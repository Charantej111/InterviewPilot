import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { Component as AILoader } from '../components/ui/ai-loader';

export const QuestionFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { activeSession, latestFeedback } = useInterview();

  React.useEffect(() => {
    if (activeSession && activeSession.id === id) {
      const isCompleted =
        activeSession.status === 'completed' ||
        activeSession.status === 'report_generating' ||
        activeSession.status === 'report_ready' ||
        activeSession.status === 'report_failed';

      if (!isCompleted) {
        console.warn('[InterviewIntegrity] Blocked premature feedback navigation');
        navigate(`/interview/${id}`, { replace: true });
      }
    }
  }, [id, activeSession?.status, navigate]);

  const currentQ = activeSession.questions[activeSession.currentQuestionIndex];
  const storedFeedback = currentQ?.id ? activeSession.feedbacks?.[currentQ.id] : null;
  const fb = latestFeedback || storedFeedback;

  const handleContinue = async () => {
    navigate(`/interview/${id || activeSession.id}/report`);
  };

  if (!fb) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-24 flex flex-col items-center justify-center space-y-4 text-center">
          <AILoader text="Analyzing" />
          <p className="text-xs text-foreground-muted font-medium">
            Fetching evaluated question feedback...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const metrics = [
    { label: 'Relevance', score: fb.breakdown?.relevance ?? 0, color: 'bg-cyan-500' },
    { label: 'Structure', score: fb.breakdown?.structure ?? 0, color: 'bg-emerald-500' },
    { label: 'Clarity', score: fb.breakdown?.clarity ?? 0, color: 'bg-indigo-500' },
    { label: 'Depth', score: fb.breakdown?.depth ?? 0, color: 'bg-amber-500' },
    { label: 'Evidence', score: fb.breakdown?.evidence ?? 0, color: 'bg-rose-500' },
    { label: 'Role alignment', score: fb.breakdown?.roleAlignment ?? 0, color: 'bg-emerald-500' },
  ];

  const currentQNum = (activeSession.currentQuestionIndex || 0) + 1;
  const totalQNum = activeSession.questions?.length || 1;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="space-y-1 text-left">
          <span className="eyebrow block">
            Question {currentQNum} of {totalQNum} Evaluated
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            How did you answer?
          </h1>
        </div>

        {/* Feedback Main Glass Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface/80 backdrop-blur-2xl border border-border/80 shadow-xl shadow-purple-500/5 dark:shadow-black/40 space-y-8 text-left">
          {/* Big Score Display */}
          <div className="flex items-baseline gap-2 pb-6 border-b border-border/80">
            <span className="text-4xl sm:text-5xl font-extrabold text-foreground font-mono tracking-tight">
              {Number(fb.overallScore || 0).toFixed(1)}
            </span>
            <span className="text-lg sm:text-xl text-foreground-muted font-medium">/ 10</span>
          </div>

          {/* 6 Rubric Dimension Bars */}
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-semibold">{m.label}</span>
                  <span className="font-mono font-bold text-foreground">
                    {Number(m.score).toFixed(1)} / 10
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-subtle border border-border/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                    style={{ width: `${(Math.max(0, Math.min(10, m.score)) / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown Sections */}
          <div className="space-y-4 pt-4 border-t border-border/80">
            {/* What worked */}
            {fb.whatWorked && fb.whatWorked.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                  <Check size={15} />
                  <span>What worked</span>
                </div>
                <ul className="space-y-1 text-xs text-foreground-muted pl-6 list-disc">
                  {fb.whatWorked.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What held you back */}
            {fb.whatHeldYouBack && fb.whatHeldYouBack.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500">
                  <X size={15} />
                  <span>What held you back</span>
                </div>
                <ul className="space-y-1 text-xs text-foreground-muted pl-6 list-disc">
                  {fb.whatHeldYouBack.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Try this next time */}
            {fb.tryThisNextTime?.suggestion && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles size={14} />
                  <span>Actionable Recommendation ({fb.tryThisNextTime.framework || 'STAR Framework'}):</span>
                </div>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {fb.tryThisNextTime.suggestion}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-4">
            <Button
              variant="glass-primary"
              size="md"
              onClick={handleContinue}
              className="w-full sm:w-auto shadow-md"
              rightIcon={<ArrowRight size={15} />}
            >
              {currentQNum < totalQNum ? 'Continue to next question' : 'View final report'}
            </Button>

            <Button
              variant="glass-secondary"
              size="md"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto"
            >
              View dashboard
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuestionFeedbackPage;
