import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { resumeService } from '../../services/resumeService';
import { 
  FileText, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Trash2 
} from 'lucide-react';
import { Folder } from '../reactbits/Folder';
import { LetterLoader } from '../ui/LetterLoader';
import { Button } from '../ui/Button';

export interface ResumeUploadStepProps {
  onNext: () => void;
}

export const ResumeUploadStep: React.FC<ResumeUploadStepProps> = ({ onNext }) => {
  const { setupDraft, updateSetupDraft } = useInterview();
  const [uploadState, setUploadState] = useState<'empty' | 'uploading' | 'processing' | 'completed'>(
    setupDraft.resumeParsed ? 'completed' : 'empty'
  );

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploadState('uploading');
      await new Promise((r) => setTimeout(r, 400));
      setUploadState('processing');
      const parsed = await resumeService.uploadAndParseResume(file);
      updateSetupDraft({
        resumeName: parsed.fileName,
        resumeFileSize: parsed.fileSize,
        resumeParsed: true,
      });
      setUploadState('completed');
    } catch {
      setUploadState('empty');
    }
  };

  const handleUseSample = async () => {
    setUploadState('processing');
    await resumeService.getSampleResume();
    updateSetupDraft({
      resumeName: 'Charan_Resume.pdf',
      resumeFileSize: '445 KB',
      resumeParsed: true,
    });
    setUploadState('completed');
  };

  const handleClear = () => {
    updateSetupDraft({
      resumeName: '',
      resumeFileSize: '',
      resumeParsed: false,
    });
    setUploadState('empty');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-0.5 block">Step 01</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Upload your resume
        </h2>
        <p className="text-xs text-foreground-muted mt-1">
          We'll extract your projects, metrics, and role experience to formulate interview probes.
        </p>
      </div>

      {uploadState === 'empty' && (
        <div className="space-y-4">
          <label
            htmlFor="resume-dropzone"
            className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border border-dashed border-border bg-surface/80 hover:bg-surface hover:border-primary/50 transition-all cursor-pointer group text-center shadow-xs"
          >
            {/* Interactive 3D Folder Graphic */}
            <div className="mb-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <Folder
                color="#635BFF"
                size={1.1}
                items={[
                  <div key="1" className="p-1 text-[9px] font-bold text-slate-900">
                    PM Experience
                  </div>,
                  <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">
                    +42% Growth
                  </div>,
                  <div key="3" className="p-1 text-[9px] font-bold text-purple-700">
                    Skills & Tech
                  </div>
                ]}
              />
            </div>

            <p className="text-xs font-semibold text-foreground-muted mb-3">
              Drag and drop your resume file here or
            </p>

            <span className="btn-metallic-primary text-xs py-2 px-4 mb-2 pointer-events-none shadow-sm">
              Browse files
            </span>

            <span className="text-[11px] text-foreground-subtle">
              PDF, DOCX up to 10MB
            </span>

            <input
              id="resume-dropzone"
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>

          {/* Quick Demo Pre-fill */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border text-xs">
            <span className="text-foreground-muted flex items-center gap-1.5 font-medium">
              <Sparkles size={14} className="text-primary" />
              <span>Test quickly without a file:</span>
            </span>
            <button
              type="button"
              onClick={handleUseSample}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Load Charan_Resume.pdf
            </button>
          </div>
        </div>
      )}

      {(uploadState === 'uploading' || uploadState === 'processing') && (
        <div className="p-12 rounded-2xl border border-border bg-surface/90 flex flex-col items-center justify-center text-center space-y-4">
          <LetterLoader text="Analyzing" />
          <p className="text-xs text-foreground-muted font-medium">
            Extracting career highlights, metrics, and domain leadership claims...
          </p>
        </div>
      )}

      {uploadState === 'completed' && (
        <div className="space-y-6">
          {/* Uploaded File Card with Interactive Folder */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {setupDraft.resumeName || 'Charan_Resume.pdf'}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">
                    <Check size={10} />
                  </div>
                </div>
                <span className="text-[11px] text-foreground-muted font-medium">
                  {setupDraft.resumeFileSize || '445 KB'} · Parsed successfully
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-foreground-subtle hover:text-rose-500 transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={onNext}
              size="md"
              rightIcon={<ArrowRight size={15} />}
            >
              Next: Job description
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
