import React, { useState, useEffect } from 'react';
import { X, Clock, Sparkles, CheckCircle2, Send } from 'lucide-react';
import { Button } from '../ui/Button';

export interface MicroDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  drillTitle: string;
  drillTask: string;
}

export const MicroDrillModal: React.FC<MicroDrillModalProps> = ({
  isOpen,
  onClose,
  drillTitle,
  drillTask,
}) => {
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(120);
      setResponse('');
      setEvaluation(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const handleSubmit = () => {
    if (response.trim().length < 10) return;
    setIsEvaluating(true);
    setTimeout(() => {
      setEvaluation({
        score: 8.8,
        feedback:
          'Sharp execution. You addressed the core tradeoff directly, supported your reasoning with concrete metric criteria, and stayed well within the time constraint.',
        strengths: [
          'High density of decision criteria per sentence',
          'Avoided passive disclaimers',
          'Addressed potential failure modes',
        ],
      });
      setIsEvaluating(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn text-left">
      <div className="max-w-xl w-full rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl p-6 sm:p-8 space-y-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header with Timer */}
        <div className="flex items-center justify-between pr-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles size={11} />
              <span>2-Minute Targeted Micro-Drill</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{drillTitle}</h2>
          </div>

          <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
            timeLeft < 30 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-zinc-800 text-zinc-300'
          }`}>
            <Clock size={13} />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Drill Task Description */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Drill Objective</span>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">{drillTask}</p>
        </div>

        {/* EVALUATION VIEW */}
        {evaluation ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Drill Calibration Score</span>
              <span className="text-xl font-black text-white font-mono">{evaluation.score} / 10</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">{evaluation.feedback}</p>
            <div className="space-y-1 pt-2 border-t border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Key Highlights:</span>
              <ul className="space-y-1 text-xs text-zinc-300">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={onClose} className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs">
                Complete Drill
              </Button>
            </div>
          </div>
        ) : (
          /* DRILL INPUT */
          <div className="space-y-4">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your concise, punchy response here..."
              rows={5}
              className="w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs leading-relaxed outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Focus on precision and actionable decision points.</span>
              <Button
                size="md"
                onClick={handleSubmit}
                isLoading={isEvaluating}
                disabled={response.trim().length < 10}
                rightIcon={<Send size={14} />}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Submit Drill
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroDrillModal;
