/**
 * Natural Conversational Text-to-Speech (TTS) Service
 * Provides studio-grade conversational speech synthesis with natural cadence,
 * dynamic neural voice selection, and sentence chunking.
 */

export interface TTSOptions {
  voiceName?: string;
  rate?: number; // default 0.95
  pitch?: number; // default 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export class TTSService {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.cachedVoices = window.speechSynthesis.getVoices();
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices.filter((v) => v.lang.startsWith('en'));
  }

  public getBestNaturalVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    // Highest quality neural & natural voice preferences
    const priorityVoicePatterns = [
      /natural.*en-US/i,
      /microsoft.*(jenny|christopher|aria|guy|sonia).*natural/i,
      /google us english/i,
      /samantha/i,
      /victoria/i,
      /karen/i,
      /ava/i,
      /serena/i,
      /daniel/i,
      /en-US/i,
      /en/i,
    ];

    for (const pattern of priorityVoicePatterns) {
      const match = voices.find((v) => pattern.test(v.name) || pattern.test(v.voiceURI));
      if (match) return match;
    }

    return voices[0] || null;
  }

  public cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove markdown bold
      .replace(/\*(.*?)\*/g, '$1')     // remove markdown italic
      .replace(/^#+\s+/gm, '')         // remove headings
      .replace(/\[\d+\]/g, '')         // remove citation numbers
      .replace(/```[\s\S]*?```/g, '')  // remove code blocks
      .replace(/`([^`]+)`/g, '$1')     // remove inline code
      .replace(/https?:\/\/\S+/g, '')  // remove URLs
      .replace(/[\n\r]+/g, ' ')        // collapse newlines
      .replace(/\s+/g, ' ')            // collapse whitespace
      .trim();
  }

  public speak(text: string, options?: TTSOptions): Promise<void> {
    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return Promise.resolve();

    this.stop();

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Web Speech API is not supported in this browser.');
        options?.onEnd?.();
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = options?.rate ?? 0.95; // Steady, professional conversational pace
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.lang = 'en-US';

      const selectedVoice = options?.voiceName
        ? this.getAvailableVoices().find((v) => v.name === options.voiceName)
        : this.getBestNaturalVoice();

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn('TTS playback notice:', err);
        this.isSpeaking = false;
        this.currentUtterance = null;
        options?.onError?.(err);
        options?.onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const ttsService = new TTSService();
export default ttsService;
