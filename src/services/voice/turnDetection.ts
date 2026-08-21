/**
 * Turn Detection Controller
 *
 * Distinguishes candidate speaking vs natural pauses vs answer completion.
 * Configurable silence thresholds ensure candidates can pause to think without premature auto-submission.
 */

export interface TurnDetectionConfig {
  initialPauseThresholdMs: number;
  normalPauseThresholdMs: number;
  shortPauseThresholdMs: number;
  minimumMeaningfulWords: number;
  minimumAnswerDurationMs: number;
}

export const DEFAULT_TURN_CONFIG: TurnDetectionConfig = {
  initialPauseThresholdMs: 3000,
  normalPauseThresholdMs: 2000,
  shortPauseThresholdMs: 1400,
  minimumMeaningfulWords: 3,
  minimumAnswerDurationMs: 1500,
};

export type TurnState = 'idle' | 'listening' | 'speaking' | 'paused' | 'completing';

export class TurnDetectionController {
  private config: TurnDetectionConfig;
  private silenceTimer: any = null;
  private turnStartTime: number = 0;
  private lastSpeechTime: number = 0;
  private turnState: TurnState = 'idle';
  private onTurnCompleteCallback: ((finalTranscript: string) => void) | null = null;
  private onStateChangeCallback: ((state: TurnState) => void) | null = null;

  constructor(
    config: Partial<TurnDetectionConfig> = {},
    onTurnComplete?: (finalTranscript: string) => void,
    onStateChange?: (state: TurnState) => void
  ) {
    this.config = { ...DEFAULT_TURN_CONFIG, ...config };
    if (onTurnComplete) this.onTurnCompleteCallback = onTurnComplete;
    if (onStateChange) this.onStateChangeCallback = onStateChange;
  }

  public setCallbacks(
    onTurnComplete: (finalTranscript: string) => void,
    onStateChange?: (state: TurnState) => void
  ): void {
    this.onTurnCompleteCallback = onTurnComplete;
    if (onStateChange) this.onStateChangeCallback = onStateChange;
  }

  public startTurn(): void {
    this.clearTimer();
    this.turnStartTime = Date.now();
    this.lastSpeechTime = Date.now();
    this.updateState('listening');
  }

  public onSpeechActivity(currentDisplayTranscript: string): void {
    const cleanText = currentDisplayTranscript.trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
    this.lastSpeechTime = Date.now();

    this.clearTimer();

    if (this.turnState !== 'speaking') {
      this.updateState('speaking');
    }

    // Evaluate dynamic pause threshold
    const duration = Date.now() - this.turnStartTime;
    const threshold =
      wordCount >= 35
        ? this.config.shortPauseThresholdMs
        : this.config.normalPauseThresholdMs;

    // Start silence detection timer
    if (wordCount >= this.config.minimumMeaningfulWords && duration >= this.config.minimumAnswerDurationMs) {
      this.silenceTimer = setTimeout(() => {
        this.evaluateTurnCompletion(cleanText);
      }, threshold);
    }
  }

  public onSpeechPaused(currentDisplayTranscript: string): void {
    if (this.turnState === 'speaking') {
      this.updateState('paused');
    }
    const cleanText = currentDisplayTranscript.trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;

    if (wordCount >= this.config.minimumMeaningfulWords) {
      this.clearTimer();
      const threshold =
        wordCount >= 35
          ? this.config.shortPauseThresholdMs
          : this.config.normalPauseThresholdMs;

      this.silenceTimer = setTimeout(() => {
        this.evaluateTurnCompletion(cleanText);
      }, threshold);
    }
  }

  private evaluateTurnCompletion(transcript: string): void {
    if (this.turnState === 'completing' || this.turnState === 'idle') return;

    const cleanText = transcript.trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;

    if (wordCount >= this.config.minimumMeaningfulWords) {
      this.updateState('completing');
      this.clearTimer();
      this.onTurnCompleteCallback?.(cleanText);
    } else {
      this.updateState('listening');
    }
  }

  public forceComplete(transcript: string): void {
    this.clearTimer();
    const cleanText = transcript.trim();
    this.updateState('completing');
    this.onTurnCompleteCallback?.(cleanText);
  }

  public reset(): void {
    this.clearTimer();
    this.turnStartTime = 0;
    this.lastSpeechTime = 0;
    this.updateState('idle');
  }

  private clearTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private updateState(newState: TurnState): void {
    this.turnState = newState;
    this.onStateChangeCallback?.(newState);
  }

  public getState(): TurnState {
    return this.turnState;
  }

  public getLastSpeechTime(): number {
    return this.lastSpeechTime;
  }
}
