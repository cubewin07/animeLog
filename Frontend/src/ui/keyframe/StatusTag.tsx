import React from 'react';
import { Bookmark, CheckCircle2, CirclePause, CircleSlash, Play } from 'lucide-react';
import './StatusTag.css';

const STATUS: Record<string, { label: string; tone: string; Icon: typeof Play }> = {
  WATCHING: { label: 'Watching', tone: 'active', Icon: Play },
  READING: { label: 'Reading', tone: 'active', Icon: Play },
  COMPLETED: { label: 'Completed', tone: 'completed', Icon: CheckCircle2 },
  PLAN_TO_WATCH: { label: 'Plan to watch', tone: 'plan', Icon: Bookmark },
  PLAN_TO_READ: { label: 'Plan to read', tone: 'plan', Icon: Bookmark },
  ON_HOLD: { label: 'On hold', tone: 'hold', Icon: CirclePause },
  DROPPED: { label: 'Dropped', tone: 'dropped', Icon: CircleSlash },
};

export const StatusTag: React.FC<{ status: string }> = ({ status }) => {
  const { label, tone, Icon } = STATUS[status] ?? STATUS.PLAN_TO_WATCH;
  return (
    <span className={`kf-status is-${tone}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
};

/** Gold is reserved for 9 and 10, so a top score always stands out. */
export const ScoreTag: React.FC<{ score?: number | null }> = ({ score }) =>
  score ? (
    <span className={`kf-score ${score >= 9 ? 'is-top' : ''}`} aria-label={`Rated ${score} out of 10`}>
      {score}
    </span>
  ) : null;
