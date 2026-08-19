import { VoiceProvider, VoiceSessionConfig } from './VoiceProvider';
import { GeminiLiveVoiceProvider } from './GeminiLiveVoiceProvider';
import { supabase } from '../../lib/supabase';

let activeProvider: VoiceProvider | null = null;

export const voiceManager = {
  /**
   * Returns the singleton active Gemini Live voice provider instance.
   */
  getVoiceProvider(): VoiceProvider {
    if (!activeProvider) {
      activeProvider = new GeminiLiveVoiceProvider();
    }
    return activeProvider;
  },

  /**
   * Securely requests an authenticated, short-lived real-time voice session from Supabase Edge Function.
   */
  async createVoiceSession(interviewId: string): Promise<VoiceSessionConfig> {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || undefined;
    const { data, error } = await supabase.functions.invoke('create-voice-session', {
      body: { interviewId, apiKey },
    });

    if (error || !data?.sessionConfig) {
      console.error('Failed to create secure voice session via Supabase:', error);
      throw new Error(error?.message || 'Failed to initialize secure voice session.');
    }

    return data.sessionConfig;
  },

  /**
   * Validates microphone availability and permissions.
   */
  async checkMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { granted: false, error: 'MediaDevices API not supported in this browser.' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      return {
        granted: false,
        error: err.name === 'NotAllowedError' ? 'Microphone permission denied.' : err.message,
      };
    }
  },
};
