import type { AnimeSeries, Book, FavoriteCharacter } from '../types';

export type NoteKind = 'lesson' | 'episode' | 'return' | 'why';
export type NoteTargetKind = 'season' | 'movie' | 'book' | 'character';

export interface NoteTargetRef {
  targetKind: NoteTargetKind;
  id: number;
}

export interface JournalLists {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
}

export interface ExistingNote {
  text: string | null;
  /** Set when an episode note already exists, so saving updates it instead of creating a duplicate. */
  episodeNoteId?: number;
  totalEpisodes?: number | null;
}

/** Reads the saved note from live journal data, so every way of opening the Composer sees it. */
export function resolveExistingNote(
  target: NoteTargetRef,
  kind: NoteKind,
  episodeNumber: number,
  { seriesList, bookList, characterList }: JournalLists
): ExistingNote {
  if (target.targetKind === 'season') {
    const season = seriesList.flatMap((s) => s.seasons ?? []).find((s) => s.id === target.id);
    const totalEpisodes = season?.total_episodes;
    if (kind === 'lesson') return { text: season?.notes ?? null, totalEpisodes };
    if (kind === 'episode') {
      const note = season?.episode_notes?.find((n) => n.episode_number === episodeNumber);
      return { text: note?.note ?? null, episodeNoteId: note?.id, totalEpisodes };
    }
    return { text: null, totalEpisodes };
  }
  if (target.targetKind === 'movie' && kind === 'lesson') {
    const movie = seriesList.flatMap((s) => s.movies ?? []).find((m) => m.id === target.id);
    return { text: movie?.notes ?? null };
  }
  if (target.targetKind === 'book') {
    return { text: bookList.find((b) => b.id === target.id)?.notes ?? null };
  }
  if (target.targetKind === 'character') {
    return { text: characterList.find((c) => c.id === target.id)?.why ?? null };
  }
  return { text: null };
}

/** Which note kinds a target supports. An unsupported kind falls back to the first one. */
export function normalizeKind(targetKind: NoteTargetKind, kind?: NoteKind): NoteKind {
  const allowed: Record<NoteTargetKind, NoteKind[]> = {
    season: ['lesson', 'episode', 'return'],
    movie: ['lesson', 'return'],
    book: ['lesson'],
    character: ['why'],
  };
  return kind && allowed[targetKind].includes(kind) ? kind : allowed[targetKind][0];
}

/**
 * The text to save. Adds to the existing note unless the writer explicitly chose to edit the
 * whole note, so saved words are never replaced by accident.
 */
export function composeFinalNote(options: {
  newText: string;
  existingText: string | null | undefined;
  editEntireNote: boolean;
  dateLabel: string;
}): string {
  const newText = options.newText.trim();
  const existing = options.existingText?.trim();
  if (options.editEntireNote || !existing || newText.includes(existing)) return newText;
  return `${existing}\n\n— ${options.dateLabel}\n${newText}`;
}
