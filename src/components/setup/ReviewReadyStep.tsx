import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../../context/InterviewContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Folder } from '../reactbits/Folder';
import { LetterLoader } from '../ui/LetterLoader';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  FileText, 
  Building2, 
  Clock, 
  Target, 
  ArrowRight
} from 'lucide-react';

export interface ReviewReadyStepProps {
  onBack: () => void;
}

export const ReviewReadyStep: React.FC<ReviewReadyStepProps> = ({ onBack }) => {
  const { setupDraft, createInterviewFromDraft } = useInterview();
  const [isBuilding, setIsBuilding] = useState(false);
  const navigate = useNavigate();

  const handleStartBuilding = async () => {
    setIsBuilding(true);
    try {
      const session = await createInterviewFromDraft();
      navigate('/interview/preview', { state: { sessionId: session.id } });
    } finally {
      setIsBuilding(false);
    }
  };

  if (isBuilding) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <LetterLoader text="Generating" />
        <p className="text-xs text-foreground-muted font-medium">
          Synthesizing personalized question sequence from your resume & target job description...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <span className="eyebrow mb-0.5 block">Review Blueprint</span>
        <h3 className="text-xl font-bold text-foreground">Ready to build your interview</h3>
        <p className="text-xs text-foreground-muted mt-1">
          Review your interview blueprint before we generate your personalized question sequence.
        </p>
      </div>

      {/* Blueprint Card */}
      <div className="p-6 rounded-2xl bg-surface/90 dark:bg-[#12121c]/90 backdrop-blur-xl border border-border/80 shadow-lg space-y-6">
        {/* Role & Company Header with 3D Folder Dossier */}
        <div className="flex items-start justify-between pb-4 border-b border-border/80">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Target Blueprint
            </span>
            <h4 className="text-lg font-bold text-foreground mt-0.5">
              {setupDraft.jobTitle}
            </h4>
            <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{setupDraft.company}</span>
              <span>•</span>
              <span className="capitalize">{setupDraft.interviewType} Loop</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="accent" size="sm" className="font-semibold">
              {setupDraft.difficulty.toUpperCase()}
            </Badge>
            <div className="hidden sm:block">
              <Folder
                color="#635BFF"
                size={0.8}
                items={[
                  <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Blueprint</div>,
                  <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">6 Qs</div>,
                  <div key="3" className="p-1 text-[9px] font-bold text-purple-700">Rubric</div>
                ]}
              />
            </div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle/80 border border-border/60">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <div>
              <span className="text-foreground-muted block">Attached Resume</span>
              <span className="font-bold text-foreground">{setupDraft.resumeName || 'Resume.pdf'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle/80 border border-border/60">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="text-foreground-muted block">Target Duration</span>
              <span className="font-bold text-foreground">{setupDraft.durationMinutes} Minutes (5-6 Questions)</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" />
            Core Focus Areas:
          </span>
          <div className="space-y-1.5">
            {setupDraft.focusAreas.map((area, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Calibration Note */}
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-2.5 text-xs text-foreground-muted">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="font-medium">
            The interviewer will challenge your specific metrics from your background and test your product prioritization under time pressure.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleStartBuilding}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="px-6 shadow-md"
        >
          Build my interview
        </Button>
      </div>
    </div>
  );
};

export default ReviewReadyStep;
