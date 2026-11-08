import type { AnimeSeries, Book, FavoriteCharacter } from '../types';
import type { JournalReflection } from '../state/useReflections';

export interface PaletteItem {
  id: string;
  kind: 'recent' | 'action' | 'anime' | 'book' | 'character' | 'note';
  title: string;
  meta: string;
  badge?: string;
  run: () => void;
}

export interface PaletteCallbacks {
  navigate: (to: string) => void;
  openComposer: (target?: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
  }) => void;
  openNewSeries: () => void;
  openNewBook: () => void;
  openNewCharacter: () => void;
  openNewRewatch: () => void;
  openShortcuts: () => void;
  seasonDelta: (seasonId: number, delta: number) => void;
  movieDelta: (movieId: number, delta: number) => void;
  bookDelta: (bookId: number, delta: number) => void;
}

export interface PaletteSources {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
  reflections: JournalReflection[];
}

function snippetAround(text: string, query: string, maxLen = 78): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return `“${clean}”`;
  const idx = clean.toLowerCase().indexOf(query.toLowerCase());
  if (idx <= 20) return `“${clean.slice(0, maxLen)}…”`;
  const start = Math.max(0, idx - 20);
  const slice = clean.slice(start, start + maxLen);
  return `“…${slice}${start + maxLen < clean.length ? '…' : ''}”`;
}

export function reflectionHref(r: JournalReflection): string {
  if (r.kind === 'rewatch' && !r.seriesId) {
    return '/journal?kind=rewatch';
  }
  if (r.seriesId && r.targetKind === 'season') {
    const ep = r.episodeNumber ? `&ep=${r.episodeNumber}` : '';
    return `/anime/${r.seriesId}?release=season-${r.targetId}${ep}`;
  }
  if (r.seriesId && r.targetKind === 'movie') {
    return `/anime/${r.seriesId}?release=movie-${r.targetId}`;
  }
  if (r.targetKind === 'book') {
    return `/books/${r.targetId}`;
  }
  if (r.targetKind === 'character') {
    return `/characters/${r.targetId}`;
  }
  if (r.seriesId) {
    return `/anime/${r.seriesId}`;
  }
  return '/journal';
}

export function buildPaletteItems(
  query: string,
  sources: PaletteSources,
  cb: PaletteCallbacks
): PaletteItem[] {
  const { seriesList, bookList, characterList, reflections } = sources;
  const q = query.trim().toLowerCase();

  // Active in-progress items (shown first when query is empty, and used for +1 actions)
  const activeItems: PaletteItem[] = [];
  const plusOneActions: (PaletteItem & { keywords: string })[] = [];

  seriesList.forEach((series) => {
    series.seasons?.forEach((season) => {
      if (season.status === 'WATCHING') {
        const nextEp = (season.progress || 0) + 1;
        const total = season.total_episodes ? ` of ${season.total_episodes}` : '';
        activeItems.push({
          id: `recent-season-${season.id}`,
          kind: 'recent',
          title: series.title,
          meta: `Watching · Season ${season.season_number} · Ep ${season.progress || 0}${total}`,
          badge: 'Continue',
          run: () => cb.navigate(`/anime/${series.id}?release=season-${season.id}`),
        });
        plusOneActions.push({
          id: `action-plus-season-${season.id}`,
          kind: 'action',
          title: `+1 ${series.title}`,
          meta: `Log Ep ${nextEp} · Season ${season.season_number}`,
          badge: '+1 Ep',
          keywords: `+1 + next ep episode ${series.title} ${series.romaji_title || ''} ${season.title}`.toLowerCase(),
          run: () => cb.seasonDelta(season.id, 1),
        });
      }
    });

    series.movies?.forEach((movie) => {
      if (movie.status === 'WATCHING') {
        activeItems.push({
          id: `recent-movie-${movie.id}`,
          kind: 'recent',
          title: series.title,
          meta: `Watching · Movie · ${movie.title}`,
          badge: 'Continue',
          run: () => cb.navigate(`/anime/${series.id}?release=movie-${movie.id}`),
        });
        plusOneActions.push({
          id: `action-plus-movie-${movie.id}`,
          kind: 'action',
          title: `+10m ${series.title} (${movie.title})`,
          meta: 'Add 10 minutes watched',
          badge: '+10m',
          keywords: `+1 + +10 next movie ${series.title} ${movie.title}`.toLowerCase(),
          run: () => cb.movieDelta(movie.id, 10),
        });
      }
    });
  });

  bookList.forEach((book) => {
    if (book.status === 'READING') {
      const total = book.total_pages ? ` of ${book.total_pages}` : '';
      activeItems.push({
        id: `recent-book-${book.id}`,
        kind: 'recent',
        title: book.title,
        meta: `Reading · ${book.progress || 0}${total} pages`,
        badge: 'Continue',
        run: () => cb.navigate(`/books/${book.id}`),
      });
      plusOneActions.push({
        id: `action-plus-book-${book.id}`,
        kind: 'action',
        title: `+10 pages · ${book.title}`,
        meta: 'Advance reading progress by 10 pages',
        badge: '+10p',
        keywords: `+1 + +10 next page pages ${book.title} ${book.author || ''}`.toLowerCase(),
        run: () => cb.bookDelta(book.id, 10),
      });
    }
  });

  const baseActions: (PaletteItem & { keywords: string })[] = [
    {
      id: 'action-write',
      kind: 'action',
      title: 'Write a note…',
      meta: 'Open the note composer (W)',
      badge: 'W',
      keywords: 'write note thought journal composer w',
      run: () => cb.openComposer(),
    },
    {
      id: 'action-add-anime',
      kind: 'action',
      title: 'Add anime series…',
      meta: 'Add a new series to your library (N)',
      badge: 'N',
      keywords: 'add new log anime series title n',
      run: () => cb.openNewSeries(),
    },
    {
      id: 'action-add-book',
      kind: 'action',
      title: 'Add book…',
      meta: 'Add a new book or light novel',
      keywords: 'add new log book novel reading',
      run: () => cb.openNewBook(),
    },
    {
      id: 'action-add-character',
      kind: 'action',
      title: 'Add character…',
      meta: 'Add a favorite character to your collection',
      keywords: 'add new character card favorite',
      run: () => cb.openNewCharacter(),
    },
    {
      id: 'action-add-rewatch',
      kind: 'action',
      title: 'Log a rewatch…',
      meta: 'Record another pass through a series, season, movie or episode',
      keywords: 'add new log rewatch pass again',
      run: () => cb.openNewRewatch(),
    },
    {
      id: 'action-go-home',
      kind: 'action',
      title: 'Go to Home',
      meta: 'Continue watching and recent notes',
      keywords: 'go to home today continue',
      run: () => cb.navigate('/'),
    },
    {
      id: 'action-go-anime',
      kind: 'action',
      title: 'Go to Anime Library',
      meta: 'Browse all anime series',
      keywords: 'go to library anime series shelf',
      run: () => cb.navigate('/anime'),
    },
    {
      id: 'action-go-books',
      kind: 'action',
      title: 'Go to Books',
      meta: 'Browse all books in your library',
      keywords: 'go to library books reading',
      run: () => cb.navigate('/books'),
    },
    {
      id: 'action-go-characters',
      kind: 'action',
      title: 'Go to Characters',
      meta: 'Browse character cards',
      keywords: 'go to library characters cards',
      run: () => cb.navigate('/characters'),
    },
    {
      id: 'action-go-journal',
      kind: 'action',
      title: 'Go to Journal',
      meta: 'Read all your notes and rewatches',
      keywords: 'go to journal notes rewatches timeline',
      run: () => cb.navigate('/journal'),
    },
    {
      id: 'action-go-me',
      kind: 'action',
      title: 'Go to Me & Achievements',
      meta: 'Level, XP, streak, achievements and stats',
      keywords: 'go to me profile achievements xp level streak stats recap',
      run: () => cb.navigate('/me'),
    },
    {
      id: 'action-go-settings',
      kind: 'action',
      title: 'Go to Settings',
      meta: 'Media library, export, import and preferences',
      keywords: 'go to settings media export import backup',
      run: () => cb.navigate('/settings'),
    },
    {
      id: 'action-shortcuts',
      kind: 'action',
      title: 'Keyboard shortcuts',
      meta: 'Show all keyboard shortcuts (?)',
      badge: '?',
      keywords: 'keyboard shortcuts help keys ?',
      run: () => cb.openShortcuts(),
    },
  ];

  if (!q) {
    return [...activeItems.slice(0, 4), ...plusOneActions.slice(0, 2), ...baseActions.slice(0, 6)];
  }

  const matches: PaletteItem[] = [];

  // 1. Check "+1 <title>" or general +1 actions
  const isPlusQuery = q.startsWith('+') || q.startsWith('next ');
  const plusTargetQuery = q.replace(/^(\+1|\+|next\s+ep(isode)?|next)\s*/i, '').trim();

  if (isPlusQuery) {
    seriesList.forEach((s) => {
      const season = s.seasons?.find((sea) => sea.status === 'WATCHING') ?? s.seasons?.[0];
      if (!season) return;
      const matchesTitle =
        !plusTargetQuery ||
        s.title.toLowerCase().includes(plusTargetQuery) ||
        s.romaji_title?.toLowerCase().includes(plusTargetQuery) ||
        season.title.toLowerCase().includes(plusTargetQuery);
      if (matchesTitle) {
        matches.push({
          id: `action-plus-season-${season.id}`,
          kind: 'action',
          title: `+1 ${s.title}`,
          meta: `Log Ep ${(season.progress || 0) + 1} · Season ${season.season_number}`,
          badge: '+1 Ep',
          run: () => cb.seasonDelta(season.id, 1),
        });
      }
    });
  } else {
    plusOneActions.forEach((a) => {
      if (a.title.toLowerCase().includes(q) || a.keywords.includes(q)) {
        matches.push(a);
      }
    });
  }

  // 2. Check "write about <target>" / "note <target>" contextual actions
  const writeMatch = /^(?:write(?:\s+about|\s+note\s+on|\s+on)?|note(?:\s+on|\s+about)?)\s+(.+)$/i.exec(q);
  if (writeMatch) {
    const targetQ = writeMatch[1].trim().toLowerCase();
    characterList.forEach((c) => {
      if (c.name.toLowerCase().includes(targetQ) || c.series_title?.toLowerCase().includes(targetQ)) {
        matches.push({
          id: `action-write-char-${c.id}`,
          kind: 'action',
          title: `Write about ${c.name}`,
          meta: c.series_title ? `Character note · ${c.series_title}` : 'Character note',
          badge: 'Note',
          run: () =>
            cb.openComposer({
              targetKind: 'character',
              id: c.id,
              title: c.name,
              context: c.series_title,
              defaultKind: 'why',
            }),
        });
      }
    });
    seriesList.forEach((s) => {
      if (s.title.toLowerCase().includes(targetQ) || s.romaji_title?.toLowerCase().includes(targetQ)) {
        const season = s.seasons?.find((sea) => sea.status === 'WATCHING') ?? s.seasons?.[0];
        const movie = s.movies?.[0];
        if (season) {
          matches.push({
            id: `action-write-season-${season.id}`,
            kind: 'action',
            title: `Write note on ${s.title}`,
            meta: `Season ${season.season_number} · ${season.title}`,
            badge: 'Note',
            run: () =>
              cb.openComposer({
                targetKind: 'season',
                id: season.id,
                title: s.title,
                context: `Season ${season.season_number}`,
                defaultKind: 'lesson',
              }),
          });
        } else if (movie) {
          matches.push({
            id: `action-write-movie-${movie.id}`,
            kind: 'action',
            title: `Write note on ${s.title}`,
            meta: `Movie · ${movie.title}`,
            badge: 'Note',
            run: () =>
              cb.openComposer({
                targetKind: 'movie',
                id: movie.id,
                title: s.title,
                context: movie.title,
                defaultKind: 'lesson',
              }),
          });
        }
      }
    });
    bookList.forEach((b) => {
      if (b.title.toLowerCase().includes(targetQ) || b.author?.toLowerCase().includes(targetQ)) {
        matches.push({
          id: `action-write-book-${b.id}`,
          kind: 'action',
          title: `Write note on ${b.title}`,
          meta: b.author ? `Book · by ${b.author}` : 'Book note',
          badge: 'Note',
          run: () =>
            cb.openComposer({
              targetKind: 'book',
              id: b.id,
              title: b.title,
              context: b.author || undefined,
              defaultKind: 'lesson',
            }),
        });
      }
    });
  }

  // 3. Base actions
  baseActions.forEach((a) => {
    if (a.title.toLowerCase().includes(q) || a.meta.toLowerCase().includes(q) || a.keywords.includes(q)) {
      matches.push(a);
    }
  });

  // 4. Anime Series
  seriesList.forEach((s) => {
    if (
      s.title.toLowerCase().includes(q) ||
      s.romaji_title?.toLowerCase().includes(q) ||
      s.japanese_title?.toLowerCase().includes(q)
    ) {
      const seasonCount = s.seasons?.length || 0;
      const movieCount = s.movies?.length || 0;
      const parts = [
        seasonCount ? `${seasonCount} season${seasonCount > 1 ? 's' : ''}` : '',
        movieCount ? `${movieCount} movie${movieCount > 1 ? 's' : ''}` : '',
      ].filter(Boolean);
      matches.push({
        id: `anime-${s.id}`,
        kind: 'anime',
        title: s.title,
        meta: `${parts.join(' · ') || 'Series'} · Anime`,
        run: () => cb.navigate(`/anime/${s.id}`),
      });
    }
  });

  // 5. Books
  bookList.forEach((b) => {
    if (b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)) {
      matches.push({
        id: `book-${b.id}`,
        kind: 'book',
        title: b.title,
        meta: b.author ? `by ${b.author} · Book` : 'Book',
        run: () => cb.navigate(`/books/${b.id}`),
      });
    }
  });

  // 6. Characters
  characterList.forEach((c) => {
    if (c.name.toLowerCase().includes(q) || c.series_title?.toLowerCase().includes(q)) {
      matches.push({
        id: `char-${c.id}`,
        kind: 'character',
        title: c.name,
        meta: c.series_title ? `${c.series_title} · Character` : 'Character',
        run: () => cb.navigate(`/characters/${c.id}`),
      });
    }
  });

  // 7. Full-text note search
  reflections.forEach((r) => {
    if (
      r.note.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.context.toLowerCase().includes(q)
    ) {
      // Avoid duplicating if the note didn't match and the title is already listed, unless the note itself matched
      if (!r.note.toLowerCase().includes(q) && !r.context.toLowerCase().includes(q)) return;
      matches.push({
        id: `note-${r.id}`,
        kind: 'note',
        title: snippetAround(r.note, q),
        meta: `${r.title} · ${r.context}`,
        badge: 'Note',
        run: () => cb.navigate(reflectionHref(r)),
      });
    }
  });

  // Deduplicate by id and cap at 14 results
  const seen = new Set<string>();
  return matches.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 14);
}
