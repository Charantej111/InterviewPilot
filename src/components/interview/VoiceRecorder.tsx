import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { RotateCcw, Volume2, Sparkles, AudioWaveform } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import './VoiceWave.css';

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
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-md text-center">
      {/* Top Audio Telemetry Strip */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
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

      {/* Central Interactive Voice Wave Capsule */}
      <div className="py-2 flex flex-col items-center justify-center space-y-3">
        <div 
          onClick={onToggleRecording}
          className="voice-wave-wrapper relative mx-auto"
        >
          {/* Gradient glow background */}
          <div className="voice-glow">
            <div className="glow-ellipse" />
            <div className="glow-polygon" />
          </div>

          {/* Audio wave bars */}
          <div className="audio-wave">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`bar ${isRecording ? 'active' : ''}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-foreground-muted">
          {isRecording ? 'Listening... Click card to finish speaking' : 'Click card to start speaking'}
        </p>
      </div>

      {/* Live Speech-to-Text Transcript Display */}
      <div className="text-left p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-2">
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
                : 'Click the card above to start speaking, or insert a sample test answer.'}
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
            leftIcon={isRecording ? <Volume2 size={14} /> : <Volume2 size={14} />}
          >
            {isRecording ? 'Finish Speaking' : 'Start Recording'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
