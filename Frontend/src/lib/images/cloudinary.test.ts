import { describe, expect, it } from 'vitest';
import { COVER_WIDTHS, cloudinaryThumbUrl } from './cloudinary';

describe('COVER_WIDTHS', () => {
  it('defines expected preset widths', () => {
    expect(COVER_WIDTHS).toEqual({
      thumb: 160,
      card: 420,
      hero: 900,
    });
  });
});

describe('cloudinaryThumbUrl', () => {
  it('returns null, undefined, and empty strings as-is', () => {
    expect(cloudinaryThumbUrl(null)).toBeNull();
    expect(cloudinaryThumbUrl(undefined)).toBeUndefined();
    expect(cloudinaryThumbUrl('')).toBe('');
  });

  it('inserts default card width transform for versioned Cloudinary URLs', () => {
    const input = 'https://res.cloudinary.com/demo/image/upload/v1700000000/anime_log/frieren.jpg';
    expect(cloudinaryThumbUrl(input)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_420,c_limit,f_auto,q_auto/v1700000000/anime_log/frieren.jpg',
    );
  });

  it('supports thumb, card, hero presets and numeric widths', () => {
    const input = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    expect(cloudinaryThumbUrl(input, 'thumb')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_160,c_limit,f_auto,q_auto/sample.jpg',
    );
    expect(cloudinaryThumbUrl(input, 'card')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_420,c_limit,f_auto,q_auto/sample.jpg',
    );
    expect(cloudinaryThumbUrl(input, 'hero')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_900,c_limit,f_auto,q_auto/sample.jpg',
    );
    expect(cloudinaryThumbUrl(input, 280)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_280,c_limit,f_auto,q_auto/sample.jpg',
    );
  });

  it('transforms unversioned folder paths on Cloudinary', () => {
    const input = 'https://res.cloudinary.com/demo/image/upload/anime_log/covers/frieren.jpg';
    expect(cloudinaryThumbUrl(input, 'thumb')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_160,c_limit,f_auto,q_auto/anime_log/covers/frieren.jpg',
    );
  });

  it('is idempotent when a transform segment is already present', () => {
    const input = 'https://res.cloudinary.com/demo/image/upload/v123/frieren.jpg';
    const once = cloudinaryThumbUrl(input, 'card');
    expect(cloudinaryThumbUrl(once, 'card')).toBe(once);
    expect(cloudinaryThumbUrl(once, 'hero')).toBe(once);

    const custom = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_200,g_auto/v123/frieren.jpg';
    expect(cloudinaryThumbUrl(custom, 'card')).toBe(custom);
  });

  it('preserves query strings and protocol-relative Cloudinary URLs', () => {
    const withQuery = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg?cb=1';
    expect(cloudinaryThumbUrl(withQuery, 'thumb')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_160,c_limit,f_auto,q_auto/v1/sample.jpg?cb=1',
    );

    const protoRel = '//res.cloudinary.com/demo/image/upload/v1/sample.jpg';
    expect(cloudinaryThumbUrl(protoRel, 'thumb')).toBe(
      '//res.cloudinary.com/demo/image/upload/w_160,c_limit,f_auto,q_auto/v1/sample.jpg',
    );
  });

  it('leaves non-Cloudinary and relative URLs untouched', () => {
    const urls = [
      'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
      'https://covers.openlibrary.org/b/id/12345-L.jpg',
      'https://images.unsplash.com/photo-12345?auto=format&fit=crop&w=800',
      '/media/covers/frieren.jpg',
      'https://example.com/res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4',
    ];
    for (const url of urls) {
      expect(cloudinaryThumbUrl(url, 'card')).toBe(url);
    }
  });
});
