import { describe, expect, it } from 'vitest';
import type { FavoriteCharacter, ImageAsset } from '../../types';
import {
  countCharacterTiers,
  filterCharacters,
  getCharacterCoverUrl,
  getCharacterImageCount,
  getCharacterTier,
  getNextTierStep,
  resolveImageAssetUrl,
  sortCharacters,
} from './characterUtils';

const makeImage = (id: number, overrides: Partial<ImageAsset> = {}): ImageAsset => ({
  id,
  file: `/media/img-${id}.jpg`,
  url: `https://cdn.example.com/img-${id}.jpg`,
  title: `Image ${id}`,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeChar = (overrides: Partial<FavoriteCharacter> = {}): FavoriteCharacter => ({
  id: 1,
  series: 10,
  series_title: 'Frieren: Beyond Journey’s End',
  name: 'Frieren',
  why: null,
  cover_image: null,
  cover_image_url: null,
  image_url: null,
  images: [],
  ...overrides,
});

describe('resolveImageAssetUrl', () => {
  it('prefers image_url, then url, then file', () => {
    expect(
      resolveImageAssetUrl({ ...makeImage(1), image_url: 'https://cdn.example.com/preferred.jpg' } as ImageAsset),
    ).toBe('https://cdn.example.com/preferred.jpg');
    expect(resolveImageAssetUrl(makeImage(2))).toBe('https://cdn.example.com/img-2.jpg');
    expect(resolveImageAssetUrl(makeImage(3, { url: '' }))).toBe('/media/img-3.jpg');
  });

  it('returns null for missing or blank assets', () => {
    expect(resolveImageAssetUrl(null)).toBeNull();
    expect(resolveImageAssetUrl(undefined)).toBeNull();
    expect(resolveImageAssetUrl(makeImage(4, { url: '   ', file: '' }))).toBeNull();
  });
});

describe('getCharacterCoverUrl', () => {
  it('resolves cover_image_url first, then image_url, then matching cover_image, then images[0]', () => {
    expect(
      getCharacterCoverUrl(
        makeChar({
          cover_image_url: 'https://cdn.example.com/cover.jpg',
          image_url: 'https://cdn.example.com/fallback.jpg',
          images: [makeImage(1)],
        }),
      ),
    ).toBe('https://cdn.example.com/cover.jpg');

    expect(
      getCharacterCoverUrl(
        makeChar({
          cover_image_url: '   ',
          image_url: 'https://cdn.example.com/fallback.jpg',
          images: [makeImage(1)],
        }),
      ),
    ).toBe('https://cdn.example.com/fallback.jpg');

    expect(
      getCharacterCoverUrl(
        makeChar({
          cover_image: 2,
          images: [makeImage(1), makeImage(2)],
        }),
      ),
    ).toBe('https://cdn.example.com/img-2.jpg');

    expect(
      getCharacterCoverUrl(
        makeChar({
          images: [makeImage(5)],
        }),
      ),
    ).toBe('https://cdn.example.com/img-5.jpg');
  });

  it('returns null when no portrait URL exists', () => {
    expect(getCharacterCoverUrl(makeChar())).toBeNull();
  });
});

describe('getCharacterImageCount', () => {
  it('returns images.length when gallery images are populated', () => {
    expect(
      getCharacterImageCount(
        makeChar({
          cover_image_url: 'https://cdn.example.com/cover.jpg',
          images: [makeImage(1), makeImage(2)],
        }),
      ),
    ).toBe(2);
  });

  it('counts a cover image as 1 when images array is empty or missing', () => {
    expect(
      getCharacterImageCount(
        makeChar({
          cover_image_url: 'https://cdn.example.com/cover.jpg',
          images: [],
        }),
      ),
    ).toBe(1);

    expect(
      getCharacterImageCount(
        makeChar({
          image_url: 'https://cdn.example.com/legacy.jpg',
          images: undefined,
        }),
      ),
    ).toBe(1);
  });

  it('returns 0 when neither gallery images nor cover URL exist', () => {
    expect(getCharacterImageCount(makeChar({ images: undefined }))).toBe(0);
    expect(getCharacterImageCount(makeChar({ images: [] }))).toBe(0);
  });
});

describe('getCharacterTier', () => {
  it('returns sketch when there is no portrait, even if why is written', () => {
    expect(getCharacterTier(makeChar({ why: 'Quiet grief across centuries.' }))).toBe('sketch');
  });

  it('returns inked when portrait exists without a why note', () => {
    expect(
      getCharacterTier(
        makeChar({
          cover_image_url: 'https://cdn.example.com/frieren.jpg',
          why: '   ',
          images: [makeImage(1)],
        }),
      ),
    ).toBe('inked');
  });

  it('returns color when portrait and why exist with fewer than 3 images', () => {
    expect(
      getCharacterTier(
        makeChar({
          cover_image_url: 'https://cdn.example.com/frieren.jpg',
          why: 'Learns to notice small moments before they pass.',
          images: [makeImage(1), makeImage(2)],
        }),
      ),
    ).toBe('color');
  });

  it('returns foil when portrait, why, and 3+ gallery images exist', () => {
    expect(
      getCharacterTier(
        makeChar({
          cover_image_url: 'https://cdn.example.com/frieren.jpg',
          why: 'Learns to notice small moments before they pass.',
          images: [makeImage(1), makeImage(2), makeImage(3)],
        }),
      ),
    ).toBe('foil');
  });
});

describe('getNextTierStep', () => {
  it('returns the sketch -> inked step', () => {
    expect(getNextTierStep(makeChar())).toEqual({
      currentTier: 'sketch',
      nextTier: 'inked',
      stepLabel: 'Add a portrait',
      hint: 'Upload or link an image below to ink this card.',
      currentImages: 0,
      neededImages: 3,
    });
  });

  it('returns the inked -> color step with +10 XP cue', () => {
    expect(
      getNextTierStep(
        makeChar({
          cover_image_url: 'https://cdn.example.com/frieren.jpg',
          images: [makeImage(1)],
        }),
      ),
    ).toEqual({
      currentTier: 'inked',
      nextTier: 'color',
      stepLabel: 'Write why they matter (+10 XP)',
      hint: 'Add a note about what makes them unforgettable.',
      currentImages: 1,
      neededImages: 2,
    });
  });

  it('returns the color -> foil step with dynamic remaining image count', () => {
    expect(
      getNextTierStep(
        makeChar({
          cover_image_url: 'https://cdn.example.com/frieren.jpg',
          why: 'Unforgettable patience.',
          images: [makeImage(1), makeImage(2)],
        }),
      ),
    ).toEqual({
      currentTier: 'color',
      nextTier: 'foil',
      stepLabel: 'Collect 3+ gallery images',
      hint: '2 of 3 images saved — add 1 more for Foil.',
      currentImages: 2,
      neededImages: 1,
    });
  });

  it('returns the completed foil state when 3+ images are saved', () => {
    expect(
      getNextTierStep(
        makeChar({
          cover_image_url: 'https://cdn.example.com/frieren.jpg',
          why: 'Unforgettable patience.',
          images: [makeImage(1), makeImage(2), makeImage(3)],
        }),
      ),
    ).toEqual({
      currentTier: 'foil',
      nextTier: null,
      stepLabel: 'Foil tier unlocked',
      hint: 'Portrait, note, and gallery complete.',
      currentImages: 3,
      neededImages: 0,
    });
  });
});

describe('filterCharacters, countCharacterTiers, and sortCharacters', () => {
  const sketchChar = makeChar({
    id: 1,
    series: 10,
    series_title: 'Frieren',
    name: 'Stark',
    why: null,
  });
  const inkedChar = makeChar({
    id: 2,
    series: 10,
    series_title: 'Frieren',
    name: 'Fern',
    cover_image_url: 'https://cdn.example.com/fern.jpg',
    images: [makeImage(10)],
  });
  const colorChar = makeChar({
    id: 3,
    series: 20,
    series_title: 'Attack on Titan',
    name: 'Erwin Smith',
    why: 'Led from the front even without seeing the basement.',
    cover_image_url: 'https://cdn.example.com/erwin.jpg',
    images: [makeImage(11)],
  });
  const foilChar = makeChar({
    id: 4,
    series: 30,
    series_title: 'Vinland Saga',
    name: 'Askeladd',
    why: 'A tragic mentor forged by resentment.',
    cover_image_url: 'https://cdn.example.com/askeladd.jpg',
    images: [makeImage(12), makeImage(13), makeImage(14)],
  });

  const roster = [sketchChar, inkedChar, colorChar, foilChar];

  it('filters by seriesId, tier, and query across name, series_title, and why', () => {
    expect(filterCharacters(roster, { seriesId: 10 }).map((c) => c.id)).toEqual([1, 2]);
    expect(filterCharacters(roster, { tier: 'foil' }).map((c) => c.id)).toEqual([4]);
    expect(filterCharacters(roster, { q: 'basement' }).map((c) => c.id)).toEqual([3]);
    expect(filterCharacters(roster, { q: 'VINLAND' }).map((c) => c.id)).toEqual([4]);
    expect(filterCharacters(roster, { seriesId: 10, tier: 'inked', q: 'fern' }).map((c) => c.id)).toEqual([2]);
  });

  it('counts characters per tier accurately', () => {
    expect(countCharacterTiers(roster)).toEqual({
      ALL: 4,
      sketch: 1,
      inked: 1,
      color: 1,
      foil: 1,
    });
  });

  it('sorts by recent, tier, name, and series', () => {
    expect(sortCharacters(roster, 'recent').map((c) => c.id)).toEqual([4, 3, 2, 1]);
    expect(sortCharacters(roster, 'tier').map((c) => c.id)).toEqual([4, 3, 2, 1]);
    expect(sortCharacters(roster, 'name').map((c) => c.name)).toEqual([
      'Askeladd',
      'Erwin Smith',
      'Fern',
      'Stark',
    ]);
    expect(sortCharacters(roster, 'series').map((c) => c.id)).toEqual([3, 2, 1, 4]);
  });
});
