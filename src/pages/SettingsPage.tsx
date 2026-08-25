import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useInterview } from '../context/InterviewContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import {
  User,
  Sliders,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Trash2,
  Check,
  FileText,
  UploadCloud,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Theme } from '../types/theme';

export const SettingsPage: React.FC = () => {
  const { user, preferences, updateProfile, updatePreferences } = useUser();
  const { theme, setTheme } = useTheme();
  const { setupDraft, uploadResumeFile } = useInterview();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'vault' | 'privacy'>('profile');
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [targetRole, setTargetRole] = useState(user.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || '');
  const [targetCompaniesText, setTargetCompaniesText] = useState((user.targetCompanies || []).join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Resume Upload State
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.targetRole) setTargetRole(user.targetRole);
      if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
      if (user.targetCompanies) setTargetCompaniesText(user.targetCompanies.join(', '));
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const companies = targetCompaniesText.split(',').map((c) => c.trim()).filter((c) => c.length > 0);
    updateProfile({
      name,
      email,
      targetRole,
      experienceLevel: experienceLevel as any,
      targetCompanies: companies,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePreferences = (newPrefs: Partial<typeof preferences>) => {
    updatePreferences(newPrefs);
  };

  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingResume(true);
    setResumeError(null);
    setResumeSuccess(null);

    try {
      const res = await uploadResumeFile(file);
      if (res.profile?.name && !name) {
        setName(res.profile.name);
      }
      if (res.profile?.targetRole && !targetRole) {
        setTargetRole(res.profile.targetRole);
      }
      setResumeSuccess(`Successfully parsed ${file.name}. Verified candidate evidence is active.`);
      setTimeout(() => setResumeSuccess(null), 4000);
    } catch (err: any) {
      console.error('Resume upload failed:', err);
      setResumeError(err.message || 'Failed to upload and parse resume file.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all locally cached practice sessions? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const displayDisplayName = name || (email ? email.split('@')[0] : 'Candidate');
  const hasActiveResume = Boolean(setupDraft.resumeParsed && setupDraft.resumeName);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 text-left animate-fadeIn">
        {/* Hidden Native File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleResumeUpload(file);
          }}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Settings & Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Manage your career credentials, simulation evaluation bars, and workspace preferences.
            </p>
          </div>
        </div>

        {/* Profile Identity Overview Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={displayDisplayName} src={user.avatarUrl} size="lg" status="online" />
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-foreground">{displayDisplayName}</h2>
              <p className="text-xs text-foreground-muted font-medium">{email || 'No email configured'}</p>
              {(targetRole || experienceLevel) && (
                <div className="flex items-center gap-2 pt-1">
                  {targetRole && (
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                      {targetRole}
                    </span>
                  )}
                  {targetRole && experienceLevel && <span className="text-zinc-300 dark:text-zinc-700">•</span>}
                  {experienceLevel && (
                    <span className="text-[11px] text-foreground-muted font-medium">{experienceLevel}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <div className="px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-center flex-1 sm:flex-none">
              <span className="text-xs font-bold text-foreground font-mono">
                {user.readinessPercentage || 78}%
              </span>
              <p className="text-[9px] text-foreground-muted uppercase tracking-wider font-bold">Readiness</p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-center flex-1 sm:flex-none">
              <span className="text-xs font-bold text-foreground font-mono">
                {user.interviewsCompleted || 0}
              </span>
              <p className="text-[9px] text-foreground-muted uppercase tracking-wider font-bold">Completed</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border/80 pb-px">
          {[
            { id: 'profile', label: 'Candidate Profile', icon: <User size={14} /> },
            { id: 'preferences', label: 'Simulation Bars', icon: <Sliders size={14} /> },
            { id: 'vault', label: 'Resume & Vault', icon: <FileText size={14} /> },
            { id: 'privacy', label: 'Privacy & Storage', icon: <ShieldCheck size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl animate-fadeIn">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Candidate Identity & Credentials</h3>

              <div className="space-y-3">
                <Input
                  label="Full Name"
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email Address"
                  placeholder="candidate@domain.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Target Job Title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Seniority Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Entry / Intern">Entry / Intern (0 - 2 yrs)</option>
                    <option value="Mid-level">Mid-level (3 - 5 yrs)</option>
                    <option value="Senior">Senior (5 - 8 yrs)</option>
                    <option value="Lead / Director">Lead / Staff / Director (8+ yrs)</option>
                  </select>
                </div>

                <Input
                  label="Target Companies (comma separated)"
                  placeholder="Google, Stripe, Meta, OpenAI"
                  value={targetCompaniesText}
                  onChange={(e) => setTargetCompaniesText(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button type="submit" size="sm" className="font-bold text-xs">
                  {saveSuccess ? 'Changes Saved!' : 'Save Credentials'}
                </Button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <Check size={14} /> Saved successfully
                  </span>
                )}
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: PREFERENCES & EVALUATION BARS */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-2xl animate-fadeIn">
            {/* Simulation Duration Default */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Default Simulation Time Budget</h3>
              <div className="grid grid-cols-3 gap-3">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSavePreferences({ defaultDuration: mins as any })}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      preferences.defaultDuration === mins
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            {/* Evaluation Strictness */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">STAR Evaluation Strictness</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Executive Bar Strictness</span>
                    <span className="text-[11px] text-foreground-muted">Mandate metric quantification and penalize hand-waving.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.strictEvaluation}
                    onChange={(e) => handleSavePreferences({ strictEvaluation: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Spoken Audio AI Synthesis</span>
                    <span className="text-[11px] text-foreground-muted">Enable natural text-to-speech voice playback for interviewer prompts.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.audioFeedbackEnabled}
                    onChange={(e) => handleSavePreferences({ audioFeedbackEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Color Theme Selector */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Appearance & Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light' as Theme, label: 'Light', icon: <Sun size={16} /> },
                  { id: 'dark' as Theme, label: 'Dark', icon: <Moon size={16} /> },
                  { id: 'system' as Theme, label: 'System', icon: <Laptop size={16} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      theme === item.id
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESUME & DOCUMENT VAULT */}
        {activeTab === 'vault' && (
          <div className="space-y-6 max-w-2xl animate-fadeIn">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Primary Resume Document</h3>
                  <p className="text-xs text-foreground-muted">Currently active for AI question calibration.</p>
                </div>
                {hasActiveResume && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Verified Active
                  </span>
                )}
              </div>

              {/* Error / Success Notifications */}
              {resumeError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{resumeError}</span>
                </div>
              )}

              {resumeSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{resumeSuccess}</span>
                </div>
              )}

              {hasActiveResume ? (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground truncate max-w-xs">
                        {setupDraft.resumeName || 'Primary_Resume.pdf'}
                      </h4>
                      <p className="text-[11px] text-foreground-muted">
                        {setupDraft.resumeFileSize || '142 KB'} · 2-Column Spatial Engine Active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/setup/resume-intelligence')}
                      leftIcon={<Eye size={13} />}
                      className="text-xs font-semibold flex-1 sm:flex-none cursor-pointer"
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isUploadingResume}
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={isUploadingResume ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                      className="text-xs font-semibold flex-1 sm:flex-none cursor-pointer"
                    >
                      {isUploadingResume ? 'Parsing...' : 'Replace Resume'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-center space-y-2 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {isUploadingResume ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    {isUploadingResume ? 'Extracting Resume Evidence...' : 'Upload Primary Resume'}
                  </p>
                  <p className="text-[11px] text-foreground-muted">Click or drag & drop PDF/DOCX resume file</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PRIVACY & DATA RESET */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 max-w-2xl animate-fadeIn">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Zero Data Training Commitment</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Your uploaded resumes, job descriptions, audio recordings, and evaluation rubrics are isolated strictly to your candidate session and never used to train foundation models.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Reset Local Practice Session Storage
              </h4>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Clear all locally cached interview turns, answer drafts, and simulation progress back to factory defaults.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearData}
                leftIcon={<Trash2 size={13} />}
                className="font-bold text-xs cursor-pointer"
              >
                Reset Local Storage
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
