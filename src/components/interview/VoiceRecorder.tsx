import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { RotateCcw, Volume2, Mic, MicOff, AudioWaveform, Keyboard } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { VoiceStatus, InterviewEngineState } from '../../types/interview';
import './VoiceWave.css';

export interface VoiceRecorderProps {
  voiceStatus: VoiceStatus;
  engineState: InterviewEngineState;
  transcript: string;
  interviewerSpokenText?: string;
  isInterrupted?: boolean;
  onToggleRecording: () => void;
  onResetRecording: () => void;
  onInterrupt?: () => void;
  onSwitchToTextMode?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  voiceStatus,
  engineState,
  transcript,
  interviewerSpokenText,
  isInterrupted,
  onToggleRecording,
  onResetRecording,
  onInterrupt,
  onSwitchToTextMode,
}) => {
  const [recordSeconds, setRecordSeconds] = useState(0);

  const isListening = voiceStatus === 'listening' || engineState === 'listening';
  const isAISpeaking = voiceStatus === 'speaking' || engineState === 'asking';
  const isProcessing = voiceStatus === 'processing' || engineState === 'processing';
  const isConnecting = voiceStatus === 'connecting';
  const isError = voiceStatus === 'error';

  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const estimatedWPM = recordSeconds > 5 ? Math.round((wordCount / recordSeconds) * 60) : 0;

  const getStatusDisplay = () => {
    if (isConnecting) return { label: 'Connecting to Gemini Live...', color: 'bg-amber-500' };
    if (isAISpeaking) return { label: 'AI Interviewer Speaking...', color: 'bg-blue-500 animate-pulse' };
    if (isListening) return { label: 'Listening to Candidate...', color: 'bg-emerald-500 animate-ping' };
    if (isProcessing) return { label: 'Processing Response...', color: 'bg-purple-500' };
    if (engineState === 'follow_up') return { label: 'Preparing Adaptive Follow-up...', color: 'bg-indigo-500' };
    if (isError) return { label: 'Connection Error', color: 'bg-rose-500' };
    return { label: 'Microphone Standby', color: 'bg-zinc-400' };
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-md text-center">
      {/* Top Audio Telemetry Strip */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color}`} />
          <span className="font-semibold text-foreground">
            {statusInfo.label}
          </span>
          {isListening && <ShiningText text="Live" className="text-[10px]" />}
        </div>

        <div className="flex items-center gap-3 font-mono">
          {isListening && estimatedWPM > 0 && (
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              {estimatedWPM} wpm · Active
            </span>
          )}
          <span className="font-bold text-foreground text-sm">{formatTime(recordSeconds)}</span>
        </div>
      </div>

      {/* AI Spoken Remark Box (when AI is speaking) */}
      {isAISpeaking && interviewerSpokenText && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-left text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed animate-fadeIn">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
            Interviewer (Speaking Aloud)
          </span>
          "{interviewerSpokenText}"
        </div>
      )}

      {/* Central Interactive Voice Wave Capsule */}
      <div className="py-2 flex flex-col items-center justify-center space-y-3">
        <div 
          onClick={isAISpeaking ? onInterrupt : onToggleRecording}
          className="voice-wave-wrapper relative mx-auto cursor-pointer"
        >
          {/* Gradient glow background */}
          <div className="voice-glow">
            <div className="glow-ellipse" />
            <div className="glow-polygon" />
          </div>

          {/* Audio wave bars */}
          <div className="audio-wave">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`bar ${isListening || isAISpeaking ? 'active' : ''}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-foreground-muted">
          {isAISpeaking
            ? 'AI is speaking... (Click wave or start speaking to Interrupt / Barge-in)'
            : isListening
            ? 'Listening to speech... Click card to finish answer'
            : 'Click wave or microphone button to speak'}
        </p>

        {isInterrupted && (
          <span className="text-[11px] font-bold text-amber-500 animate-fadeIn">
            Barge-in detected: AI audio halted for candidate.
          </span>
        )}
      </div>

      {/* Live Speech-to-Text Transcript Display */}
      <div className="text-left p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <AudioWaveform size={13} className="text-zinc-400" />
            Live Candidate Transcript
          </span>
          {wordCount > 0 && (
            <span className="text-[11px] text-zinc-400 font-mono">
              {wordCount} words
            </span>
          )}
        </div>

        <div className="min-h-[80px] max-h-[160px] overflow-y-auto pr-1 text-sm text-foreground leading-relaxed font-normal">
          {transcript ? (
            <p className="whitespace-pre-wrap">
              {transcript}
              {isListening && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-zinc-900 dark:bg-white animate-pulse" />
              )}
            </p>
          ) : (
            <p className="text-zinc-400 dark:text-zinc-500 italic text-xs">
              {isListening
                ? 'Speak clearly into your microphone; live speech will transcribe here in real-time...'
                : 'Microphone is active. Begin speaking to answer.'}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        {onSwitchToTextMode && (
          <button
            type="button"
            onClick={onSwitchToTextMode}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <Keyboard size={13} />
            <span>Switch to Text Mode</span>
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {isAISpeaking && onInterrupt && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onInterrupt}
              leftIcon={<Volume2 size={14} />}
            >
              Interrupt AI
            </Button>
          )}

          {transcript && !isListening && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onResetRecording}
              leftIcon={<RotateCcw size={14} />}
            >
              Clear
            </Button>
          )}

          <Button
            size="sm"
            onClick={onToggleRecording}
            variant={isListening ? 'danger' : 'primary'}
            leftIcon={isListening ? <MicOff size={14} /> : <Mic size={14} />}
          >
            {isListening ? 'Finish Speaking' : 'Start Speaking'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
