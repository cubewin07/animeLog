export const COVER_WIDTHS = {
  thumb: 160,
  card: 420,
  hero: 900,
} as const;

export type CoverSize = keyof typeof COVER_WIDTHS | number;

const UPLOAD_MARKER = '/image/upload/';
const TRANSFORM_TOKEN_RE =
  /^(?:w|h|c|f|q|g|e|ar|dpr|fl|t|b|bo|r|x|y|z|a|co|cs|l|u|o|pg|if|dn|dl|du|eo|so|sp|vc|vs)_[^,/]+$/;

function resolveWidth(size: CoverSize): number {
  const raw = typeof size === 'number' ? size : COVER_WIDTHS[size];
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : COVER_WIDTHS.card;
}

function isTransformSegment(segment: string): boolean {
  if (!segment || /^v\d+$/.test(segment)) return false;
  return segment.split(',').every((token) => TRANSFORM_TOKEN_RE.test(token));
}

function isCloudinaryHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === 'res.cloudinary.com' || lower.endsWith('.cloudinary.com');
}

/**
 * Inserts sized Cloudinary delivery transforms (`w_<width>,c_limit,f_auto,q_auto`)
 * right after `/image/upload/` unless an existing transform segment is already present.
 * Non-Cloudinary, relative, and empty URLs are returned untouched.
 */
export function cloudinaryThumbUrl(
  url: string | null | undefined,
  size: CoverSize = 'card',
): string | null | undefined {
  if (!url) return url;

  const isProtocolRelative = url.startsWith('//');
  let parsed: URL;
  try {
    parsed = new URL(isProtocolRelative ? `https:${url}` : url);
  } catch {
    return url;
  }

  if (!isCloudinaryHostname(parsed.hostname)) return url;

  const markerIndex = parsed.pathname.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const prefix = parsed.pathname.slice(0, markerIndex + UPLOAD_MARKER.length);
  const rest = parsed.pathname.slice(markerIndex + UPLOAD_MARKER.length);
  if (!rest) return url;

  const slashIndex = rest.indexOf('/');
  if (slashIndex !== -1) {
    const firstSegment = rest.slice(0, slashIndex);
    if (isTransformSegment(firstSegment)) {
      return url;
    }
  }

  const width = resolveWidth(size);
  parsed.pathname = `${prefix}w_${width},c_limit,f_auto,q_auto/${rest}`;
  const formatted = parsed.toString();
  return isProtocolRelative ? formatted.replace(/^https:/, '') : formatted;
}
