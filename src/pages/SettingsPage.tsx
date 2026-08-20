import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
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
} from 'lucide-react';
import { Theme } from '../types/theme';

export const SettingsPage: React.FC = () => {
  const { user, preferences, updateProfile, updatePreferences } = useUser();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'vault' | 'privacy'>('profile');
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [targetRole, setTargetRole] = useState(user.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || '');
  const [targetCompaniesText, setTargetCompaniesText] = useState((user.targetCompanies || []).join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleClearData = () => {
    if (window.confirm('Reset all local interview session data and start fresh?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const displayDisplayName = name || (email ? email.split('@')[0] : 'Candidate');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-4 space-y-8 text-left animate-fadeIn">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Candidate Profile & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Manage your career credentials, simulation evaluation bars, and workspace preferences.
            </p>
          </div>
        </div>

        {/* Profile Identity Overview Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={displayDisplayName} size="lg" status="online" />
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-semibold text-foreground text-center">
              <span className="block text-[10px] text-foreground-muted uppercase font-bold">Streak</span>
              <span>{user.streakDays || 0} Days Active</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-semibold text-foreground text-center">
              <span className="block text-[10px] text-foreground-muted uppercase font-bold">Readiness</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user.readinessPercentage || 0}% Alignment</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Clean, No Account/Plan) */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-bold">
          {[
            { id: 'profile', label: 'Career Identity', icon: User },
            { id: 'preferences', label: 'Evaluation Calibration', icon: Sliders },
            { id: 'vault', label: 'Resume & Documents', icon: FileText },
            { id: 'privacy', label: 'Privacy & Storage', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary font-extrabold'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CAREER IDENTITY FORM */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl animate-fadeIn">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-foreground">Target Role & Seniority Calibration</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Primary Target Role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  helperText="Calibrates interview domain questions."
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Seniority Benchmark</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  >
                    <option value="Entry / Early Career (0-2 yrs)">Entry / Early Career (0-2 yrs)</option>
                    <option value="Mid-level (2-5 yrs)">Mid-level (2-5 yrs)</option>
                    <option value="Senior (5-8 yrs)">Senior (5-8 yrs)</option>
                    <option value="Staff / Principal / Director (8+ yrs)">Staff / Principal / Director (8+ yrs)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Target Companies (comma separated)"
                value={targetCompaniesText}
                onChange={(e) => setTargetCompaniesText(e.target.value)}
                helperText="E.g. Google, Amazon, Meta, Stripe, Apple"
              />

              <div className="pt-3 flex items-center gap-3">
                <Button type="submit" className="bg-primary text-white font-bold text-xs">
                  Save Career Profile
                </Button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                    <Check size={14} />
                    Profile saved successfully!
                  </span>
                )}
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: EVALUATION PREFERENCES & APPEARANCE */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-2xl animate-fadeIn">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Assessment Strictness</h3>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">Strict Tier-1 Evaluation Bar</h4>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Grade responses against Staff/Principal criteria without score inflation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences({ strictEvaluation: !preferences.strictEvaluation })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    preferences.strictEvaluation ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                      preferences.strictEvaluation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">Spoken Question Natural TTS</h4>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Synthesize conversational interviewer speech aloud using neural voice models.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences({ audioFeedbackEnabled: !preferences.audioFeedbackEnabled })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    preferences.audioFeedbackEnabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                      preferences.audioFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Interface Theme */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Interface Appearance</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light' as Theme, label: 'Light Mode', icon: <Sun size={16} className="text-amber-500" /> },
                  { id: 'dark' as Theme, label: 'Dark Mode', icon: <Moon size={16} className="text-indigo-400" /> },
                  { id: 'system' as Theme, label: 'System Sync', icon: <Laptop size={16} className="text-zinc-500" /> },
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
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Verified Active
                </span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Resume_Charan_Tej_Senior.pdf</h4>
                    <p className="text-[11px] text-foreground-muted">142 KB · Uploaded Aug 2026 · Extracted Evidence Locked</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<UploadCloud size={13} />}
                  className="text-xs font-semibold"
                >
                  Replace Resume
                </Button>
              </div>
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
                className="font-bold text-xs"
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
