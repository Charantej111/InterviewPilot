import React from 'react';

export interface ReadinessScoreWidgetProps {
  score?: number;
  delta?: number;
}

export const ReadinessScoreWidget: React.FC<ReadinessScoreWidgetProps> = ({
  score = 74,
  delta = 8,
}) => {
  return (
    <div className="glow-card p-6 sm:p-7 flex flex-col justify-between h-full">
      <div>
        <span className="text-xs font-semibold text-foreground-muted block mb-4">
          Interview readiness
        </span>

        {/* Circular Progress Gauge */}
        <div className="my-6 flex justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Active gradient progress stroke */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#readinessGrad)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#635BFF" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {score}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-2">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          +{delta}% from last week
        </span>
      </div>
    </div>
  );
};
