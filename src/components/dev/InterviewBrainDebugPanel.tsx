import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { Brain, ChevronDown, ChevronUp, Clock, Target, Layers, Sparkles } from 'lucide-react';
import { formatTime } from '../../lib/utils';

export const InterviewBrainDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    activeSession,
    remainingSeconds,
    latestFeedback,
    engineState,
    voiceStatus,
    liveTranscript,
    interviewerSpokenText,
  } = useInterview();

  const isDebugActive =
    typeof window !== 'undefined' &&
    window.location.search.includes('debug=true');

  if (!isDebugActive) return null;

  const contract = activeSession.interviewContract;
  const competencyMap = activeSession.competencyMap || {};
  const currentObj = activeSession.currentObjective;
  const currentQ = activeSession.questions?.[activeSession.currentQuestionIndex];

  // Route telemetry
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isCompletedSession =
    activeSession.status === 'completed' ||
    activeSession.status === 'report_generating' ||
    activeSession.status === 'report_ready' ||
    activeSession.status === 'report_failed';
  const expectedPath = isCompletedSession ? `/interview/${activeSession.id}/report` : `/interview/${activeSession.id}`;
  const feedbackAllowed = isCompletedSession;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg w-full bg-zinc-950/95 text-zinc-200 border border-zinc-700 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono">
      {/* Top Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3 border-b border-zinc-800 cursor-pointer bg-zinc-900/80 rounded-t-2xl select-none"
      >
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-emerald-400" />
          <span className="font-bold text-zinc-100 uppercase tracking-wider text-[11px]">
            Interview Brain & Objective Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
            {contract?.mode || 'resume_grounded'}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
            <Clock size={11} /> {formatTime(remainingSeconds)}
          </span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-3.5 max-h-[32rem] overflow-y-auto">
          {/* 1. CURRENT SESSION & CONTRACT */}
          <div className="space-y-1 pb-2 border-b border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-500">
              <span>1. Session & Lifecycle</span>
              <span>Questions: {activeSession.questions?.length || 1} (Bound: {contract?.minQuestions || 5}..{contract?.maxQuestions || 15})</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] pt-0.5">
              <div>
                Session ID: <span className="text-zinc-400 text-[10px]">{activeSession.id.slice(0, 12)}...</span>
              </div>
              <div>
                Turn ID: <span className="text-zinc-400 text-[10px]">{activeSession.activeTurnId ? activeSession.activeTurnId.slice(0, 12) : 'NONE'}</span>
              </div>
              <div>
                Status: <span className="text-blue-300 font-bold">{activeSession.status}</span>
              </div>
              <div>
                Session Status: <span className="text-cyan-300 font-bold">{activeSession.sessionStatus || 'not_started'}</span>
              </div>
              <div>
                Turn State: <span className="text-purple-300 font-bold">{activeSession.turnState || 'idle'}</span>
              </div>
              <div>
                Time Remaining: <span className="text-amber-300 font-mono font-bold">{formatTime(remainingSeconds)}</span>
              </div>
              <div>
                Expected Route: <span className="text-zinc-400">{expectedPath}</span>
              </div>
              <div>
                Current Route: <span className="text-zinc-400">{currentPath}</span>
              </div>
              <div>
                Feedback Allowed: <span className={feedbackAllowed ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{feedbackAllowed ? 'YES' : 'NO'}</span>
              </div>
              <div>
                Completion Reason: <span className="text-amber-400 font-bold">{activeSession.completionReason || 'NONE'}</span>
              </div>
            </div>
            <div className="pt-1.5 text-[10px] border-t border-zinc-900">
              <span className="text-zinc-500 font-bold">Why did the session end?</span>
              <div className="text-zinc-300 mt-0.5 bg-zinc-900/60 p-1.5 rounded-lg">
                {activeSession.status === 'completed' || isCompletedSession ? (
                  <span>
                    Completed: true | Reason: {activeSession.completionReason || 'UNKNOWN'} | Action: REDIRECT_TO_REPORT
                  </span>
                ) : (
                  <span>
                    Completed: false | Reason: NONE | Next Action: GENERATE_NEXT_QUESTION (Score count: {activeSession.questions?.length})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. CURRENT ACTIVE OBJECTIVE */}
          <div className="space-y-1 pb-2 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Target size={11} className="text-cyan-400" />
              <span>2. Current Active Objective</span>
            </span>
            <div className="space-y-1 text-[11px] bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-400">Target Competency:</span>
                <span className="text-emerald-300 font-bold">{currentObj?.targetCompetency || currentQ?.targetCompetency || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Question Type:</span>
                <span className="text-cyan-300 font-semibold uppercase text-[10px]">{currentObj?.questionType || currentQ?.questionType || 'product_sense'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Difficulty Level:</span>
                <span className="text-amber-300 font-semibold capitalize">{currentObj?.difficulty || currentQ?.difficulty || 'intermediate'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Resume Grounded:</span>
                <span className={currentObj?.useResumeGrounding ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                  {currentObj?.useResumeGrounding ? '✓ True (Confirmed Evidence)' : '✗ False (Hypothetical/General)'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Intent:</span>
                <span className="text-zinc-300 italic text-[10px]">{currentObj?.intent || currentQ?.intent || 'Assess candidate approach'}</span>
              </div>
              {currentObj?.expectedSignals && currentObj.expectedSignals.length > 0 && (
                <div>
                  <span className="text-zinc-400 block">Expected Signals:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {currentObj.expectedSignals.map((sig, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2a. VOICE & AUDIO TELEMETRY */}
          <div className="space-y-1 pb-2 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Brain size={11} className="text-purple-400" />
              <span>2a. Voice & Audio Telemetry</span>
            </span>
            <div className="space-y-1 text-[11px] bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-400">Voice Status:</span>
                <span className="text-purple-300 font-bold">{voiceStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Engine State:</span>
                <span className="text-cyan-300 font-semibold uppercase">{engineState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">TTS Active:</span>
                <span className={activeSession.turnState === 'interviewer_speaking' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                  {activeSession.turnState === 'interviewer_speaking' ? 'ACTIVE (Mic Muted)' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mic Listening:</span>
                <span className={activeSession.turnState === 'candidate_listening' || activeSession.turnState === 'candidate_speaking' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                  {activeSession.turnState === 'candidate_listening' || activeSession.turnState === 'candidate_speaking' ? 'ACTIVE (Mic Open)' : 'INACTIVE'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Live Transcript:</span>
                <div className="text-[10px] text-zinc-300 bg-zinc-950 p-1.5 rounded border border-zinc-800 min-h-[24px] break-words">
                  {liveTranscript || 'No speech activity...'}
                </div>
              </div>
              <div>
                <span className="text-zinc-400 block">AI TTS Spoken:</span>
                <div className="text-[10px] text-zinc-400 bg-zinc-950 p-1.5 rounded border border-zinc-800 max-h-16 overflow-y-auto break-words">
                  {interviewerSpokenText || 'No AI speech...'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. COMPETENCY MAP */}
          <div className="space-y-1.5 pb-2 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Layers size={11} className="text-indigo-400" />
              <span>3. Internal Competency Map ({Object.keys(competencyMap).length} Items)</span>
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {Object.entries(competencyMap).map(([compName, state]) => (
                <div
                  key={compName}
                  className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[10px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 truncate max-w-[200px]" title={compName}>
                      {compName}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
                          state.importance === 'critical' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {state.importance}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
                          state.assessmentReliability === 'reliable'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : state.assessmentReliability === 'provisional'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {state.assessmentReliability}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Status: <strong className="text-zinc-200 capitalize">{state.status}</strong></span>
                    <span>Confidence: <strong className="text-zinc-200 capitalize">{state.confidence}</strong></span>
                    <span>Q/F: {state.questionsAsked}/{state.followUpsUsed}</span>
                    <span>Ev: {state.evidence.length}</span>
                  </div>

                  {state.missingSignals.length > 0 && (
                    <div className="text-[10px] text-amber-400/90 pt-0.5">
                      Missing: {state.missingSignals.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. LAST EVALUATION */}
          {latestFeedback && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>4. Real-time Answer Evaluation</span>
              </span>
              <div className="space-y-1 text-[11px] bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Score / Gate:</span>
                  <span className="text-emerald-300 font-bold">
                    {latestFeedback.overallScore} / 10 ({latestFeedback.relevanceGate?.status || 'answered'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Classification:</span>
                  <span className="text-amber-300 font-semibold capitalize">{latestFeedback.answerClassification}</span>
                </div>
                {latestFeedback.deterministicScore && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Score Confidence:</span>
                    <span className="text-cyan-300 font-semibold uppercase text-[10px]">{latestFeedback.deterministicScore.scoreConfidence} ({latestFeedback.deterministicScore.assessedDimensions}/6 Dims)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Follow-up Needed:</span>
                  <span className={latestFeedback.shouldFollowUp ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                    {latestFeedback.shouldFollowUp ? `Yes (${latestFeedback.followUpReasonCode})` : 'No'}
                  </span>
                </div>
                {latestFeedback.breakdown && (
                  <div className="pt-1 border-t border-zinc-800">
                    <span className="text-zinc-400 text-[10px] block mb-0.5">Dimensions:</span>
                    <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                      <span>Rel: <strong className="text-zinc-200">{latestFeedback.breakdown.relevance ?? 'null'}</strong></span>
                      <span>Dep: <strong className="text-zinc-200">{latestFeedback.breakdown.depth ?? 'null'}</strong></span>
                      <span>Ev: <strong className="text-zinc-200">{latestFeedback.breakdown.evidence ?? 'null'}</strong></span>
                      <span>Str: <strong className="text-zinc-200">{latestFeedback.breakdown.structure ?? 'null'}</strong></span>
                      <span>Cla: <strong className="text-zinc-200">{latestFeedback.breakdown.clarity ?? 'null'}</strong></span>
                      <span>Role: <strong className="text-zinc-200">{latestFeedback.breakdown.roleAlignment ?? 'null'}</strong></span>
                    </div>
                  </div>
                )}
                {latestFeedback.whatWorked && latestFeedback.whatWorked.length > 0 && (
                  <div className="pt-0.5">
                    <span className="text-emerald-400 text-[10px] block">Observed Evidence:</span>
                    <ul className="list-disc list-inside text-[10px] text-zinc-300">
                      {latestFeedback.whatWorked.slice(0, 2).map((w, idx) => (
                        <li key={idx} className="truncate">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {latestFeedback.missingSignals && latestFeedback.missingSignals.length > 0 && (
                  <div className="pt-0.5">
                    <span className="text-amber-400 text-[10px] block">Missing Signals:</span>
                    <div className="text-[10px] text-zinc-400">
                      {latestFeedback.missingSignals.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewBrainDebugPanel;
