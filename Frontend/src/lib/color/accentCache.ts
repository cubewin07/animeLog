import { clampAccent, dominantColor, titleFallbackAccent } from './accent';

export const ACCENT_CACHE_STORAGE_KEY = 'animelog_cover_accent_v1';
export const ACCENT_CACHE_MAX_ENTRIES = 200;

const accentCache = new Map<string, string>();
const corsBlockedUrls = new Set<string>();
let hydrated = false;

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors (private mode or Node without storage)
  }
  return null;
}

function ensureHydrated(): void {
  if (hydrated) return;
  hydrated = true;

  const storage = getStorage();
  if (!storage) return;

  try {
    const raw = storage.getItem(ACCENT_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;

    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === 'string' && key && typeof value === 'string' && value.startsWith('#')) {
        accentCache.set(key, value);
        if (accentCache.size >= ACCENT_CACHE_MAX_ENTRIES) break;
      }
    }
  } catch {
    // Ignore malformed JSON or storage errors
  }
}

function persistCache(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(ACCENT_CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(accentCache)));
  } catch {
    // Ignore quota / security errors
  }
}

export function getCachedAccent(url: string | null | undefined): string | null {
  if (!url) return null;
  ensureHydrated();
  const hit = accentCache.get(url);
  if (hit === undefined) return null;
  // Refresh LRU recency
  accentCache.delete(url);
  accentCache.set(url, hit);
  return hit;
}

export function setCachedAccent(url: string | null | undefined, hex: string): void {
  if (!url || !hex) return;
  ensureHydrated();

  if (accentCache.has(url)) {
    accentCache.delete(url);
  }
  accentCache.set(url, hex);

  while (accentCache.size > ACCENT_CACHE_MAX_ENTRIES) {
    const oldestKey = accentCache.keys().next().value;
    if (oldestKey === undefined) break;
    accentCache.delete(oldestKey);
  }

  persistCache();
}

export function isCorsBlocked(url: string | null | undefined): boolean {
  if (!url) return false;
  return corsBlockedUrls.has(url);
}

export function markCorsBlocked(url: string | null | undefined): void {
  if (!url) return;
  corsBlockedUrls.add(url);
}

export function clearAccentCache(): void {
  accentCache.clear();
  corsBlockedUrls.clear();
  hydrated = false;

  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(ACCENT_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Resolves a readable accent for a loaded cover image using the cache first,
 * falling back to `titleFallbackAccent` when pixel access is blocked or monochrome.
 */
export function resolveAccentFromImage(
  image: HTMLImageElement,
  url: string | null | undefined,
  title: string,
): string {
  if (url) {
    const cached = getCachedAccent(url);
    if (cached) return cached;
    if (isCorsBlocked(url)) return titleFallbackAccent(title);
  }

  const dominant = dominantColor(image);
  if (dominant) {
    const clamped = clampAccent(dominant);
    if (url) setCachedAccent(url, clamped);
    return clamped;
  }

  if (url && image.crossOrigin !== 'anonymous') {
    markCorsBlocked(url);
  }
  return titleFallbackAccent(title);
}
