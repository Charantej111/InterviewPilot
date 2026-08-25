import React, { useState } from 'react';
import type { ExtractionDebugSnapshot } from '../../context/InterviewContext';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ResumeIntelligenceDebugPanelProps {
  debugSnapshot?: ExtractionDebugSnapshot | null;
  candidateName?: string;
  isOpenDefault?: boolean;
}

export const ResumeIntelligenceDebugPanel: React.FC<ResumeIntelligenceDebugPanelProps> = ({
  debugSnapshot,
  candidateName,
  isOpenDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [activeTab, setActiveTab] = useState<
    'pipeline' | 'blocks' | 'projects' | 'experience' | 'education' | 'achievements' | 'raw_lines' | 'gemini' | 'audit'
  >('pipeline');

  if (!debugSnapshot) {
    return null;
  }

  const {
    sections,
    lineBlocks,
    detectedSemanticBlocks = [],
    detectedProjects = [],
    detectedExperience = [],
    detectedEducation = [],
    detectedAchievements = [],
    rawGeminiOutput,
    validatedEvidence,
    rejectedEvidence = [],
    derivedProfile,
    characterCount,
    pageCount = 1,
  } = debugSnapshot;

  return (
    <div className="w-full mt-6 bg-zinc-950 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-emerald-950/40 hover:bg-emerald-900/40 border-b border-emerald-500/30 flex items-center justify-between transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-300">
                RESUME PARSING STRUCTURAL DEBUG TELEMETRY
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                ?resumeDebug=true
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Candidate: <span className="text-zinc-200 font-medium">{candidateName || derivedProfile?.name || 'Detected'}</span> • {pageCount} {pageCount === 1 ? 'page' : 'pages'} • {characterCount} chars • {detectedSemanticBlocks.length} semantic blocks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="hidden sm:inline">
            Projects: <strong className="text-emerald-400">{detectedProjects.length}</strong> | Exp: <strong className="text-blue-400">{detectedExperience.length}</strong> | Edu: <strong className="text-purple-400">{detectedEducation.length}</strong>
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 space-y-5">
          {/* Navigation Sub-tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-mono">
            {[
              { id: 'pipeline', label: '1. Pipeline Overview' },
              { id: 'blocks', label: `2. Semantic Blocks (${detectedSemanticBlocks.length})` },
              { id: 'projects', label: `3. Projects (${detectedProjects.length})` },
              { id: 'experience', label: `4. Experience (${detectedExperience.length})` },
              { id: 'education', label: `5. Education (${detectedEducation.length})` },
              { id: 'achievements', label: `6. Achievements (${detectedAchievements.length})` },
              { id: 'raw_lines', label: `7. Line Blocks (${lineBlocks.length})` },
              { id: 'gemini', label: '8. Raw Gemini Output' },
              { id: 'audit', label: `9. Validation Audit (${rejectedEvidence.length} rejected)` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Pipeline Overview */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Total Characters</div>
                  <div className="text-lg font-bold text-white mt-1">{characterCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Reconstructed Lines</div>
                  <div className="text-lg font-bold text-white mt-1">{lineBlocks.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Detected Sections</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{sections.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Semantic Blocks</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">{detectedSemanticBlocks.length}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="text-zinc-300 font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Deterministic Structural Pipeline Execution Trace
                </div>
                <div className="text-zinc-400 space-y-1 pl-4 border-l border-emerald-500/30">
                  <div>1. Raw PDF/DOCX parsed $\to$ {lineBlocks.length} column-ordered LineBlocks created.</div>
                  <div>2. Page markers $\to$ filtered from text stream; page metadata preserved on LineBlocks.</div>
                  <div>3. Section Detector $\to$ {sections.map((s) => s.normalizedName).join(', ')}.</div>
                  <div>4. Semantic Block Layer $\to$ {detectedProjects.length} projects, {detectedExperience.length} experiences, {detectedEducation.length} educations.</div>
                  <div>5. Gemini / Fallback 1:1 Mapping $\to$ 1 semantic block = max 1 candidate entity.</div>
                  <div>6. Dual Validator $\to$ validateEvidence() + validateEntityStructure() evaluated.</div>
                  <div>7. Final Candidate Profile $\to$ {derivedProfile?.projects?.length || 0} projects, {derivedProfile?.experience?.length || 0} experiences, {derivedProfile?.education?.length || 0} educations.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Semantic Blocks */}
          {activeTab === 'blocks' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400">
                All detected intermediate structural blocks across document sections:
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
                {detectedSemanticBlocks.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">{b.id}</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">{b.section.toUpperCase()}</span>
                        <span className="text-white font-bold">{b.heading || 'No Heading'}</span>
                      </div>
                      <span className="text-emerald-400 text-[11px]">Conf: {(b.structuralConfidence * 100).toFixed(0)}% • Lines {b.startLine}–{b.endLine}</span>
                    </div>
                    {b.link && (
                      <div className="text-blue-400 text-[11px]">Link: {b.link}</div>
                    )}
                    <div className="text-zinc-400 text-[11px] bg-zinc-950 p-2 rounded-lg whitespace-pre-wrap">
                      {b.blockText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400">
                Grounded Project Blocks ({detectedProjects.length} detected):
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {detectedProjects.map((p, idx) => (
                  <div key={p.id || idx} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{p.id || `proj_${idx + 1}`}</span>
                        <span className="text-white font-bold text-sm">{p.heading}</span>
                        {p.link && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">Hyperlink Grounded</span>}
                      </div>
                      <span className="text-zinc-400 text-[11px]">Lines {p.startLine}–{p.endLine}</span>
                    </div>
                    <div className="text-zinc-300 text-xs leading-relaxed bg-zinc-950 p-2.5 rounded-lg">
                      {p.text || p.lines.join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400">
                Grounded Experience Blocks ({detectedExperience.length} detected):
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {detectedExperience.map((e, idx) => (
                  <div key={e.id || idx} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">{e.id || `exp_${idx + 1}`}</span>
                        <span className="text-white font-bold">{e.role || 'Role'}</span>
                        <span className="text-zinc-400">at</span>
                        <span className="text-emerald-300 font-bold">{e.company || 'No Company (null)'}</span>
                      </div>
                      <span className="text-zinc-400 text-[11px]">{[e.startDate, e.endDate].filter(Boolean).join(' – ')}</span>
                    </div>
                    <div className="text-zinc-300 space-y-1 bg-zinc-950 p-2.5 rounded-lg">
                      {e.highlights.map((h, i) => (
                        <div key={i} className="text-zinc-300 text-[11px]">• {h}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Education */}
          {activeTab === 'education' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400">
                Grounded Education Blocks ({detectedEducation.length} detected):
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {detectedEducation.map((ed, idx) => (
                  <div key={ed.id || idx} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">{ed.id || `edu_${idx + 1}`}</span>
                        <span className="text-white font-bold">{ed.degree || 'Degree'}</span>
                      </div>
                      <span className="text-zinc-400 text-[11px]">{ed.year || ''}</span>
                    </div>
                    <div className="text-zinc-300 text-xs">{ed.institution || 'Institution'}</div>
                    {ed.grade && <div className="text-emerald-400 text-[11px]">Grade / Score: {ed.grade}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Achievements */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400">
                Grounded Achievements ({detectedAchievements.length} detected):
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {detectedAchievements.map((a, idx) => (
                  <div key={a.id || idx} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{a.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 7: Line Blocks */}
          {activeTab === 'raw_lines' && (
            <div className="space-y-2 font-mono text-xs">
              <div className="text-zinc-400">Reconstructed Line Blocks ({lineBlocks.length}):</div>
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 max-h-96 overflow-y-auto text-[11px] leading-relaxed">
                {lineBlocks.map((b) => `[L${b.lineNumber.toString().padStart(3, '0')}] [P${b.pageNumber || 1}] [${(b.section || 'header').padEnd(12, ' ')}] ${b.text}`).join('\n')}
              </pre>
            </div>
          )}

          {/* Tab 8: Raw Gemini Output */}
          {activeTab === 'gemini' && (
            <div className="space-y-2 font-mono text-xs">
              <div className="text-zinc-400">Raw Gemini Structured Extraction JSON:</div>
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-300 max-h-96 overflow-y-auto text-[11px] leading-relaxed">
                {JSON.stringify(rawGeminiOutput || validatedEvidence, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 9: Validation Audit */}
          {activeTab === 'audit' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="text-zinc-400">
                Strict Grounding & Structural Validator Audit ({rejectedEvidence.length} items rejected):
              </div>
              {rejectedEvidence.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  All extracted candidate entities passed both source grounding and structural validity checks with zero rejections.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {rejectedEvidence.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-zinc-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-bold">[{item.section || 'GENERAL'}] Rejected: "{item.value}"</span>
                        <span className="text-zinc-500 text-[10px]">Item #{idx + 1}</span>
                      </div>
                      <div className="text-xs text-zinc-400">Reason: {item.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
