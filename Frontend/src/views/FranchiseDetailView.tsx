import React, { useState } from 'react';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  EpisodeNote,
  FavoriteCharacter,
  Rewatch,
} from '../types';
import { useJournal } from '../state/JournalContext';
import { Cover, StatusMark, Rating, Stepper, Button, EmptyState, Kbd } from '../ui';
import { formatDate } from '../lib/format';
import { seasonApi, movieApi } from '../api/client';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Film,
  MoreVertical,
  PenLine,
  Plus,
  Quote,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import './FranchiseDetailView.css';

interface FranchiseDetailViewProps {
  series: AnimeSeries;
  allRewatches?: Rewatch[];
  onBack: () => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason: (series: AnimeSeries) => void;
  onAddMovie: (series: AnimeSeries) => void;
  onEditSeason: (season: AnimeSeason) => void;
  onDeleteSeason: (id: number) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onEditMovie: (movie: AnimeMovie) => void;
  onDeleteMovie: (id: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onOpenEpisodeNotes: (season: AnimeSeason, note?: EpisodeNote) => void;
  onAddRewatchSeries?: (series: AnimeSeries) => void;
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddRewatchEpisode?: (season: AnimeSeason, episodeNumber: number) => void;
  onEditRewatch?: (rewatch: Rewatch) => void;
  onDeleteRewatch?: (id: number) => void;
  onAddCharacter: (series: AnimeSeries) => void;
  onEditCharacter?: (character: FavoriteCharacter) => void;
  onDeleteCharacter?: (id: number) => void;
  onRefresh?: () => Promise<void>;
}

export const FranchiseDetailView: React.FC<FranchiseDetailViewProps> = ({
  series,
  allRewatches = [],
  onBack,
  onEditSeries,
  onDeleteSeries,
  onAddSeason,
  onAddMovie,
  onEditSeason,
  onDeleteSeason,
  onSeasonProgressDelta,
  onEditMovie,
  onDeleteMovie,
  onMovieProgressDelta,
  onOpenEpisodeNotes,
  onAddRewatchSeason,
  onAddRewatchMovie,
  onAddCharacter,
  onRefresh,
}) => {
  const { openComposer, addToast, refreshAll } = useJournal();

  // Active release selection
  const defaultSeason = series.seasons?.find((s) => s.status === 'WATCHING') || series.seasons?.[0];
  const [selectedType, setSelectedType] = useState<'season' | 'movie'>(defaultSeason ? 'season' : 'movie');
  const [selectedId, setSelectedId] = useState<number>(defaultSeason?.id || series.movies?.[0]?.id || 0);

  const currentSeason = series.seasons?.find((s) => s.id === selectedId) || series.seasons?.[0];
  const currentMovie = series.movies?.find((m) => m.id === selectedId) || series.movies?.[0];

  const activeRelease = selectedType === 'season' ? currentSeason : currentMovie;

  // Inline lesson editing state
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonDraft, setLessonDraft] = useState(activeRelease?.notes || '');
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // Collapsible details section
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const releaseTitle =
    selectedType === 'season'
      ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} · ${activeRelease?.title}`
      : `Film · ${activeRelease?.title}`;

  const coverUrl =
    activeRelease?.cover_image_url ||
    (activeRelease as any)?.image_url ||
    series.cover_image_url;

  // Save inline lesson
  const handleSaveInlineLesson = async () => {
    if (!activeRelease) return;
    try {
      setIsSavingLesson(true);
      if (selectedType === 'season') {
        await seasonApi.update(activeRelease.id, { notes: lessonDraft.trim() });
      } else {
        await movieApi.update(activeRelease.id, { notes: lessonDraft.trim() });
      }
      setIsEditingLesson(false);
      addToast('Lesson updated');
      if (onRefresh) await onRefresh();
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving lesson: ${err.message}`, 'error');
    } finally {
      setIsSavingLesson(false);
    }
  };

  // Episode memories mapped by episode number
  const episodeNotesMap = React.useMemo(() => {
    const map = new Map<number, EpisodeNote>();
    if (selectedType === 'season' && currentSeason?.episode_notes) {
      currentSeason.episode_notes.forEach((ep) => {
        map.set(ep.episode_number, ep);
      });
    }
    return map;
  }, [selectedType, currentSeason]);

  // Rewatches for active release
  const releaseRewatches = React.useMemo(() => {
    if (!activeRelease) return [];
    return allRewatches.filter((r) => {
      if (selectedType === 'season') return r.season_id === activeRelease.id || r.target_id === activeRelease.id;
      return r.movie_id === activeRelease.id || r.target_id === activeRelease.id;
    });
  }, [allRewatches, selectedType, activeRelease]);

  return (
    <div className="lamplight-folio">
      <div className="lamplight-folio-grid">
        {/* Left Column: Identity & Release Navigation */}
        <aside className="lamplight-identity-col">
          <button type="button" className="lamplight-identity-back" onClick={onBack}>
            <ArrowLeft size={14} />
            <span>Anime Journal</span>
          </button>

          <div className="lamplight-identity-cover-wrap">
            <Cover
              title={series.title}
              subtitle={series.romaji_title}
              imageUrl={coverUrl}
              variant="poster"
            />
          </div>

          <div>
            <h1 className="lamplight-identity-title">{series.title}</h1>
            {(series.japanese_title || series.romaji_title) && (
              <span className="lamplight-identity-sub">
                {[series.romaji_title, series.japanese_title].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>

          {activeRelease && (
            <>
              <div className="lamplight-identity-meta-row">
                <StatusMark status={activeRelease.status} />
                {activeRelease.rating && <Rating score={activeRelease.rating} />}
              </div>

              {selectedType === 'season' && currentSeason && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Stepper
                    current={currentSeason.progress || 0}
                    total={currentSeason.total_episodes}
                    unit="eps"
                    onDelta={(delta) => onSeasonProgressDelta(currentSeason.id, delta)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<PenLine size={12} />}
                    onClick={() =>
                      openComposer({
                        targetKind: 'season',
                        id: currentSeason.id,
                        title: series.title,
                        context: `Season ${currentSeason.season_number}`,
                        defaultKind: 'episode',
                        episodeNumber: (currentSeason.progress || 0) + 1,
                      })
                    }
                  >
                    Note ep {(currentSeason.progress || 0) + 1}
                  </Button>
                </div>
              )}

              {selectedType === 'movie' && currentMovie && (
                <Stepper
                  current={currentMovie.progress_minutes || 0}
                  total={currentMovie.total_minutes}
                  unit="min"
                  step={10}
                  onDelta={(delta) => onMovieProgressDelta(currentMovie.id, delta)}
                />
              )}
            </>
          )}

          {/* Release Switcher */}
          <div className="lamplight-release-nav">
            <span className="lamplight-release-label">Releases & Seasons</span>
            <div className="lamplight-release-pills">
              {series.seasons?.map((s) => (
                <button
                  key={`s-${s.id}`}
                  type="button"
                  className={`lamplight-release-pill ${selectedType === 'season' && selectedId === s.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedType('season');
                    setSelectedId(s.id);
                    setLessonDraft(s.notes || '');
                    setIsEditingLesson(false);
                  }}
                >
                  <span>Season {s.season_number}: {s.title}</span>
                  <StatusMark status={s.status} showLabel={false} />
                </button>
              ))}

              {series.movies?.map((m) => (
                <button
                  key={`m-${m.id}`}
                  type="button"
                  className={`lamplight-release-pill ${selectedType === 'movie' && selectedId === m.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedType('movie');
                    setSelectedId(m.id);
                    setLessonDraft(m.notes || '');
                    setIsEditingLesson(false);
                  }}
                >
                  <span>Film: {m.title}</span>
                  <StatusMark status={m.status} showLabel={false} />
                </button>
              ))}

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus size={12} />}
                  onClick={() => onAddSeason(series)}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  Season
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus size={12} />}
                  onClick={() => onAddMovie(series)}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  Film
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <Button
              variant="primary"
              icon={<PenLine size={14} />}
              onClick={() =>
                openComposer({
                  targetKind: selectedType,
                  id: activeRelease?.id || series.id,
                  title: series.title,
                  context: releaseTitle,
                  defaultKind: 'lesson',
                })
              }
            >
              Write Reflection
            </Button>

            <Button
              variant="secondary"
              icon={<RotateCcw size={14} />}
              onClick={() => {
                if (selectedType === 'season' && currentSeason) onAddRewatchSeason(currentSeason);
                else if (selectedType === 'movie' && currentMovie) onAddRewatchMovie(currentMovie);
              }}
            >
              Log Return Pass
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditSeries(series)}
            >
              Edit franchise details
            </Button>
          </div>
        </aside>

        {/* Right Column: The Journal Folio Reading Spread */}
        <section className="lamplight-spread-col">
          {/* 1. Main Lesson Paper */}
          <article className="lamplight-lesson-folio">
            <div className="lamplight-paper-rule" aria-hidden="true" />

            <header className="lamplight-lesson-folio-head">
              <span>{releaseTitle} · Lesson & Takeaways</span>
              <div>
                {isEditingLesson ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingLesson(false)} disabled={isSavingLesson}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveInlineLesson} loading={isSavingLesson}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<PenLine size={12} />}
                    onClick={() => {
                      setLessonDraft(activeRelease?.notes || '');
                      setIsEditingLesson(true);
                    }}
                  >
                    Edit lesson
                  </Button>
                )}
              </div>
            </header>

            {isEditingLesson ? (
              <textarea
                className="lamplight-lesson-folio-textarea"
                value={lessonDraft}
                onChange={(e) => setLessonDraft(e.target.value)}
                placeholder="Write the philosophical takeaways, emotional memories, and life lessons that stayed with you…"
                autoFocus
              />
            ) : activeRelease?.notes?.trim() ? (
              <div className="lamplight-lesson-folio-text">
                “{activeRelease.notes}”
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--paper-ink-2)' }}>
                <Quote size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, marginBottom: 16 }}>
                  No reflection written for this release yet.
                </p>
                <Button
                  variant="primary"
                  icon={<PenLine size={14} />}
                  onClick={() => {
                    setLessonDraft('');
                    setIsEditingLesson(true);
                  }}
                >
                  Write what stayed
                </Button>
              </div>
            )}
          </article>

          {/* 2. Episode Memories Grid (if Season) */}
          {selectedType === 'season' && currentSeason && (
            <div className="lamplight-episode-grid-wrap">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)' }}>
                    Episode Memories
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {episodeNotesMap.size} of {currentSeason.total_episodes || '—'} episodes noted
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => onOpenEpisodeNotes(currentSeason)}
                >
                  Log Memory
                </Button>
              </div>

              {currentSeason.total_episodes && currentSeason.total_episodes > 0 ? (
                <div className="lamplight-episode-cells">
                  {Array.from({ length: currentSeason.total_episodes }, (_, i) => i + 1).map((epNum) => {
                    const note = episodeNotesMap.get(epNum);
                    return (
                      <button
                        key={epNum}
                        type="button"
                        className={`lamplight-episode-cell ${note ? 'has-note' : ''}`}
                        title={note ? `Ep ${epNum}: "${note.note}"` : `Ep ${epNum} (Click to note)`}
                        onClick={() => {
                          if (note) onOpenEpisodeNotes(currentSeason, note);
                          else {
                            openComposer({
                              targetKind: 'season',
                              id: currentSeason.id,
                              title: series.title,
                              context: `Season ${currentSeason.season_number}`,
                              defaultKind: 'episode',
                              episodeNumber: epNum,
                            });
                          }
                        }}
                      >
                        <span>{epNum}</span>
                        {note && <div className="lamplight-episode-cell-dot" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>
                  Total episodes not set for this season.
                </p>
              )}
            </div>
          )}

          {/* 3. Returns Timeline: Then vs Now */}
          {releaseRewatches.length > 0 && (
            <div className="lamplight-returns-spread">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RotateCcw size={16} color="var(--lamp)" />
                  <span>Returns Over Time</span>
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {releaseRewatches.length} return pass{releaseRewatches.length > 1 ? 'es' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {releaseRewatches.map((r, idx) => (
                  <div key={r.id} className="lamplight-then-now-card">
                    <div className="lamplight-then-now-meta">
                      <span>Pass {idx + 1} · {formatDate(r.finish_date || r.start_date)}</span>
                      {r.rating && <span>★ {r.rating}/10</span>}
                    </div>
                    {r.notes && (
                      <p className="lamplight-then-now-body">
                        “{r.notes}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. People Remembered in this Title */}
          <div className="lamplight-returns-spread">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--lamp)" />
                <span>People Remembered</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => onAddCharacter(series)}
              >
                Add Person
              </Button>
            </div>

            {series.favorite_characters?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {series.favorite_characters.map((char) => (
                  <div
                    key={char.id}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      padding: 12,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                      <Cover
                        title={char.name}
                        imageUrl={char.cover_image_url || char.image_url}
                        variant="portrait"
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 14, color: 'var(--text)', display: 'block' }}>{char.name}</strong>
                      {char.why && (
                        <p style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          “{char.why}”
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>
                No characters remembered yet from this series.
              </p>
            )}
          </div>

          {/* 5. Collapsible Metadata */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => setDetailsExpanded((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>About this title (studios, genres, dates)</span>
              {detailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {detailsExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 13, color: 'var(--text-2)' }}>
                {series.genres?.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--text)' }}>Genres: </strong>
                    <span>{series.genres.map((g) => g.name).join(', ')}</span>
                  </div>
                )}
                {series.studios?.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--text)' }}>Studios: </strong>
                    <span>{series.studios.map((st) => st.name).join(', ')}</span>
                  </div>
                )}
                <div>
                  <strong style={{ color: 'var(--text)' }}>First Logged: </strong>
                  <span>{formatDate(series.created_at)}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
