import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

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

  useEffect(() => {
    if (!isOpen) return;

    // Focus the safe cancel button on mount
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {isDestructive && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-dim)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="confirm-dialog-title"
              style={{
                fontSize: 18,
                color: 'var(--text-desk)',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-desk-muted)',
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="btn-icon"
            style={{
              border: 'none',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            paddingTop: 8,
          }}
        >
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ padding: '7px 16px', fontSize: 14 }}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={isDestructive ? 'btn btn-danger' : 'btn btn-primary'}
            style={{
              padding: '7px 16px',
              fontSize: 14,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
