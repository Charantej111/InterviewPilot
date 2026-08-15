import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface FeedbackPointsProps {
  whatWorked: string[];
  whatHeldYouBack: string[];
  tryThisNextTime: {
    framework: string;
    suggestion: string;
    examplePhrasing: string;
  };
}

export const FeedbackPoints: React.FC<FeedbackPointsProps> = ({
  whatWorked,
  whatHeldYouBack,
  tryThisNextTime,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyExample = () => {
    navigator.clipboard.writeText(tryThisNextTime.examplePhrasing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What Worked */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <h4>What worked well</h4>
          </div>
          <ul className="space-y-2.5">
            {whatWorked.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What Held You Back */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <h4>What held you back</h4>
          </div>
          <ul className="space-y-2.5">
            {whatHeldYouBack.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Coach Box: Try this next time */}
      <div className="p-6 rounded-2xl bg-primary-subtle/50 border border-primary/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Lightbulb className="w-4 h-4" />
            <h4>Try this next time ({tryThisNextTime.framework})</h4>
          </div>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Model Phrasing
          </span>
        </div>

        <p className="text-xs text-foreground leading-relaxed">
          {tryThisNextTime.suggestion}
        </p>

        <div className="relative p-4 rounded-xl bg-surface border border-border/80 text-xs text-foreground-muted font-mono leading-relaxed group">
          <div className="pr-8 italic">
            "{tryThisNextTime.examplePhrasing}"
          </div>
          <button
            type="button"
            onClick={handleCopyExample}
            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-surface-subtle text-foreground-subtle hover:text-foreground transition-colors"
            title="Copy model phrasing"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
