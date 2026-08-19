import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  X,
  Lock,
  Sparkles,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type {
  CandidateEvidenceModel,
  EvidenceItem,
} from '../types/resume';

// ─── Confidence Badge ─────────────────────────────────────────────────────────

const ConfidenceBadge: React.FC<{ confidence: EvidenceItem['confidence'] }> = ({ confidence }) => {
  const map = {
    high:     { label: 'High',     color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    medium:   { label: 'Medium',   color: 'text-amber-400  bg-amber-400/10  border-amber-400/20'  },
    low:      { label: 'Low',      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
    inferred: { label: 'Inferred', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  };
  const { label, color } = map[confidence] ?? map.low;
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', color)}>
      {label}
    </span>
  );
};

// ─── Evidence Source Chip ─────────────────────────────────────────────────────

const SourceChip: React.FC<{ sourceText: string }> = ({ sourceText }) => (
  <div className="mt-1 text-[10px] text-foreground-muted font-mono bg-surface-subtle border border-border/60 rounded px-2 py-1 leading-relaxed">
    <span className="text-foreground-muted/60 mr-1">source:</span>
    <span className="text-foreground-muted italic">"{sourceText}"</span>
  </div>
);

// ─── Removable Item Wrapper ───────────────────────────────────────────────────

const EvidenceItemRow: React.FC<{
  label: string;
  item: EvidenceItem;
  onEdit?: (newValue: string) => void;
  onRemove?: () => void;
}> = ({ label, item, onEdit, onRemove }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.value);

  const handleSave = () => {
    onEdit?.(draft);
    setEditing(false);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-foreground-muted w-20 shrink-0">{label}</span>
          {editing ? (
            <input
              className="flex-1 text-xs bg-surface-subtle border border-primary/40 rounded px-2 py-1 text-foreground outline-none focus:border-primary"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          ) : (
            <span className="text-xs font-medium text-foreground">{item.value || '—'}</span>
          )}
          <ConfidenceBadge confidence={item.confidence} />
        </div>
        {!editing && <SourceChip sourceText={item.sourceText} />}
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-0.5">
        {editing ? (
          <>
            <button onClick={handleSave} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-colors"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setDraft(item.value); setEditing(false); }} className="p-1 rounded text-foreground-muted hover:bg-surface-subtle transition-colors"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <>
            {onEdit && <button onClick={() => setEditing(true)} className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors"><Edit3 className="w-3 h-3" /></button>}
            {onRemove && <button onClick={onRemove} className="p-1 rounded text-foreground-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"><X className="w-3 h-3" /></button>}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  confidence?: EvidenceItem['confidence'];
  defaultOpen?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, confidence, defaultOpen = true, onRemove, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-surface-subtle/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-primary shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {confidence && <ConfidenceBadge confidence={confidence} />}
            </div>
            {subtitle && <p className="text-[11px] text-foreground-muted truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded text-foreground-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-foreground-muted" /> : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/60 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ResumeIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const { setupDraft, confirmCandidateProfile } = useInterview();
  const [isConfirming, setIsConfirming] = useState(false);

  // Local editable copy of the evidence model
  const [model, setModel] = useState<CandidateEvidenceModel | null>(
    setupDraft.candidateEvidenceModel ?? null
  );

  if (!model) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">No resume data found</h1>
          <p className="text-sm text-foreground-muted">Please upload your resume first.</p>
          <Button onClick={() => navigate('/setup')}>Back to Setup</Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const removeSkill = (category: 'technical' | 'product' | 'domain', index: number) => {
    setModel((prev) => {
      if (!prev) return prev;
      const updated = prev.skills[category].filter((_, i) => i !== index);
      return { ...prev, skills: { ...prev.skills, [category]: updated } };
    });
  };

  const removeExperience = (index: number) => {
    setModel((prev) => {
      if (!prev) return prev;
      return { ...prev, workExperience: prev.workExperience.filter((_, i) => i !== index) };
    });
  };

  const removeProject = (index: number) => {
    setModel((prev) => {
      if (!prev) return prev;
      return { ...prev, projects: prev.projects.filter((_, i) => i !== index) };
    });
  };

  const removeUnclear = (index: number) => {
    setModel((prev) => {
      if (!prev) return prev;
      return { ...prev, unclear: prev.unclear.filter((_, i) => i !== index) };
    });
  };

  // ── Stats for status bar ──────────────────────────────────────────────────

  const totalExperience   = (model.workExperience || []).length;
  const totalProjects     = (model.projects || []).length;
  const totalSkills       = (model.skills?.technical || []).length + (model.skills?.product || []).length + (model.skills?.domain || []).length;
  const totalUnclear      = (model.unclear || []).length;

  const hasMinimumEvidence = totalExperience > 0 || totalProjects > 0 || totalSkills > 0;

  // ── Confirm ───────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmCandidateProfile(model);
      navigate('/setup');
    } finally {
      setIsConfirming(false);
    }
  };

  // ── All skills combined ───────────────────────────────────────────────────

  const allSkills = [
    ...(model.skills?.technical || []).map((s, i) => ({ ...s, category: 'technical' as const, index: i })),
    ...(model.skills?.product || []).map((s, i) => ({ ...s, category: 'product' as const, index: i })),
    ...(model.skills?.domain || []).map((s, i) => ({ ...s, category: 'domain' as const, index: i })),
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-6 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Resume Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">What we understood about you</h1>
          <p className="text-sm text-foreground-muted">
            Review each item below. Edit or remove anything incorrect before confirming.
            Once you confirm, this evidence is locked and used to run your interview.
          </p>
        </div>

        {/* Extraction Status Bar */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Resume Reading Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Work Experiences', count: totalExperience, icon: <Briefcase className="w-3.5 h-3.5" /> },
              { label: 'Projects',         count: totalProjects,   icon: <FolderKanban className="w-3.5 h-3.5" /> },
              { label: 'Skills',           count: totalSkills,     icon: <Wrench className="w-3.5 h-3.5" /> },
              { label: 'Education',        count: (model.education || []).length, icon: <GraduationCap className="w-3.5 h-3.5" /> },
            ].map(({ label, count, icon }) => (
              <div key={label} className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border/60">
                <span className={count > 0 ? 'text-emerald-400' : 'text-foreground-muted'}>{icon}</span>
                <div>
                  <span className="font-semibold text-foreground">{count}</span>
                  <span className="text-foreground-muted ml-1">{label}</span>
                </div>
              </div>
            ))}
          </div>

          {totalUnclear > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{totalUnclear} item{totalUnclear > 1 ? 's' : ''} need your clarification below.</span>
            </div>
          )}
        </div>

        {/* Work Experience */}
        {(model.workExperience || []).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">Work Experience</h2>
            {(model.workExperience || []).map((exp, i) => (
              <SectionCard
                key={i}
                icon={<Briefcase className="w-4 h-4" />}
                title={`${exp?.role?.value || 'Role'} — ${exp?.company?.value || 'Company'}`}
                subtitle={`${exp?.startDate?.value || ''} – ${exp?.endDate?.value || ''}`.replace(/^ – $/, '')}
                confidence={exp?.role?.confidence}
                onRemove={() => removeExperience(i)}
              >
                {(exp?.bullets || []).map((b, bi) => (
                  <div key={bi} className="pl-2 py-1.5 text-xs text-foreground-muted border-l-2 border-border/60">
                    <span className="text-foreground">{b?.value || String(b)}</span>
                    {b?.sourceText && <SourceChip sourceText={b.sourceText} />}
                  </div>
                ))}
              </SectionCard>
            ))}
          </div>
        )}

        {/* Projects */}
        {(model.projects || []).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">Projects</h2>
            {(model.projects || []).map((proj, i) => (
              <SectionCard
                key={i}
                icon={<FolderKanban className="w-4 h-4" />}
                title={proj?.name?.value || 'Project'}
                confidence={proj?.name?.confidence}
                onRemove={() => removeProject(i)}
              >
                {proj?.problem && (
                  <EvidenceItemRow label="Problem" item={proj.problem} />
                )}
                {proj?.contribution && (
                  <EvidenceItemRow label="Contribution" item={proj.contribution} />
                )}
                {(proj?.technologies || []).length > 0 && (
                  <div className="py-2">
                    <span className="text-xs text-foreground-muted block mb-1.5">Technologies</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(proj.technologies || []).map((t, ti) => (
                        <span key={ti} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {t?.value || String(t)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(proj?.outcomes || []).length > 0 && (proj.outcomes || []).map((o, oi) => (
                  <EvidenceItemRow key={oi} label="Outcome" item={o} />
                ))}
                {(!proj?.outcomes || proj.outcomes.length === 0) && (
                  <div className="flex items-center gap-1.5 py-1.5 text-xs text-foreground-muted/60">
                    <AlertTriangle className="w-3 h-3 text-amber-400/60" />
                    <span>No measurable outcome found in resume</span>
                  </div>
                )}
              </SectionCard>
            ))}
          </div>
        )}

        {/* Skills */}
        {allSkills.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">Skills</h2>
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {allSkills.map((s) => (
                  <div
                    key={`${s.category}-${s.index}`}
                    className="group flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-surface-subtle border border-border/80 text-foreground hover:border-primary/40 transition-colors"
                    title={s.sourceText ? `source: "${s.sourceText}"` : undefined}
                  >
                    <span>{s.value}</span>
                    {s.confidence && <ConfidenceBadge confidence={s.confidence} />}
                    <button
                      onClick={() => removeSkill(s.category, s.index)}
                      className="ml-0.5 text-foreground-muted/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-foreground-muted">
                Hover a skill to see its source. Click × to remove any skill that was extracted incorrectly.
              </p>
            </div>
          </div>
        )}

        {/* Education */}
        {(model.education || []).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">Education</h2>
            {(model.education || []).map((edu, i) => (
              <SectionCard
                key={i}
                icon={<GraduationCap className="w-4 h-4" />}
                title={`${edu?.degree?.value || 'Degree'}`}
                subtitle={`${edu?.institution?.value || ''} ${edu?.year?.value ? `· ${edu.year.value}` : ''}`}
                confidence={edu?.degree?.confidence}
                defaultOpen={false}
              >
                {edu?.degree && <EvidenceItemRow label="Degree" item={edu.degree} />}
                {edu?.institution && <EvidenceItemRow label="Institution" item={edu.institution} />}
                {edu?.year && <EvidenceItemRow label="Year" item={edu.year} />}
              </SectionCard>
            ))}
          </div>
        )}

        {/* Unclear Items */}
        {(model.unclear || []).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Items Needing Clarification
            </h2>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 divide-y divide-amber-500/10">
              {(model.unclear || []).map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">{item?.text || String(item)}</p>
                    {item?.reason && <p className="text-[11px] text-amber-400/70">{item.reason}</p>}
                  </div>
                  <button
                    onClick={() => removeUnclear(i)}
                    className="p-1 text-amber-400/60 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Confirm Bar */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-sm border-t border-border flex items-center justify-between gap-4">
          <div className="text-xs text-foreground-muted">
            {hasMinimumEvidence ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to confirm
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Add at least one experience, project, or skill
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/setup')} size="sm">
              Re-upload
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!hasMinimumEvidence || isConfirming}
              leftIcon={<Lock className="w-4 h-4" />}
              size="sm"
            >
              {isConfirming ? 'Locking context...' : 'Confirm Profile & Continue'}
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ResumeIntelligencePage;
