import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { 
  Sun, 
  Moon, 
  Laptop, 
  ShieldCheck, 
  Trash2, 
  Check, 
  LogOut,
  CreditCard
} from 'lucide-react';
import { Theme } from '../types/theme';

export const SettingsPage: React.FC = () => {
  const { user, preferences, updateProfile, updatePreferences, logout } = useUser();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'appearance' | 'privacy' | 'account'>('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [targetRole, setTargetRole] = useState(user.targetRole);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, targetRole });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearData = () => {
    if (window.confirm('Clear all local mock session data and reset progress?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-4 space-y-8">
        <div>
          <span className="eyebrow mb-1 block">Account & Preferences</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Manage your candidate profile, evaluation standards, and workspace appearance.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-border/80 gap-6 text-xs font-semibold">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'preferences', label: 'Interview Preferences' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'privacy', label: 'Data & Privacy' },
            { id: 'account', label: 'Account & Plan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xs">
              <Avatar name={user.name} size="lg" status="online" />
              <div>
                <h4 className="text-sm font-bold text-foreground">{user.name}</h4>
                <p className="text-xs text-foreground-muted">{user.email}</p>
                <span className="text-[11px] text-primary font-semibold mt-1 inline-block">
                  Candidate ID: {user.id}
                </span>
              </div>
            </div>

            <div className="space-y-4">
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
              <Input
                label="Primary Target Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                helperText="Used to benchmark your initial baseline across interview dimensions."
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="glass-primary">
                Save Changes
              </Button>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved successfully!
                </span>
              )}
            </div>
          </form>
        )}

        {/* Tab Content 2: Interview Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-xl">
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xs flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Strict Evaluation Bar</h4>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Grade responses against Staff/Principal criteria without score inflation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences({ strictEvaluation: !preferences.strictEvaluation })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    preferences.strictEvaluation ? 'bg-primary' : 'bg-surface-subtle border border-border'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                      preferences.strictEvaluation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xs flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Audio & Spoken Prompts</h4>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Enable synthesized voice questions for simulated phone/video loops.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences({ audioFeedbackEnabled: !preferences.audioFeedbackEnabled })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    preferences.audioFeedbackEnabled ? 'bg-primary' : 'bg-surface-subtle border border-border'
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
          </div>
        )}

        {/* Tab Content 3: Appearance */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-foreground">Interface Theme</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Choose between crisp modern light mode, cinematic charcoal dark mode, or system sync.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light' as Theme, label: 'Light Mode', icon: <Sun className="w-4 h-4 text-amber-500" /> },
                { id: 'dark' as Theme, label: 'Dark Mode', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
                { id: 'system' as Theme, label: 'System Sync', icon: <Laptop className="w-4 h-4 text-foreground-muted" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    theme === item.id
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-surface/80 text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Privacy */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 max-w-xl">
            <div className="p-5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Data Training Commitment</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Your uploaded resumes, target job descriptions, transcripts, and audio sessions are isolated strictly to your account and never used to train foundation models.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Clear Local Session Storage
              </h4>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Reset your practice session history, draft interviews, and custom settings back to factory defaults.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearData}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear All Mock Data
              </Button>
            </div>
          </div>
        )}

        {/* Tab Content 5: Account */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-xl">
            <div className="p-6 rounded-3xl bg-surface/80 backdrop-blur-2xl border border-border/80 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Current Tier</span>
                  <h4 className="text-lg font-extrabold text-foreground mt-0.5">Job Hunter Pro Plan</h4>
                </div>
                <Badge variant="success" size="sm">Active Subscription</Badge>
              </div>
              <p className="text-xs text-foreground-muted">
                Unlimited AI mock interviews, deep resume probes, adaptive follow-ups, and exportable reports.
              </p>
              <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                <span className="text-xs text-foreground-muted font-medium">$29.00 / month • Renews in 24 days</span>
                <Button variant="glass-secondary" size="sm" leftIcon={<CreditCard className="w-3.5 h-3.5" />}>
                  Manage Billing
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="glass-secondary"
                onClick={logout}
                leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
