import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { DarkGradientBg } from '../components/ui/DarkGradientBg';
import { InterviewHeader } from '../components/interview/InterviewHeader';
import { QuestionBlock } from '../components/interview/QuestionBlock';
import { AnswerInput } from '../components/interview/AnswerInput';
import { ThinkingState } from '../components/interview/ThinkingState';
import { ExitConfirmModal } from '../components/interview/ExitConfirmModal';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeSession,
    activeQuestion,
    submitCandidateAnswer,
    isEvaluating,
    isPreparingNextQuestion,
  } = useInterview();

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const currentQuestionNum = activeSession.currentQuestionIndex + 1;
  const totalQuestions = activeSession.questions.length;
  const isAdaptiveFollowUp = activeQuestion.type === 'follow_up';

  const handleAnswerSubmit = async (
    answerText: string,
    inputMode: 'text' | 'voice',
    durationSecs: number
  ) => {
    try {
      await submitCandidateAnswer(answerText, inputMode, durationSecs);
      navigate(`/interview/${id || activeSession.id}/feedback`);
    } catch {
      // Error handling
    }
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    navigate('/dashboard');
  };

  return (
    <DarkGradientBg className="flex flex-col text-foreground">
      {/* Top Room Header Bar */}
      <InterviewHeader
        currentQuestion={currentQuestionNum}
        totalQuestions={totalQuestions}
        company={activeSession.company}
        role={activeSession.jobTitle}
        onExitClick={() => setIsExitModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col justify-center relative z-10">
        {isEvaluating || isPreparingNextQuestion ? (
          <ThinkingState
            label={isEvaluating ? 'Evaluating your response...' : 'Preparing your next question...'}
            sublabel={
              isEvaluating
                ? 'Synthesizing scores across relevance, clarity, evidence, and STAR frameworks'
                : 'Formulating adaptive follow-up based on your previous answer'
            }
          />
        ) : (
          <div className="space-y-8">
            {/* Question Glass Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/85 dark:bg-[#12121e]/90 backdrop-blur-2xl border border-zinc-800 dark:border-white/10 shadow-2xl">
              <QuestionBlock
                question={activeQuestion}
                isAdaptiveFollowUp={isAdaptiveFollowUp}
              />
            </div>

            {/* Answer Input Area */}
            <AnswerInput
              onSubmit={handleAnswerSubmit}
              isSubmitting={isEvaluating}
              questionSampleAnswer={activeQuestion.sampleAnswer}
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
