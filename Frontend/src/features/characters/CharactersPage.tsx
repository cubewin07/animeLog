import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, PenLine, Plus, Search, Sparkles, X } from 'lucide-react';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { LibraryTabs } from '../../shell/LibraryTabs';
import { getGamePrefs } from '../../lib/progression';
import {
  CardTier,
  KfButton,
  KfCharacterCard,
  TIER_LABEL,
} from '../../ui/keyframe';
import {
  CharacterSort,
  countCharacterTiers,
  filterCharacters,
  getCharacterCoverUrl,
  getCharacterTier,
  sortCharacters,
} from './characterUtils';
import './Characters.css';

type TierFilter = 'ALL' | CardTier;

const VALID_TIERS = new Set<TierFilter>(['ALL', 'sketch', 'inked', 'color', 'foil']);
const VALID_SORTS = new Set<CharacterSort>(['recent', 'tier', 'name', 'series']);

const TIER_DEFS: Array<{ id: TierFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'sketch', label: TIER_LABEL.sketch },
  { id: 'inked', label: TIER_LABEL.inked },
  { id: 'color', label: TIER_LABEL.color },
  { id: 'foil', label: TIER_LABEL.foil },
];

function parseSeriesParam(raw: string | null): number | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL';
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 'ALL';
}

export const CharactersPage: React.FC = () => {
  const { loading, loadFailed, characterList, seriesList } = useJournalData();
  const { retryLoad, openAddCharacterModal, openComposer } = useJournalActions();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedSeries = parseSeriesParam(searchParams.get('series'));

  const rawTier = searchParams.get('tier') || 'ALL';
  const selectedTier: TierFilter = VALID_TIERS.has(rawTier as TierFilter)
    ? (rawTier as TierFilter)
    : 'ALL';

  const filterText = searchParams.get('q') ?? '';

  const rawSort = searchParams.get('sort') || 'recent';
  const sortBy: CharacterSort = VALID_SORTS.has(rawSort as CharacterSort)
    ? (rawSort as CharacterSort)
    : 'recent';

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('series');
    next.delete('tier');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const seriesOptions = useMemo(() => {
    const charCounts = new Map<number, number>();
    const fallbackTitles = new Map<number, string>();
    for (const char of characterList) {
      charCounts.set(char.series, (charCounts.get(char.series) ?? 0) + 1);
      if (char.series_title && !fallbackTitles.has(char.series)) {
        fallbackTitles.set(char.series, char.series_title);
      }
    }

    const byId = new Map<number, { id: number; title: string; count: number }>();
    for (const s of seriesList) {
      const count = charCounts.get(s.id) ?? 0;
      if (count > 0 || selectedSeries === s.id) {
        byId.set(s.id, { id: s.id, title: s.title, count });
      }
    }

    for (const [id, count] of charCounts.entries()) {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          title: fallbackTitles.get(id) ?? `Series #${id}`,
          count,
        });
      }
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    );
  }, [characterList, seriesList, selectedSeries]);

  // Tier pill counts reflect active series + search query so every pill count matches its results
  const facetFiltered = useMemo(
    () =>
      filterCharacters(characterList, {
        seriesId: selectedSeries,
        tier: 'ALL',
        q: filterText,
      }),
    [characterList, selectedSeries, filterText],
  );

  const tierCounts = useMemo(() => countCharacterTiers(facetFiltered), [facetFiltered]);

  const visibleCharacters = useMemo(() => {
    const filtered = filterCharacters(facetFiltered, {
      tier: selectedTier,
    });
    return sortCharacters(filtered, sortBy);
  }, [facetFiltered, selectedTier, sortBy]);

  const hasActiveFilters =
    selectedSeries !== 'ALL' || selectedTier !== 'ALL' || filterText.trim().length > 0;
  const showXp = getGamePrefs().xp;

  return (
    <>
      <LibraryTabs />

      <div className="kf kf-chars">
        <header className="kf-chars-header">
          <div>
            <h1 className="kf-chars-title">Characters</h1>
            <p className="kf-chars-desc">
              Characters worth remembering. Upgrade each card from Sketch to Inked, Full color, and Foil by adding portraits and why they matter.
            </p>
          </div>

          <KfButton
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => openAddCharacterModal()}
          >
            Add Character
          </KfButton>
        </header>

        <section className="kf-chars-toolbar" aria-label="Character filters and sorting">
          <div className="kf-chars-tier-bar" role="group" aria-label="Filter by card tier">
            {TIER_DEFS.map((tierDef) => (
              <button
                key={tierDef.id}
                type="button"
                className={`kf-chars-tier-pill ${tierDef.id === 'foil' ? 'is-foil' : ''} ${
                  selectedTier === tierDef.id ? 'is-active' : ''
                }`}
                aria-pressed={selectedTier === tierDef.id}
                onClick={() => updateParam('tier', tierDef.id, 'ALL')}
              >
                <span>{tierDef.label}</span>
                <span className="kf-chars-pill-count">{tierCounts[tierDef.id]}</span>
              </button>
            ))}
          </div>

          <div className="kf-chars-controls">
            <div className="kf-chars-search">
              <Search size={15} className="kf-chars-search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by name, series, or why…"
                aria-label="Search characters by name, series, or why"
                value={filterText}
                onChange={(e) => updateParam('q', e.target.value, '')}
              />
              {filterText && (
                <button
                  type="button"
                  className="kf-chars-search-clear"
                  onClick={() => updateParam('q', '', '')}
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="kf-chars-selects">
              <select
                className="kf-chars-select"
                value={String(selectedSeries)}
                onChange={(e) => updateParam('series', e.target.value, 'ALL')}
                aria-label="Filter by series"
              >
                <option value="ALL">All series</option>
                {seriesOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title} ({s.count})
                  </option>
                ))}
              </select>

              <select
                className="kf-chars-select"
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value, 'recent')}
                aria-label="Sort characters"
              >
                <option value="recent">Recently added</option>
                <option value="tier">Card tier (highest)</option>
                <option value="name">Name (A–Z)</option>
                <option value="series">Series (A–Z)</option>
              </select>
            </div>
          </div>
        </section>

        {loading && characterList.length === 0 ? (
          <div className="kf-chars-grid" aria-label="Loading characters">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="kf-chars-skeleton" />
            ))}
          </div>
        ) : loadFailed && characterList.length === 0 ? (
          <div className="kf-chars-empty" role="alert">
            <div className="kf-chars-empty-icon">
              <AlertCircle size={24} aria-hidden="true" />
            </div>
            <h2>Couldn’t load your characters</h2>
            <p>Check that the backend server is running, then try again.</p>
            <KfButton variant="primary" onClick={retryLoad}>
              Retry
            </KfButton>
          </div>
        ) : characterList.length === 0 ? (
          <div className="kf-chars-empty">
            <div className="kf-chars-empty-icon">
              <Sparkles size={24} aria-hidden="true" />
            </div>
            <h2>Your character wall is ready</h2>
            <p>
              Keep notes on characters whose choices stayed with you, and collect portraits to upgrade their cards.
            </p>
            <KfButton
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => openAddCharacterModal()}
            >
              Add first character
            </KfButton>
          </div>
        ) : visibleCharacters.length === 0 ? (
          <div className="kf-chars-empty">
            <div className="kf-chars-empty-icon">
              <Sparkles size={24} aria-hidden="true" />
            </div>
            <h2>No characters matched</h2>
            <p>
              {filterText
                ? `No characters matched “${filterText}”.`
                : 'Try clearing your series or tier filters.'}
            </p>
            {hasActiveFilters && (
              <KfButton variant="secondary" onClick={clearAllFilters}>
                Clear filters
              </KfButton>
            )}
          </div>
        ) : (
          <div className="kf-chars-grid">
            {visibleCharacters.map((char) => {
              const coverUrl = getCharacterCoverUrl(char);
              const tier = getCharacterTier(char);
              const hasWhy = Boolean(char.why?.trim());

              return (
                <div key={char.id} className="kf-chars-card">
                  <Link
                    viewTransition
                    to={`/characters/${char.id}`}
                    className="kf-chars-card-link"
                  >
                    <KfCharacterCard
                      name={char.name}
                      seriesTitle={char.series_title}
                      why={char.why}
                      imageUrl={coverUrl}
                      tier={tier}
                    />
                  </Link>

                  {!hasWhy && (
                    <button
                      type="button"
                      className="kf-chars-card-note-btn"
                      onClick={() =>
                        openComposer({
                          targetKind: 'character',
                          id: char.id,
                          title: char.name,
                          context: char.series_title || undefined,
                          defaultKind: 'why',
                        })
                      }
                      aria-label={`Add note for ${char.name}`}
                    >
                      <PenLine size={13} aria-hidden="true" />
                      <span>Add note</span>
                      {showXp && <span className="kf-chars-card-note-xp">+10 XP</span>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
