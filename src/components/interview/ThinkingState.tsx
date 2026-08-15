import React, { useState, useEffect } from 'react';
import { LetterLoader } from '../ui/LetterLoader';
import { ShiningText } from '../ui/ShiningText';
import { Sparkles } from 'lucide-react';

export interface ThinkingStateProps {
  label?: string;
  sublabel?: string;
}

const REASONING_STAGES = [
  'Parsing response structure & STAR clarity...',
  'Evaluating quantitative evidence & baseline metrics...',
  'Calibrating trade-off analysis & role alignment...',
  'Formulating scoring breakdown & follow-up probe...',
];

export const ThinkingState: React.FC<ThinkingStateProps> = ({
  label = 'Evaluating',
}) => {
  const [stageIdx, setStageIdx] = useState(0);
  const cleanLabel = label.replace(/\.+$/, '');

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % REASONING_STAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-14 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
      {/* 3D Plasma Sphere Letter Loader */}
      <LetterLoader text={cleanLabel} size="md" />

      <div className="space-y-2 max-w-lg px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 shadow-sm">
          <Sparkles size={13} className="text-purple-400 animate-spin" />
          <ShiningText text={REASONING_STAGES[stageIdx]} />
        </div>
        <p className="text-[11px] text-foreground-muted font-mono">
          Scoring relevance, clarity, structure & evidence metrics...
        </p>
      </div>
    </div>
  );
};

export default ThinkingState;
