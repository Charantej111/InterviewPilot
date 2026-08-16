import React, { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { LetterLoader } from '../ui/LetterLoader';
import { CandidateProfile } from '../../types/resume';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  Briefcase, 
  Award, 
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ResumeStepProps {
  candidateProfile: CandidateProfile | null;
  uploadedFileName?: string;
  uploadedFileSize?: string;
  isProcessing: boolean;
  processingStageText?: string;
  errorMessage?: string | null;
  onUploadFile: (file: File) => Promise<void>;
  onContinue: () => void;
}

export const ResumeStep: React.FC<ResumeStepProps> = ({
  candidateProfile,
  uploadedFileName,
  uploadedFileSize,
  isProcessing,
  processingStageText = 'Analyzing candidate experience & technical profile...',
  errorMessage,
  onUploadFile,
  onContinue,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
          <FileText size={13} className="text-zinc-500" />
          <span>Stage 1 of 6 • Candidate Background</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text="Upload Your Resume" />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Upload your PDF, DOC, or DOCX resume. InterviewPilot will extract your actual projects, skills, and past deliverables to anchor live interview questions.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      {/* Upload Dropzone */}
      {!candidateProfile && !isProcessing && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20 scale-[0.99]'
              : 'border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-xs'
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <UploadCloud size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground">Click to upload or drag and drop</h3>
          <p className="text-xs text-foreground-muted mt-1 font-medium">
            Supported formats: PDF, DOC, DOCX (Max 10 MB)
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold shadow-xs">
            <FileText size={14} />
            <span>Select Resume Document</span>
          </div>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xs animate-fadeIn">
          <LetterLoader text="Reading Resume" size="md" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <Sparkles size={13} className="text-purple-500 animate-spin" />
            <span>{processingStageText}</span>
          </div>
        </div>
      )}

      {/* Extracted Candidate Profile View */}
      {candidateProfile && !isProcessing && (
        <div className="space-y-5 animate-fadeIn">
          {/* File Card Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground truncate max-w-[280px]">
                    {uploadedFileName || `${candidateProfile.name}'s Resume`}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                    Analyzed
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted font-medium">
                  {uploadedFileSize || 'Processed document'} • Structured profile verified
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-foreground transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw size={13} />
              <span>Replace Resume</span>
            </button>
          </div>

          {/* Profile Dossier Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
            {/* Candidate Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Award size={14} className="text-purple-500" />
                <span>Executive Summary</span>
              </h4>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                {candidateProfile.summary}
              </p>
            </div>

            {/* Extracted Core Skills */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Extracted Skills & Competencies ({candidateProfile.skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidateProfile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Deliverables & Projects */}
            {candidateProfile.projects && candidateProfile.projects.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Briefcase size={14} className="text-zinc-500" />
                  <span>Anchor Projects on Resume ({candidateProfile.projects.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidateProfile.projects.map((proj, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1.5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{proj.name}</span>
                        {proj.metrics && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            {proj.metrics}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground-muted leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Strengths Checklist */}
            {candidateProfile.strengths && candidateProfile.strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Identified Strengths
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {candidateProfile.strengths.map((str, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check size={11} />
                      </div>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action CTA */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="lg"
              onClick={onContinue}
              rightIcon={<ArrowRight size={16} />}
              className="w-full sm:w-auto"
            >
              Continue to Target Job
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeStep;
