import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { LetterLoader } from '../ui/LetterLoader';
import { JobProfile } from '../../types/jobDescription';
import { 
  Briefcase, 
  Building2, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Target,
  Edit3
} from 'lucide-react';

export interface JobDescriptionStepProps {
  jobProfile: JobProfile | null;
  jobTitle: string;
  company: string;
  rawText: string;
  isAnalyzing: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateCompany: (company: string) => void;
  onUpdateRawText: (text: string) => void;
  onAnalyzeJD: () => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
}

export const JobDescriptionStep: React.FC<JobDescriptionStepProps> = ({
  jobProfile,
  jobTitle,
  company,
  rawText,
  isAnalyzing,
  onUpdateTitle,
  onUpdateCompany,
  onUpdateRawText,
  onAnalyzeJD,
  onContinue,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(!jobProfile);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || !jobTitle.trim() || !company.trim()) return;
    await onAnalyzeJD();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
          <Briefcase size={13} className="text-zinc-500" />
          <span>Stage 2 of 6 • Target Role & Requirements</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text="Target Job Description" />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Specify the target role and paste the complete job posting. InterviewPilot will extract key competencies, required qualifications, and interview rubrics.
        </p>
      </div>

      {/* Input Form Mode */}
      {(isEditing || !jobProfile) && (
        <form onSubmit={handleAnalyze} className="space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Briefcase size={13} className="text-zinc-400" />
                  <span>Target Role / Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => onUpdateTitle(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                />
              </div>

              {/* Target Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building2 size={13} className="text-zinc-400" />
                  <span>Target Company</span>
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => onUpdateCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google, Linear"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Complete Raw Job Description Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText size={13} className="text-zinc-400" />
                <span>Job Description & Requirements</span>
              </label>
              <textarea
                required
                rows={8}
                value={rawText}
                onChange={(e) => onUpdateRawText(e.target.value)}
                placeholder="Paste the complete job description text, responsibilities, requirements, and tech stack requirements here..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-xs sm:text-sm text-foreground leading-relaxed outline-none focus:border-zinc-400 dark:focus:border-zinc-500 resize-y"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button type="button" variant="outline" size="md" onClick={onBack} leftIcon={<ArrowLeft size={15} />}>
                Back
              </Button>
              <Button
                type="submit"
                size="md"
                isLoading={isAnalyzing}
                disabled={!rawText.trim() || !jobTitle.trim() || !company.trim() || isAnalyzing}
                leftIcon={<Sparkles size={15} className="text-purple-400" />}
              >
                Analyze Job Description
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Analyzing Progress State */}
      {isAnalyzing && (
        <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xs animate-fadeIn">
          <LetterLoader text="Deconstructing Job Requirements" size="md" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <Sparkles size={13} className="text-purple-500 animate-spin" />
            <span>Extracting core competencies, qualifications, and hiring rubrics...</span>
          </div>
        </div>
      )}

      {/* Decomposed Job Profile Dossier */}
      {jobProfile && !isAnalyzing && !isEditing && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground truncate max-w-[280px]">
                    {jobProfile.role} at {jobProfile.company}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold uppercase">
                    Requirements Extracted
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted font-medium">
                  {jobProfile.experienceRequirements}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-foreground transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Edit3 size={13} />
              <span>Edit Job Description</span>
            </button>
          </div>

          {/* Extracted Details Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
            {/* Responsibilities */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Target size={14} className="text-purple-500" />
                <span>Primary Role Responsibilities</span>
              </h4>
              <div className="space-y-2">
                {jobProfile.responsibilities.map((resp, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                    <div className="w-4 h-4 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} />
                    </div>
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Skills & Competencies */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Required Core Skills & Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {jobProfile.requiredSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Evaluation Signals */}
            {jobProfile.interviewSignals && jobProfile.interviewSignals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Hiring Bar Evaluation Signals
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {jobProfile.interviewSignals.map((sig, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs font-medium text-foreground"
                    >
                      • {sig}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" size="md" onClick={onBack} leftIcon={<ArrowLeft size={15} />}>
              Back to Resume
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onContinue}
              rightIcon={<ArrowRight size={16} />}
              className="w-full sm:w-auto"
            >
              Continue to Company Context
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptionStep;
