import React, { useState } from 'react';
import { Mic, ArrowRight, Check, Keyboard, Sparkles } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { Button } from '../ui/Button';

export interface AnswerInputProps {
  onSubmit: (answerText: string, inputMode: 'text' | 'voice', durationSecs: number) => void;
  isSubmitting?: boolean;
  questionSampleAnswer?: string;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [textAnswer, setTextAnswer] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const currentContent = inputMode === 'text' ? textAnswer : voiceTranscript;
  const charCount = currentContent.length;

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      const simulated = "In my previous role, we discovered a 42% drop-off rate during onboarding. I interviewed 18 users and rebuilt the verification flow with auto-crop, which reduced drop-off by 19% and recovered $1.2M in annual recurring revenue.";
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < simulated.length) {
          setVoiceTranscript(simulated.slice(0, idx + 8));
          idx += 8;
        } else {
          clearInterval(interval);
        }
      }, 100);
    } else {
      setIsRecording(false);
    }
  };

  const handleInsertVerbalSample = () => {
    setVoiceTranscript(
      "In my previous role, we noticed a 42% abandonment rate in the user onboarding funnel. I ran 18 user interviews, identified lighting glare on document uploads as the root cause, and led a 3-week sprint to add auto-edge detection. This reduced verification failure by 19% and increased monthly activations by 12%."
    );
  };

  const handleSubmit = () => {
    if (!currentContent.trim()) return;
    if (!showFollowUp) {
      setShowFollowUp(true);
    } else {
      onSubmit(currentContent, inputMode, 90);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Type / Voice Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              inputMode === 'text'
                ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Keyboard size={13} />
            <span>Type Answer</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('voice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              inputMode === 'voice'
                ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Mic size={13} />
            <span>Live Voice Mode</span>
          </button>
        </div>

        {inputMode === 'text' && !textAnswer && (
          <button
            type="button"
            onClick={() =>
              setTextAnswer(
                'In my previous role, we noticed a 42% abandonment rate in the user onboarding funnel. I ran 18 user interviews, identified lighting glare on document uploads as the root cause, and led a 3-week sprint to add auto-edge detection. This reduced verification failure by 19% and increased monthly activations by 12%.'
              )
            }
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors cursor-pointer"
          >
            <Sparkles size={12} />
            <span>Insert sample answer</span>
          </button>
        )}
      </div>

      {/* Input Box Area */}
      {inputMode === 'text' ? (
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#11111a]/95 p-5 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all shadow-lg">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your response here using the STAR framework (Situation, Task, Action, Result)..."
            rows={5}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-zinc-400 resize-none focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-400">
            <span className="text-[11px] font-medium hidden sm:inline">
              Tips: State quantitative metrics · Explain trade-offs · Articulate your exact role
            </span>

            <div className="flex items-center gap-3 ml-auto">
              <span className="font-mono text-[11px]">{charCount} / 3000</span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!textAnswer.trim() || isSubmitting}
                rightIcon={<ArrowRight size={14} />}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <VoiceRecorder
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            onResetRecording={() => setVoiceTranscript('')}
            transcript={voiceTranscript}
            onInsertSample={handleInsertVerbalSample}
          />

          {voiceTranscript.trim().length > 0 && !isRecording && (
            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                rightIcon={<ArrowRight size={16} />}
                className="px-6"
              >
                Submit Verbal Response
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Real-Time Adaptive Follow-up Box */}
      {showFollowUp && (
        <div className="p-5 rounded-2xl bg-zinc-900 dark:bg-zinc-800/90 border border-zinc-700 text-white space-y-3 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Check size={15} />
              <span>Good initial framing. The interviewer is probing deeper:</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Adaptive Follow-up Question
            </span>
            <p className="text-sm font-semibold text-white leading-relaxed">
              "You mentioned conversion recovered by 19%. How did you ensure this change didn't increase false positive fraud rates down the line?"
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              size="md"
              onClick={() => onSubmit(currentContent, inputMode, 90)}
              rightIcon={<ArrowRight size={15} />}
            >
              Continue to Instant Evaluation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerInput;
