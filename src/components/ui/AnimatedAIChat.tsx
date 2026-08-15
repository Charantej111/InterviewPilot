import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Command, Send, X, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AnimatedAIChatProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFileSelect?: (file: File) => void;
  attachedFile?: { name: string; size?: string } | null;
  onRemoveFile?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  quickPrompts?: string[];
  onSelectPrompt?: (prompt: string) => void;
}

export const AnimatedAIChat: React.FC<AnimatedAIChatProps> = ({
  value,
  onChange,
  onSubmit,
  onFileSelect,
  attachedFile,
  onRemoveFile,
  placeholder = 'Ask zap a question...',
  isLoading = false,
  className,
  quickPrompts,
  onSelectPrompt,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || attachedFile) && !isLoading) {
        onSubmit();
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsCommandMenuOpen((prev) => !prev);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className={cn('border-beam-card transition-all duration-300 group', className)}>
      {/* Crisp Luxury Inner Capsule */}
      <div
        className={cn(
          'relative rounded-[19px] z-10 transition-all duration-300 bg-[#100f18] dark:bg-[#0a0910] text-left overflow-hidden',
          isFocused && 'bg-[#13121d] dark:bg-[#0c0b14]'
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
          <div className="p-3.5 pb-0 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 text-zinc-200 text-xs font-semibold border border-zinc-700/60 shadow-xs">
              <FileText size={14} className="text-zinc-400" />
              <span className="truncate max-w-[240px]">{attachedFile.name}</span>
              {attachedFile.size && (
                <span className="text-[10px] text-zinc-500 font-normal">
                  ({attachedFile.size})
                </span>
              )}
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="p-0.5 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white ml-1 cursor-pointer"
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Textarea Area */}
        <div className="p-4 sm:p-5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-transparent border-0 outline-none resize-none text-zinc-100 placeholder:text-zinc-500 text-sm sm:text-[14.5px] leading-relaxed max-h-[220px] overflow-y-auto"
          />
        </div>

        {/* Command Menu Drawer */}
        {isCommandMenuOpen && quickPrompts && quickPrompts.length > 0 && (
          <div className="mx-4 mb-3 p-2 rounded-xl bg-zinc-900/95 border border-zinc-800/90 space-y-1 animate-fadeIn">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles size={11} /> Quick Prompts (⌘K)
            </div>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectPrompt?.(prompt);
                  setIsCommandMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-between"
              >
                <span className="truncate">{prompt}</span>
                <span className="text-[10px] text-zinc-500 font-mono">↵</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="px-4 py-3 border-t border-zinc-800/70 bg-zinc-950/40 flex items-center justify-between">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Paperclip Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/50 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Attach File (PDF, DOCX)"
            >
              <Paperclip size={15} />
            </button>

            {/* Command Button */}
            <button
              type="button"
              onClick={() => setIsCommandMenuOpen((prev) => !prev)}
              className={cn(
                'w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer',
                isCommandMenuOpen
                  ? 'bg-zinc-700 text-white border-zinc-500'
                  : 'bg-zinc-800/60 hover:bg-zinc-700/80 border-zinc-700/50 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100'
              )}
              title="Command Menu (⌘K)"
            >
              <Command size={14} />
            </button>
          </div>

          {/* Right Send Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={(!value.trim() && !attachedFile) || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 hover:border-zinc-500 font-medium text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Send (Enter)"
          >
            <Send size={13} className="text-zinc-300" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedAIChat;
