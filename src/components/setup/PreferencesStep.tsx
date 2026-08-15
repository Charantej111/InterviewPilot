import React from 'react';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/Button';
import { ArrowRight, ArrowLeft, Volume2, ShieldCheck, Video } from 'lucide-react';

export interface PreferencesStepProps {
  onBack: () => void;
  onNext: () => void;
}

export const PreferencesStep: React.FC<PreferencesStepProps> = ({ onBack, onNext }) => {
  const { preferences, updatePreferences } = useUser();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-xl font-bold text-foreground">Interview Preferences</h3>
        <p className="text-xs text-foreground-muted mt-1">
          Customize interviewer behavior, evaluation strictness, and feedback tone.
        </p>
      </div>

      <div className="space-y-4">
        {/* Strict Evaluation Toggle */}
        <div className="p-4 rounded-xl bg-surface border border-border flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Hiring Bar Calibration (Strict Mode)
              </h4>
              <p className="text-xs text-foreground-muted mt-0.5">
                Evaluates your answers against Senior/Staff hiring bar rubrics with no curve or lenient scoring.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.strictEvaluation}
            onClick={() => updatePreferences({ strictEvaluation: !preferences.strictEvaluation })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              preferences.strictEvaluation ? 'bg-primary' : 'bg-surface-subtle border border-border'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                preferences.strictEvaluation ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio / Voice Assistance Toggle */}
        <div className="p-4 rounded-xl bg-surface border border-border flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Audio Prompts & Spoken Questions
              </h4>
              <p className="text-xs text-foreground-muted mt-0.5">
                The AI interviewer will vocalize questions and counter-prompts to simulate a live conversational call.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.audioFeedbackEnabled}
            onClick={() => updatePreferences({ audioFeedbackEnabled: !preferences.audioFeedbackEnabled })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              preferences.audioFeedbackEnabled ? 'bg-primary' : 'bg-surface-subtle border border-border'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                preferences.audioFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Camera Simulation Toggle */}
        <div className="p-4 rounded-xl bg-surface border border-border flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Simulate Video Room Ambience
              </h4>
              <p className="text-xs text-foreground-muted mt-0.5">
                Displays webcam preview overlay to help you practice eye contact and posture while speaking.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.cameraSimulated}
            onClick={() => updatePreferences({ cameraSimulated: !preferences.cameraSimulated })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              preferences.cameraSimulated ? 'bg-primary' : 'bg-surface-subtle border border-border'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                preferences.cameraSimulated ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back
        </Button>
        <Button onClick={onNext} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
          Next: Review & Ready
        </Button>
      </div>
    </div>
  );
};
