import React, { useState } from 'react';
import { getClothTone } from '../../lib/hash';
import { BookOpen, Clapperboard, Film } from 'lucide-react';
import './Cover.css';

export type CoverVariant = 'poster' | 'book' | 'portrait';

export interface CoverProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  variant?: CoverVariant;
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  showTitle?: boolean;
}

export const Cover: React.FC<CoverProps> = ({
  title,
  subtitle,
  imageUrl,
  variant = 'poster',
  className = '',
  alt = '',
  loading = 'lazy',
  showTitle = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const tone = getClothTone(title);

  const hasValidImage = imageUrl && !imageError;

  return (
    <div
      className={`lamplight-cover is-${variant} ${className}`}
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
      }}
      aria-label={alt || title}
    >
      {hasValidImage ? (
        <img
          src={imageUrl}
          alt={alt || title}
          loading={loading}
          decoding="async"
          className={`lamplight-cover-img ${imageLoaded ? 'is-loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : variant === 'portrait' ? (
        <div className="lamplight-cover-monogram">
          {title ? title.trim().charAt(0).toUpperCase() : '?'}
        </div>
      ) : (
        <div className="lamplight-cover-generated">
          <div className="lamplight-cover-frame" />
          <div className="lamplight-cover-top">
            <span className="lamplight-cover-format">
              {variant === 'book' ? 'Vol.' : 'Edition'}
            </span>
            {variant === 'book' ? (
              <BookOpen size={14} style={{ opacity: 0.6 }} />
            ) : (
              <Film size={14} style={{ opacity: 0.6 }} />
            )}
          </div>
          {showTitle && (
            <div className="lamplight-cover-body">
              <h4 className="lamplight-cover-title">{title}</h4>
              {subtitle && <span className="lamplight-cover-sub">{subtitle}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
