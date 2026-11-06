import { describe, expect, it } from 'vitest';
import { clampAccent, contrastRatio, hexToRgb, rgbToHex } from './accent';

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
