import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../../context/InterviewContext';
import { AnimatedAIChat } from '../ui/AnimatedAIChat';

const QUICK_PROMPTS = [
  'Senior Product Manager · Stripe (Payments Platform)',
  'Fullstack Software Engineer · Vercel (Next.js & Edge)',
  'Staff Systems Architect · OpenAI (Distributed LLMs)',
  'Data Analytics Lead · Airbnb (Search & Ranking)',
];

const ANIMATED_PLACEHOLDERS = [
  'Paste target role (e.g. Senior PM at Stripe) or drop resume...',
  'Fullstack Software Engineer · Vercel (Next.js & Edge)...',
  'Senior Product Manager · Stripe (Payments Platform)...',
  'Staff Systems Architect · OpenAI (Distributed LLMs)...',
  'Data Analytics Lead · Airbnb (Search & Ranking)...',
  'Attach your resume PDF to synthesize tailored probes...',
];

export const HeroChatbox: React.FC = () => {
  const navigate = useNavigate();
  const { updateSetupDraft } = useInterview();
  const [promptText, setPromptText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size?: string } | null>(null);

  const handleFileProcess = (file: File) => {
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setAttachedFile({ name: file.name, size: sizeStr });
    updateSetupDraft({
      resumeName: file.name,
      resumeFileSize: sizeStr,
      resumeParsed: true,
    });
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    updateSetupDraft({
      resumeName: '',
      resumeFileSize: '',
      resumeParsed: false,
    });
  };

  const handleSubmit = () => {
    if (promptText.trim()) {
      updateSetupDraft({ jobTitle: promptText.trim() });
    }
    navigate('/setup');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-6">
      <AnimatedAIChat
        value={promptText}
        onChange={setPromptText}
        onSubmit={handleSubmit}
        onFileSelect={handleFileProcess}
        attachedFile={attachedFile}
        onRemoveFile={handleRemoveFile}
        placeholder="Paste target role, job description, or attach resume..."
        animatedPlaceholders={ANIMATED_PLACEHOLDERS}
        quickPrompts={QUICK_PROMPTS}
        onSelectPrompt={(selected) => setPromptText(selected)}
      />
    </div>
  );
};

export default HeroChatbox;
