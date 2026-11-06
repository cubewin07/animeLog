/** Turns any cover color into an accent that stays readable on Keyframe's dark surfaces. */

type Rgb = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

function rgbToOklch([r, g, b]: Rgb): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map((c) => toLinear(c / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, b2), Math.atan2(b2, a)];
}

function oklchToRgb(L: number, C: number, h: number): { rgb: Rgb; inGamut: boolean } {
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const inGamut = linear.every((c) => c >= -0.001 && c <= 1.001);
  const rgb = linear.map((c) => toSrgb(Math.min(1, Math.max(0, c))) * 255) as Rgb;
  return { rgb, inGamut };
}

/** Keeps the hue, and limits lightness and chroma so the color works as text on dark panels. */
export function clampAccent(hex: string): string {
  const [L, C, h] = rgbToOklch(hexToRgb(hex));
  const lightness = Math.min(0.86, Math.max(0.76, L));
  let chroma = Math.min(0.16, Math.max(C, C < 0.03 ? C : 0.09));
  let result = oklchToRgb(lightness, chroma, h);
  while (!result.inGamut && chroma > 0.01) {
    chroma -= 0.01;
    result = oklchToRgb(lightness, chroma, h);
  }
  return rgbToHex(result.rgb);
}

export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((c) => toLinear(c / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Finds the cover's most vivid common color. Returns null when the image host blocks pixel access,
 * so callers can fall back to a color derived from the title.
 */
export function dominantColor(image: HTMLImageElement): string | null {
  try {
    const size = 24;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    const buckets = new Map<number, { score: number; r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const rgb: Rgb = [data[i], data[i + 1], data[i + 2]];
      const [L, C, h] = rgbToOklch(rgb);
      if (L < 0.2 || L > 0.95 || C < 0.04) continue;
      const key = Math.round(((h + Math.PI) / (2 * Math.PI)) * 12);
      const bucket = buckets.get(key) ?? { score: 0, r: 0, g: 0, b: 0, n: 0 };
      bucket.score += C;
      bucket.r += rgb[0];
      bucket.g += rgb[1];
      bucket.b += rgb[2];
      bucket.n += 1;
      buckets.set(key, bucket);
    }
    const best = [...buckets.values()].sort((x, y) => y.score - x.score)[0];
    return best ? rgbToHex([best.r / best.n, best.g / best.n, best.b / best.n]) : null;
  } catch {
    return null;
  }
}

/** A stable accent for titles without readable art. The same title always gets the same color. */
export function titleAccent(title: string): string {
  let hash = 0;
  for (const char of title.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = ((hash % 360) * Math.PI) / 180;
  return rgbToHex(oklchToRgb(0.8, 0.13, hue).rgb);
}
