import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

export const DebugTelemetryPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    setupDraft,
    activeSession,
    engineState,
    voiceStatus,
    liveTranscript,
    latestFeedback,
  } = useInterview();

  const isDebugActive =
    typeof window !== 'undefined' &&
    window.location.search.includes('debug=true');

  if (!isDebugActive) return null;

  const currentQ = activeSession.questions?.[activeSession.currentQuestionIndex];
  const feedbackScore = latestFeedback
    ? (latestFeedback as any).score ?? (latestFeedback as any).overallScore ?? 'N/A'
    : 'N/A';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-zinc-950/95 text-zinc-200 border border-zinc-700 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3 border-b border-zinc-800 cursor-pointer bg-zinc-900/60 rounded-t-2xl select-none"
      >
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-emerald-400" />
          <span className="font-bold text-zinc-100 uppercase tracking-wider text-[11px]">
            Engine Debug Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
            {setupDraft.interviewMode || 'resume_grounded'}
          </span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {/* SETUP SOURCES */}
          <div className="space-y-1 pb-2 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">
              1. Setup Input Grounding
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div>
                Resume:{' '}
                <span className={setupDraft.resumeConfirmed ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                  {setupDraft.resumeConfirmed ? '✓ Confirmed' : '✗ Unconfirmed'}
                </span>
              </div>
              <div>
                JD:{' '}
                <span className={setupDraft.jobDescriptionProvided ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                  {setupDraft.jobDescriptionProvided ? '✓ Provided' : '✗ None'}
                </span>
              </div>
              <div>
                Company Intel:{' '}
                <span className={setupDraft.companyResearch ? 'text-emerald-400' : 'text-zinc-500'}>
                  {setupDraft.companyResearch ? '✓ Active' : '✗ None'}
                </span>
              </div>
              <div>
                Match Status:{' '}
                <span className={setupDraft.matchState?.status === 'ready' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {setupDraft.matchState?.status === 'ready'
                    ? `${setupDraft.matchAnalysis?.matchPercentage}% Ready`
                    : 'Unavailable (No JD)'}
                </span>
              </div>
            </div>
          </div>

          {/* TURN & SPEECH ENGINE */}
          <div className="space-y-1 pb-2 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">
              2. Turn & Conversational State
            </span>
            <div className="space-y-0.5 text-[11px]">
              <div>
                Engine State: <span className="text-indigo-300 font-bold">{engineState}</span>
              </div>
              <div>
                Voice Status: <span className="text-cyan-300 font-bold">{voiceStatus}</span>
              </div>
              <div>
                Candidate Live STT:
                <p className="text-zinc-300 bg-zinc-900 p-1.5 rounded mt-0.5 text-[10px] font-sans">
                  {liveTranscript || '(Waiting for candidate speech...)'}
                </p>
              </div>
            </div>
          </div>

          {/* INTERNAL OBJECTIVE (NEVER SHOWN TO CANDIDATE) */}
          <div className="space-y-1 pb-2 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">
              3. Hidden Internal Brain Objective
            </span>
            <div className="space-y-0.5 text-[11px]">
              <div>
                Target Competency:{' '}
                <span className="text-emerald-300 font-bold">
                  {currentQ?.targetCompetency || currentQ?.category || 'Project & Technical Depth'}
                </span>
              </div>
              <div>
                Source Reference: <span className="text-zinc-300">{currentQ?.sourceReference || 'Confirmed Resume'}</span>
              </div>
              <div>
                Intent: <span className="text-zinc-400">{currentQ?.intent || 'Probe deliverable architecture & ownership'}</span>
              </div>
            </div>
          </div>

          {/* LAST EVALUATION & FEEDBACK */}
          {latestFeedback && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500 block">
                4. Real-time Answer Evaluation
              </span>
              <div className="space-y-0.5 text-[11px]">
                <div>
                  Score: <span className="text-emerald-300 font-bold">{feedbackScore} / 10</span>
                </div>
                <div>
                  Classification:{' '}
                  <span className="text-amber-300 capitalize">{latestFeedback.answerClassification || 'adequate'}</span>
                </div>
                <div>
                  Follow-up Triggered:{' '}
                  <span className={latestFeedback.shouldFollowUp ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                    {latestFeedback.shouldFollowUp ? `Yes (${latestFeedback.followUpReasonCode})` : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
