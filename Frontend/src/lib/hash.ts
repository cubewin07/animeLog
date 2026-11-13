/**
 * Deterministic color and texture hashing for title covers and monograms.
 * Translates any string into one of 10 curated cloth/bookbinder palette tones.
 */

export interface ClothTone {
  id: string;
  name: string;
  bg: string;
  accent: string;
  text: string;
  border: string;
}

export const CLOTH_TONES: ClothTone[] = [
  {
    id: 'oxblood',
    name: 'Oxblood Leather',
    bg: '#3A1817',
    accent: '#8F4B44',
    text: '#E8CEC9',
    border: 'rgba(232, 206, 201, 0.18)',
  },
  {
    id: 'moss',
    name: 'Moss Green',
    bg: '#1E2D1D',
    accent: '#4B6B49',
    text: '#D2E2D1',
    border: 'rgba(210, 226, 209, 0.18)',
  },
  {
    id: 'ink',
    name: 'Ink Blue',
    bg: '#172332',
    accent: '#3E5F82',
    text: '#CFDEEE',
    border: 'rgba(207, 222, 238, 0.18)',
  },
  {
    id: 'ochre',
    name: 'Warm Ochre',
    bg: '#382813',
    accent: '#8C6834',
    text: '#EEDCBD',
    border: 'rgba(238, 220, 189, 0.18)',
  },
  {
    id: 'plum',
    name: 'Deep Plum',
    bg: '#2F182C',
    accent: '#6E3C67',
    text: '#E6D2E3',
    border: 'rgba(230, 210, 227, 0.18)',
  },
  {
    id: 'slate',
    name: 'Muted Slate',
    bg: '#1F272E',
    accent: '#4E6171',
    text: '#D3DFE9',
    border: 'rgba(211, 223, 233, 0.18)',
  },
  {
    id: 'teal',
    name: 'Midnight Teal',
    bg: '#142C2E',
    accent: '#346B70',
    text: '#CFE7E9',
    border: 'rgba(207, 231, 233, 0.18)',
  },
  {
    id: 'rust',
    name: 'Burnished Rust',
    bg: '#3B1F16',
    accent: '#8B4B37',
    text: '#ECCDC4',
    border: 'rgba(236, 205, 196, 0.18)',
  },
  {
    id: 'olive',
    name: 'Aged Olive',
    bg: '#282A17',
    accent: '#65693C',
    text: '#DFE2C4',
    border: 'rgba(223, 226, 196, 0.18)',
  },
  {
    id: 'charcoal',
    name: 'Binder Charcoal',
    bg: '#211E1C',
    accent: '#59504B',
    text: '#DDD8D3',
    border: 'rgba(221, 216, 211, 0.18)',
  },
];

export function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getClothTone(seed: string): ClothTone {
  const normalized = (seed || 'AnimeLog').trim().toLowerCase();
  const hash = stringHash(normalized);
  const index = hash % CLOTH_TONES.length;
  return CLOTH_TONES[index];
}

