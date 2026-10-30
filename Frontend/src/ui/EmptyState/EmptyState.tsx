import React from 'react';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`lamplight-empty-state ${className}`}>
      {icon && <div className="lamplight-empty-icon">{icon}</div>}
      <h4 className="lamplight-empty-title">{title}</h4>
      {description && <p className="lamplight-empty-desc">{description}</p>}
      {action && <div className="lamplight-empty-action">{action}</div>}
    </div>
  );
};
