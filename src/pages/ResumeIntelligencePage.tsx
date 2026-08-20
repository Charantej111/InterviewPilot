import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import {
  Briefcase,
  FolderKanban,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Code2,
  Layers,
  Award,
  Edit3,
  Check,
  Sparkles,
  Trash2,
  AlertTriangle,
  Calendar,
  Building2,
  FileText,
} from 'lucide-react';
import type { CandidateEvidenceModel, EvidenceItem, EvidenceConfidence } from '../types/resume';

export const ResumeIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const { setupDraft, confirmCandidateProfile } = useInterview();

  const [evidence, setEvidence] = useState<CandidateEvidenceModel | null>(
    setupDraft.candidateEvidenceModel || null
  );

  const rawName = evidence?.identity?.name?.value || setupDraft.candidateProfile?.name || '';
  const cleanCandidateName = rawName.replace(/\[SECTION:[^\]]*\]/gi, '').replace(/\[PAGE\s*\d+\]/gi, '').trim() || 'Candidate';
  
  const rawRole = evidence?.identity?.role?.value || setupDraft.jobTitle || 'AI / Software Engineer';
  const cleanCandidateRole = rawRole.replace(/\[SECTION:[^\]]*\]/gi, '').replace(/\[PAGE\s*\d+\]/gi, '').trim();

  const [candidateName, setCandidateName] = useState(cleanCandidateName);
  const [candidateRole, setCandidateRole] = useState(cleanCandidateRole);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<'experience' | 'projects' | 'skills' | 'education' | 'achievements'>('experience');

  React.useEffect(() => {
    if (setupDraft.candidateEvidenceModel) {
      setEvidence(setupDraft.candidateEvidenceModel);
    }
  }, [setupDraft.candidateEvidenceModel]);

  const workExperience = evidence?.workExperience || [];
  const technicalSkills = evidence?.skills?.technical || [];
  const productSkills = evidence?.skills?.product || [];
  const domainSkills = evidence?.skills?.domain || [];
  const projects = evidence?.projects || [];
  const education = evidence?.education || [];
  const certifications = evidence?.certifications || [];
  const achievements = evidence?.achievements || [];

  // Remove skill handler
  const handleRemoveSkill = (category: 'technical' | 'product' | 'domain', index: number) => {
    if (!evidence) return;
    const updated = { ...evidence };
    updated.skills[category] = updated.skills[category].filter((_, i) => i !== index);
    setEvidence(updated);
  };

  // Remove experience handler
  const handleRemoveExperience = (index: number) => {
    if (!evidence) return;
    const updated = { ...evidence };
    updated.workExperience = updated.workExperience.filter((_, i) => i !== index);
    setEvidence(updated);
  };

  // Remove project handler
  const handleRemoveProject = (index: number) => {
    if (!evidence) return;
    const updated = { ...evidence };
    updated.projects = updated.projects.filter((_, i) => i !== index);
    setEvidence(updated);
  };

  const handleConfirmAndProceed = async () => {
    setIsConfirming(true);
    try {
      if (evidence) {
        const updatedModel: CandidateEvidenceModel = {
          ...evidence,
          identity: {
            ...evidence.identity,
            name: {
              value: candidateName,
              sourceText: evidence.identity.name?.sourceText || candidateName,
              sourceLocation: { section: 'HEADER' },
              confidence: 'high',
            },
            role: {
              value: candidateRole,
              sourceText: evidence.identity.role?.sourceText || candidateRole,
              sourceLocation: { section: 'HEADER' },
              confidence: 'high',
            },
          },
        };
        await confirmCandidateProfile(updatedModel);
      }
      navigate('/setup');
    } catch (err) {
      console.error('Error confirming candidate profile:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!evidence && !setupDraft.candidateProfile) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-foreground-muted flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-700">
            <Briefcase size={26} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">No Resume Intelligence Found</h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Please upload your resume to calibrate your role-specific interview simulation.
            </p>
          </div>
          <Button
            size="md"
            onClick={() => navigate('/setup')}
            leftIcon={<ArrowLeft size={14} />}
            className="font-bold"
          >
            Go to Resume Upload
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const renderConfidenceBadge = (confidence: EvidenceConfidence) => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Verified Source
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Interpreted
          </span>
        );
      case 'inferred':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <AlertTriangle size={10} />
            Needs Confirmation
          </span>
        );
      default:
        return null;
    }
  };

  const initials = candidateName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CP';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-4 space-y-8 text-left animate-fadeIn">
        {/* Top Header & Confirmation Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-wide">
              <CheckCircle2 size={12} />
              <span>Evidence Traceability Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Candidate Dossier
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Every fact below is grounded in your uploaded resume. Confirm or adjust any items before locking your interview profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/setup')}
              leftIcon={<ArrowLeft size={13} />}
              className="text-xs font-semibold"
            >
              Upload Different
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAndProceed}
              isLoading={isConfirming}
              rightIcon={<ArrowRight size={14} />}
              className="bg-primary text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Confirm & Continue
            </Button>
          </div>
        </div>

        {/* Real Measurable Reading Status Bar */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
          <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
            <FileText size={14} className="text-primary" />
            <span>Resume Reading & Evidence Status</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <Check size={14} className="text-emerald-500 shrink-0" />
              <span><strong>{workExperience.length}</strong> Experience Roles</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Check size={14} className="text-emerald-500 shrink-0" />
              <span><strong>{projects.length}</strong> Key Projects</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Check size={14} className="text-emerald-500 shrink-0" />
              <span><strong>{technicalSkills.length + productSkills.length + domainSkills.length}</strong> Skills Calibrated</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Check size={14} className="text-emerald-500 shrink-0" />
              <span><strong>{education.length}</strong> Education Items</span>
            </div>
          </div>
        </div>

        {/* Candidate Identity Header Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                {initials}
              </div>

              {isEditingHeader ? (
                <div className="space-y-2 flex-1">
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full px-3 py-1.5 text-base font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    placeholder="Target Role / Specialization"
                    className="w-full px-3 py-1 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-foreground tracking-tight">{candidateName}</h2>
                    <button
                      onClick={() => setIsEditingHeader(true)}
                      className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit Name / Role"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-foreground-muted font-medium">
                    {candidateRole} · <span className="font-mono">{setupDraft.resumeName || 'Resume.pdf'}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isEditingHeader && (
                <Button
                  size="sm"
                  onClick={() => setIsEditingHeader(false)}
                  leftIcon={<Check size={13} />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Structured Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar">
          {[
            { id: 'experience', label: 'Work Experience', count: workExperience.length, icon: Briefcase },
            { id: 'projects', label: 'Key Projects', count: projects.length, icon: FolderKanban },
            { id: 'skills', label: 'Skills & Stack', count: technicalSkills.length + productSkills.length + domainSkills.length, icon: Code2 },
            { id: 'education', label: 'Education', count: education.length, icon: GraduationCap },
            { id: 'achievements', label: 'Achievements', count: certifications.length + achievements.length, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 flex items-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-primary text-primary font-extrabold'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: WORK EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-4 animate-fadeIn">
            {workExperience.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-foreground-muted">
                No work experience detected in document.
              </div>
            ) : (
              workExperience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-foreground">
                          {exp.role?.value || 'Role'}
                        </h3>
                        {exp.role && renderConfidenceBadge(exp.role.confidence)}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Building2 size={13} />
                        <span>{exp.company?.value || 'Organization'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-foreground-muted">
                        <Calendar size={12} />
                        <span>{exp.startDate?.value || 'Start'} – {exp.endDate?.value || 'Present'}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveExperience(idx)}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove experience entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-foreground">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span className="text-foreground/90">{b.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: KEY PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4 animate-fadeIn">
            {projects.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-foreground-muted">
                No distinct project initiatives detected.
              </div>
            ) : (
              projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderKanban size={16} className="text-primary" />
                      <h3 className="text-base font-extrabold text-foreground">{proj.name?.value || 'Project'}</h3>
                      {renderConfidenceBadge(proj.name?.confidence || 'high')}
                    </div>
                    <div className="flex items-center gap-3">
                      {proj.outcomes && proj.outcomes.length > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          {proj.outcomes[0]?.value}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveProject(idx)}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {proj.problem?.value && (
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {proj.problem.value}
                    </p>
                  )}

                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      {proj.technologies.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-medium text-foreground-muted border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          {t.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: SKILLS & STACK */}
        {activeTab === 'skills' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Technical Stack */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-primary" />
                <h3 className="text-sm font-extrabold text-foreground">Core Technical Stack & Frameworks</h3>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {technicalSkills.length === 0 ? (
                  <span className="text-xs text-foreground-muted">No technical skills parsed.</span>
                ) : (
                  technicalSkills.map((s, idx) => (
                    <div
                      key={idx}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-foreground border border-zinc-200 dark:border-zinc-700"
                    >
                      <span>{s.value}</span>
                      <button
                        onClick={() => handleRemoveSkill('technical', idx)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition-opacity cursor-pointer"
                        title="Remove skill"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI / ML & Specializations */}
            {domainSkills.length > 0 && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-500" />
                  <h3 className="text-sm font-extrabold text-foreground">AI, Architecture & Domain Specializations</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {domainSkills.map((s, idx) => (
                    <div
                      key={idx}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-500/20"
                    >
                      <span>{s.value}</span>
                      <button
                        onClick={() => handleRemoveSkill('domain', idx)}
                        className="opacity-0 group-hover:opacity-100 text-purple-400 hover:text-rose-500 transition-opacity cursor-pointer"
                        title="Remove specialization"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product & Methodologies */}
            {productSkills.length > 0 && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-extrabold text-foreground">Methodologies & Operational Practices</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {productSkills.map((s, idx) => (
                    <div
                      key={idx}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20"
                    >
                      <span>{s.value}</span>
                      <button
                        onClick={() => handleRemoveSkill('product', idx)}
                        className="opacity-0 group-hover:opacity-100 text-emerald-400 hover:text-rose-500 transition-opacity cursor-pointer"
                        title="Remove methodology"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-4 animate-fadeIn">
            {education.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-foreground-muted">
                No education history detected in resume.
              </div>
            ) : (
              education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <GraduationCap size={18} className="text-primary" />
                      <span>{edu.degree?.value || 'Degree'}</span>
                    </h3>
                    <p className="text-xs font-semibold text-foreground-muted">{edu.institution?.value || 'Institution'}</p>
                  </div>
                  {edu.year?.value && (
                    <div className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-foreground self-start sm:self-auto">
                      {edu.year.value}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: ACHIEVEMENTS & CERTIFICATIONS */}
        {activeTab === 'achievements' && (
          <div className="space-y-4 animate-fadeIn">
            {certifications.length === 0 && achievements.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-foreground-muted">
                No specific certifications or hackathon achievements parsed.
              </div>
            ) : (
              [...certifications, ...achievements].map((cert, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Award size={18} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground">{cert.value}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bottom Lock Confirmation Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold">Lock Verified Candidate Profile</h4>
              <p className="text-xs opacity-75">
                Confirmed facts are saved into an immutable locked context. Downstream AI will strictly evaluate your confirmed credentials.
              </p>
            </div>
          </div>

          <Button
            size="md"
            onClick={handleConfirmAndProceed}
            isLoading={isConfirming}
            rightIcon={<ArrowRight size={15} />}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md self-start sm:self-auto shrink-0 cursor-pointer"
          >
            Confirm & Calibrate Interview
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeIntelligencePage;
