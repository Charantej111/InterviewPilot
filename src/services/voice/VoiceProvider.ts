export type VoiceStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'speaking' 
  | 'listening' 
  | 'processing' 
  | 'interrupted'
  | 'reconnecting' 
  | 'disconnected' 
  | 'error';

export type VoiceInterviewState =
  | 'idle'
  | 'interviewer_speaking'
  | 'listening'
  | 'candidate_speaking'
  | 'candidate_paused'
  | 'processing'
  | 'interviewer_responding'
  | 'recovering'
  | 'paused'
  | 'completed';

export interface VoiceSessionConfig {
  voiceSessionId: string;
  interviewId: string;
  provider: 'gemini_live';
  model?: string;
  systemInstruction?: string;
  initialQuestion?: {
    id: string;
    order: number;
    text: string;
    category?: string;
    intent?: string;
  } | null;
  timeLimitMinutes?: number;
  candidateName?: string;
  targetRole?: string;
  company?: string;
  voiceConfig?: {
    voiceName?: string;
    speechRate?: number;
  };
}

export interface VoiceError {
  code: 'mic_permission_denied' | 'mic_unavailable' | 'unsupported_browser' | 'connection_failed' | 'network_error' | 'session_expired' | 'audio_playback_error' | 'unknown';
  message: string;
  recoverable: boolean;
}

export interface VoiceEventListeners {
  onStatusChange: (status: VoiceStatus) => void;
  onStateChange?: (state: VoiceInterviewState) => void;
  onTranscript: (text: string, isFinal: boolean, isCandidate: boolean, interimText?: string, finalText?: string) => void;
  onSpeechStart: (speaker: 'ai' | 'candidate') => void;
  onSpeechEnd: (speaker: 'ai' | 'candidate', finalTranscript?: string) => void;
  onAnswerAutoCompleted?: (finalAnswer: string) => void;
  onInterruption: () => void;
  onError: (error: VoiceError) => void;
}

export interface VoiceProvider {
  readonly id: string;
  readonly status: VoiceStatus;
  
  connect(config: VoiceSessionConfig, listeners: VoiceEventListeners): Promise<void>;
  disconnect(): Promise<void>;
  
  startListening(): Promise<void>;
  stopListening(): void;
  
  speak(text: string): Promise<void>;
  stopAudio(): void; // Instant barge-in / interruption
  
  sendContext(contextSummary: string): void;
}

export interface VoiceSessionController {
  startInterviewerSpeech(text: string): Promise<void>;
  stopInterviewerSpeech(): void;

  startCandidateListening(): Promise<void>;
  stopCandidateListening(): void;

  pauseRecognition(): void;
  resumeRecognition(): void;

  finishCandidateTurn(): Promise<void>;

  cleanup(): void;
}
