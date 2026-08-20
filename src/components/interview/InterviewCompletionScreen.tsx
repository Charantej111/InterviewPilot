import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { CheckCircle2, Loader2, Circle, AlertCircle, ArrowRight, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface InterviewCompletionScreenProps {
  status: 'completing' | 'completed' | 'report_generating' | 'report_ready' | 'report_failed';
  errorMessage?: string;
  onRetry?: () => void;
  onGoToDashboard?: () => void;
  onViewReport?: () => void;
}

export const InterviewCompletionScreen: React.FC<InterviewCompletionScreenProps> = ({
  status,
  errorMessage,
  onRetry,
  onGoToDashboard,
  onViewReport,
}) => {
  const isFailed = status === 'report_failed';

  const steps = [
    {
      label: 'Candidate responses securely saved',
      status: status === 'completing' ? 'in_progress' : 'completed',
    },
    {
      label: 'Multi-turn answer evaluation & signal extraction',
      status:
        status === 'completing'
          ? 'pending'
          : status === 'completed'
          ? 'in_progress'
          : isFailed
          ? 'completed'
          : 'completed',
    },
    {
      label: 'Synthesizing executive readiness report & rubrics',
      status:
        status === 'report_generating'
          ? 'in_progress'
          : status === 'report_ready'
          ? 'completed'
          : isFailed
          ? 'pending'
          : 'pending',
    },
    {
      label: 'Performance dossier & hiring bar recommendation',
      status: status === 'report_ready' ? 'completed' : 'pending',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center max-w-lg w-full mx-auto bg-zinc-900/90 dark:bg-zinc-900/90 text-white backdrop-blur-2xl border border-zinc-800 shadow-2xl animate-fadeIn">
      {/* Ambient Radial Lighting */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 space-y-6">
        {/* Animated Visual */}
        {isFailed ? (
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertCircle size={32} />
          </div>
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto flex items-center justify-center">
            <DotLottieReact
              src="https://lottie.host/62c7d048-2882-4ac7-bf30-5e33816b4ec4/a2PgmTbjDh.lottie"
              loop
              autoplay
            />
          </div>
        )}

        {/* Title & Status Message */}
        <div className="space-y-1.5 text-left sm:text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 size={13} />
            <span>Interview Completed</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isFailed
              ? 'Report Synthesis Delayed'
              : status === 'report_ready'
              ? 'Performance Report Ready'
              : 'Reviewing Your Responses'}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {isFailed
              ? errorMessage || 'All your answers are safely preserved. The AI report synthesis encountered a temporary delay.'
              : status === 'report_ready'
              ? 'Your comprehensive evaluation report is ready. Redirecting to your candidate dossier...'
              : 'Your responses have been safely saved. We are generating your comprehensive evaluation report and actionable coaching points.'}
          </p>
        </div>

        {/* Real-Time Stepped Checklist */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-left space-y-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs py-1 transition-all duration-300 ${
                step.status === 'completed'
                  ? 'text-emerald-400 font-semibold'
                  : step.status === 'in_progress'
                  ? 'text-white font-bold animate-pulse'
                  : 'text-zinc-500 font-normal'
              }`}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : step.status === 'in_progress' ? (
                <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" />
              ) : (
                <Circle size={16} className="text-zinc-700 shrink-0" />
              )}
              <span className="leading-snug">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Safety Note & Action Buttons */}
        <div className="space-y-3 pt-2">
          {!isFailed && status !== 'report_ready' && (
            <p className="text-[11px] text-zinc-400 leading-normal">
              Please keep this tab open for a few seconds. If you navigate away, your progress is saved and your report will be available on your dashboard.
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isFailed && onRetry && (
              <Button
                size="md"
                onClick={onRetry}
                leftIcon={<RefreshCw size={15} />}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Retry Report Generation
              </Button>
            )}

            {status === 'report_ready' && onViewReport && (
              <Button
                size="md"
                onClick={onViewReport}
                rightIcon={<ArrowRight size={15} />}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold"
              >
                View Performance Report
              </Button>
            )}

            {onGoToDashboard && (
              <Button
                variant="outline"
                size="md"
                onClick={onGoToDashboard}
                leftIcon={<LayoutDashboard size={14} />}
                className="w-full sm:w-auto border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCompletionScreen;
