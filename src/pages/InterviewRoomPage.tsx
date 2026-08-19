import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DarkGradientBg } from '../components/ui/DarkGradientBg';
import { InterviewHeader } from '../components/interview/InterviewHeader';
import { QuestionBlock } from '../components/interview/QuestionBlock';
import { AnswerInput } from '../components/interview/AnswerInput';
import { AILoader } from '../components/ui/AILoader';
import { ExitConfirmModal } from '../components/interview/ExitConfirmModal';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeSession,
    loadSession,
    submitCandidateAnswer,
    advanceToNextQuestion,
    getReport,
    terminateActiveSession,
  } = useInterview();

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isFinishingInterview, setIsFinishingInterview] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const questionContainerRef = useRef<HTMLDivElement>(null);

  // Load session by ID on mount if needed
  useEffect(() => {
    if (id && activeSession.id !== id) {
      loadSession(id);
    }
  }, [id, activeSession.id, loadSession]);

  // Check if session is already failed / terminated
  useEffect(() => {
    if (activeSession?.status === 'failed') {
      setIsTerminated(true);
    }
  }, [activeSession?.status]);

  // Anti-Cheating: Tab Switch / Visibility Change Detection
  useEffect(() => {
    if (isTerminated || isFinishingInterview) return;

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
  }, [isTerminated, isFinishingInterview, terminateActiveSession]);

  // Auto-scroll to question container when question changes
  useEffect(() => {
    if (questionContainerRef.current) {
      questionContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSession.currentQuestionIndex]);

  const currentQuestionNum = (activeSession.currentQuestionIndex || 0) + 1;
  const totalQuestions = activeSession.questions?.length || 4;
  const activeQuestion = activeSession.questions?.[activeSession.currentQuestionIndex] || activeSession.questions?.[0];
  const isAdaptiveFollowUp = activeQuestion?.type === 'follow_up';

  const handleAnswerSubmit = async (
    answerText: string,
    inputMode: 'text' | 'voice',
    durationSecs: number
  ) => {
    setIsAdvancing(true);
    try {
      // 1. Submit answer
      await submitCandidateAnswer(answerText, inputMode, durationSecs);

      // 2. Check if there are more questions
      const hasMore = await advanceToNextQuestion();

      if (hasMore) {
        setIsAdvancing(false);
      } else {
        // All questions completed! Trigger holistic evaluation
        setIsFinishingInterview(true);
        const targetSessionId = id || activeSession.id;
        try {
          await getReport(targetSessionId);
        } catch (reportErr) {
          console.warn('Report generation completed with fallback:', reportErr);
        }
        navigate(`/interview/${targetSessionId}/report`);
      }
    } catch (err) {
      console.error('Error during answer submission:', err);
      setIsAdvancing(false);
      setIsFinishingInterview(false);
    }
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    navigate('/dashboard');
  };

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
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
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
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* AI EVALUATION LOADER */}
        {isFinishingInterview ? (
          <AILoader
            title="Synthesizing Candidate Dossier"
            stage="Evaluating holistic responses across STAR rubric, metrics depth, and hiring bar standards..."
          />
        ) : isAdvancing ? (
          <AILoader
            title="Saving Response"
            stage="Loading next anchor question..."
          />
        ) : (
          <div ref={questionContainerRef} className="space-y-6">
            {/* Question Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-left">
              {activeQuestion && (
                <QuestionBlock
                  question={activeQuestion}
                  isAdaptiveFollowUp={isAdaptiveFollowUp}
                />
              )}
            </div>

            {/* Answer Input Area (Anti-paste + Direct continuous flow) */}
            <AnswerInput
              key={activeQuestion?.id || activeSession.currentQuestionIndex}
              onSubmit={handleAnswerSubmit}
              isSubmitting={isAdvancing || isFinishingInterview}
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
    </DarkGradientBg>
  );
};

export default InterviewRoomPage;
