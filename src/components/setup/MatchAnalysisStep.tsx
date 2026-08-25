import React, { useState } from 'react';
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
  Target,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MatchAnalysisStepProps {
  matchResult?: MatchAnalysisResult | null;
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
  const [showScoreTrace, setShowScoreTrace] = useState(false);
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('matchDebug=true');

  if (!matchResult || matchResult.matchPercentage === null || matchResult.matchPercentage === undefined) {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Section Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <GitCompare size={13} className="text-zinc-500" />
            <span>Stage 4 of 6 • Match Alignment</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            <ShiningText text="Resume × JD Match" />
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            No job description was supplied. The interview will be dynamically grounded in your confirmed resume.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <GitCompare size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No Job Description Provided</h3>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto">
              Your interview will operate in <strong className="text-foreground">Resume-Grounded Mode</strong>, evaluating depth, technical trade-offs, and ownership of your confirmed deliverables.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="secondary" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onContinue} rightIcon={<ArrowRight size={16} />}>
              Continue with Resume-Grounded Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { matchPercentage, directMatches, transferableMatches, gaps, companyAlignmentSummary, matchAssessment } = matchResult;
  const directList = directMatches || [];
  const transList = transferableMatches || [];
  const gapList = gaps || [];

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
          <GitCompare size={13} className="text-zinc-500" />
          <span>Stage 4 of 6 • Evidence-Based Match Alignment</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text="Requirement × Evidence Alignment" />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Deterministic alignment calculation comparing your confirmed resume evidence against extracted job posting requirements.
        </p>
      </div>

      {/* Match Alignment Dossier */}
      <div className="space-y-5">
        {/* Score Card */}
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
                  ({matchAssessment?.verdict ? matchAssessment.verdict.toUpperCase() : 'CALCULATED'})
                </span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-foreground max-w-sm">
              <span className="font-semibold">{companyAlignmentSummary}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">{directList.length}</span>
              <span className="text-[11px] text-foreground-muted font-medium">Direct Matches</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-bold block">{transList.length}</span>
              <span className="text-[11px] text-foreground-muted font-medium">Transferable</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-bold block">{gapList.length}</span>
              <span className="text-[11px] text-foreground-muted font-medium">Requirement Gaps</span>
            </div>
          </div>
        </div>

        {/* Direct Matches */}
        {directList.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Direct Verified Matches ({directList.length})</span>
            </h4>
            <div className="space-y-2">
              {directList.map((ms, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span className="font-bold text-foreground">{ms.competency}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">Direct</span>
                  </div>
                  <p className="text-foreground-muted text-[11px] pl-5 italic">
                    "{ms.evidence}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transferable Matches */}
        {transList.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              <span>Transferable Capabilities ({transList.length})</span>
            </h4>
            <div className="space-y-2">
              {transList.map((ms, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
                    <span className="font-bold text-foreground">{ms.competency}</span>
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10">Transferable</span>
                  </div>
                  <p className="text-foreground-muted text-[11px] pl-5 italic">
                    "{ms.evidence}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirement Gaps */}
        {gapList.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Target size={14} className="text-amber-500" />
                <span>Identified Role Requirements Not Grounded on Resume ({gapList.length})</span>
              </h4>
              <p className="text-[11px] text-foreground-muted">
                These specific requirements from the job posting did not have direct or transferable evidence in your confirmed profile:
              </p>
            </div>

            <div className="space-y-2.5">
              {gapList.map((gap) => (
                <div
                  key={gap.gapId}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-500 shrink-0" />
                      <span className="font-bold text-foreground">{gap.requirement}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                      {gap.criticality === 'blocking' ? 'Critical' : 'Required'}
                    </span>
                  </div>
                  {gap.provenance?.snippet && (
                    <p className="text-foreground-muted text-[11px] pl-5">
                      <strong className="text-foreground">JD Source:</strong> "{gap.provenance.snippet}"
                    </p>
                  )}

                  {/* Debug-only Priority Controller */}
                  {isDebug && (
                    <div className="pt-2 pl-5 flex items-center gap-2">
                      <span className="text-[10px] text-foreground-muted uppercase font-bold">Debug Override:</span>
                      <select
                        value={gap.priority}
                        onChange={(e) => onUpdateGapPriority(gap.gapId, e.target.value as GapPriority)}
                        className="text-[10px] px-2 py-0.5 rounded border bg-surface"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="excluded">Exclude</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainable Mathematical Score Trace */}
        {matchAssessment && matchAssessment.requirementMatches.length > 0 && (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowScoreTrace(!showScoreTrace)}
              className="text-xs font-bold text-foreground-muted hover:text-foreground flex items-center gap-1.5 cursor-pointer w-full justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Layers size={13} />
                <span>Explainable Score Trace (Why {matchPercentage}%?)</span>
              </span>
              {showScoreTrace ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showScoreTrace && (
              <div className="mt-3 overflow-x-auto text-xs animate-fadeIn">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 text-[10px] uppercase text-foreground-muted font-bold">
                      <th className="py-2 pr-3">Requirement</th>
                      <th className="py-2 px-2">Strength</th>
                      <th className="py-2 px-2">Verdict</th>
                      <th className="py-2 px-2">Weight</th>
                      <th className="py-2 px-2">Multiplier</th>
                      <th className="py-2 pl-2">Earned / Possible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-[11px]">
                    {matchAssessment.requirementMatches.map((rm, idx) => (
                      <tr key={idx} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2 pr-3 font-semibold text-foreground max-w-[220px] truncate" title={rm.jdRequirement.requirement}>
                          {rm.jdRequirement.requirement}
                        </td>
                        <td className="py-2 px-2 capitalize text-foreground-muted">
                          {rm.jdRequirement.strength} {rm.jdRequirement.critical ? '(Crit)' : ''}
                        </td>
                        <td className="py-2 px-2">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                            rm.verdict === 'direct' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            rm.verdict === 'transferable' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}>
                            {rm.verdict}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-mono text-foreground-muted">{rm.scoreTrace.weight}x</td>
                        <td className="py-2 px-2 font-mono text-foreground-muted">{rm.scoreTrace.multiplier}</td>
                        <td className="py-2 pl-2 font-mono font-bold text-foreground">
                          {rm.scoreTrace.earnedPoints} / {rm.scoreTrace.possiblePoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
