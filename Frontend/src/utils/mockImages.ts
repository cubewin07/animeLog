/**
 * Curated Mock Images for Anime Series, Releases, and Characters.
 * Preserved for testing UI/UX previews when explicitly requested.
 */

export const MOCK_SERIES_POSTERS: Record<string, string> = {
  "frieren: beyond journey's end":
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  'attack on titan':
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  'demon slayer: kimetsu no yaiba':
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  'steins;gate':
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
};

export const MOCK_RELEASE_STILLS: Record<string, string> = {
  // Frieren
  'season 1':
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  // Attack on Titan
  'the final season':
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
  'season 2':
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
  'season 3':
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
  // Demon Slayer
  'unwavering resolve arc':
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  'entertainment district arc':
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'mugen train':
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  // Steins;Gate
  'load region of déjà vu':
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
};

export const MOCK_CHARACTER_AVATARS: Record<string, string> = {
  'himmel the hero':
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'erwin smith':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'rintaro okabe':
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'kurisu makise':
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'tanjiro kamado':
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'nezuko kamado':
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
};

/**
 * Returns the live uploaded image URL if set, otherwise returns null.
 * Disables automatic mock fallback so users can test true upload behavior.
 */
export function getSeriesPoster(_title: string, explicitUrl?: string | null): string | null {
  if (explicitUrl && explicitUrl.trim()) return explicitUrl.trim();
  return null;
}

export function getReleaseStill(_title: string, explicitUrl?: string | null): string | null {
  if (explicitUrl && explicitUrl.trim()) return explicitUrl.trim();
  return null;
}

export function getCharacterAvatar(_name: string, explicitUrl?: string | null): string | null {
  if (explicitUrl && explicitUrl.trim()) return explicitUrl.trim();
  return null;
}

/**
 * Optional helper to retrieve curated mock images for UI/UX testing.
 */
export function getSeriesMockImage(title: string): string | null {
  const key = title.toLowerCase().trim();
  return MOCK_SERIES_POSTERS[key] || null;
}

export function getReleaseMockImage(title: string): string | null {
  const key = title.toLowerCase().trim();
  return MOCK_RELEASE_STILLS[key] || null;
}

export function getCharacterMockImage(name: string): string | null {
  const key = name.toLowerCase().trim();
  return MOCK_CHARACTER_AVATARS[key] || null;
}
