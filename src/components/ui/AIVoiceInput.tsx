import React, { useState, useEffect } from 'react';
import { Mic, Square, Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (durationSecs: number) => void;
  onReset?: () => void;
  isRecording?: boolean;
  visualizerBars?: number;
  className?: string;
  demoMode?: boolean;
}

export const AIVoiceInput: React.FC<AIVoiceInputProps> = ({
  onStart,
  onStop,
  onReset,
  isRecording: externalIsRecording,
  visualizerBars = 24,
  className,
  demoMode = false,
}) => {
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array.from({ length: visualizerBars }, () => 14)
  );

  const isRecording = externalIsRecording !== undefined ? externalIsRecording : internalIsRecording;

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      setBarHeights(Array.from({ length: visualizerBars }, () => 12));
      return;
    }

    const interval = setInterval(() => {
      setBarHeights(
        Array.from({ length: visualizerBars }, (_, i) => {
          const dist = Math.abs(i - visualizerBars / 2) / (visualizerBars / 2);
          const factor = 1 - dist * 0.55;
          const randomVal = Math.random() * 0.75 + 0.25;
          return Math.floor(factor * randomVal * 85) + 15;
        })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isRecording, visualizerBars]);

  const toggleRecording = () => {
    if (isRecording) {
      if (externalIsRecording === undefined) setInternalIsRecording(false);
      onStop?.(seconds);
    } else {
      if (externalIsRecording === undefined) setInternalIsRecording(true);
      setSeconds(0);
      onStart?.();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSeconds(0);
    onReset?.();
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-3 p-1.5 px-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-2xl shadow-sm select-none',
        isRecording
          ? 'bg-red-500/10 border-red-500/30 text-red-500 ring-2 ring-red-500/20'
          : 'bg-zinc-900/90 dark:bg-[#12111d]/95 border-zinc-800 text-zinc-100 hover:border-zinc-700',
        className
      )}
    >
      {/* Microphone Status Button */}
      <button
        type="button"
        onClick={toggleRecording}
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0',
          isRecording
            ? 'bg-red-600 hover:bg-red-700 text-white scale-105 shadow-red-500/25 animate-pulse'
            : 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm'
        )}
        title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
      >
        {isRecording ? <Square size={13} className="fill-current" /> : <Mic size={15} />}
      </button>

      {/* Visualizer Waveform & Live Timer */}
      <div className="flex items-center gap-3 min-w-[130px]">
        {/* Animated Bar Visualizer */}
        <div className="flex items-center gap-[2.5px] h-6">
          {barHeights.map((h, idx) => (
            <span
              key={idx}
              className={cn(
                'w-[2.5px] rounded-full transition-all duration-100',
                isRecording
                  ? 'bg-red-500 dark:bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                  : 'bg-zinc-600 dark:bg-zinc-700'
              )}
              style={{
                height: isRecording ? `${h}%` : '4px',
              }}
            />
          ))}
        </div>

        {/* Live Timer Counter */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-300 shrink-0">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isRecording ? 'bg-red-500 animate-ping' : 'bg-zinc-500'
            )}
          />
          <span>{formatTimer(seconds)}</span>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 ml-1 cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {demoMode && (
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium pl-1 border-l border-zinc-800">
          <Sparkles size={11} className="text-zinc-400" />
          <span>AI Voice</span>
        </span>
      )}
    </div>
  );
};

export default AIVoiceInput;
