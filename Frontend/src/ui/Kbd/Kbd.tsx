import React from 'react';
import './Kbd.css';

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', title }) => {
  return (
    <kbd className={`lamplight-kbd ${className}`} title={title}>
      {children}
    </kbd>
  );
};

