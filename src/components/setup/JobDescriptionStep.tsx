import React from 'react';
import { useInterview } from '../../context/InterviewContext';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { 
  Briefcase, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { InterviewType, InterviewDifficulty, InterviewDuration } from '../../types/interview';

export interface JobDescriptionStepProps {
  onBack: () => void;
  onNext: () => void;
}

export const JobDescriptionStep: React.FC<JobDescriptionStepProps> = ({ onBack, onNext }) => {
  const { setupDraft, updateSetupDraft } = useInterview();

  const handleRolePreset = (title: string, company: string, type: InterviewType, jd: string) => {
    updateSetupDraft({
      jobTitle: title,
      company: company,
      interviewType: type,
      jobDescriptionText: jd,
    });
  };

  const isValid = 
    setupDraft.jobTitle.trim().length > 0 && 
    setupDraft.company.trim().length > 0 && 
    setupDraft.jobDescriptionText.trim().length > 20;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-xl font-bold text-foreground">Target Role & Job Description</h3>
        <p className="text-xs text-foreground-muted mt-1">
          Tell us about the company and role you are targeting so the interviewer can calibrate questions.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/80 space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Quick Test Templates:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleRolePreset(
                'Product Manager Intern',
                'Acme Corp',
                'mixed',
                'We are seeking a Product Manager Intern at Acme Corp to help discover user friction points, write PRDs, run experimentation funnels, and collaborate across engineering and UX design.'
              )
            }
            className="px-2.5 py-1 text-xs rounded-md bg-surface hover:bg-border/60 border border-border text-foreground font-medium transition-colors"
          >
            Product Manager (Acme)
          </button>
          <button
            type="button"
            onClick={() =>
              handleRolePreset(
                'Software Engineer (Frontend)',
                'Nova AI',
                'technical',
                'Looking for a Frontend Software Engineer skilled in React, TypeScript, and modern design systems. Responsible for performance optimization and building high-scale user workflows.'
              )
            }
            className="px-2.5 py-1 text-xs rounded-md bg-surface hover:bg-border/60 border border-border text-foreground font-medium transition-colors"
          >
            Frontend Engineer (Nova)
          </button>
          <button
            type="button"
            onClick={() =>
              handleRolePreset(
                'Business Analyst',
                'TechCorp Systems',
                'behavioral',
                'Seeking a Business Analyst to drive operational modeling, cross-functional stakeholder interviews, and data-informed process optimization.'
              )
            }
            className="px-2.5 py-1 text-xs rounded-md bg-surface hover:bg-border/60 border border-border text-foreground font-medium transition-colors"
          >
            Business Analyst (TechCorp)
          </button>
        </div>
      </div>

      {/* Role & Company Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Target Job Title"
          placeholder="e.g. Product Manager Intern"
          value={setupDraft.jobTitle}
          onChange={(e) => updateSetupDraft({ jobTitle: e.target.value })}
          leftIcon={<Briefcase className="w-4 h-4" />}
          required
        />
        <Input
          label="Target Company"
          placeholder="e.g. Acme Corp"
          value={setupDraft.company}
          onChange={(e) => updateSetupDraft({ company: e.target.value })}
          leftIcon={<Building2 className="w-4 h-4" />}
          required
        />
      </div>

      {/* Job Description Textarea */}
      <Textarea
        label="Job Description / Key Requirements"
        placeholder="Paste the job description text or key responsibility requirements here..."
        value={setupDraft.jobDescriptionText}
        onChange={(e) => updateSetupDraft({ jobDescriptionText: e.target.value })}
        rows={5}
        characterCount={{
          current: setupDraft.jobDescriptionText.split(/\s+/).filter(Boolean).length,
        }}
        helperText="The more details you provide, the sharper the role alignment scoring."
      />

      {/* Configuration Selectors */}
      <div className="space-y-4 pt-2 border-t border-border/80">
        {/* Interview Type */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Interview Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'mixed', label: 'Mixed' },
              { id: 'behavioral', label: 'Behavioral' },
              { id: 'product_case', label: 'Product / Case' },
              { id: 'technical', label: 'Technical' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => updateSetupDraft({ interviewType: type.id as InterviewType })}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  setupDraft.interviewType === type.id
                    ? 'bg-primary/10 border-primary text-primary font-semibold shadow-subtle'
                    : 'bg-surface border-border text-foreground hover:bg-surface-subtle'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'beginner', label: 'Entry' },
                { id: 'intermediate', label: 'Mid' },
                { id: 'advanced', label: 'Senior' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => updateSetupDraft({ difficulty: diff.id as InterviewDifficulty })}
                  className={`py-2 text-xs rounded-lg border font-medium transition-all ${
                    setupDraft.difficulty === diff.id
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-surface border-border text-foreground hover:bg-surface-subtle'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Estimated Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => updateSetupDraft({ durationMinutes: dur as InterviewDuration })}
                  className={`py-2 text-xs rounded-lg border font-medium transition-all ${
                    setupDraft.durationMinutes === dur
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-surface border-border text-foreground hover:bg-surface-subtle'
                  }`}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Next: Preferences
        </Button>
      </div>
    </div>
  );
};
