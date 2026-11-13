import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { KfButton } from '../ui/keyframe';
import { useDialog } from '../ui/Sheet/useDialog';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useDialog(overlayRef, isOpen, onCancel);

  // Start on the safe choice
  useEffect(() => {
    if (isOpen) cancelBtnRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="modal-container kf-confirm-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kf-confirm-head">
          {isDestructive && (
            <div className="kf-confirm-icon" aria-hidden="true">
              <AlertTriangle size={20} />
            </div>
          )}

          <div className="kf-confirm-copy">
            <h3 id="confirm-dialog-title" className="kf-confirm-title">
              {title}
            </h3>
            <p className="kf-confirm-message">{message}</p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="kf-confirm-close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="kf-confirm-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="kf-btn is-secondary is-md"
          >
            {cancelLabel}
          </button>

          <KfButton
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </KfButton>
        </div>
      </div>
    </div>
  );
};
