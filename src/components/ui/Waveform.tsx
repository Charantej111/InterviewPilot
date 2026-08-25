import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export interface WaveformProps {
  isRecording?: boolean;
  isActive?: boolean;
  speaker?: 'candidate' | 'interviewer' | 'idle';
  barCount?: number;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  isRecording = false,
  isActive,
  speaker = 'candidate',
  barCount = 38,
  className,
}) => {
  const active = isActive !== undefined ? isActive : isRecording;

  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 10)
  );

  useEffect(() => {
    if (!active) {
      setHeights(Array.from({ length: barCount }, () => 6));
      return;
    }

    let frame = 0;
    const interval = setInterval(() => {
      frame += 1;
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Center-weighted Gaussian & harmonic sine oscillation
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const weight = Math.max(0.2, 1 - distFromCenter * 0.7);
          const sineWave = Math.sin(frame * 0.25 + i * 0.35) * 0.35 + 0.65;
          const randomJitter = Math.random() * 0.4 + 0.6;
          const height = Math.floor(weight * sineWave * randomJitter * 88) + 12;
          return Math.min(Math.max(height, 8), 100);
        })
      );
    }, 60);

    return () => clearInterval(interval);
  }, [active, barCount]);

  const getBarColorClass = () => {
    if (!active) return 'bg-zinc-300 dark:bg-zinc-800';
    if (speaker === 'interviewer') {
      return 'bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]';
    }
    return 'bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-[3.5px] h-16 px-4 py-2 w-full select-none',
        className
      )}
      aria-label="Dynamic audio waveform visualizer"
    >
      {heights.map((height, i) => (
        <span
          key={i}
          className={cn(
            'w-[3.5px] rounded-full transition-all duration-75 ease-out',
            getBarColorClass()
          )}
          style={{
            height: active ? `${height}%` : '5px',
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
