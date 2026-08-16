import React from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { MatchAnalysisResult, GapPriority } from '../../types/matchAnalysis';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Target 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MatchAnalysisStepProps {
  matchResult: MatchAnalysisResult;
  onUpdateGapPriority: (gapId: string, priority: GapPriority) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const MatchAnalysisStep: React.FC<MatchAnalysisStepProps> = ({
  matchResult,
  onUpdateGapPriority,
  onContinue,
  onBack,
}) => {
  const { matchPercentage, deterministicBreakdown, matchingStrengths, actionableGaps, companyAlignmentSummary } = matchResult;

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
          <GitCompare size={13} className="text-zinc-500" />
          <span>Stage 4 of 6 • Match Alignment & Gap Strategy</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text="Resume ↔ Job Gap Analysis" />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Deterministic alignment calculation based on requirement coverage. Customize the probe priority for each identified gap before generating your interview.
        </p>
      </div>

      {/* Match Alignment Dossier */}
      <div className="space-y-5">
        {/* Score & Formula Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Deterministic Match Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground font-mono">
                  {matchPercentage}%
                </span>
                <span className="text-xs text-foreground-muted font-semibold">
                  (Requirement Coverage Baseline)
                </span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-foreground max-w-sm">
              <span className="font-semibold">{companyAlignmentSummary}</span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
              <span className="text-foreground-muted font-medium">Required Skills Coverage</span>
              <p className="text-sm font-extrabold text-foreground font-mono">
                {deterministicBreakdown.requiredSkillsCoverage} / 45 pts
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
              <span className="text-foreground-muted font-medium">Experience Depth</span>
              <p className="text-sm font-extrabold text-foreground font-mono">
                {deterministicBreakdown.experienceAlignment} / 30 pts
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
              <span className="text-foreground-muted font-medium">Competency Overlap</span>
              <p className="text-sm font-extrabold text-foreground font-mono">
                {deterministicBreakdown.competenciesMatch} / 25 pts
              </p>
            </div>
          </div>
        </div>

        {/* Matching Strengths */}
        {matchingStrengths && matchingStrengths.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Verified Matching Strengths ({matchingStrengths.length})</span>
            </h4>
            <div className="space-y-2">
              {matchingStrengths.map((ms, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span className="font-bold text-foreground">{ms.competency}</span>
                  </div>
                  <p className="text-foreground-muted text-[11px] pl-5">{ms.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Gaps with User Priority Customization */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Target size={14} className="text-amber-500" />
                <span>Identified Gap Areas & Probe Opportunities</span>
              </h4>
              <p className="text-[11px] text-foreground-muted">
                These JD requirements were not found on your resume. Set their interview probe priority or exclude them:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {actionableGaps.map((gap) => (
              <div
                key={gap.gapId}
                className={cn(
                  'p-4 rounded-2xl border transition-all text-xs space-y-2',
                  gap.priority === 'excluded'
                    ? 'bg-zinc-100/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 opacity-60'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    <span className="font-bold text-foreground text-sm">{gap.requirement}</span>
                  </div>

                  {/* Priority Select Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-foreground-muted font-bold uppercase">Probe Priority:</span>
                    <select
                      value={gap.priority}
                      onChange={(e) => onUpdateGapPriority(gap.gapId, e.target.value as GapPriority)}
                      className={cn(
                        'px-2.5 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer',
                        gap.priority === 'high'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : gap.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : gap.priority === 'low'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700'
                      )}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                      <option value="excluded">Exclude from Interview</option>
                    </select>
                  </div>
                </div>

                <div className="pl-6 space-y-1 text-foreground-muted text-[11px]">
                  <p><strong className="text-foreground">Recommendation:</strong> {gap.recommendation}</p>
                  <p><strong className="text-foreground">Simulated Probe:</strong> "{gap.targetedProbeOpportunity}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" size="md" onClick={onBack} leftIcon={<ArrowLeft size={15} />}>
            Back to Company Context
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={onContinue}
            rightIcon={<ArrowRight size={16} />}
            className="w-full sm:w-auto"
          >
            Continue to Calibration Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchAnalysisStep;
