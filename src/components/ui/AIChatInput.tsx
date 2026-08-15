import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, ArrowUp, Mic, X, FileText, Sparkles, CornerDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AIVoiceInput } from './AIVoiceInput';

export interface AIChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFileSelect?: (file: File) => void;
  attachedFile?: { name: string; size?: string } | null;
  onRemoveFile?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

export const AIChatInput: React.FC<AIChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFileSelect,
  attachedFile,
  onRemoveFile,
  placeholder = 'Paste job description, target role, or ask interview questions...',
  isLoading = false,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || attachedFile) && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
    const sampleSpokenText = "Seeking a Senior Product Manager to lead platform infrastructure and distributed payment flows.";
    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < sampleSpokenText.length) {
        onChange(sampleSpokenText.slice(0, charIdx + 6));
        charIdx += 6;
      } else {
        clearInterval(interval);
      }
    }, 100);
  };

  const handleVoiceStop = () => {
    setIsRecording(false);
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border transition-all duration-200 bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-2xl shadow-sm text-left',
        isFocused
          ? 'border-zinc-400 dark:border-zinc-600 ring-2 ring-zinc-400/20 dark:ring-white/10'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
        className
      )}
    >
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />

      {/* Attached File Chip */}
      {attachedFile && (
        <div className="p-3 pb-0 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <FileText size={14} className="text-zinc-500" />
            <span className="truncate max-w-[240px]">{attachedFile.name}</span>
            {attachedFile.size && (
              <span className="text-[10px] text-zinc-400 font-normal">
                ({attachedFile.size})
              </span>
            )}
            {onRemoveFile && (
              <button
                type="button"
                onClick={onRemoveFile}
                className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 ml-1 cursor-pointer"
                title="Remove file"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Multi-line Auto-Expanding Textarea or Active Voice Stream */}
      <div className="p-3 sm:p-4">
        {isRecording ? (
          <div className="py-2 flex items-center justify-between">
            <AIVoiceInput
              isRecording={isRecording}
              onStart={handleVoiceStart}
              onStop={handleVoiceStop}
              visualizerBars={28}
              demoMode
              className="w-full justify-between"
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-transparent border-0 outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm leading-relaxed max-h-[180px] overflow-y-auto"
          />
        )}
      </div>

      {/* Action Toolbar Footer */}
      <div className="px-3 py-2.5 sm:px-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
            title="Attach Resume or JD (PDF/DOCX)"
          >
            <Paperclip size={16} />
          </button>

          {/* Voice Mode Toggle (Kokonut Voice) */}
          <button
            type="button"
            onClick={handleVoiceStart}
            className={cn(
              'p-2 rounded-xl transition-colors cursor-pointer',
              isRecording
                ? 'text-red-500 bg-red-500/10'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
            )}
            title="Voice input mode (Kokonut Voice)"
          >
            <Mic size={16} />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 pl-1 font-medium">
            <Sparkles size={12} className="text-zinc-400" />
            <span>AI Calibration Engine</span>
          </span>
        </div>

        {/* Right: Enter Key Hint & Send Button */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">
              <CornerDownLeft size={10} className="inline" />
            </kbd>
          </span>

          <button
            type="button"
            onClick={onSubmit}
            disabled={(!value.trim() && !attachedFile) || isLoading}
            className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Send (Enter)"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatInput;
