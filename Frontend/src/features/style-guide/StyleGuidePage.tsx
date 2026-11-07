import React, { useMemo, useState } from 'react';
import { Flame, Minus, PenLine, Plus, RotateCcw, Trophy, Undo2 } from 'lucide-react';
import { useJournalData } from '../../state/JournalContext';
import { formatDate } from '../../lib/format';
import { overallSeriesStatus } from '../../lib/selectors/seriesStatus';
import { clampAccent, contrastRatio, dominantColor, titleAccent } from '../../lib/color/accent';
import type { AnimeSeries } from '../../types';
import {
  cardTier,
  CoverArt,
  EpisodeMap,
  KfButton,
  KfCharacterCard,
  NotePaper,
  PosterCard,
  ScoreTag,
  StatusTag,
} from '../../ui/keyframe';
import type { CardTier } from '../../ui/keyframe';
import { ArtRequest, useLookupArt } from './useLookupArt';
import '../../styles/keyframe.css';
import './StyleGuide.css';

const seriesMeta = (series: AnimeSeries) => {
  const seasons = series.seasons?.length ?? 0;
  const movies = series.movies?.length ?? 0;
  return [seasons && `${seasons} season${seasons > 1 ? 's' : ''}`, movies && `${movies} movie${movies > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' · ');
};

const latestNote = (series: AnimeSeries) =>
  series.seasons?.map((s) => s.notes).filter((n) => n?.trim()).at(-1) ??
  series.movies?.map((m) => m.notes).filter((n) => n?.trim()).at(-1) ??
  null;

const bestScore = (series: AnimeSeries) => {
  const scores = [...(series.seasons ?? []), ...(series.movies ?? [])].flatMap((r) => r.rating ?? []);
  return scores.length ? Math.max(...scores) : null;
};

const SWATCHES = [
  { name: 'Background', hex: '#0D1017' },
  { name: 'Panel', hex: '#171B25' },
  { name: 'Raised', hex: '#212734' },
  { name: 'Text', hex: '#F2F4F8' },
  { name: 'Secondary text', hex: '#A8B0C0' },
  { name: 'Brand', hex: '#FF5A36', note: 'Main action' },
  { name: 'Gold', hex: '#FFC857', note: 'Rewards and 9–10 only' },
  { name: 'Paper', hex: '#F4F6F1', note: 'Your writing only' },
  { name: 'Completed', hex: '#4FD1B5' },
  { name: 'Plan', hex: '#7EA8FF' },
  { name: 'On hold', hex: '#E8B14C' },
  { name: 'Dropped', hex: '#7B8291' },
];

const SAMPLE_ACHIEVEMENTS = [
  { name: 'First Cour', detail: 'Finish 12 or more episodes', current: 12, goal: 12 },
  { name: 'Every Episode Counts', detail: 'A note on every episode of a season', current: 3, goal: 28 },
  { name: 'Changed My Mind', detail: 'A rewatch rating 2+ away from the original', current: 0, goal: 1 },
];

const StyleGuidePage: React.FC = () => {
  const { loading, seriesList, characterList } = useJournalData();

  const heroSeries = useMemo(
    () => seriesList.find((s) => s.seasons?.some((season) => season.status === 'WATCHING')) ?? seriesList[0],
    [seriesList]
  );
  const heroSeason = heroSeries?.seasons?.find((s) => s.status === 'WATCHING') ?? heroSeries?.seasons?.[0];

  const artRequests = useMemo<ArtRequest[]>(
    () => [
      ...seriesList.map((s) => ({ key: `series-${s.id}`, query: s.romaji_title || s.title, kind: 'anime' as const })),
      ...characterList.map((c) => ({ key: `char-${c.id}`, query: c.name, kind: 'character' as const })),
    ],
    [seriesList, characterList]
  );
  const { art, unavailable } = useLookupArt(artRequests);

  // Everything below is local preview state. Nothing on this page saves.
  const [extraEpisodes, setExtraEpisodes] = useState(0);
  const [xpGain, setXpGain] = useState(0);
  const [quickLogFor, setQuickLogFor] = useState<number | null>(null);
  const [quickRating, setQuickRating] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [accent, setAccent] = useState<string | null>(null);

  if (loading) return <div className="kf kf-guide" style={{ minHeight: '100vh' }} />;

  if (!heroSeries || !heroSeason) {
    return (
      <div className="kf kf-guide" style={{ minHeight: '100vh', padding: 32 }}>
        <p>Add an anime with a season to preview the Keyframe design with your own titles.</p>
      </div>
    );
  }

  const heroAccent = accent ?? titleAccent(heroSeries.title);
  const total = heroSeason.total_episodes ?? Math.max(heroSeason.progress + 12, 12);
  const watched = Math.min(total, (heroSeason.progress ?? 0) + extraEpisodes);
  const nextEpisode = watched + 1;
  const heroArt = art[`series-${heroSeries.id}`];
  const episodeNotes = heroSeason.episode_notes ?? [];
  const selectedNote = episodeNotes.find((n) => n.episode_number === selectedEpisode);

  const logEpisode = () => {
    if (watched >= total) return;
    setExtraEpisodes((n) => n + 1);
    setXpGain((n) => n + 1);
    setQuickLogFor(nextEpisode);
    setQuickRating(null);
  };
  const undoEpisode = () => {
    setExtraEpisodes((n) => Math.max(0, n - 1));
    setXpGain((n) => Math.max(0, n - 1));
    setQuickLogFor(null);
  };

  const character = characterList[0];
  const tierLadder: { tier: CardTier; why: string | null }[] = character
    ? [
        { tier: 'sketch', why: null },
        { tier: 'inked', why: null },
        { tier: 'color', why: character.why },
        { tier: 'foil', why: character.why },
      ]
    : [];

  return (
    <div className="kf kf-guide" style={{ '--title-accent': heroAccent } as React.CSSProperties}>
      <div className="kf-guide-banner" role="note">
        <strong>Keyframe preview.</strong> Your real titles and notes, with no changes saved.{' '}
        {unavailable
          ? 'The art search is offline, so covers show the designed fallback.'
          : 'Art is each title’s first search match, not yet added to your journal.'}
      </div>

      {/* The thesis: your show, huge, with the next action one tap away */}
      <header className="kf-hero">
        {heroArt && <div className="kf-hero-backdrop" style={{ backgroundImage: `url("${heroArt}")` }} aria-hidden="true" />}
        <div className="kf-hero-inner">
          <div className="kf-hero-poster">
            <CoverArt
              title={heroSeries.title}
              imageUrl={heroArt}
              accent={heroAccent}
              onImageReady={(image) => {
                const color = dominantColor(image);
                if (color) setAccent(clampAccent(color));
              }}
            />
          </div>
          <div className="kf-hero-copy">
            <div className="kf-hero-status">
              <StatusTag status={heroSeason.status} />
              <ScoreTag score={heroSeason.rating} />
            </div>
            <h1>{heroSeries.title}</h1>
            <p className="kf-hero-progress">
              Season {heroSeason.season_number} · <strong>Ep {watched}</strong> of {total}
            </p>
            <div className="kf-hero-bar" aria-hidden="true">
              <span style={{ width: `${(watched / total) * 100}%` }} />
            </div>
            <div className="kf-hero-actions">
              <KfButton variant="primary" size="lg" icon={<Plus size={18} />} onClick={logEpisode} disabled={watched >= total}>
                Ep {nextEpisode}
              </KfButton>
              <KfButton size="lg" icon={<PenLine size={16} />}>Note</KfButton>
              <KfButton variant="quiet" size="lg" icon={<RotateCcw size={16} />}>Rewatch</KfButton>
              {xpGain > 0 && <span key={xpGain} className="kf-xp-pop" aria-live="polite">+{xpGain} XP</span>}
            </div>

            {quickLogFor && (
              <form className="kf-quicklog" onSubmit={(e) => e.preventDefault()}>
                <div className="kf-quicklog-head">
                  <strong>Ep {quickLogFor}, how was it?</strong>
                  <KfButton variant="quiet" icon={<Undo2 size={14} />} onClick={undoEpisode}>Undo</KfButton>
                </div>
                <div className="kf-quicklog-scores" role="group" aria-label="Quick rating">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                    <button
                      key={score}
                      type="button"
                      aria-pressed={quickRating === score}
                      className={`${quickRating === score ? 'is-on' : ''} ${score >= 9 ? 'is-high' : ''}`}
                      onClick={() => setQuickRating(score)}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <label className="kf-quicklog-line">
                  <span>One line, if you want</span>
                  <input type="text" placeholder="What stayed with you?" />
                </label>
              </form>
            )}
          </div>
          {heroSeries.japanese_title && (
            <div className="kf-hero-jp" lang="ja" aria-hidden="true">{heroSeries.japanese_title}</div>
          )}
        </div>
      </header>

      <main className="kf-guide-body">
        <section aria-labelledby="sg-map">
          <div className="kf-section-head">
            <h2 id="sg-map">Episode map</h2>
            <p>Lit means watched, filled has a note, gold is a 9 or 10. Log the next episode and watch it fill.</p>
          </div>
          <EpisodeMap
            total={total}
            watched={watched}
            selected={selectedEpisode}
            onSelect={setSelectedEpisode}
            notes={episodeNotes.map((n) => ({ episode: n.episode_number, rating: n.rating }))}
          />
          {selectedEpisode && (
            <p className="kf-map-detail" aria-live="polite">
              <strong>Ep {selectedEpisode}.</strong> {selectedNote?.note ?? 'No note yet.'}
            </p>
          )}
        </section>

        <section aria-labelledby="sg-note" className="kf-note-section">
          <div className="kf-section-head">
            <h2 id="sg-note">Your words, on key-frame paper</h2>
            <p>Paper appears only where you read or write. Everything else stays in the dark.</p>
          </div>
          <NotePaper slate={[`Season ${heroSeason.season_number}`, `${heroSeason.title}`, heroSeason.status === 'WATCHING' ? 'In progress' : formatDate(heroSeason.finish_date)]}>
            <p>{heroSeason.notes || 'What stayed with you?'}</p>
          </NotePaper>
        </section>

        <section aria-labelledby="sg-wall">
          <div className="kf-section-head">
            <h2 id="sg-wall">Library wall</h2>
            <p>Hover or focus a poster to read your note. A pencil means no note yet.</p>
          </div>
          <div className="kf-wall">
            {seriesList.map((series) => {
              const season = series.seasons?.find((s) => s.status === 'WATCHING');
              return (
                <PosterCard
                  key={series.id}
                  to={`/anime/${series.id}`}
                  title={series.title}
                  imageUrl={art[`series-${series.id}`]}
                  status={overallSeriesStatus(series)}
                  score={bestScore(series)}
                  meta={seriesMeta(series)}
                  latestNote={latestNote(series)}
                  progress={season ? { current: season.progress, total: season.total_episodes } : undefined}
                />
              );
            })}
          </div>
        </section>

        {character && (
          <section aria-labelledby="sg-cards">
            <div className="kf-section-head">
              <h2 id="sg-cards">Character cards level up</h2>
              <p>
                {character.name} at each tier: name, then portrait, then why they matter, then three or more images.
                Your current {characterList.length} characters are below.
              </p>
            </div>
            <div className="kf-card-row">
              {tierLadder.map(({ tier, why }) => (
                <KfCharacterCard
                  key={tier}
                  tier={tier}
                  name={character.name}
                  seriesTitle={character.series_title}
                  why={why}
                  imageUrl={art[`char-${character.id}`]}
                />
              ))}
            </div>
            <div className="kf-card-row kf-card-row-real">
              {characterList.slice(1).map((c) => (
                <KfCharacterCard
                  key={c.id}
                  tier={cardTier({
                    hasPortrait: Boolean(c.cover_image_url || art[`char-${c.id}`]),
                    hasWhy: Boolean(c.why?.trim()),
                    imageCount: c.images?.length ?? 0,
                  })}
                  name={c.name}
                  seriesTitle={c.series_title}
                  why={c.why}
                  imageUrl={c.cover_image_url || art[`char-${c.id}`]}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="sg-progress">
          <div className="kf-section-head">
            <h2 id="sg-progress">Progress</h2>
            <p>Sample numbers for now. Real ones arrive with the activity table in Phase 5.</p>
          </div>
          <div className="kf-progress-grid">
            <div className="kf-level">
              <span className="kf-level-tag">Level 4</span>
              <strong>Otaku</strong>
              <div className="kf-xp-track" aria-hidden="true"><span style={{ width: '64%' }} /></div>
              <p>320 of 500 XP to Critic</p>
            </div>
            <div className="kf-streak">
              <Flame size={22} aria-hidden="true" />
              <strong>6 days</strong>
              <p>1 rest day available this week</p>
            </div>
            <ul className="kf-achievements">
              {SAMPLE_ACHIEVEMENTS.map((a) => {
                const earned = a.current >= a.goal;
                return (
                  <li key={a.name} className={earned ? 'is-earned' : ''}>
                    <Trophy size={18} aria-hidden="true" />
                    <div>
                      <strong>{a.name}</strong>
                      <p>{a.detail}</p>
                    </div>
                    <span>{earned ? 'Earned' : `${a.current} of ${a.goal}`}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section aria-labelledby="sg-system">
          <div className="kf-section-head">
            <h2 id="sg-system">System</h2>
            <p>Each color's contrast with its best text color.</p>
          </div>
          <div className="kf-swatches">
            {SWATCHES.map((s) => {
              const onDark = contrastRatio(s.hex, '#0D1017');
              const onLight = contrastRatio(s.hex, '#F2F4F8');
              return (
                <div key={s.name} className="kf-swatch">
                  <span style={{ background: s.hex }} aria-hidden="true" />
                  <strong>{s.name}</strong>
                  <code>{s.hex}</code>
                  <small>{Math.max(onDark, onLight).toFixed(1)}:1{s.note ? ` · ${s.note}` : ''}</small>
                </div>
              );
            })}
          </div>
          <div className="kf-type-samples">
            <p className="kf-type-display">Beyond the journey’s end</p>
            <p className="kf-type-ui">Geist runs the interface: buttons, labels and numbers like Ep 14 of 28.</p>
            <p className="kf-type-note">Literata carries your words, because rereading should feel like reading.</p>
            <p className="kf-type-jp" lang="ja">葬送のフリーレン</p>
          </div>
          <div className="kf-control-row">
            <KfButton variant="primary" icon={<Plus size={16} />}>Primary</KfButton>
            <KfButton>Secondary</KfButton>
            <KfButton variant="quiet" icon={<Minus size={16} />}>Quiet</KfButton>
            <KfButton variant="danger">Delete</KfButton>
            <KfButton variant="primary" disabled>Disabled</KfButton>
          </div>
          <div className="kf-control-row">
            {['WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'ON_HOLD', 'DROPPED'].map((s) => (
              <StatusTag key={s} status={s} />
            ))}
            <ScoreTag score={7} />
            <ScoreTag score={10} />
          </div>
        </section>
      </main>

      {/* Phone: the next episode stays under the thumb */}
      <div className="kf-thumbbar">
        <span>{heroSeries.title}<small>Ep {watched} of {total}</small></span>
        <KfButton variant="primary" icon={<Plus size={16} />} onClick={logEpisode} disabled={watched >= total}>
          Ep {nextEpisode}
        </KfButton>
      </div>
    </div>
  );
};

export default StyleGuidePage;
