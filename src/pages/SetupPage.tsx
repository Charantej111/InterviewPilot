import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useInterview } from '../context/InterviewContext';
import { AnimatedAIChat } from '../components/ui/AnimatedAIChat';
import { ShiningText } from '../components/ui/ShiningText';
import { Button } from '../components/ui/Button';
import { LetterLoader } from '../components/ui/LetterLoader';
import { CustomDropdown } from '../components/ui/CustomDropdown';
import { Folder } from '../components/reactbits/Folder';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Target, 
  Building2, 
  Briefcase, 
  Sliders, 
  Clock, 
  Zap,
  Gauge
} from 'lucide-react';
import { InterviewType, InterviewDifficulty, InterviewDuration } from '../types/interview';

const ANALYSIS_STAGES = [
  'Deconstructing job requirements & tech stack...',
  'Extracting core technical & behavioral competencies...',
  'Calibrating hiring bar to industry benchmarks...',
  'Synthesizing tailored adaptive interview probes...',
];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner' as InterviewDifficulty, label: 'Entry Level', description: 'Foundational & baseline probes' },
  { value: 'intermediate' as InterviewDifficulty, label: 'Senior / Lead', description: 'Trade-offs & STAR depth' },
  { value: 'advanced' as InterviewDifficulty, label: 'Staff / Principal', description: 'System scale & edge pressure' },
];

const DURATION_OPTIONS = [
  { value: 15 as InterviewDuration, label: '15 Mins (3-4 Qs)', description: 'Quick focused pulse' },
  { value: 30 as InterviewDuration, label: '30 Mins (5-6 Qs)', description: 'Standard interview loop' },
  { value: 45 as InterviewDuration, label: '45 Mins (Full Loop)', description: 'Comprehensive simulation' },
];

const FORMAT_OPTIONS = [
  { value: 'mixed' as InterviewType, label: 'Mixed Loop', description: 'Technical, behavioral & product' },
  { value: 'behavioral' as InterviewType, label: 'Behavioral', description: 'Leadership & STAR methodology' },
  { value: 'product_case' as InterviewType, label: 'Product Case', description: 'Strategy & funnel execution' },
  { value: 'technical' as InterviewType, label: 'Technical', description: 'System design & architecture' },
];

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setupDraft, updateSetupDraft, createInterviewFromDraft } = useInterview();

  const [inputPrompt, setInputPrompt] = useState(
    setupDraft.jobDescriptionText || ''
  );
  const [attachedFile, setAttachedFile] = useState<{ name: string; size?: string } | null>(
    setupDraft.resumeName ? { name: setupDraft.resumeName, size: setupDraft.resumeFileSize } : null
  );
  const [targetCompany, setTargetCompany] = useState(setupDraft.company || 'Stripe');
  const [targetRole, setTargetRole] = useState(setupDraft.jobTitle || 'Senior Product Manager');
  const [interviewType, setInterviewType] = useState<InterviewType>(setupDraft.interviewType || 'mixed');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>(setupDraft.difficulty || 'intermediate');
  const [duration, setDuration] = useState<InterviewDuration>(setupDraft.durationMinutes || 30);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStageIdx, setAnalysisStageIdx] = useState(0);
  const [analyzedBlueprint, setAnalyzedBlueprint] = useState<{
    competencies: string[];
    sampleQuestions: string[];
    hiringBar: string;
  } | null>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setAnalysisStageIdx((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 450);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileSelect = (file: File) => {
    const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setAttachedFile({ name: file.name, size: fileSize });
    updateSetupDraft({
      resumeName: file.name,
      resumeFileSize: fileSize,
      resumeParsed: true,
    });
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    updateSetupDraft({
      resumeName: '',
      resumeFileSize: '',
      resumeParsed: false,
    });
  };

  const handleAnalyzeAndGenerate = async () => {
    if (!inputPrompt.trim() && !attachedFile) return;

    setIsAnalyzing(true);
    setAnalysisStageIdx(0);
    updateSetupDraft({
      jobTitle: targetRole,
      company: targetCompany,
      interviewType: interviewType,
      difficulty: difficulty,
      durationMinutes: duration,
      jobDescriptionText: inputPrompt,
      focusAreas: ['Product Strategy & Funnel Optimization', 'Metric Evidence & STAR Framework', 'System Scalability & Prioritization'],
    });

    // Simulate multi-stage AI reasoning
    await new Promise((r) => setTimeout(r, 1600));

    setAnalyzedBlueprint({
      competencies: [
        'Funnel Drop-off Analysis & Quantitative Prioritization',
        'Cross-Functional Engineering & Design Alignment',
        'Technical Trade-offs & Experimentation Velocity',
        'Senior Stakeholder Communication Under Pressure',
      ],
      sampleQuestions: [
        'How did you isolate the friction point in the user onboarding funnel?',
        'Describe a time you deprioritized a highly requested stakeholder feature.',
        'Walk through how you scale a feature architecture when query latency spikes 4x.',
      ],
      hiringBar: `Calibrated to ${difficulty === 'advanced' ? 'Staff / Lead' : difficulty === 'intermediate' ? 'Senior' : 'Mid-Level'} Benchmark`,
    });

    setIsAnalyzing(false);
  };

  const handleLaunchSession = async () => {
    setIsAnalyzing(true);
    try {
      const session = await createInterviewFromDraft();
      navigate('/interview/preview', { state: { sessionId: session.id } });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <Zap size={13} className="text-zinc-500" />
            <span>AI Calibration Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            <ShiningText text="Paste Job Description to Analyze" />
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Attach your resume and paste your target job requirements. The AI will instantly analyze core competencies and formulate your live interview loop.
          </p>
        </div>

        {/* Animated AI Chat Input Cockpit (by jatin-yadav05) */}
        <div className="space-y-4">
          <AnimatedAIChat
            value={inputPrompt}
            onChange={setInputPrompt}
            onSubmit={handleAnalyzeAndGenerate}
            onFileSelect={handleFileSelect}
            attachedFile={attachedFile}
            onRemoveFile={handleRemoveFile}
            placeholder="Paste your target job description, requirements, or enter target role to analyze..."
            isLoading={isAnalyzing}
          />
        </div>

        {/* Calibration Settings Grid */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
          {/* Target Role */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
              <Briefcase size={12} className="text-zinc-400" /> Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-zinc-400"
              placeholder="e.g. Senior Product Manager"
            />
          </div>

          {/* Target Company */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
              <Building2 size={12} className="text-zinc-400" /> Company
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-zinc-400"
              placeholder="e.g. Stripe, Acme Corp"
            />
          </div>

          {/* Custom Difficulty Bar Dropdown */}
          <div>
            <CustomDropdown<InterviewDifficulty>
              label="Difficulty Bar"
              icon={Gauge}
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
            />
          </div>

          {/* Custom Duration Selector Dropdown */}
          <div>
            <CustomDropdown<InterviewDuration>
              label="Duration"
              icon={Clock}
              options={DURATION_OPTIONS}
              value={duration}
              onChange={setDuration}
            />
          </div>

          {/* Custom Interview Loop Format Dropdown */}
          <div>
            <CustomDropdown<InterviewType>
              label="Format"
              icon={Sliders}
              options={FORMAT_OPTIONS}
              value={interviewType}
              onChange={setInterviewType}
            />
          </div>
        </div>

        {/* Loading Analyzing State with 3D Plasma Sphere & Progressive Reasoning Stream */}
        {isAnalyzing && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
            <LetterLoader text="Analyzing" size="md" />
            <div className="space-y-1.5 max-w-lg px-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-medium border border-zinc-700 shadow-sm">
                <Sparkles size={12} className="text-purple-400 animate-spin" />
                <ShiningText text={ANALYSIS_STAGES[analysisStageIdx]} />
              </div>
              <p className="text-[11px] text-foreground-muted font-mono pt-1">
                Synthesizing personalized question sequence & rubric weights...
              </p>
            </div>
          </div>
        )}

        {/* AI Analyzed Blueprint Dossier */}
        {analyzedBlueprint && !isAnalyzing && (
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md text-left space-y-6 animate-fadeIn">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Analysis Ready
                  </span>
                  <span className="text-xs text-foreground-muted font-medium">
                    {analyzedBlueprint.hiringBar}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-foreground mt-1">
                  {targetRole} · {targetCompany}
                </h3>
              </div>

              {/* 3D Folder Graphic */}
              <div className="hidden sm:block">
                <Folder
                  color="#18181b"
                  size={0.8}
                  items={[
                    <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Blueprint</div>,
                    <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">Competencies</div>,
                    <div key="3" className="p-1 text-[9px] font-bold text-purple-700">Rubric</div>
                  ]}
                />
              </div>
            </div>

            {/* Extracted Core Competencies */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target size={13} className="text-zinc-500" />
                Target Competencies Evaluated:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analyzedBlueprint.competencies.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-start gap-2.5 text-xs text-foreground font-medium"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Question Sequence Sample */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-zinc-500" />
                Sample Generated Probes:
              </span>
              <div className="space-y-2">
                {analyzedBlueprint.sampleQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-foreground font-medium"
                  >
                    <span className="text-zinc-400 font-mono mr-2">Q{idx + 1}.</span>
                    "{q}"
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Clock size={14} />
                <span>Estimated duration: <strong>{duration} Minutes</strong></span>
              </div>

              <Button
                size="lg"
                onClick={handleLaunchSession}
                className="px-6 shadow-sm"
                rightIcon={<ArrowRight size={15} />}
              >
                Launch Mock Interview
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SetupPage;
