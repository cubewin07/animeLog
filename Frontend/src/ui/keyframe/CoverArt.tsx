import React, { useState } from 'react';
import { isCorsBlocked, markCorsBlocked } from '../../lib/color/accentCache';
import { cloudinaryThumbUrl, type CoverSize } from '../../lib/images/cloudinary';
import './CoverArt.css';

export interface CoverArtProps {
  title: string;
  imageUrl?: string | null;
  accent?: string;
  variant?: 'poster' | 'portrait';
  size?: CoverSize;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low';
  /** Fires with the loaded image so a caller can read its color. */
  onImageReady?: (image: HTMLImageElement, resolvedUrl?: string) => void;
  /** Fires when the image host blocks CORS pixel access. */
  onCorsBlocked?: (resolvedUrl?: string) => void;
}

interface CoverArtImageProps {
  title: string;
  resolvedUrl: string;
  loading: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low';
  onImageReady?: (image: HTMLImageElement, resolvedUrl?: string) => void;
  onCorsBlocked?: (resolvedUrl?: string) => void;
}

const CoverArtImage: React.FC<CoverArtImageProps> = ({
  title,
  resolvedUrl,
  loading,
  fetchPriority,
  onImageReady,
  onCorsBlocked,
}) => {
  const [failed, setFailed] = useState(false);
  // Hosts that refuse color reading can still show the image, so retry without the CORS request
  const [allowCors, setAllowCors] = useState(() => !isCorsBlocked(resolvedUrl));
  const [loaded, setLoaded] = useState(false);

  const showImage = !failed;
  const useCors = allowCors && !isCorsBlocked(resolvedUrl);

  return (
    <>
      {!loaded && (
        <div className="kf-cover-card" aria-hidden={showImage}>
          <span className="kf-cover-title">{title}</span>
        </div>
      )}
      {showImage && (
        <img
          key={useCors ? 'cors' : 'nocors'}
          src={resolvedUrl}
          alt={title}
          loading={loading}
          decoding="async"
          {...(fetchPriority ? { fetchPriority } : {})}
          crossOrigin={useCors ? 'anonymous' : undefined}
          className={loaded ? 'is-loaded' : ''}
          onLoad={(e) => {
            setLoaded(true);
            onImageReady?.(e.currentTarget, resolvedUrl);
          }}
          onError={() => {
            if (useCors) {
              markCorsBlocked(resolvedUrl);
              onCorsBlocked?.(resolvedUrl);
              setAllowCors(false);
            } else {
              setFailed(true);
            }
          }}
        />
      )}
    </>
  );
};

/** Shows real art when there is some, otherwise a designed title card instead of an empty box. */
export const CoverArt: React.FC<CoverArtProps> = ({
  title,
  imageUrl,
  accent,
  variant = 'poster',
  size = 'card',
  loading,
  fetchPriority,
  onImageReady,
  onCorsBlocked,
}) => {
  const resolvedUrl = cloudinaryThumbUrl(imageUrl, size);
  const effectiveLoading = fetchPriority === 'high' ? 'eager' : (loading ?? 'lazy');

  return (
    <div
      className={`kf-cover is-${variant}`}
      style={accent ? ({ '--title-accent': accent } as React.CSSProperties) : undefined}
    >
      {resolvedUrl ? (
        <CoverArtImage
          key={resolvedUrl}
          title={title}
          resolvedUrl={resolvedUrl}
          loading={effectiveLoading}
          fetchPriority={fetchPriority}
          onImageReady={onImageReady}
          onCorsBlocked={onCorsBlocked}
        />
      ) : (
        <div className="kf-cover-card">
          <span className="kf-cover-title">{title}</span>
        </div>
      )}
    </div>
  );
};
