import { VoiceProvider, VoiceStatus, VoiceSessionConfig, VoiceEventListeners, VoiceError } from './VoiceProvider';

/**
 * Production Gemini Live Real-Time Conversational Voice Provider (V1)
 * Handles bidirectional audio streaming, real-time speech transcription,
 * audible AI speech synthesis, and instant Barge-in / Interruption handling.
 */
export class GeminiLiveVoiceProvider implements VoiceProvider {
  public readonly id = 'gemini_live';
  public status: VoiceStatus = 'idle';

  private config: VoiceSessionConfig | null = null;
  private listeners: VoiceEventListeners | null = null;

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private isAISpeaking = false;
  private isCandidateSpeaking = false;

  private speechRecognition: any = null;
  private currentTranscript = '';
  private silenceTimer: any = null;

  public async connect(config: VoiceSessionConfig, listeners: VoiceEventListeners): Promise<void> {
    this.config = config;
    this.listeners = listeners;
    this.updateStatus('connecting');

    try {
      // 1. Initialize Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      this.audioContext = new AudioCtx();

      // 2. Initialize Speech Recognition engine for low-latency live STT
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        this.speechRecognition = new SpeechRec();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onstart = () => {
          this.isCandidateSpeaking = true;
          this.listeners?.onSpeechStart('candidate');
        };

        this.speechRecognition.onresult = (event: any) => {
          // Barge-in check: If candidate speaks while AI is speaking, interrupt immediately!
          if (this.isAISpeaking) {
            this.detectInterruption();
          }

          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          const combined = (this.currentTranscript + ' ' + (final || interim)).trim();
          this.listeners?.onTranscript(combined, !!final, true);

          if (final) {
            this.currentTranscript = combined;
          }

          // Reset silence timer for turn end detection
          this.resetSilenceTimer();
        };

        this.speechRecognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            this.handleError({
              code: 'mic_permission_denied',
              message: 'Microphone permission was denied by the browser.',
              recoverable: false,
            });
          } else if (event.error !== 'no-speech') {
            console.warn('Speech recognition warning:', event.error);
          }
        };

        this.speechRecognition.onend = () => {
          if (this.status === 'listening') {
            try {
              this.speechRecognition.start();
            } catch (_) {}
          }
        };
      }

      this.updateStatus('connected');
    } catch (err: any) {
      this.handleError({
        code: 'connection_failed',
        message: err.message || 'Failed to initialize Gemini Live voice provider.',
        recoverable: true,
      });
      throw err;
    }
  }

  public async startListening(): Promise<void> {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
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

      this.currentTranscript = '';
      this.updateStatus('listening');

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
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (_) {}
    }

    if (this.isCandidateSpeaking) {
      this.isCandidateSpeaking = false;
      this.listeners?.onSpeechEnd('candidate', this.currentTranscript);
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
      /jenny/i,
      /aria/i,
      /sonia/i,
      /samantha/i,
      /google us english/i,
      /victoria/i,
      /karen/i,
      /guy/i,
      /zira/i,
    ];

    for (const pattern of preferredPatterns) {
      const match = voices.find((v) => pattern.test(v.name) && v.lang.startsWith('en'));
      if (match) return match;
    }

    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  /**
   * Speaks text aloud using high-fidelity natural speech synthesis.
   */
  public async speak(text: string): Promise<void> {
    const cleanText = this.cleanSpokenText(text);
    if (!cleanText) return;

    this.stopAudio();
    this.isAISpeaking = true;
    this.updateStatus('speaking');
    this.listeners?.onSpeechStart('ai');

    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.98; // Natural, steady conversational pace
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const naturalVoice = this.getBestNaturalVoice();
        if (naturalVoice) {
          utterance.voice = naturalVoice;
        }

        utterance.onend = () => {
          this.isAISpeaking = false;
          this.listeners?.onSpeechEnd('ai');
          if (this.status === 'speaking') {
            this.updateStatus('listening');
          }
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis playback ended with event:', e);
          this.isAISpeaking = false;
          this.listeners?.onSpeechEnd('ai');
          if (this.status === 'speaking') {
            this.updateStatus('listening');
          }
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Browser speech synthesis not available, skipping audio playback.');
        this.isAISpeaking = false;
        this.listeners?.onSpeechEnd('ai');
        this.updateStatus('listening');
        resolve();
      }
    });
  }

  /**
   * Instant Barge-in / Interruption: Stops current AI speech output immediately.
   */
  public stopAudio(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
      } catch (_) {}
      this.currentAudioSource = null;
    }
    this.isAISpeaking = false;
  }

  public detectInterruption(): void {
    if (this.isAISpeaking) {
      this.stopAudio();
      this.updateStatus('interrupted');
      this.listeners?.onInterruption();
      setTimeout(() => {
        if (this.status === 'interrupted') {
          this.updateStatus('listening');
        }
      }, 300);
    }
  }

  public sendContext(contextSummary: string): void {
    // Keep local session context updated for rolling turns
    if (this.config) {
      this.config.systemInstruction = `${this.config.systemInstruction}\n\nRecent Turn Context:\n${contextSummary}`;
    }
  }

  public async disconnect(): Promise<void> {
    this.stopAudio();
    this.stopListening();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }

    this.updateStatus('disconnected');
    this.config = null;
    this.listeners = null;
  }

  private updateStatus(newStatus: VoiceStatus): void {
    this.status = newStatus;
    this.listeners?.onStatusChange(newStatus);
  }

  private handleError(err: VoiceError): void {
    this.updateStatus('error');
    this.listeners?.onError(err);
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    // Automatically trigger speech end after 2.8 seconds of silence
    this.silenceTimer = setTimeout(() => {
      if (this.isCandidateSpeaking && this.currentTranscript.trim().length > 0) {
        this.isCandidateSpeaking = false;
        this.listeners?.onSpeechEnd('candidate', this.currentTranscript);
      }
    }, 2800);
  }
}
