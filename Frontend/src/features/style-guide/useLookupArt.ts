import { useEffect, useState } from 'react';
import { lookupApi } from '../../api/client';

export interface ArtRequest {
  key: string;
  query: string;
  kind: 'anime' | 'character';
}

const CACHE_KEY = 'keyframe_style_art';

function readCache(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/**
 * Preview only: shows the first search match for each title without saving anything.
 * Requests run one at a time to respect the lookup service's rate limit.
 */
export function useLookupArt(requests: ArtRequest[]): { art: Record<string, string>; unavailable: boolean } {
  const [art, setArt] = useState<Record<string, string>>(readCache);
  const [unavailable, setUnavailable] = useState(false);
  const signature = requests.map((r) => r.key).join('|');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const cached = readCache();
      for (const request of requests) {
        if (cancelled) return;
        if (cached[request.key]) continue;
        try {
          const url =
            request.kind === 'anime'
              ? (await lookupApi.searchAnime(request.query))[0]?.cover_url
              : (await lookupApi.searchCharacter(request.query))[0]?.portrait_url;
          if (url && !cancelled) {
            cached[request.key] = url;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
            setArt({ ...cached });
          }
        } catch {
          if (!cancelled) setUnavailable(true);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    };
    if (requests.length) run();
    return () => {
      cancelled = true;
    };
    // The signature covers everything the requests contain
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { art, unavailable };
}
