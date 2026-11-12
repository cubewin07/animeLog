import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOTH_TONES } from '../hash';
import { clampAccent, contrastRatio, hexToRgb, rgbToHex, titleFallbackAccent } from './accent';
import {
  ACCENT_CACHE_MAX_ENTRIES,
  ACCENT_CACHE_STORAGE_KEY,
  clearAccentCache,
  getCachedAccent,
  isCorsBlocked,
  markCorsBlocked,
  resolveAccentFromImage,
  setCachedAccent,
} from './accentCache';

const panel = '#171B25';
const raised = '#212734';
const coverColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#3B1E54', '#FFE600', '#6B7280', '#0D1017', '#FF5A36'];

describe('clampAccent', () => {
  it.each(coverColors)('makes %s readable as text on dark surfaces', (color) => {
    const accent = clampAccent(color);
    expect(contrastRatio(accent, panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(accent, raised)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(coverColors)('makes dark text readable on %s as a fill', (color) => {
    expect(contrastRatio(clampAccent(color), '#0D1017')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the color family recognizable', () => {
    const [r, g, b] = hexToRgb(clampAccent('#C81E1E'));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });
});

describe('hex helpers', () => {
  it('round-trips and expands short hex', () => {
    expect(rgbToHex(hexToRgb('#ff5a36'))).toBe('#ff5a36');
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });
});

describe('Keyframe palette', () => {
  it('meets 4.5:1 for every text pairing', () => {
    expect(contrastRatio('#F2F4F8', '#0D1017')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#F2F4F8', raised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#A8B0C0', '#0D1017')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#A8B0C0', raised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0D1017', '#FF5A36')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0D1017', '#FFC857')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#1E2430', '#F4F6F1')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFC857', panel)).toBeGreaterThanOrEqual(4.5);
    for (const status of ['#4FD1B5', '#7EA8FF', '#E8B14C']) {
      expect(contrastRatio(status, panel)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('titleFallbackAccent', () => {
  const sampleTitles = [
    '',
    'Frieren: Beyond Journey’s End',
    'Orb: On the Movements of the Earth',
    'Dungeon Meshi',
    'Vinland Saga',
    'The Left Hand of Darkness',
    'Monogatari Series',
    '葬送のフリーレン',
    '1984',
    'A',
  ];

  it.each(sampleTitles)('meets >= 4.5:1 contrast for %j on dark surfaces', (title) => {
    const accent = titleFallbackAccent(title);
    expect(contrastRatio(accent, panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(accent, raised)).toBeGreaterThanOrEqual(4.5);
  });

  it('meets >= 4.5:1 contrast for every curated cloth tone accent', () => {
    for (const tone of CLOTH_TONES) {
      const clamped = clampAccent(tone.accent);
      expect(contrastRatio(clamped, panel)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(clamped, raised)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('is deterministic for the same title', () => {
    expect(titleFallbackAccent('Frieren')).toBe(titleFallbackAccent('  frieren  '));
  });
});

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('accentCache', () => {
  beforeEach(() => {
    clearAccentCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearAccentCache();
  });

  it('returns null on miss and returns cached hex on hit', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/frieren.jpg';
    expect(getCachedAccent(url)).toBeNull();
    expect(getCachedAccent(null)).toBeNull();
    expect(getCachedAccent(undefined)).toBeNull();

    setCachedAccent(url, '#d4a373');
    expect(getCachedAccent(url)).toBe('#d4a373');
  });

  it('persists to and hydrates from localStorage when available', () => {
    const storage = createMemoryStorage();
    vi.stubGlobal('localStorage', storage);

    const url = 'https://res.cloudinary.com/demo/image/upload/orb.jpg';
    setCachedAccent(url, '#7ea8ff');
    const raw = storage.getItem(ACCENT_CACHE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ [url]: '#7ea8ff' });

    // Simulate a fresh session hydrating from the same localStorage
    const persisted = storage.getItem(ACCENT_CACHE_STORAGE_KEY)!;
    clearAccentCache();
    storage.setItem(ACCENT_CACHE_STORAGE_KEY, persisted);
    expect(getCachedAccent(url)).toBe('#7ea8ff');
  });

  it('evicts oldest entries once capacity exceeds 200', () => {
    for (let i = 0; i < ACCENT_CACHE_MAX_ENTRIES + 5; i++) {
      setCachedAccent(`https://example.com/${i}.jpg`, '#abcdef');
    }

    expect(getCachedAccent('https://example.com/0.jpg')).toBeNull();
    expect(getCachedAccent('https://example.com/4.jpg')).toBeNull();
    expect(getCachedAccent('https://example.com/5.jpg')).toBe('#abcdef');
    expect(getCachedAccent(`https://example.com/${ACCENT_CACHE_MAX_ENTRIES + 4}.jpg`)).toBe('#abcdef');
  });

  it('tracks CORS-blocked URLs and clears them with clearAccentCache', () => {
    const url = 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg';
    expect(isCorsBlocked(url)).toBe(false);
    markCorsBlocked(url);
    expect(isCorsBlocked(url)).toBe(true);

    clearAccentCache();
    expect(isCorsBlocked(url)).toBe(false);
  });

  it('resolveAccentFromImage uses cached value, falls back and marks CORS-blocked on failure', () => {
    const cachedUrl = 'https://res.cloudinary.com/demo/image/upload/cached.jpg';
    setCachedAccent(cachedUrl, '#4fd1b5');
    expect(resolveAccentFromImage({} as HTMLImageElement, cachedUrl, 'Cached Title')).toBe('#4fd1b5');

    const blockedUrl = 'https://cdn.myanimelist.net/blocked.jpg';
    const fallback = resolveAccentFromImage(
      { crossOrigin: null } as unknown as HTMLImageElement,
      blockedUrl,
      'Frieren',
    );
    expect(fallback).toBe(titleFallbackAccent('Frieren'));
    expect(isCorsBlocked(blockedUrl)).toBe(true);
  });

  it('resolveAccentFromImage extracts, clamps, and caches dominant color when readable', () => {
    const pixels = new Uint8ClampedArray(24 * 24 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 220;
      pixels[i + 1] = 60;
      pixels[i + 2] = 40;
      pixels[i + 3] = 255;
    }

    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: () => {},
          getImageData: () => ({ data: pixels }),
        }),
      }),
    });

    const url = 'https://res.cloudinary.com/demo/image/upload/vivid.jpg';
    const resolved = resolveAccentFromImage(
      { crossOrigin: 'anonymous' } as unknown as HTMLImageElement,
      url,
      'Vivid',
    );

    expect(resolved).toBe(clampAccent('#dc3c28'));
    expect(getCachedAccent(url)).toBe(resolved);
    expect(contrastRatio(resolved, panel)).toBeGreaterThanOrEqual(4.5);
  });
});
