import {
  VoiceProvider,
  VoiceStatus,
  VoiceInterviewState,
  VoiceSessionConfig,
  VoiceEventListeners,
  VoiceError,
} from './VoiceProvider';
import { TurnDetectionController } from './turnDetection';

/**
 * Production Real-Time Conversational Voice Provider
 *
 * Architecture:
 * - Interim vs Final Transcript Separation: Interim text is replaced in-place, never duplicated.
 * - TurnDetectionController: Evaluates natural pause thresholds before auto-completing turns.
 * - Microphone/TTS Audio Isolation: Suspends mic during interviewer playback to eliminate echo loopback.
 * - Resilience: Recovers and restarts on unexpected Web Speech API onend events without dropping speech.
 */
export class GeminiLiveVoiceProvider implements VoiceProvider {
  public readonly id = 'gemini_live';
  public status: VoiceStatus = 'idle';
  public interviewState: VoiceInterviewState = 'idle';

  private config: VoiceSessionConfig | null = null;
  private listeners: VoiceEventListeners | null = null;

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private isAISpeaking = false;
  private isCandidateSpeaking = false;

  private speechRecognition: any = null;
  private initialTurnTranscript: string = '';
  private finalTranscript: string = '';
  private interimTranscript: string = '';

  private turnController: TurnDetectionController;

  constructor() {
    this.turnController = new TurnDetectionController(
      {},
      (finalAnswer) => this.handleTurnCompleted(finalAnswer),
      (turnState) => this.handleTurnStateChange(turnState)
    );
  }

  public async connect(config: VoiceSessionConfig, listeners: VoiceEventListeners): Promise<void> {
    this.config = config;
    this.listeners = listeners;
    this.updateStatus('connecting');
    this.updateInterviewState('idle');

    try {
      // 1. Initialize Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }

      // 2. Initialize Speech Recognition engine for low-latency live STT
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        this.speechRecognition = new SpeechRec();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onstart = () => {
          if (!this.isAISpeaking) {
            this.isCandidateSpeaking = true;
            this.listeners?.onSpeechStart('candidate');
          }
        };

        this.speechRecognition.onresult = (event: any) => {
          // If AI is speaking, ignore incoming mic frames to prevent audio loopback
          if (this.isAISpeaking) {
            return;
          }

          let accumulatedFinal = '';
          let currentInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const resultItem = event.results[i];
            if (resultItem.isFinal) {
              accumulatedFinal += resultItem[0].transcript + ' ';
            } else {
              currentInterim += resultItem[0].transcript;
            }
          }

          this.finalTranscript = (this.initialTurnTranscript + ' ' + accumulatedFinal).trim();
          this.interimTranscript = currentInterim.trim();

          const displayTranscript = (
            this.finalTranscript +
            (this.finalTranscript && this.interimTranscript ? ' ' : '') +
            this.interimTranscript
          ).trim();

          this.listeners?.onTranscript(
            displayTranscript,
            false,
            true,
            this.interimTranscript,
            this.finalTranscript
          );

          // Update Turn Detection Controller
          this.turnController.onSpeechActivity(displayTranscript);
        };

        this.speechRecognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            this.handleError({
              code: 'mic_permission_denied',
              message: 'Microphone permission was denied by the browser.',
              recoverable: false,
            });
          } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('Speech recognition event:', event.error);
          }
        };

        this.speechRecognition.onend = () => {
          // Resilient auto-restart if candidate is still in an active listening/answering turn
          const shouldBeListening =
            !this.isAISpeaking &&
            (this.interviewState === 'listening' ||
              this.interviewState === 'candidate_speaking' ||
              this.interviewState === 'candidate_paused');

          if (shouldBeListening && this.speechRecognition) {
            try {
              // Store accumulated final transcript as baseline for new recognition session
              this.initialTurnTranscript = this.finalTranscript;
              this.speechRecognition.start();
            } catch (_) {}
          }
        };
      }

      this.updateStatus('connected');
    } catch (err: any) {
      this.handleError({
        code: 'connection_failed',
        message: err.message || 'Failed to initialize conversational voice provider.',
        recoverable: true,
      });
      throw err;
    }
  }

  public async startListening(): Promise<void> {
    if (this.isAISpeaking) return;

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      this.initialTurnTranscript = '';
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.turnController.startTurn();

      this.updateStatus('listening');
      this.updateInterviewState('listening');

      if (this.speechRecognition) {
        try {
          this.speechRecognition.start();
        } catch (_) {}
      }
    } catch (err: any) {
      this.handleError({
        code: err.name === 'NotAllowedError' ? 'mic_permission_denied' : 'mic_unavailable',
        message: err.message || 'Unable to access microphone.',
        recoverable: false,
      });
    }
  }

  public stopListening(): void {
    this.turnController.reset();

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (_) {}
    }

    if (this.isCandidateSpeaking) {
      this.isCandidateSpeaking = false;
      this.listeners?.onSpeechEnd('candidate', this.finalTranscript);
    }
  }

  public async speak(text: string): Promise<void> {
    const cleanText = this.cleanSpokenText(text);
    if (!cleanText) return;

    // 1. Audio Isolation: Stop microphone input during interviewer speech
    this.isAISpeaking = true;
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (_) {}
    }

    this.updateStatus('speaking');
    this.updateInterviewState('interviewer_speaking');
    this.listeners?.onSpeechStart('ai');

    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.98;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const naturalVoice = this.getBestNaturalVoice();
        if (naturalVoice) {
          utterance.voice = naturalVoice;
        }

        utterance.onend = () => {
          this.isAISpeaking = false;
          this.listeners?.onSpeechEnd('ai');
          this.updateInterviewState('listening');
          this.updateStatus('listening');

          // Resume microphone for candidate response
          this.startListening();
          resolve();
        };

        utterance.onerror = (e: any) => {
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('Speech synthesis event:', e.error || e);
          }
          this.isAISpeaking = false;
          this.listeners?.onSpeechEnd('ai');
          this.updateInterviewState('listening');
          this.updateStatus('listening');

          this.startListening();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        this.isAISpeaking = false;
        this.listeners?.onSpeechEnd('ai');
        this.updateInterviewState('listening');
        this.updateStatus('listening');
        this.startListening();
        resolve();
      }
    });
  }

  public stopAudio(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isAISpeaking = false;
  }

  public forceSubmitCurrentTurn(): void {
    const current = (this.finalTranscript + ' ' + this.interimTranscript).trim();
    this.turnController.forceComplete(current);
  }

  private handleTurnCompleted(finalAnswer: string): void {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (_) {}
    }

    this.updateInterviewState('processing');
    this.updateStatus('processing');
    this.listeners?.onAnswerAutoCompleted?.(finalAnswer);
  }

  private handleTurnStateChange(turnState: import('./turnDetection').TurnState): void {
    if (turnState === 'speaking') {
      this.updateInterviewState('candidate_speaking');
    } else if (turnState === 'paused') {
      this.updateInterviewState('candidate_paused');
    } else if (turnState === 'completing') {
      this.updateInterviewState('processing');
    }
  }

  private cleanSpokenText(raw: string): string {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/\[\d+\]/g, '')
      .replace(/```.*?```/gs, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getBestNaturalVoice(): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const preferredPatterns = [
      /natural.*en/i,
      /google.*us english/i,
      /google.*english/i,
      /samantha/i,
      /karen/i,
      /daniel/i,
      /en-us/i,
      /en-gb/i,
    ];

    for (const pattern of preferredPatterns) {
      const match = voices.find((v) => pattern.test(v.name) || pattern.test(v.lang));
      if (match) return match;
    }

    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  public sendContext(_contextSummary: string): void {
    // Context hook for streaming voice integration
  }

  public getConfig(): VoiceSessionConfig | null {
    return this.config;
  }

  public async disconnect(): Promise<void> {
    this.stopAudio();
    this.stopListening();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }

    this.updateStatus('disconnected');
    this.updateInterviewState('idle');
  }

  private updateStatus(newStatus: VoiceStatus): void {
    this.status = newStatus;
    this.listeners?.onStatusChange(newStatus);
  }

  private updateInterviewState(newState: VoiceInterviewState): void {
    this.interviewState = newState;
    this.listeners?.onStateChange?.(newState);
  }

  private handleError(err: VoiceError): void {
    this.updateStatus('error');
    this.listeners?.onError(err);
  }
}
