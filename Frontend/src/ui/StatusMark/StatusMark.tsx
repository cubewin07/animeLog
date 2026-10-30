import React from 'react';
import { AnimeStatus, BookStatus } from '../../types';
import { getStatusMeta } from '../../lib/status';
import './StatusMark.css';

export interface StatusMarkProps {
  status: AnimeStatus | BookStatus | string | null | undefined;
  showLabel?: boolean;
  className?: string;
}

export const StatusMark: React.FC<StatusMarkProps> = ({
  status,
  showLabel = true,
  className = '',
}) => {
  const meta = getStatusMeta(status);

  return (
    <span className={`lamplight-status-mark ${className}`} title={meta.label}>
      <span
        className="lamplight-status-dot"
        style={{ backgroundColor: meta.dotColor }}
        aria-hidden="true"
      />
      {showLabel && <span className="lamplight-status-label">{meta.label}</span>}
    </span>
  );
};
