import React, { useState, useEffect } from 'react';
import { Question } from '../../types/interview';
import { Volume2, VolumeX, Sparkles, Clock, Target, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ttsService } from '../../services/voice/ttsService';

export interface QuestionBlockProps {
  question: Question;
  isAdaptiveFollowUp?: boolean;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({
  question,
  isAdaptiveFollowUp = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    // Stop audio if question changes
    ttsService.stop();
    setIsPlayingAudio(false);
  }, [question?.id]);

  const toggleSpeechPlayback = () => {
    if (isPlayingAudio) {
      ttsService.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      ttsService.speak(question.text, {
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const categoryLabel = question.category || question.targetCompetency || 'Problem Solving & Strategy';
  const durationSecs = question.recommendedDurationSeconds || 180;
  const durationMins = Math.ceil(durationSecs / 60);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Meta Bar: Category, Adaptive Tag, Duration & Audio Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Interviewer identity */}
          <div className="flex items-center gap-2">
            <Avatar name="AI" size="xs" isAI={true} isLive={true} />
            <span className="text-xs font-bold text-foreground">AI Interviewer</span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700">•</span>

          {/* Category Chip */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
            <Target size={12} className="text-primary shrink-0" />
            <span>{categoryLabel}</span>
          </div>

          {/* Adaptive Follow-up Tag */}
          {isAdaptiveFollowUp && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-[11px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Sparkles size={11} />
              <span>Adaptive Deep-Dive</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Duration Hint */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-foreground-muted">
            <Clock size={12} />
            <span>~{durationMins} min answer</span>
          </div>

          {/* Natural Voice Audio Button */}
          <button
            type="button"
            onClick={toggleSpeechPlayback}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
            }`}
            title={isPlayingAudio ? 'Stop speech audio' : 'Listen to question read aloud'}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX size={13} className="animate-pulse" />
                <span>Stop</span>
                <span className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <>
                <Volume2 size={13} />
                <span>Listen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Question Text with Generous Leading & Readability */}
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-relaxed">
          {question.text}
        </h1>

        {question.contextExplanation && (
          <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed font-normal pt-1 border-l-2 border-primary/40 pl-3">
            {question.contextExplanation}
          </p>
        )}
      </div>

      {/* Subtle STAR Rubric Directives Hint */}
      <div className="pt-2 flex items-center gap-2 text-[11px] text-foreground-muted font-medium">
        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
        <span>STAR Rubric active · Provide clear baseline context, specific actions, and quantified impact.</span>
      </div>
    </div>
  );
};

export default QuestionBlock;
