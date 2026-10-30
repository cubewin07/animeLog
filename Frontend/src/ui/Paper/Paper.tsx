import React, { useState } from 'react';
import './Paper.css';

export interface PaperProps {
  children?: React.ReactNode;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  editable?: boolean;
  value?: string;
  placeholder?: string;
  onChange?: (val: string) => void;
  className?: string;
  isQuote?: boolean;
}

export const Paper: React.FC<PaperProps> = ({
  children,
  meta,
  footer,
  editable = false,
  value,
  placeholder = 'Write what stayed with you…',
  onChange,
  className = '',
  isQuote = false,
}) => {
  return (
    <article className={`lamplight-paper ${className}`}>
      <div className="lamplight-paper-rule" aria-hidden="true" />

      {meta && <div className="lamplight-paper-meta">{meta}</div>}

      {editable ? (
        <textarea
          className="lamplight-paper-textarea"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <div className={`lamplight-paper-content ${isQuote ? 'lamplight-paper-quote' : ''}`}>
          {children}
        </div>
      )}

      {footer && <footer className="lamplight-paper-footer">{footer}</footer>}
    </article>
  );
};
