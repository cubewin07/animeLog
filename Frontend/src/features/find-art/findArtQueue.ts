import type { AnimeMovie, AnimeSeason, AnimeSeries, Book, FavoriteCharacter } from '../../types';

export type FindArtKind = 'series' | 'season' | 'movie' | 'book' | 'character';

export interface FindArtItem {
  uid: string;
  id: number;
  kind: FindArtKind;
  title: string;
  subtitle: string;
  defaultQuery: string;
  folderName: string;
  currentImageUrl: string | null;
  hasArt: boolean;
  href: string;
  seriesId?: number;
}

export interface FindArtSources {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
}

export interface FindArtKindSummary {
  total: number;
  missing: number;
  saved: number;
}

export interface FindArtSummary {
  total: number;
  missing: number;
  saved: number;
  byKind: Record<FindArtKind, FindArtKindSummary>;
}

const SEASON_GENERIC_RE = /^season\s*\d+$/i;

function buildSeasonQuery(series: AnimeSeries, season: AnimeSeason): string {
  const title = season.title.trim();
  if (SEASON_GENERIC_RE.test(title)) {
    return `${series.title}${season.season_number > 1 ? ` Season ${season.season_number}` : ''}`;
  }
  if (title.toLowerCase().includes(series.title.toLowerCase())) {
    return title;
  }
  return `${series.title} ${title}`.trim();
}

function buildMovieQuery(series: AnimeSeries, movie: AnimeMovie): string {
  const title = movie.title.trim();
  if (title.toLowerCase().includes(series.title.toLowerCase())) {
    return title;
  }
  return `${series.title} ${title}`.trim();
}

function resolveCharacterImageUrl(character: FavoriteCharacter): string | null {
  if (character.cover_image_url) return character.cover_image_url;
  if (character.image_url) return character.image_url;
  const firstImage = character.images?.[0] as ({ url?: string; image_url?: string } | undefined);
  return firstImage?.url || firstImage?.image_url || null;
}

export function buildFindArtItems({
  seriesList,
  bookList,
  characterList,
}: FindArtSources): FindArtItem[] {
  const items: FindArtItem[] = [];
  const seriesById = new Map<number, AnimeSeries>();

  for (const series of seriesList) {
    seriesById.set(series.id, series);
    const currentImageUrl = series.cover_image_url || series.image_url || null;
    items.push({
      uid: `series-${series.id}`,
      id: series.id,
      kind: 'series',
      title: series.title,
      subtitle:
        series.romaji_title && series.romaji_title !== series.title
          ? series.romaji_title
          : series.japanese_title || 'Anime Series',
      defaultQuery: series.romaji_title || series.title,
      folderName: 'Anime Covers',
      currentImageUrl,
      hasArt: Boolean(series.cover_image_url || series.image_url),
      href: `/anime/${series.id}`,
      seriesId: series.id,
    });

    for (const season of series.seasons ?? []) {
      const seasonImageUrl = season.cover_image_url || season.image_url || null;
      items.push({
        uid: `season-${season.id}`,
        id: season.id,
        kind: 'season',
        title: season.title,
        subtitle: `${series.title} · Season ${season.season_number}`,
        defaultQuery: buildSeasonQuery(series, season),
        folderName: 'Anime Covers',
        currentImageUrl: seasonImageUrl,
        hasArt: Boolean(season.cover_image_url || season.image_url),
        href: `/anime/${series.id}?release=season-${season.id}`,
        seriesId: series.id,
      });
    }

    for (const movie of series.movies ?? []) {
      const movieImageUrl = movie.cover_image_url || movie.image_url || null;
      items.push({
        uid: `movie-${movie.id}`,
        id: movie.id,
        kind: 'movie',
        title: movie.title,
        subtitle: series.title,
        defaultQuery: buildMovieQuery(series, movie),
        folderName: 'Anime Covers',
        currentImageUrl: movieImageUrl,
        hasArt: Boolean(movie.cover_image_url || movie.image_url),
        href: `/anime/${series.id}?release=movie-${movie.id}`,
        seriesId: series.id,
      });
    }
  }

  for (const book of bookList) {
    const currentImageUrl = book.cover_image_url || book.image_url || null;
    items.push({
      uid: `book-${book.id}`,
      id: book.id,
      kind: 'book',
      title: book.title,
      subtitle: book.author || 'Book',
      defaultQuery: book.author ? `${book.title} ${book.author}` : book.title,
      folderName: 'Book Covers',
      currentImageUrl,
      hasArt: Boolean(book.cover_image_url || book.image_url),
      href: `/books/${book.id}`,
    });
  }

  for (const character of characterList) {
    const parentSeries = seriesById.get(character.series);
    const currentImageUrl = resolveCharacterImageUrl(character);
    items.push({
      uid: `character-${character.id}`,
      id: character.id,
      kind: 'character',
      title: character.name,
      subtitle: character.series_title || parentSeries?.title || 'Character',
      defaultQuery: character.name,
      folderName: 'Character Portraits',
      currentImageUrl,
      hasArt: Boolean(character.cover_image_url || character.image_url || character.images?.[0]),
      href: `/characters/${character.id}`,
      seriesId: character.series,
    });
  }

  return items;
}

export function summarizeFindArt(items: FindArtItem[]): FindArtSummary {
  const byKind: Record<FindArtKind, FindArtKindSummary> = {
    series: { total: 0, missing: 0, saved: 0 },
    season: { total: 0, missing: 0, saved: 0 },
    movie: { total: 0, missing: 0, saved: 0 },
    book: { total: 0, missing: 0, saved: 0 },
    character: { total: 0, missing: 0, saved: 0 },
  };

  let missing = 0;
  let saved = 0;

  for (const item of items) {
    const bucket = byKind[item.kind];
    bucket.total += 1;
    if (item.hasArt) {
      saved += 1;
      bucket.saved += 1;
    } else {
      missing += 1;
      bucket.missing += 1;
    }
  }

  return {
    total: items.length,
    missing,
    saved,
    byKind,
  };
}
