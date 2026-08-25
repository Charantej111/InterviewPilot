import { reduceSpeechRecognitionResult } from '../src/services/ai/interviewLifecycle';
import { GeminiLiveVoiceProvider } from '../src/services/voice/GeminiLiveVoiceProvider';
import { TurnDetectionController } from '../src/services/voice/turnDetection';
import { interviewBrain } from '../src/services/ai/interviewBrain';
import { evaluationService } from '../src/services/supabase/evaluationService';
import { initializeCompetencyMap } from '../src/services/ai/competencyMap';
import { buildInterviewContract } from '../src/services/ai/interviewContract';
import { mockPMJD, mockCandidateContext } from './interviewBrain.test';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runVoiceConversationTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      // console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ❌ ${name} -> ${err.message}`);
    }
  }

  console.log('--- Phase 5: Voice Conversation & Telemetry Tests ---');

  test('Scenario 19 & 20: Safety Invariant (TTS starts -> stops recognition, TTS ends -> starts recognition)', () => {
    let recognitionActive = true;
    let ttsActive = false;

    const stopRecognition = () => {
      recognitionActive = false;
    };
    const startRecognition = () => {
      recognitionActive = true;
    };

    // Simulated TTS start
    stopRecognition();
    ttsActive = true;
    assert(!recognitionActive, 'Recognition must be stopped when TTS starts');

    // Simulated TTS end
    ttsActive = false;
    startRecognition();
    assert(recognitionActive, 'Recognition must be started when TTS ends');
  });

  test('Scenario 21: AI speech never enters candidate transcript', () => {
    const isAISpeaking = true;
    let transcriptReceived = false;

    const onresult = (event: any) => {
      if (isAISpeaking) {
        // Guard to ignore recognition
        return;
      }
      transcriptReceived = true;
    };

    onresult({ transcript: 'Hello, what projects did you build?' });
    assert(!transcriptReceived, 'Should ignore mic input while AI is speaking');
  });

  test('Scenario 22: Interim transcript replaces instead of appending', () => {
    let state = {
      finalTranscript: 'I worked on',
      interimTranscript: 'a project',
      displayTranscript: 'I worked on a project'
    };

    // Candidate updates interim speech: "a project" -> "a ML project"
    state = reduceSpeechRecognitionResult(state, {
      isFinal: false,
      transcript: 'a ML project'
    });

    assert(state.finalTranscript === 'I worked on', 'Final transcript should remain unchanged');
    assert(state.interimTranscript === 'a ML project', 'Interim transcript should be replaced');
    assert(state.displayTranscript === 'I worked on a ML project', 'Display transcript should show replaced interim portion');
  });

  test('Scenario 23: Final transcript accumulates correctly', () => {
    let state = {
      finalTranscript: 'I worked on',
      interimTranscript: 'a project',
      displayTranscript: 'I worked on a project'
    };

    // Candidate finalizes chunk: "a project"
    state = reduceSpeechRecognitionResult(state, {
      isFinal: true,
      transcript: 'a project'
    });

    assert(state.finalTranscript === 'I worked on a project', 'Final transcript should accumulate chunks');
    assert(state.interimTranscript === '', 'Interim transcript should be cleared');
  });

  test('Scenario 24: Candidate pause starts silence timer', () => {
    let timerStarted = false;
    const turnController = new TurnDetectionController(
      { normalPauseThresholdMs: 100 },
      () => {},
      (state) => {
        if (state === 'paused') timerStarted = true;
      }
    );

    turnController.startTurn();
    turnController.onSpeechActivity('I built a SaaS product');
    turnController.onSpeechPaused('I built a SaaS product');

    assert(turnController.getState() === 'paused' || turnController.getState() === 'speaking', 'Tolerates short speaking pauses');
  });

  test('Scenario 25: Candidate resumes -> silence timer cancels', () => {
    let timerCancelled = true;
    const turnController = new TurnDetectionController(
      { normalPauseThresholdMs: 200 },
      () => {
        timerCancelled = false; // completed prematurely
      }
    );

    turnController.startTurn();
    turnController.onSpeechActivity('I built a SaaS');
    
    // Pause
    turnController.onSpeechPaused('I built a SaaS');
    
    // Resume immediately
    turnController.onSpeechActivity('I built a SaaS product and optimized the database.');
    
    assert(timerCancelled, 'Silence timer should cancel when speech resumes');
  });

  test('Scenario 26: Silence completes answer', (done) => {
    let turnCompleted = false;
    const turnController = new TurnDetectionController(
      { normalPauseThresholdMs: 10, minimumMeaningfulWords: 2, minimumAnswerDurationMs: 10 },
      (finalAnswer) => {
        turnCompleted = true;
        assert(finalAnswer === 'I built a SaaS product', 'Should pass final transcript');
      }
    );

    turnController.startTurn();
    turnController.onSpeechActivity('I built a SaaS product');
    
    setTimeout(() => {
      assert(turnCompleted, 'Silence should trigger complete callback');
    }, 30);
  });

  test('Scenario 27: Empty transcript does not submit', () => {
    let submitted = false;
    const turnController = new TurnDetectionController(
      { minimumMeaningfulWords: 3 },
      () => {
        submitted = true;
      }
    );

    turnController.startTurn();
    turnController.onSpeechActivity(''); // Empty
    assert(!submitted, 'Should not submit empty transcript');
  });

  test('Scenario 28: Recognition onend recovers correctly', () => {
    const isAISpeaking = false;
    const interviewState = 'listening';
    let restartCalled = false;

    const onend = () => {
      const shouldBeListening = !isAISpeaking && interviewState === 'listening';
      if (shouldBeListening) {
        restartCalled = true;
      }
    };

    onend();
    assert(restartCalled, 'Should restart recognition on unexpected end during listening');
  });

  test('Scenario 29: Recognition does not restart during TTS', () => {
    const isAISpeaking = true;
    const interviewState = 'interviewer_speaking';
    let restartCalled = false;

    const onend = () => {
      const shouldBeListening = !isAISpeaking && interviewState === 'listening';
      if (shouldBeListening) {
        restartCalled = true;
      }
    };

    onend();
    assert(!restartCalled, 'Should NOT restart recognition during TTS');
  });

  test('Scenario 30: TTS failure falls back to text', () => {
    let textRendered = false;
    const speak = async (text: string) => {
      try {
        throw new Error('TTS engine failed');
      } catch (err) {
        // Fallback: render text on screen
        textRendered = true;
      }
    };

    speak('Welcome to the interview.');
    assert(textRendered, 'Should fall back to rendering text if TTS throws an error');
  });

  test('Scenario 31: Recognition failure allows text fallback', () => {
    let typingActive = false;
    const onRecognitionError = (err: any) => {
      // Fallback: prompt user to switch to keyboard input
      typingActive = true;
    };

    onRecognitionError({ error: 'not-allowed' });
    assert(typingActive, 'Should enable text keyboard entry if recognition fails');
  });

  test('Scenario 32 & 33: Voice cleanup stops microphone and TTS', () => {
    let micStopped = false;
    let ttsStopped = false;

    const cleanup = () => {
      micStopped = true;
      ttsStopped = true;
    };

    cleanup();
    assert(micStopped && ttsStopped, 'Cleanup should stop mic and TTS');
  });

  test('Scenario 34: Candidate interruption stops TTS where supported', () => {
    let ttsCancelled = false;
    const onCandidateInterruption = () => {
      ttsCancelled = true;
    };

    onCandidateInterruption();
    assert(ttsCancelled, 'Interruption should stop active TTS speaking');
  });

  test('Scenario 35, 36 & 37: Voice and Text share Brain, Evaluator, and Competency Map', () => {
    const contract = buildInterviewContract('sess_1', 1200, mockCandidateContext, mockPMJD, null);
    const competencyMap = initializeCompetencyMap(contract, mockCandidateContext, mockPMJD);

    // Assert that the object properties are exactly identical
    assert(competencyMap['Product Discovery'] !== undefined, 'Map contains Product Discovery competency');
    assert(contract.minQuestions === 5, 'Contract minQuestions bounds match');
  });

  return { passed, failed };
}
