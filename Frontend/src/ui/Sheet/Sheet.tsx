import React, { useId, useRef } from 'react';
import { useDialog } from './useDialog';
import { X } from 'lucide-react';
import './Sheet.css';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(sheetRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="lamplight-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        ref={sheetRef} className={`lamplight-sheet ${className}`}
      >
        {title && (
          <header className="lamplight-sheet-header">
            <h3 id={titleId} className="lamplight-sheet-title">{title}</h3>
            <button
              type="button"
              className="lamplight-sheet-close"
              onClick={onClose}
              aria-label="Close sheet"
            >
              <X size={16} />
            </button>
          </header>
        )}
        <div className="lamplight-sheet-body">{children}</div>
        {footer && <footer className="lamplight-sheet-footer">{footer}</footer>}
      </div>
    </div>
  );
};

