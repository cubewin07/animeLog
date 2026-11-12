import React, { useState } from 'react';
import { BookOpen, Film } from 'lucide-react';
import { titleFallbackAccent } from '../../lib/color/accent';
import {
  getCachedAccent,
  isCorsBlocked,
  markCorsBlocked,
  resolveAccentFromImage,
} from '../../lib/color/accentCache';
import { cloudinaryThumbUrl, type CoverSize } from '../../lib/images/cloudinary';
import { getClothTone } from '../../lib/hash';
import './Cover.css';

export type CoverVariant = 'poster' | 'book' | 'portrait';

export interface CoverProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  variant?: CoverVariant;
  size?: CoverSize;
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low';
  showTitle?: boolean;
  onImageReady?: (image: HTMLImageElement) => void;
  onAccentReady?: (accent: string) => void;
}

interface CoverImageProps {
  resolvedUrl: string;
  title: string;
  alt: string;
  loading: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low';
  onImageReady?: (image: HTMLImageElement) => void;
  onAccentReady?: (accent: string) => void;
  fallback: React.ReactNode;
}

const CoverImage: React.FC<CoverImageProps> = ({
  resolvedUrl,
  title,
  alt,
  loading,
  fetchPriority,
  onImageReady,
  onAccentReady,
  fallback,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [allowCors, setAllowCors] = useState(() => !isCorsBlocked(resolvedUrl));

  if (imageError) {
    return <>{fallback}</>;
  }

  const useCors = allowCors && !isCorsBlocked(resolvedUrl);

  return (
    <img
      key={useCors ? 'cors' : 'nocors'}
      src={resolvedUrl}
      alt={alt}
      loading={loading}
      decoding="async"
      {...(fetchPriority ? { fetchPriority } : {})}
      crossOrigin={useCors ? 'anonymous' : undefined}
      className={`lamplight-cover-img ${imageLoaded ? 'is-loaded' : ''}`}
      onLoad={(e) => {
        const img = e.currentTarget;
        setImageLoaded(true);
        onImageReady?.(img);

        const cached = getCachedAccent(resolvedUrl);
        if (cached) {
          onAccentReady?.(cached);
        } else if (useCors) {
          const accent = resolveAccentFromImage(img, resolvedUrl, title);
          onAccentReady?.(accent);
        } else if (onAccentReady) {
          onAccentReady(titleFallbackAccent(title));
        }
      }}
      onError={() => {
        if (useCors) {
          markCorsBlocked(resolvedUrl);
          setAllowCors(false);
        } else {
          setImageError(true);
        }
      }}
    />
  );
};

export const Cover: React.FC<CoverProps> = ({
  title,
  subtitle,
  imageUrl,
  variant = 'poster',
  size = 'card',
  className = '',
  alt = '',
  loading,
  fetchPriority,
  showTitle = true,
  onImageReady,
  onAccentReady,
}) => {
  const tone = getClothTone(title);
  const resolvedUrl = cloudinaryThumbUrl(imageUrl, size);
  const effectiveLoading = fetchPriority === 'high' ? 'eager' : (loading ?? 'lazy');

  const fallback =
    variant === 'portrait' ? (
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
    );

  return (
    <div
      className={`lamplight-cover is-${variant} ${className}`}
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
      }}
      aria-label={alt || title}
    >
      {resolvedUrl ? (
        <CoverImage
          key={resolvedUrl}
          resolvedUrl={resolvedUrl}
          title={title}
          alt={alt || title}
          loading={effectiveLoading}
          fetchPriority={fetchPriority}
          onImageReady={onImageReady}
          onAccentReady={onAccentReady}
          fallback={fallback}
        />
      ) : (
        fallback
      )}
    </div>
  );
};
