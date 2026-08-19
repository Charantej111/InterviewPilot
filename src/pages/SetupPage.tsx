import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useInterview } from '../context/InterviewContext';
import { Button } from '../components/ui/Button';
import { ShiningText } from '../components/ui/ShiningText';
import { AILoader } from '../components/ui/AILoader';
import { InterviewDifficulty, InterviewDuration, InterviewStyle } from '../types/interview';
import { 
  FileText, 
  UploadCloud, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Building2, 
  Briefcase, 
  AlertCircle,
  Clock,
  Flame,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    setupDraft,
    updateSetupDraft,
    uploadResumeFile,
    analyzeJobDescription,
    researchCompanyContext,
    prepareTailoredInterview,
    createInterviewFromDraft,
  } = useInterview();


  const [mode, setMode] = useState<'input' | 'ready'>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('Extracting resume & job signals...');
  const [loadingSteps, setLoadingSteps] = useState<import('../components/ui/AILoader').LoadingStep[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Resume Upload Handler
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStage(`Extracting candidate profile from ${file.name}...`);
    setLoadingSteps([
      { label: `Parsing ${file.name} deliverables`, status: 'in_progress' },
      { label: 'Structuring candidate competencies & skills', status: 'pending' },
    ]);

    try {
      await uploadResumeFile(file);
      setLoadingSteps([
        { label: `Parsed ${file.name} deliverables`, status: 'completed' },
        { label: 'Candidate evidence extracted — review required', status: 'completed' },
      ]);
      // Navigate to evidence review page — candidate must confirm before interview starts
      navigate('/setup/resume-intelligence');
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Failed to upload resume document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // One-Click Calibrate & Prepare
  const handleCalibrateAndPrepare = async () => {
    if (!setupDraft.jobTitle.trim() || !setupDraft.company.trim()) {
      setErrorMessage('Please enter both the target role and company name.');
      return;
    }

    // Gate: candidate must have confirmed their profile before calibration
    if (!setupDraft.lockedCandidateContext) {
      if (setupDraft.candidateEvidenceModel) {
        navigate('/setup/resume-intelligence');
        return;
      }
      setErrorMessage('Please upload and confirm your resume first.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    
    setLoadingSteps([
      { label: `Deconstruct ${setupDraft.jobTitle} hiring bar`, status: 'in_progress' },
      { label: `Research ${setupDraft.company} context & verified facts`, status: 'pending' },
      { label: 'Calculate requirement-level fit & map gaps', status: 'pending' },
      { label: 'Prepare interview objectives', status: 'pending' },
    ]);

    try {
      // 1. Analyze JD → JDEvidenceModel
      setProcessingStage(`Deconstructing ${setupDraft.jobTitle} requirements...`);
      const jdText = setupDraft.jobDescriptionText.trim() || `${setupDraft.jobTitle} at ${setupDraft.company}`;
      await analyzeJobDescription(setupDraft.jobTitle, setupDraft.company, jdText);

      setLoadingSteps([
        { label: `Deconstructed ${setupDraft.jobTitle} hiring bar`, status: 'completed' },
        { label: `Researching ${setupDraft.company} context & verified facts`, status: 'in_progress' },
        { label: 'Calculate requirement-level fit & map gaps', status: 'pending' },
        { label: 'Prepare interview objectives', status: 'pending' },
      ]);

      // 2. Company Research
      setProcessingStage(`Gathering grounded ${setupDraft.company} intelligence...`);
      await researchCompanyContext(
        setupDraft.company,
        setupDraft.jobTitle
      );

      // 3. Compute match using new engine if we have evidence models
      setLoadingSteps([
        { label: `Deconstructed ${setupDraft.jobTitle} hiring bar`, status: 'completed' },
        { label: `Gathered ${setupDraft.company} context & verified facts`, status: 'completed' },
        { label: 'Calculating requirement-level fit...', status: 'in_progress' },
        { label: 'Prepare interview objectives', status: 'pending' },
      ]);

      const jdEvidenceModel = setupDraft.jdEvidenceModel;
      if (setupDraft.lockedCandidateContext && jdEvidenceModel) {
        try {
          const { computeMatchAssessment, buildLegacyMatchResult } = await import('../services/ai/matchEngine');
          const assessment = computeMatchAssessment(setupDraft.lockedCandidateContext, jdEvidenceModel);
          const legacyResult = buildLegacyMatchResult(assessment);
          updateSetupDraft({ matchAnalysis: legacyResult });
        } catch (matchErr) {
          console.warn('Match engine failed, skipping match step:', matchErr);
        }
      }

      setLoadingSteps([
        { label: `Deconstructed ${setupDraft.jobTitle} hiring bar`, status: 'completed' },
        { label: `Gathered ${setupDraft.company} context & verified facts`, status: 'completed' },
        { label: 'Requirement-level fit calculated', status: 'completed' },
        { label: 'Preparing interview objectives...', status: 'in_progress' },
      ]);

      // 4. Prepare tailored interview
      setProcessingStage('Calibrating tailored interview questions & rubric...');
      await prepareTailoredInterview();


      setLoadingSteps([
        { label: `Deconstructed ${setupDraft.jobTitle} hiring bar`, status: 'completed' },
        { label: `Gathered ${setupDraft.company} context & verified facts`, status: 'completed' },
        { label: 'Requirement-level fit calculated', status: 'completed' },
        { label: 'Interview objectives ready', status: 'completed' },
      ]);

      setMode('ready');
    } catch (err: any) {
      console.error('Calibration error:', err);
      setErrorMessage(err.message || 'Failed to prepare interview simulation.');
    } finally {
      setIsProcessing(false);
    }
  };


  // Launch Simulation
  const handleLaunchSimulation = async () => {
    setIsProcessing(true);
    setProcessingStage('Initializing interview session...');
    try {
      const session = await createInterviewFromDraft();
      navigate('/interview/preview', { state: { sessionId: session.id } });
    } catch (err: any) {
      console.error('Launch error:', err);
      setErrorMessage(err.message || 'Failed to start interview.');
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 text-left pb-16">
        {/* Hidden Native File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            <ShiningText text={mode === 'input' ? 'Start Mock Interview' : 'Simulation Brief'} />
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">
            {mode === 'input'
              ? 'Calibrate your simulation based on the specific job posting and company you want to practice for.'
              : `Ready to simulate your interview for ${setupDraft.jobTitle} at ${setupDraft.company}.`}
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PROCESSING LOADER STATE */}
        {isProcessing && (
          <AILoader
            title="Calibrating Simulation Engine"
            stage={processingStage}
            steps={loadingSteps}
          />
        )}

        {/* MODE 1: SETUP & CONTEXT INPUT */}
        {mode === 'input' && !isProcessing && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6 animate-fadeIn">
            {/* Target Role & Target Company from JD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-zinc-400" />
                    <span>Role Title (from Job Posting)</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={setupDraft.jobTitle}
                  onChange={(e) => updateSetupDraft({ jobTitle: e.target.value })}
                  placeholder="e.g. Product Manager Intern"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                />
                <span className="text-[10px] text-foreground-muted block">The exact job title you are interviewing for</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-zinc-400" />
                    <span>Company Hiring for this Role</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={setupDraft.company}
                  onChange={(e) => updateSetupDraft({ company: e.target.value })}
                  placeholder="e.g. Google, Stripe, Linear"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                />
                <span className="text-[10px] text-foreground-muted block">The company hiring for this opening (from the JD)</span>
              </div>
            </div>

            {/* Resume Upload Chip or Dropzone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText size={13} className="text-zinc-400" />
                <span>Your Resume (PDF / DOCX)</span>
              </label>

              {setupDraft.resumeName ? (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                      <FileText size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground truncate max-w-[240px]">
                        {setupDraft.resumeName}
                      </h4>
                      <p className="text-[10px] text-foreground-muted font-medium">
                        {setupDraft.resumeFileSize || 'Resume Attached'} • Profile Ready
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Replace</span>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'p-6 rounded-2xl border border-dashed transition-all text-center cursor-pointer',
                    isDragOver
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-400'
                  )}
                >
                  <UploadCloud size={22} className="mx-auto mb-2 text-zinc-400" />
                  <p className="text-xs font-bold text-foreground">Upload or drag & drop your resume</p>
                  <p className="text-[10px] text-foreground-muted mt-0.5 font-medium">PDF, DOC, DOCX up to 10 MB</p>
                </div>
              )}
            </div>

            {/* Complete Job Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText size={13} className="text-zinc-400" />
                  <span>Job Description (from the Posting)</span>
                </span>
                <span className="text-[10px] font-normal text-foreground-muted">Paste full requirements</span>
              </label>
              <textarea
                rows={5}
                value={setupDraft.jobDescriptionText}
                onChange={(e) => updateSetupDraft({ jobDescriptionText: e.target.value })}
                placeholder="Paste the job description, responsibilities, or specific requirements for this opening..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground leading-relaxed outline-none focus:border-zinc-400 dark:focus:border-zinc-500 resize-y"
              />
              <span className="text-[10px] text-foreground-muted block">
                InterviewPilot extracts hiring signals from this text to match against your resume.
              </span>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                size="lg"
                onClick={handleCalibrateAndPrepare}
                rightIcon={<ArrowRight size={16} />}
                className="w-full sm:w-auto shadow-sm"
              >
                Calibrate & Prepare Simulation
              </Button>
            </div>
          </div>
        )}

        {/* MODE 2: EXECUTIVE READY BRIEF */}
        {mode === 'ready' && !isProcessing && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6 animate-fadeIn">
            {/* Header Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Simulation Calibrated
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">
                  {setupDraft.jobTitle} · {setupDraft.company}
                </h2>
              </div>

              {setupDraft.matchAnalysis && (
                <div className="flex items-baseline gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                  <span className="text-xs text-foreground-muted font-semibold">Match:</span>
                  <span className="text-sm font-extrabold text-foreground font-mono">
                    {setupDraft.matchAnalysis.matchPercentage}%
                  </span>
                </div>
              )}
            </div>

            {/* Focus Probes Overview */}
            {setupDraft.tailoredQuestions && setupDraft.tailoredQuestions.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Prepared Anchor Topics ({setupDraft.tailoredQuestions.length})
                </h4>
                <div className="space-y-2">
                  {setupDraft.tailoredQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground">{q.category}</span>
                        <p className="text-foreground-muted text-[11px] leading-relaxed line-clamp-2">
                          "{q.text}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Segmented Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <Flame size={12} className="text-amber-500" />
                  <span>Difficulty</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {(['beginner', 'intermediate', 'advanced'] as InterviewDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateSetupDraft({ difficulty: d })}
                      className={cn(
                        'py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer text-center',
                        setupDraft.difficulty === d
                          ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                          : 'text-foreground-muted hover:text-foreground'
                      )}
                    >
                      {d === 'intermediate' ? 'Senior' : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <Clock size={12} className="text-blue-500" />
                  <span>Duration</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {([10, 20, 30] as InterviewDuration[]).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => updateSetupDraft({ durationMinutes: dur })}
                      className={cn(
                        'py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center',
                        setupDraft.durationMinutes === dur
                          ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                          : 'text-foreground-muted hover:text-foreground'
                      )}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <UserCheck size={12} className="text-purple-500" />
                  <span>Tone</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {(['friendly', 'realistic', 'challenging'] as InterviewStyle[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateSetupDraft({ interviewStyle: st })}
                      className={cn(
                        'py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer text-center',
                        setupDraft.interviewStyle === st
                          ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                          : 'text-foreground-muted hover:text-foreground'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setMode('input')}
                leftIcon={<ArrowLeft size={15} />}
              >
                Edit Setup
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={handleLaunchSimulation}
                rightIcon={<Play size={15} className="fill-current" />}
                className="shadow-md"
              >
                Start Interview Simulation
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SetupPage;
