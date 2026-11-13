import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, loadDraft, saveDraft } from './drafts';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('composer drafts persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isolates per-episode drafts by episodeNumber on the same season target', () => {
    saveDraft({
      targetKey: 'season:10',
      kind: 'episode',
      episodeNumber: 1,
      note: 'Ep 1 draft note',
      rating: 8,
      updatedAt: 1000,
    });
    saveDraft({
      targetKey: 'season:10',
      kind: 'episode',
      episodeNumber: 2,
      note: 'Ep 2 draft note',
      rating: 9,
      updatedAt: 2000,
    });

    expect(loadDraft('season:10', 'episode', 1)).toMatchObject({
      episodeNumber: 1,
      note: 'Ep 1 draft note',
      rating: 8,
    });
    expect(loadDraft('season:10', 'episode', 2)).toMatchObject({
      episodeNumber: 2,
      note: 'Ep 2 draft note',
      rating: 9,
    });
    expect(loadDraft('season:10', 'episode', 3)).toBeNull();
  });

  it('clears one episode draft without affecting other episodes or season-level drafts', () => {
    saveDraft({
      targetKey: 'season:10',
      kind: 'lesson',
      note: 'Season lesson draft',
      updatedAt: 1000,
    });
    saveDraft({
      targetKey: 'season:10',
      kind: 'episode',
      episodeNumber: 1,
      note: 'Ep 1 draft',
      updatedAt: 1001,
    });
    saveDraft({
      targetKey: 'season:10',
      kind: 'episode',
      episodeNumber: 2,
      note: 'Ep 2 draft',
      updatedAt: 1002,
    });

    clearDraft('season:10', 'episode', 1);

    expect(loadDraft('season:10', 'episode', 1)).toBeNull();
    expect(loadDraft('season:10', 'episode', 2)?.note).toBe('Ep 2 draft');
    expect(loadDraft('season:10', 'lesson')?.note).toBe('Season lesson draft');
  });
});
