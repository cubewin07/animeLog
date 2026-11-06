import React from 'react';
import './KfButton.css';

export interface KfButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
}

export const KfButton: React.FC<KfButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button type={type} className={`kf-btn is-${variant} is-${size} ${className}`} {...rest}>
    {icon}
    {children}
  </button>
);
