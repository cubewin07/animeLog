import { useCallback, useState } from 'react';
import { cloudinaryThumbUrl } from '../images/cloudinary';
import { titleFallbackAccent } from './accent';
import {
  getCachedAccent,
  markCorsBlocked,
  resolveAccentFromImage,
  setCachedAccent,
} from './accentCache';

export interface CoverAccentState {
  accent: string;
  onImageReady: (img: HTMLImageElement, resolvedUrl?: string) => void;
  onCorsBlocked: (resolvedUrl?: string) => void;
}

/**
 * Tracks a readable cover accent for a title + image URL, applying cached accents
 * immediately without flicker and falling back to `titleFallbackAccent(title)`.
 */
export function useCoverAccent(
  title: string,
  imageUrl?: string | null,
): CoverAccentState {
  const [extracted, setExtracted] = useState<{ key: string; accent: string } | null>(null);

  const currentKey = `${title}\0${imageUrl ?? ''}`;
  const cardUrl = cloudinaryThumbUrl(imageUrl, 'card');
  const cached =
    getCachedAccent(imageUrl) ??
    (cardUrl && cardUrl !== imageUrl ? getCachedAccent(cardUrl) : null);
  const fallback = titleFallbackAccent(title);
  const accent =
    cached ??
    (extracted && extracted.key === currentKey ? extracted.accent : null) ??
    fallback;

  const onImageReady = useCallback(
    (img: HTMLImageElement, resolvedUrl?: string) => {
      const targetUrl = resolvedUrl ?? imageUrl;
      const next = resolveAccentFromImage(img, targetUrl, title);
      if (imageUrl && resolvedUrl && resolvedUrl !== imageUrl && getCachedAccent(resolvedUrl)) {
        setCachedAccent(imageUrl, next);
      }
      setExtracted({ key: currentKey, accent: next });
    },
    [currentKey, imageUrl, title],
  );

  const onCorsBlocked = useCallback(
    (resolvedUrl?: string) => {
      const targetUrl = resolvedUrl ?? imageUrl;
      if (targetUrl) markCorsBlocked(targetUrl);
      if (imageUrl && imageUrl !== targetUrl) markCorsBlocked(imageUrl);
      setExtracted({ key: currentKey, accent: titleFallbackAccent(title) });
    },
    [currentKey, imageUrl, title],
  );

  return { accent, onImageReady, onCorsBlocked };
}
