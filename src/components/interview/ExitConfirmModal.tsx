import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';

export interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exit interview session?"
      maxWidth="sm"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Your answered questions will be saved in your draft history, but your ongoing session loop will pause.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Stay in session
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirmExit}>
            Exit to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
};
