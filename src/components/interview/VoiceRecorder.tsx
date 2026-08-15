import React, { useState, useEffect } from 'react';
import { Waveform } from '../ui/Waveform';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { Mic, MicOff, RotateCcw, Volume2, Sparkles, AudioWaveform } from 'lucide-react';
import { formatTime } from '../../lib/utils';

export interface VoiceRecorderProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onResetRecording: () => void;
  transcript: string;
  onInsertSample?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onToggleRecording,
  onResetRecording,
  transcript,
  onInsertSample,
}) => {
  const [recordSeconds, setRecordSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleReset = () => {
    setRecordSeconds(0);
    onResetRecording();
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const estimatedWPM = recordSeconds > 5 ? Math.round((wordCount / recordSeconds) * 60) : 0;

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#11111a]/95 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-xl text-center">
      {/* Top Audio Telemetry Strip */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="font-semibold text-foreground">
            {isRecording ? 'Live Microphone Stream' : 'Microphone Ready'}
          </span>
          {isRecording && <ShiningText text="Active" className="text-[10px]" />}
        </div>

        <div className="flex items-center gap-3 font-mono">
          {isRecording && estimatedWPM > 0 && (
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              {estimatedWPM} wpm · Good pace
            </span>
          )}
          <span className="font-bold text-foreground text-sm">{formatTime(recordSeconds)}</span>
        </div>
      </div>

      {/* Central Interactive Voice Orb Capsule */}
      <div className="py-4 flex flex-col items-center justify-center space-y-4">
        {/* Pulsing Concentric Acoustic Rings */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-red-500/15 animate-ping duration-1000 pointer-events-none" />
              <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-pulse duration-700 pointer-events-none" />
            </>
          )}

          {/* Central Mic Button */}
          <button
            type="button"
            onClick={onToggleRecording}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30 scale-105'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-sm hover:scale-105'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <MicOff size={28} className="animate-pulse" /> : <Mic size={28} />}
          </button>
        </div>

        <p className="text-xs font-semibold text-foreground-muted">
          {isRecording ? 'Listening... Speak your answer naturally' : 'Click microphone to record your response'}
        </p>

        {/* Dynamic Waveform Visualizer */}
        <div className="w-full max-w-lg h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center px-4 shadow-inner">
          <Waveform isRecording={isRecording} barCount={48} />
        </div>
      </div>

      {/* Live Speech-to-Text Transcript Display */}
      <div className="text-left p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/90 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <AudioWaveform size={13} className="text-zinc-400" />
            Live Voice Transcript
          </span>
          {wordCount > 0 && (
            <span className="text-[11px] text-zinc-400 font-mono">
              {wordCount} words
            </span>
          )}
        </div>

        <div className="min-h-[80px] max-h-[160px] overflow-y-auto pr-1 text-sm text-foreground leading-relaxed font-normal">
          {transcript ? (
            <p className="whitespace-pre-wrap">
              {transcript}
              {isRecording && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-zinc-900 dark:bg-white animate-pulse" />
              )}
            </p>
          ) : (
            <p className="text-zinc-400 dark:text-zinc-500 italic text-xs">
              {isRecording
                ? 'Listening to speech and transcribing in real-time...'
                : 'Click the microphone above to start speaking, or insert a sample test answer.'}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {onInsertSample && !transcript && !isRecording && (
          <button
            type="button"
            onClick={onInsertSample}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Insert sample test answer</span>
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {recordSeconds > 0 && !isRecording && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw size={14} />}
            >
              Re-record
            </Button>
          )}

          <Button
            size="sm"
            onClick={onToggleRecording}
            variant={isRecording ? 'danger' : 'primary'}
            leftIcon={isRecording ? <Volume2 size={14} /> : <Mic size={14} />}
          >
            {isRecording ? 'Finish Speaking' : 'Start Recording'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
