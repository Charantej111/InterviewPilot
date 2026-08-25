import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useUser } from '../context/UserContext';
import { useInterview } from '../context/InterviewContext';
import { Emoji } from 'react-apple-emojis';
import {
  User,
  Target,
  CheckCircle2,
  Building2,
  Save,
  Plus,
  X,
  Mail,
  Smile,
  Check,
  FileText,
  UploadCloud,
  Eye,
  AlertCircle,
  Loader2,
  Camera,
} from 'lucide-react';

const APPLE_THEME_AVATARS = [
  { name: 'robot', label: 'Cyborg AI', category: 'AI' },
  { name: 'brain', label: 'Neural Brain', category: 'AI' },
  { name: 'high-voltage', label: 'Hyper Velocity', category: 'Energy' },
  { name: 'rocket', label: 'Cosmic Pioneer', category: 'Orbit' },
  { name: 'direct-hit', label: 'Precision Focus', category: 'Focus' },
  { name: 'sparkles', label: 'Starlight Spark', category: 'Spark' },
  { name: 'gem-stone', label: 'Diamond Standard', category: 'Luxury' },
  { name: 'mechanical-arm', label: 'Bionic Engineer', category: 'Tech' },
  { name: 'crystal-ball', label: 'Future Visionary', category: 'Magic' },
  { name: 'alien-monster', label: 'Pixel Rebel', category: 'Retro' },
  { name: 'technologist', label: 'Code Architect', category: 'Dev' },
  { name: 'astronaut', label: 'Orbit Astronaut', category: 'Space' },
  { name: 'owl', label: 'Wise Strategist', category: 'Wisdom' },
  { name: 'lion', label: 'Apex Leader', category: 'Leader' },
  { name: 'fox', label: 'Agile Innovator', category: 'Speed' },
  { name: 'laptop', label: 'Silicon Terminal', category: 'Hardware' },
  { name: 'artist-palette', label: 'Design Virtuoso', category: 'Creative' },
  { name: 'light-bulb', label: 'Eureka Insight', category: 'Ideas' },
  { name: 'fire', label: 'High Performer', category: 'Growth' },
  { name: 'trophy', label: 'Champion Bar', category: 'Win' },
];

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useUser();
  const { setupDraft, uploadResumeFile } = useInterview();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>(user.name || '');
  const [email, setEmail] = useState<string>(user.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || '');
  const [targetRole, setTargetRole] = useState<string>(user.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState<any>(user.experienceLevel || 'Senior');
  const [targetCompanies, setTargetCompanies] = useState<string[]>(user.targetCompanies || ['Google', 'Meta', 'Stripe']);
  const [newCompanyInput, setNewCompanyInput] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Resume Upload State
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.avatarUrl !== undefined) setAvatarUrl(user.avatarUrl || '');
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

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim(),
      targetRole: targetRole.trim(),
      experienceLevel: experienceLevel as any,
      targetCompanies,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Resume File Upload Handler
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

  const displayDisplayName = name || (email ? email.split('@')[0] : 'Candidate');
  const readiness = user.readinessPercentage > 0 ? user.readinessPercentage : 78;
  const hasActiveResume = Boolean(setupDraft.resumeParsed && setupDraft.resumeName);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-4 space-y-8 text-left animate-fadeIn">
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

        {/* Header Title (Without Pill) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Candidate Profile
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Configure your verified credentials, target hiring bars, dream companies, and simulation parameters.
            </p>
          </div>

          <Button
            size="md"
            onClick={() => handleSaveProfile()}
            leftIcon={isSaved ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Save size={16} />}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 self-start sm:self-auto cursor-pointer"
          >
            {isSaved ? 'Changes Saved!' : 'Save Profile'}
          </Button>
        </div>

        {/* Profile Identity Hero Card with Inline Avatar Selection */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Interactive Avatar with Edit Trigger */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 transition-transform active:scale-95 cursor-pointer block"
                  title="Click to choose Apple persona avatar"
                >
                  <Avatar name={displayDisplayName} src={avatarUrl} size="xl" status="online" />
                  <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-[2px]">
                    <Camera size={14} />
                  </span>
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-white text-[10px] shadow-sm ring-2 ring-white dark:ring-zinc-900">
                    <Smile size={12} />
                  </span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">{displayDisplayName}</h2>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-colors cursor-pointer border border-primary/20"
                  >
                    <Smile size={12} />
                    <span>{showAvatarPicker ? 'Close Picker' : 'Change Avatar'}</span>
                  </button>
                </div>
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

          {/* INLINE APPLE EMOJI AVATAR PICKER (Expands cleanly inside hero card) */}
          <AnimatePresence>
            {showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-4 border-t border-zinc-200/60 dark:border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Smile size={14} className="text-primary" />
                    <span>Choose Apple Persona Avatar</span>
                  </div>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl('');
                        setShowAvatarPicker(false);
                      }}
                      className="text-[11px] font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      Reset to Initials
                    </button>
                  )}
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/50 grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-11 gap-2.5">
                  {/* Initials Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      setShowAvatarPicker(false);
                    }}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      !avatarUrl
                        ? 'bg-primary/15 border-primary ring-2 ring-primary/30 shadow-xs'
                        : 'bg-white dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                    title="Default Initials"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                      {displayDisplayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-foreground-muted truncate max-w-full">Initials</span>
                  </button>

                  {/* Apple Emojis List */}
                  {APPLE_THEME_AVATARS.map((item) => {
                    const isSelected = avatarUrl === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(item.name);
                          setShowAvatarPicker(false);
                        }}
                        className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border relative group ${
                          isSelected
                            ? 'bg-primary/15 border-primary ring-2 ring-primary/30 shadow-xs'
                            : 'bg-white dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                        title={item.label}
                      >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-1.5 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          <Emoji name={item.name} className="w-full h-full object-contain" alt={item.label} />
                        </div>
                        <span className="text-[10px] font-bold text-foreground-muted truncate max-w-full px-0.5">
                          {item.category}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center text-[8px] shadow-xs">
                            <Check size={8} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PRIMARY RESUME DOCUMENT & EVIDENCE CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Primary Resume Document</h3>
                <p className="text-xs text-foreground-muted">
                  Your verified career evidence model used for grounded questions and rubric calibration.
                </p>
              </div>
            </div>

            {hasActiveResume && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold self-start sm:self-auto">
                <CheckCircle2 size={13} />
                <span>Verified Active</span>
              </span>
            )}
          </div>

          {/* Error / Success Notifications */}
          {resumeError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={15} className="shrink-0" />
              <span>{resumeError}</span>
            </div>
          )}

          {resumeSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{resumeSuccess}</span>
            </div>
          )}

          {/* Active Resume Display or Upload Dropzone */}
          {hasActiveResume ? (
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20">
                  PDF
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground truncate max-w-sm">
                    {setupDraft.resumeName || 'Primary_Resume.pdf'}
                  </h4>
                  <p className="text-xs text-foreground-muted">
                    {setupDraft.resumeFileSize || '142 KB'} · 2-Column Spatial Parsing Engine Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/setup/resume-intelligence')}
                  leftIcon={<Eye size={13} />}
                  className="text-xs font-semibold flex-1 sm:flex-none cursor-pointer"
                >
                  Review Evidence
                </Button>
                <Button
                  type="button"
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleResumeUpload(file);
              }}
              className="p-8 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 dark:hover:border-primary/50 bg-zinc-50/50 dark:bg-zinc-800/20 hover:bg-primary/5 transition-all duration-200 cursor-pointer text-center space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                {isUploadingResume ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {isUploadingResume ? 'Extracting & Validating Deliverables...' : 'Upload your primary resume document'}
                </p>
                <p className="text-xs text-foreground-muted">
                  Drag and drop your PDF or DOCX resume here, or click to browse files
                </p>
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground-muted text-[10px] font-semibold uppercase tracking-wider">
                PDF, DOCX, DOC (Up to 10MB)
              </span>
            </div>
          )}
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
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
