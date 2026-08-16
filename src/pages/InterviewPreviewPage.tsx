import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Folder } from '../components/reactbits/Folder';
import { 
  Building2, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

export const InterviewPreviewPage: React.FC = () => {
  const { activeSession } = useInterview();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (activeSession.status === 'failed') {
      navigate('/dashboard');
    }
  }, [activeSession.status, navigate]);

  const handleStart = () => {
    if (activeSession.status === 'failed') {
      navigate('/dashboard');
      return;
    }
    navigate(`/interview/${activeSession.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-4 space-y-8">
        {/* Pre-flight Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm">Pre-Flight Briefing</Badge>
              <span className="text-xs text-foreground-muted">Session ID: {activeSession.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Your Interview is Ready
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Review the focus dimensions and expectations below before entering the live room.
            </p>
          </div>

          <div className="hidden sm:block">
            <Folder
              color="#5A55DF"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-foreground">Briefing</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-foreground">{activeSession.questions.length} Qs</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-foreground">Live AI</div>
              ]}
            />
          </div>
        </div>

        {/* Blueprint Overview Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Target Role
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                {activeSession.jobTitle}
              </h2>
              <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{activeSession.company}</span>
                <span>•</span>
                <span className="capitalize">{activeSession.interviewType} Loop</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" size="md" className="font-semibold">
                {activeSession.difficulty.toUpperCase()}
              </Badge>
              <Badge variant="neutral" size="md">
                {activeSession.questions.length} Questions
              </Badge>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60">
              <span className="text-foreground-muted block">Duration</span>
              <span className="font-semibold text-foreground font-mono">~{activeSession.durationMinutes} mins</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60">
              <span className="text-foreground-muted block">Input Mode</span>
              <span className="font-semibold text-foreground">Voice & Text</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60">
              <span className="text-foreground-muted block">Follow-ups</span>
              <span className="font-semibold text-foreground">Adaptive</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60">
              <span className="text-foreground-muted block">Passing Bar</span>
              <span className="font-semibold text-foreground font-mono">7.0 / 10</span>
            </div>
          </div>

          {/* AI Focus Narrative */}
          <div className="p-4 rounded-xl bg-primary-subtle/40 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Calibration Summary:</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              Based on your resume and this {activeSession.jobTitle} role at {activeSession.company}, your interview will focus on:
            </p>
            <ul className="space-y-1.5 pt-1">
              {activeSession.focusAreas.map((area, idx) => (
                <li key={idx} className="text-xs text-foreground-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Examiner's Tips */}
          <div className="p-4 rounded-xl bg-surface-subtle/60 border border-border/80 space-y-2 text-xs text-foreground-muted">
            <span className="font-semibold text-foreground block">
              Interview Best Practices:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>• Take 10 seconds to collect your thoughts before speaking.</div>
              <div>• Use the STAR framework for behavioral responses.</div>
              <div>• State your baseline numbers before experiment metrics.</div>
              <div>• Always include a guardrail counter-metric.</div>
            </div>
          </div>
        </div>

        {/* Start CTA */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" onClick={() => navigate('/setup')}>
            Back to Setup
          </Button>

          <Button
            size="lg"
            onClick={handleStart}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="px-8 shadow-md"
          >
            Start interview
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
