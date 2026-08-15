import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export interface WaveformProps {
  isRecording: boolean;
  barCount?: number;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  isRecording,
  barCount = 42,
  className,
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 12)
  );

  useEffect(() => {
    if (!isRecording) {
      setHeights(Array.from({ length: barCount }, () => 8));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Center-weighted acoustic frequency curve
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const weight = 1 - distFromCenter * 0.55;
          const randomFactor = Math.random() * 0.7 + 0.3;
          const height = Math.floor(weight * randomFactor * 90) + 10;
          return Math.min(Math.max(height, 8), 100);
        })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isRecording, barCount]);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-[3px] h-14 px-4 py-2 w-full',
        className
      )}
      aria-label="Audio waveform visualizer"
    >
      {heights.map((height, i) => (
        <span
          key={i}
          className={cn(
            'w-[3.5px] rounded-full transition-all duration-100 ease-out',
            isRecording
              ? 'bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
              : 'bg-zinc-300 dark:bg-zinc-700/60'
          )}
          style={{
            height: isRecording ? `${height}%` : '5px',
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
