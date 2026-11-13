import { describe, expect, it } from 'vitest';
import { composeFinalNote, normalizeKind, resolveExistingNote } from './noteTarget';
import type { AnimeSeries, Book, FavoriteCharacter } from '../types';

const lists = {
  seriesList: [
    {
      id: 1,
      seasons: [
        {
          id: 10,
          notes: 'Season words',
          total_episodes: 12,
          episode_notes: [{ id: 99, episode_number: 3, note: 'Episode words' }],
        },
      ],
      movies: [{ id: 10, notes: 'Movie words' }],
    },
  ] as unknown as AnimeSeries[],
  bookList: [{ id: 10, notes: 'Book words' }] as unknown as Book[],
  characterList: [{ id: 10, why: 'Character words' }] as unknown as FavoriteCharacter[],
};

describe('resolveExistingNote', () => {
  it('finds the saved note for each kind of target sharing the same ID', () => {
    expect(resolveExistingNote({ targetKind: 'season', id: 10 }, 'lesson', 1, lists).text).toBe('Season words');
    expect(resolveExistingNote({ targetKind: 'movie', id: 10 }, 'lesson', 1, lists).text).toBe('Movie words');
    expect(resolveExistingNote({ targetKind: 'book', id: 10 }, 'lesson', 1, lists).text).toBe('Book words');
    expect(resolveExistingNote({ targetKind: 'character', id: 10 }, 'why', 1, lists).text).toBe('Character words');
  });

  it('returns the existing episode note ID so saving updates instead of duplicating', () => {
    const found = resolveExistingNote({ targetKind: 'season', id: 10 }, 'episode', 3, lists);
    expect(found).toMatchObject({ text: 'Episode words', episodeNoteId: 99, totalEpisodes: 12 });
    const missing = resolveExistingNote({ targetKind: 'season', id: 10 }, 'episode', 4, lists);
    expect(missing.text).toBeNull();
    expect(missing.episodeNoteId).toBeUndefined();
  });

  it('never treats a season note as the existing text of a new rewatch', () => {
    expect(resolveExistingNote({ targetKind: 'season', id: 10 }, 'return', 1, lists).text).toBeNull();
  });
});

describe('composeFinalNote', () => {
  const base = { dateLabel: '7 Nov 2026', editEntireNote: false };

  it('keeps the original text when adding to a note', () => {
    const result = composeFinalNote({ ...base, newText: 'New thought', existingText: 'Original' });
    expect(result).toBe('Original\n\n— 7 Nov 2026\nNew thought');
  });

  it('replaces only when the writer chose to edit the full note', () => {
    const result = composeFinalNote({ ...base, editEntireNote: true, newText: 'Edited', existingText: 'Original' });
    expect(result).toBe('Edited');
  });

  it('saves plain text when nothing exists yet', () => {
    expect(composeFinalNote({ ...base, newText: ' First ', existingText: null })).toBe('First');
  });

  it('does not double the note when a restored draft already contains it', () => {
    expect(composeFinalNote({ ...base, newText: 'Original plus', existingText: 'Original' })).toBe('Original plus');
  });
});

describe('normalizeKind', () => {
  it('stops a lesson being sent to a character or a rewatch to a book', () => {
    expect(normalizeKind('character', 'lesson')).toBe('why');
    expect(normalizeKind('book', 'return')).toBe('lesson');
    expect(normalizeKind('season', 'episode')).toBe('episode');
    expect(normalizeKind('movie')).toBe('lesson');
  });
});
