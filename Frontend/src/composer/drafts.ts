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
  editEntireNote?: boolean;
  updatedAt: number;
}

const STORAGE_PREFIX = 'lamplight_draft:';

function buildDraftKey(targetKey: string, kind: string, episodeNumber?: number): string {
  const epSuffix = kind === 'episode' && episodeNumber !== undefined ? `:ep${episodeNumber}` : '';
  return `${STORAGE_PREFIX}${targetKey}:${kind}${epSuffix}`;
}

export function saveDraft(draft: ComposerDraft): void {
  try {
    const key = buildDraftKey(draft.targetKey, draft.kind, draft.episodeNumber);
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save draft:', err);
  }
}

export function loadDraft(targetKey: string, kind: string, episodeNumber?: number): ComposerDraft | null {
  try {
    const key = buildDraftKey(targetKey, kind, episodeNumber);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(targetKey: string, kind: string, episodeNumber?: number): void {
  try {
    const key = buildDraftKey(targetKey, kind, episodeNumber);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear draft:', err);
  }
}

