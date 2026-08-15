import React from 'react';
import { ScoreIndicator } from '../ui/ScoreIndicator';

export interface MetricBreakdownProps {
  breakdown: {
    relevance: number;
    structure: number;
    clarity: number;
    depth: number;
    evidence: number;
    roleAlignment: number;
  };
}

export const MetricBreakdown: React.FC<MetricBreakdownProps> = ({ breakdown }) => {
  return (
    <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <h3 className="text-sm font-bold text-foreground">Score Breakdown</h3>
        <span className="text-[11px] text-foreground-muted font-medium">Hiring Benchmark: 7.0</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <ScoreIndicator label="Relevance to Prompt" score={breakdown.relevance} benchmark={7.0} />
        <ScoreIndicator label="Structure & Frameworks (STAR)" score={breakdown.structure} benchmark={7.0} />
        <ScoreIndicator label="Clarity & Communication" score={breakdown.clarity} benchmark={7.0} />
        <ScoreIndicator label="Depth of Reasoning" score={breakdown.depth} benchmark={7.0} />
        <ScoreIndicator label="Quantitative Evidence & Metrics" score={breakdown.evidence} benchmark={7.0} />
        <ScoreIndicator label="Role & Culture Alignment" score={breakdown.roleAlignment} benchmark={7.0} />
      </div>
    </div>
  );
};
