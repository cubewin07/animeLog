import React, { useState } from 'react';
import './CoverArt.css';

export interface CoverArtProps {
  title: string;
  imageUrl?: string | null;
  accent?: string;
  variant?: 'poster' | 'portrait';
  /** Fires with the loaded image so a caller can read its color. */
  onImageReady?: (image: HTMLImageElement) => void;
}

/** Shows real art when there is some, otherwise a designed title card instead of an empty box. */
export const CoverArt: React.FC<CoverArtProps> = ({
  title,
  imageUrl,
  accent,
  variant = 'poster',
  onImageReady,
}) => {
  const [failed, setFailed] = useState(false);
  // Hosts that refuse color reading can still show the image, so retry without the CORS request
  const [allowCors, setAllowCors] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={`kf-cover is-${variant}`} style={accent ? ({ '--title-accent': accent } as React.CSSProperties) : undefined}>
      {!loaded && (
        <div className="kf-cover-card" aria-hidden={showImage}>
          <span className="kf-cover-title">{title}</span>
        </div>
      )}
      {showImage && (
        <img
          src={imageUrl as string}
          alt={title}
          loading="lazy"
          decoding="async"
          crossOrigin={allowCors ? 'anonymous' : undefined}
          className={loaded ? 'is-loaded' : ''}
          onLoad={(e) => {
            setLoaded(true);
            onImageReady?.(e.currentTarget);
          }}
          onError={() => (allowCors ? setAllowCors(false) : setFailed(true))}
        />
      )}
    </div>
  );
};
