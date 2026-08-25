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
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
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
  const [showDetails, setShowDetails] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || !jobTitle.trim() || !company.trim()) return;
    await onAnalyzeJD();
    setIsEditing(false);
  };

  const totalRequirements = jobProfile
    ? (jobProfile.requiredSkills?.length || 0) +
      (jobProfile.preferredSkills?.length || 0) +
      (jobProfile.responsibilities?.length || 0) +
      (jobProfile.competencies?.length || 0)
    : 0;

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
          Specify the target role and paste the complete job posting. InterviewPilot will deconstruct requirements for interview calibration.
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
            <span>Extracting verified requirements, categories, and seniority level...</span>
          </div>
        </div>
      )}

      {/* Minimal Clean Job Profile Dossier */}
      {jobProfile && !isAnalyzing && !isEditing && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-foreground">
                      {jobProfile.role}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                      Extracted
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted font-medium">
                    {jobProfile.company} • {jobProfile.experienceRequirements}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-foreground transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Edit3 size={13} />
                <span>Edit Posting</span>
              </button>
            </div>

            {/* High-Level Category Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
                <span className="text-foreground-muted font-medium">Total Requirements</span>
                <p className="text-sm font-extrabold text-foreground font-mono">{totalRequirements}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
                <span className="text-foreground-muted font-medium">Core Skills</span>
                <p className="text-sm font-extrabold text-foreground font-mono">{jobProfile.requiredSkills?.length || 0}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
                <span className="text-foreground-muted font-medium">Responsibilities</span>
                <p className="text-sm font-extrabold text-foreground font-mono">{jobProfile.responsibilities?.length || 0}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-0.5">
                <span className="text-foreground-muted font-medium">Competencies</span>
                <p className="text-sm font-extrabold text-foreground font-mono">{jobProfile.competencies?.length || 0}</p>
              </div>
            </div>

            {/* Optional Expandable Debug Details */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-bold text-foreground-muted hover:text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={13} />
                <span>{showDetails ? 'Hide Requirement Details' : 'View Extracted Requirement Details'}</span>
                {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showDetails && (
                <div className="mt-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs animate-fadeIn">
                  {jobProfile.requiredSkills?.length > 0 && (
                    <div>
                      <span className="font-bold text-foreground block mb-1">Required Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {jobProfile.requiredSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-[11px] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobProfile.responsibilities?.length > 0 && (
                    <div>
                      <span className="font-bold text-foreground block mb-1">Responsibilities:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-foreground-muted text-[11px]">
                        {jobProfile.responsibilities.slice(0, 5).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
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
