/**
 * Local draft persistence for the Lamplight Composer.
 * Automatically preserves unsaved reflections in localStorage.
 */

export interface ComposerDraft {
  targetKey: string;
  kind: string;
  episodeNumber?: number;
  note: string;
  rating?: number | null;
  updatedAt: number;
}

const STORAGE_PREFIX = 'lamplight_draft:';

export function saveDraft(draft: ComposerDraft): void {
  try {
    const key = `${STORAGE_PREFIX}${draft.targetKey}:${draft.kind}`;
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save draft:', err);
  }
}

export function loadDraft(targetKey: string, kind: string): ComposerDraft | null {
  try {
    const key = `${STORAGE_PREFIX}${targetKey}:${kind}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(targetKey: string, kind: string): void {
  try {
    const key = `${STORAGE_PREFIX}${targetKey}:${kind}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear draft:', err);
  }
}
