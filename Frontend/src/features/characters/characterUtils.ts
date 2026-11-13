import type { FavoriteCharacter, ImageAsset } from '../../types';
import { cardTier, type CardTier } from '../../ui/keyframe/CharacterCard';

export const FOIL_IMAGE_REQUIREMENT = 3;

export const CARD_TIER_ORDER: readonly CardTier[] = ['sketch', 'inked', 'color', 'foil'] as const;

export type CharacterSort = 'recent' | 'tier' | 'name' | 'series';

export interface NextTierStep {
  currentTier: CardTier;
  nextTier: CardTier | null;
  stepLabel: string;
  hint: string;
  currentImages: number;
  neededImages: number;
}

export interface CharacterFilterOptions {
  seriesId?: number | 'ALL' | null;
  tier?: CardTier | 'ALL' | null;
  q?: string | null;
}

export type TierCounts = Record<'ALL' | CardTier, number>;

type ImageAssetWithOptionalUrl = ImageAsset & { image_url?: string | null };

const TIER_RANK: Record<CardTier, number> = {
  sketch: 0,
  inked: 1,
  color: 2,
  foil: 3,
};

/**
 * Resolves the display URL from an `ImageAsset`, supporting `image_url`, `url`, and `file`.
 */
export function resolveImageAssetUrl(image: ImageAsset | null | undefined): string | null {
  if (!image) return null;
  const candidate =
    (image as ImageAssetWithOptionalUrl).image_url ||
    image.url ||
    image.file ||
    null;
  const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
  return trimmed ? trimmed : null;
}

/**
 * Resolves a character's cover portrait URL from `cover_image_url`, `image_url`,
 * a matching `cover_image` inside `images`, or the first image in `images`.
 */
export function getCharacterCoverUrl(character: FavoriteCharacter): string | null {
  const coverUrl = character.cover_image_url?.trim();
  if (coverUrl) return coverUrl;

  const fallbackUrl = character.image_url?.trim();
  if (fallbackUrl) return fallbackUrl;

  const gallery = character.images ?? [];
  if (character.cover_image != null) {
    const matched = gallery.find((img) => img.id === character.cover_image);
    const matchedUrl = resolveImageAssetUrl(matched);
    if (matchedUrl) return matchedUrl;
  }

  for (const img of gallery) {
    const url = resolveImageAssetUrl(img);
    if (url) return url;
  }

  return null;
}

/**
 * Resolves the gallery image count safely, falling back to 1 when a cover URL
 * exists on a character without a populated `images` array.
 */
export function getCharacterImageCount(character: FavoriteCharacter): number {
  const galleryCount = Array.isArray(character.images) ? character.images.length : 0;
  if (galleryCount > 0) return galleryCount;
  return getCharacterCoverUrl(character) ? 1 : 0;
}

/**
 * Computes a character's collectible card tier (`sketch` -> `inked` -> `color` -> `foil`).
 */
export function getCharacterTier(character: FavoriteCharacter): CardTier {
  const coverUrl = getCharacterCoverUrl(character);
  const imageCount = getCharacterImageCount(character);
  return cardTier({
    hasPortrait: Boolean(coverUrl),
    hasWhy: Boolean(character.why?.trim()),
    imageCount,
  });
}

/**
 * Returns the exact next upgrade step and progress metadata for a character card.
 */
export function getNextTierStep(character: FavoriteCharacter): NextTierStep {
  const currentTier = getCharacterTier(character);
  const currentImages = getCharacterImageCount(character);
  const neededImages = Math.max(0, FOIL_IMAGE_REQUIREMENT - currentImages);

  switch (currentTier) {
    case 'sketch':
      return {
        currentTier,
        nextTier: 'inked',
        stepLabel: 'Add a portrait',
        hint: 'Upload or link an image below to ink this card.',
        currentImages,
        neededImages,
      };
    case 'inked':
      return {
        currentTier,
        nextTier: 'color',
        stepLabel: 'Write why they matter (+10 XP)',
        hint: 'Add a note about what makes them unforgettable.',
        currentImages,
        neededImages,
      };
    case 'color':
      return {
        currentTier,
        nextTier: 'foil',
        stepLabel: 'Collect 3+ gallery images',
        hint: `${currentImages} of 3 images saved — add ${FOIL_IMAGE_REQUIREMENT - currentImages} more for Foil.`,
        currentImages,
        neededImages,
      };
    case 'foil':
      return {
        currentTier,
        nextTier: null,
        stepLabel: 'Foil tier unlocked',
        hint: 'Portrait, note, and gallery complete.',
        currentImages,
        neededImages: 0,
      };
  }
}

/**
 * Filters characters by series ID, collectible tier, and search query (`name`, `series_title`, `why`).
 */
export function filterCharacters(
  characters: FavoriteCharacter[],
  { seriesId = 'ALL', tier = 'ALL', q = '' }: CharacterFilterOptions = {},
): FavoriteCharacter[] {
  const needle = (q ?? '').trim().toLowerCase();

  return characters.filter((char) => {
    if (seriesId != null && seriesId !== 'ALL' && char.series !== seriesId) {
      return false;
    }

    if (tier != null && tier !== 'ALL' && getCharacterTier(char) !== tier) {
      return false;
    }

    if (needle) {
      const nameMatch = char.name.toLowerCase().includes(needle);
      const seriesMatch = (char.series_title ?? '').toLowerCase().includes(needle);
      const whyMatch = (char.why ?? '').toLowerCase().includes(needle);
      if (!nameMatch && !seriesMatch && !whyMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Counts characters in each collectible tier (`ALL` plus `sketch`, `inked`, `color`, `foil`).
 */
export function countCharacterTiers(characters: FavoriteCharacter[]): TierCounts {
  const counts: TierCounts = {
    ALL: characters.length,
    sketch: 0,
    inked: 0,
    color: 0,
    foil: 0,
  };

  for (const char of characters) {
    counts[getCharacterTier(char)] += 1;
  }

  return counts;
}

/**
 * Returns a sorted copy of `characters` using the selected sort order.
 */
export function sortCharacters(
  characters: FavoriteCharacter[],
  sort: CharacterSort = 'recent',
): FavoriteCharacter[] {
  const copy = [...characters];

  copy.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id - b.id;

      case 'series': {
        const seriesCmp = (a.series_title ?? '').localeCompare(b.series_title ?? '', undefined, {
          sensitivity: 'base',
        });
        if (seriesCmp !== 0) return seriesCmp;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id - b.id;
      }

      case 'tier': {
        const tierDiff = TIER_RANK[getCharacterTier(b)] - TIER_RANK[getCharacterTier(a)];
        if (tierDiff !== 0) return tierDiff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || b.id - a.id;
      }

      case 'recent':
      default:
        return b.id - a.id;
    }
  });

  return copy;
}
