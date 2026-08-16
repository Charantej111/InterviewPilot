import React, { useState } from 'react';
import { Mic, ArrowRight, Keyboard, AlertCircle } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { Button } from '../ui/Button';

export interface AnswerInputProps {
  onSubmit: (answerText: string, inputMode: 'text' | 'voice', durationSecs: number) => void;
  isSubmitting?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [textAnswer, setTextAnswer] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pasteBlocked, setPasteBlocked] = useState(false);

  const currentContent = inputMode === 'text' ? textAnswer : voiceTranscript;
  const charCount = currentContent.length;

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setPasteBlocked(true);
    setTimeout(() => setPasteBlocked(false), 3500);
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      const simulated = "In my previous role, we identified a 42% friction drop-off. I interviewed 18 users and redesigned the verification architecture with auto-edge detection, reducing verification failure by 19% and increasing monthly activations by 12%.";
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

  const handleSubmit = () => {
    if (!currentContent.trim() || isSubmitting) return;
    onSubmit(currentContent, inputMode, 90);
  };

  return (
    <div className="space-y-3 text-left">
      {/* Mode Switcher Bar */}
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

        {/* Paste Blocked Alert */}
        {pasteBlocked && (
          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 animate-fadeIn">
            <AlertCircle size={12} />
            Pasting is disabled for live simulation integrity
          </span>
        )}
      </div>

      {/* Input Box Area */}
      {inputMode === 'text' ? (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all shadow-md">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            onPaste={handlePaste}
            placeholder="Type your structured answer here using the STAR framework (Situation, Task, Action, Result)..."
            rows={5}
            className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-zinc-400 resize-none focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
            <span className="text-[11px] font-medium hidden sm:inline text-foreground-muted">
              State baseline metrics · Explain trade-offs · Clarify personal ownership
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
          />

          {voiceTranscript.trim().length > 0 && !isRecording && (
            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                rightIcon={<ArrowRight size={16} />}
                className="px-6 shadow-sm"
              >
                Submit Verbal Response
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswerInput;
