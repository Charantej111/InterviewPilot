import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DarkGradientBg } from '../components/ui/DarkGradientBg';
import { InterviewHeader } from '../components/interview/InterviewHeader';
import { QuestionBlock } from '../components/interview/QuestionBlock';
import { AnswerInput } from '../components/interview/AnswerInput';
import { InterviewCompletionScreen } from '../components/interview/InterviewCompletionScreen';
import { ExitConfirmModal } from '../components/interview/ExitConfirmModal';
import { AlertTriangle, ArrowRight, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { InterviewBrainDebugPanel } from '../components/dev/InterviewBrainDebugPanel';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeSession,
    loadSession,
    submitCurrentTurn,
    completeInterviewSession,
    getReport,
    remainingSeconds,
    terminateActiveSession,
  } = useInterview();

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const questionContainerRef = useRef<HTMLDivElement>(null);
  const isCompletingRef = useRef(false);
  const isResolvingReportRef = useRef(false);

  const targetSessionId = id || activeSession.id;

  // 1. Initial load & sync on mount
  useEffect(() => {
    if (id && activeSession.id !== id) {
      loadSession(id);
    }
  }, [id, activeSession.id, loadSession]);

  // 2. Authoritative Database Lifecycle Status Routing
  useEffect(() => {
    if (activeSession?.status === 'failed') {
      setIsTerminated(true);
      return;
    }

    if (activeSession?.status === 'report_ready') {
      navigate(`/interview/${targetSessionId}/report`, { replace: true });
      return;
    }

    // If session is already completing or report generating (e.g. after refresh), poll or generate report
    const isFinishingStatus =
      activeSession?.status === 'completing' ||
      activeSession?.status === 'completed' ||
      activeSession?.status === 'report_generating';

    if (isFinishingStatus && targetSessionId && !targetSessionId.startsWith('mock_')) {
      if (isResolvingReportRef.current) return;
      isResolvingReportRef.current = true;

      let isMounted = true;
      const resolveReport = async () => {
        try {
          const report = await getReport(targetSessionId);
          if (isMounted && report) {
            navigate(`/interview/${targetSessionId}/report`, { replace: true });
          }
        } catch (err) {
          console.warn('Report resolution notice on load:', err);
        }
      };

      const timer = setTimeout(resolveReport, 1000);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [activeSession?.status, targetSessionId, navigate, getReport]);

  // 3. Anti-Cheating Detection (Only active when in_progress)
  useEffect(() => {
    if (isTerminated || activeSession.status !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations((prev) => {
          const nextCount = prev + 1;
          if (nextCount === 1) {
            setShowTabWarning(true);
          } else if (nextCount >= 2) {
            setIsTerminated(true);
            terminateActiveSession('Multiple tab switch violations detected');
          }
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTerminated, activeSession.status, terminateActiveSession]);

  // Auto-scroll on question switch
  useEffect(() => {
    if (questionContainerRef.current) {
      questionContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSession.currentQuestionIndex]);

  const currentQuestionNum = (activeSession.currentQuestionIndex || 0) + 1;
  const totalQuestions = activeSession.questions?.length || 4;
  const activeQuestion = activeSession.questions?.[activeSession.currentQuestionIndex] || activeSession.questions?.[0];
  const isAdaptiveFollowUp = activeQuestion?.type === 'follow_up';

  // 4. Idempotent Answer Submit & Completion Pipeline
  const handleAnswerSubmit = async (
    answerText: string,
    inputMode: 'text' | 'voice',
    durationSecs: number
  ) => {
    if (isCompletingRef.current || isAdvancing) return;

    setIsAdvancing(true);
    try {
      const res = await submitCurrentTurn(answerText, inputMode, durationSecs);
      if (res.status === 'completed') {
        isCompletingRef.current = true;
        await completeInterviewSession();
        navigate(`/interview/${targetSessionId}/report`, { replace: true });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleRetryReport = async () => {
    try {
      const rep = await getReport(targetSessionId);
      if (rep) {
        navigate(`/interview/${targetSessionId}/report`, { replace: true });
      }
    } catch (err) {
      console.error('Error retrying report generation:', err);
    }
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    navigate('/dashboard');
  };

  const isFinishingStatus =
    activeSession?.status === 'completing' ||
    activeSession?.status === 'completed' ||
    activeSession?.status === 'report_generating' ||
    activeSession?.status === 'report_failed';

  return (
    <DarkGradientBg className="flex flex-col text-foreground min-h-screen">
      {/* Top Room Header Bar */}
      <InterviewHeader
        currentQuestion={currentQuestionNum}
        totalQuestions={totalQuestions}
        company={activeSession.company || 'Target Company'}
        role={activeSession.jobTitle || 'Role'}
        onExitClick={() => setIsExitModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-center relative z-10">
        {/* TAB SWITCH WARNING MODAL (1st Violation) */}
        {showTabWarning && !isTerminated && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-zinc-900 border border-amber-500/40 text-center space-y-4 shadow-2xl animate-fadeIn text-white">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Tab Switch Detected (Warning {tabViolations}/2)</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Leaving the interview simulation tab during a live session is prohibited to ensure testing integrity. Your next tab switch will <strong>permanently terminate</strong> this interview.
                </p>
              </div>
              <Button
                size="md"
                onClick={() => setShowTabWarning(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold cursor-pointer"
              >
                I Understand, Return to Interview
              </Button>
            </div>
          </div>
        )}

        {/* SESSION TERMINATED DUE TO CHEATING (2nd Violation) */}
        {isTerminated && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-zinc-900 border border-rose-500/50 text-center space-y-4 shadow-2xl animate-fadeIn text-white">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Session Terminated</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  This interview has been terminated due to multiple tab switch violations. To maintain assessment rigor, sessions cannot be resumed after integrity breaches.
                </p>
              </div>
              <Button
                size="md"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight size={15} />}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* DEDICATED COMPLETION SCREEN WHEN FINISHING / COMPLETED / GENERATING REPORT */}
        {isFinishingStatus ? (
          <InterviewCompletionScreen
            status={activeSession.status as any}
            onRetry={handleRetryReport}
            onGoToDashboard={() => navigate('/dashboard')}
            onViewReport={() => navigate(`/interview/${targetSessionId}/report`)}
          />
        ) : isAdvancing ? (
          <div className="max-w-2xl mx-auto p-8 sm:p-12 rounded-3xl bg-white dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center space-y-6 animate-fadeIn text-foreground">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
              <Sparkles size={32} className="animate-spin duration-[3000ms]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Analyzing Your Response...</h3>
              <p className="text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
                Our Answer Intelligence engine is extracting evidence signals and updating your competency reliability mapping.
              </p>
            </div>
            
            {/* Visual Progress Steps */}
            <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 pt-4">
              <div className="space-y-1">
                <div className="h-1 rounded bg-purple-600" />
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">1. Submitted</span>
              </div>
              <div className="space-y-1">
                <div className="h-1 rounded bg-purple-600/50 animate-pulse duration-700" />
                <span className="text-[10px] text-foreground-muted font-bold block">2. Evaluating</span>
              </div>
              <div className="space-y-1">
                <div className="h-1 rounded bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-[10px] text-foreground-muted font-bold block">3. Next Qn</span>
              </div>
            </div>
          </div>
        ) : (
          <div ref={questionContainerRef} className="space-y-6 animate-fadeIn">
            {/* Timer Expired Banner Alert */}
            {remainingSeconds <= 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 font-medium">
                  <Clock size={16} className="text-amber-400 shrink-0" />
                  <span>Session time has expired. Please submit your final response to synthesize your report.</span>
                </div>
              </div>
            )}

            {/* Question Card */}
            <div className="p-7 sm:p-9 rounded-3xl bg-white dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-left transition-all">
              {activeQuestion && (
                <QuestionBlock
                  question={activeQuestion}
                  isAdaptiveFollowUp={isAdaptiveFollowUp}
                />
              )}
            </div>

            {/* Answer Input Area */}
            <AnswerInput
              key={activeQuestion?.id || activeSession.currentQuestionIndex}
              onSubmit={handleAnswerSubmit}
              isSubmitting={isAdvancing || isFinishingStatus}
            />
          </div>
        )}
      </main>

      {/* Exit Modal */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
      />

      {/* Observability Telemetry Overlay (?debug=true) */}
      <InterviewBrainDebugPanel />
    </DarkGradientBg>
  );
};

export default InterviewRoomPage;
