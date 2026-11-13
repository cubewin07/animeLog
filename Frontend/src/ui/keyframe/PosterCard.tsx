import React from 'react';
import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { CoverArt } from './CoverArt';
import { ScoreTag, StatusTag } from './StatusTag';
import './PosterCard.css';

export interface PosterCardProps {
  to: string;
  title: string;
  imageUrl?: string | null;
  status: string;
  score?: number | null;
  meta: string;
  progress?: { current: number; total: number | null };
  latestNote?: string | null;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  to,
  title,
  imageUrl,
  status,
  score,
  meta,
  progress,
  latestNote,
}) => {
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(title, imageUrl);
  const percent = progress?.total ? Math.min(100, (progress.current / progress.total) * 100) : 0;

  return (
    <Link to={to} className="kf-poster" style={{ '--title-accent': accent } as React.CSSProperties}>
      <div className="kf-poster-art">
        <CoverArt
          title={title}
          imageUrl={imageUrl}
          accent={accent}
          onImageReady={onImageReady}
          onCorsBlocked={onCorsBlocked}
        />
        <div className="kf-poster-score"><ScoreTag score={score} /></div>
        {!latestNote && (
          <span className="kf-poster-pencil" title="No note yet">
            <PenLine size={14} aria-label="No note yet" />
          </span>
        )}
        {latestNote && <p className="kf-poster-note">{latestNote}</p>}
      </div>
      <div className={`kf-poster-bar ${progress?.total ? '' : 'is-empty'}`} aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <h3 className="kf-poster-title">{title}</h3>
      <div className="kf-poster-meta">
        <StatusTag status={status} />
        <span>{meta}</span>
      </div>
    </Link>
  );
};
