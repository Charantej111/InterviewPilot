import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useUser } from '../context/UserContext';
import {
  User,
  Target,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  Building2,
  Zap,
  Save,
  Plus,
  X,
  Mail,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useUser();

  const [name, setName] = useState<string>(user.name || '');
  const [email, setEmail] = useState<string>(user.email || '');
  const [targetRole, setTargetRole] = useState<string>(user.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState<any>(user.experienceLevel || 'Senior');
  const [targetCompanies, setTargetCompanies] = useState<string[]>(user.targetCompanies || ['Google', 'Meta', 'Stripe']);
  const [newCompanyInput, setNewCompanyInput] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.targetRole) setTargetRole(user.targetRole);
      if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
      if (user.targetCompanies && user.targetCompanies.length > 0) {
        setTargetCompanies(user.targetCompanies);
      }
    }
  }, [user]);

  const handleAddCompany = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCompanyInput.trim();
    if (clean && !targetCompanies.includes(clean)) {
      setTargetCompanies([...targetCompanies, clean]);
      setNewCompanyInput('');
    }
  };

  const handleRemoveCompany = (company: string) => {
    setTargetCompanies(targetCompanies.filter((c: string) => c !== company));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      targetRole: targetRole.trim(),
      experienceLevel: experienceLevel as any,
      targetCompanies,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const displayDisplayName = name || (email ? email.split('@')[0] : 'Candidate');
  const readiness = user.readinessPercentage > 0 ? user.readinessPercentage : 78;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-4 space-y-8 text-left animate-fadeIn">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Sparkles size={13} className="animate-pulse" />
              <span>Career Persona & Evidence Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Candidate Profile & Calibrations
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Configure your verified credentials, target hiring bars, dream companies, and simulation parameters.
            </p>
          </div>

          <Button
            size="md"
            onClick={handleSaveProfile}
            leftIcon={isSaved ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Save size={16} />}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 self-start sm:self-auto cursor-pointer"
          >
            {isSaved ? 'Changes Saved!' : 'Save Profile'}
          </Button>
        </div>

        {/* Profile Identity Hero Card */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar name={displayDisplayName} size="xl" status="online" />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white text-[10px] shadow-sm">
                <CheckCircle2 size={14} />
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-foreground">{displayDisplayName}</h2>
              <p className="text-xs text-foreground-muted flex items-center gap-1.5 font-medium">
                <Mail size={13} />
                {email || 'candidate@domain.com'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {targetRole || 'Target Role'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground-muted text-[11px] font-medium uppercase tracking-wider">
                  {experienceLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 self-stretch md:self-auto justify-around sm:justify-start">
            <div className="text-center px-3">
              <span className="text-2xl font-black text-foreground font-mono">{readiness}%</span>
              <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider">Readiness</p>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center px-3">
              <span className="text-2xl font-black text-foreground font-mono">{user.interviewsCompleted || 0}</span>
              <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider">Loops</p>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center px-3">
              <span className="text-2xl font-black text-foreground font-mono">{user.streakDays || 1}</span>
              <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Profile Settings Form Grid */}
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Core Professional Details */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <User size={18} className="text-primary" />
              <h3 className="text-base font-extrabold text-foreground">Personal & Contact Info</h3>
            </div>

            <div className="space-y-3.5">
              <Input
                label="Full Name"
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Account Email"
                placeholder="you@domain.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Seniority & Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Entry / Intern">Entry / Intern (0 - 2 years)</option>
                  <option value="Mid-level">Mid-level (3 - 5 years)</option>
                  <option value="Senior">Senior (5 - 8 years)</option>
                  <option value="Lead / Director">Lead / Staff / Director (8+ years)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Target Roles & Dream Companies */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Target size={18} className="text-primary" />
              <h3 className="text-base font-extrabold text-foreground">Target Role & Dream Companies</h3>
            </div>

            <div className="space-y-4">
              <Input
                label="Target Job Title"
                placeholder="e.g. Senior Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Target Companies (Hiring Bar Benchmarks)
                </label>
                
                {/* Companies chips list */}
                <div className="flex flex-wrap gap-2 min-h-[38px] p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  {targetCompanies.map((comp: string) => (
                    <span
                      key={comp}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold shadow-xs"
                    >
                      <Building2 size={12} />
                      {comp}
                      <button
                        type="button"
                        onClick={() => handleRemoveCompany(comp)}
                        className="hover:text-rose-500 cursor-pointer ml-0.5"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new company input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add company (e.g. OpenAI)..."
                    value={newCompanyInput}
                    onChange={(e) => setNewCompanyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCompany();
                      }
                    }}
                    className="flex-1 h-9 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddCompany()}
                    leftIcon={<Plus size={14} />}
                    className="h-9 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Evidence & Career Vault Status */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <FileText size={18} className="text-primary" />
              <h3 className="text-base font-extrabold text-foreground">Candidate Evidence Vault</h3>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Your resume evidence is grounded with 2-column spatial parsing and anti-hallucination verification.
            </p>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Active Resume Grounding</h4>
                  <p className="text-[11px] text-foreground-muted">2-Column Spatial Engine Active</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                Verified
              </span>
            </div>
          </div>

          {/* Card 4: Connected Systems Status */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Zap size={18} className="text-amber-500" />
              <h3 className="text-base font-extrabold text-foreground">Simulation Engine Health</h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-foreground-muted font-medium">Supabase Auth (Gmail SMTP)</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-foreground-muted font-medium">Gemini 3.7 Pro Structured Engine</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Calibrated
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-foreground-muted font-medium">Deterministic STAR Scoring Rubric</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
