import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Building2, 
  Sparkles, 
  ArrowRight,
  Mic,
  Keyboard,
  CheckCircle2,
  Lock,
  Compass,
  Clock,
  Radio
} from 'lucide-react';
import { InterviewMode } from '../types/interview';

export const InterviewPreviewPage: React.FC = () => {
  const { activeSession, setupDraft, startVoiceSession, switchToTextMode } = useInterview();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (activeSession.status === 'failed') {
      navigate('/dashboard');
    }
  }, [activeSession.status, navigate]);

  const handleStart = (mode: InterviewMode) => {
    if (activeSession.status === 'failed') {
      navigate('/dashboard');
      return;
    }
    if (mode === 'voice') {
      navigate(`/interview/${activeSession.id}`);
      setTimeout(() => startVoiceSession(), 400);
    } else {
      switchToTextMode();
      navigate(`/interview/${activeSession.id}`);
    }
  };

  const roleName = activeSession.jobTitle || setupDraft.jobTitle || 'Target Role';
  const companyName = activeSession.company || setupDraft.company || 'Target Company';
  const duration = activeSession.durationMinutes || setupDraft.durationMinutes || 20;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-8">
        {/* Pre-flight Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Badge variant="accent" size="sm" className="gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Dynamic Simulation Ready
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Your interview is ready
          </h1>
          <p className="text-sm text-foreground-muted">
            The interviewer has loaded your background and requirements. Questions will adapt in real time to your responses.
          </p>
        </div>

        {/* Opaque Briefing Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-6">
          {/* Target Role & Company */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Target Role
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                {roleName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{companyName}</span>
                <span>•</span>
                <span className="capitalize">{activeSession.interviewType || 'Realistic'} Simulation</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" size="md" className="font-semibold capitalize">
                {activeSession.difficulty || 'Intermediate'}
              </Badge>
            </div>
          </div>

          {/* Key Simulation Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-foreground-muted block text-[11px]">Time Window</span>
                <span className="font-semibold text-foreground font-mono">{duration} minutes</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60 flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-foreground-muted block text-[11px]">Question Order</span>
                <span className="font-semibold text-foreground">Adaptive</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60 flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-foreground-muted block text-[11px]">Evaluation</span>
                <span className="font-semibold text-foreground">Evidence-Based</span>
              </div>
            </div>
          </div>

          {/* Grounding Pillars */}
          <div className="p-4 rounded-xl bg-surface-subtle/70 border border-border/80 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              Interview Grounding & Context:
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Confirmed resume evidence & technical deliverables (Locked)</span>
              </div>
              {setupDraft.jobDescriptionProvided && setupDraft.jobDescriptionText ? (
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Deconstructed job posting requirements & competency signals</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-foreground-muted">
                  <span className="w-4 h-4 rounded-full border border-zinc-400 flex items-center justify-center text-[10px] shrink-0">·</span>
                  <span>No JD provided — You can add a job description to enable role-specific matching and interview calibration</span>
                </div>
              )}
              {setupDraft.companyResearch ? (
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified {companyName} company context</span>
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-foreground-muted italic leading-relaxed text-center sm:text-left">
            The interviewer will decide what to ask dynamically based on your responses.
          </p>
        </div>

        {/* Start CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <Button variant="secondary" onClick={() => navigate('/setup')}>
            Back to Setup
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant="secondary"
              onClick={() => handleStart('text')}
              leftIcon={<Keyboard className="w-4 h-4" />}
            >
              Start Text Interview
            </Button>

            <Button
              size="lg"
              onClick={() => handleStart('voice')}
              leftIcon={<Mic className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="px-6 shadow-md"
            >
              Start Voice Interview
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewPreviewPage;
