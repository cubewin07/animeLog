import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Film,
  PenLine,
  Sparkles,
  Tv,
  Users,
} from 'lucide-react';
import { useJournalActions, useJournalData, useJournalUI } from '../../state/JournalContext';
import { useReflections } from '../../state/useReflections';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { cloudinaryThumbUrl } from '../../lib/images/cloudinary';
import { formatDate, truncateText } from '../../lib/format';
import { downloadQuoteCard } from '../../utils/cardGenerator';
import { CoverArt, KfButton, NotePaper, ScoreTag, TIER_LABEL } from '../../ui/keyframe';
import { computeLibraryAnalytics, computeYearRecap, type YearRecap } from './meStats';
import '../../styles/keyframe.css';
import './MePage.css';

const SLIDE_LABELS = [
  'Year in Numbers',
  'Title of the Year',
  'Your Taste',
  'Character Spotlight',
  'Best Note on Paper',
  'Summary & Share',
] as const;

const TOTAL_SLIDES = SLIDE_LABELS.length;

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (let i = 0; i < words.length; i += 1) {
    const candidate = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines - 1) {
        const rest = [line, ...words.slice(i + 1)].join(' ');
        let trimmed = rest;
        while (ctx.measureText(`${trimmed}…`).width > maxWidth && trimmed.length > 4) {
          trimmed = trimmed.slice(0, -1).trimEnd();
        }
        lines.push(`${trimmed}…`);
        return lines;
      }
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function downloadRecapCard(recap: YearRecap, accent: string): void {
  const width = 1200;
  const height = 675;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#0d1017';
  ctx.fillRect(0, 0, width, height);

  if (recap.isFullColorUnlocked) {
    const glow = ctx.createRadialGradient(180, 120, 20, 180, 120, 560);
    glow.addColorStop(0, `${accent}38`);
    glow.addColorStop(1, 'rgba(13, 16, 23, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  // Outer frame
  ctx.strokeStyle = 'rgba(242, 244, 248, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(24, 24, width - 48, height - 48, 16);
  ctx.stroke();

  // Eyebrow
  ctx.fillStyle = recap.isFullColorUnlocked ? '#ff5a36' : '#a8b0c0';
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    recap.isFullColorUnlocked
      ? `ANIMELOG · ${recap.year} YEARLY RECAP`
      : `ANIMELOG · ${recap.year} SKETCH EDITION`,
    64,
    82,
  );

  // Big year headline
  ctx.fillStyle = '#f2f4f8';
  ctx.font = '800 72px system-ui, -apple-system, sans-serif';
  ctx.fillText(String(recap.year), 64, 158);

  // Stats row
  const stats = [
    { label: 'HOURS', value: `${recap.hours}h` },
    { label: 'EPISODES', value: String(recap.episodes) },
    { label: 'MOVIES', value: String(recap.movies) },
    { label: 'BOOKS', value: String(recap.books) },
    { label: 'NOTES', value: String(recap.notesCount) },
  ];

  stats.forEach((stat, idx) => {
    const x = 64 + idx * 218;
    const y = 196;
    ctx.fillStyle = '#171b25';
    ctx.beginPath();
    ctx.roundRect(x, y, 200, 108, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(242, 244, 248, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f2f4f8';
    ctx.font = '800 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(stat.value, x + 20, y + 54);

    ctx.fillStyle = '#a8b0c0';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(stat.label, x + 20, y + 84);
  });

  // Highlights column (left)
  const highlights = [
    { label: 'TITLE OF THE YEAR', val: recap.topTitle ? recap.topTitle.title : 'Still unfolding' },
    { label: 'TOP GENRE', val: recap.topGenre ? recap.topGenre.name : 'Exploring' },
    { label: 'TOP STUDIO', val: recap.topStudio ? recap.topStudio.name : 'Various' },
    {
      label: 'CHARACTER SPOTLIGHT',
      val: recap.mostWrittenCharacter ? recap.mostWrittenCharacter.character.name : 'None yet',
    },
  ];

  highlights.forEach((item, idx) => {
    const x = 64;
    const y = 338 + idx * 66;
    ctx.fillStyle = '#a8b0c0';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(item.label, x, y);

    ctx.fillStyle = '#f2f4f8';
    ctx.font = '700 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(truncateText(item.val, 34), x, y + 28);
  });

  // Best note paper sheet (right)
  const paperX = 560;
  const paperY = 330;
  const paperW = 576;
  const paperH = 264;

  ctx.fillStyle = '#f4f6f1';
  ctx.beginPath();
  ctx.roundRect(paperX, paperY, paperW, paperH, 10);
  ctx.fill();

  // Blue pencil rules
  ctx.strokeStyle = 'rgba(143, 176, 217, 0.45)';
  ctx.lineWidth = 1;
  for (let ruleY = paperY + 68; ruleY < paperY + paperH - 24; ruleY += 32) {
    ctx.beginPath();
    ctx.moveTo(paperX + 28, ruleY);
    ctx.lineTo(paperX + paperW - 28, ruleY);
    ctx.stroke();
  }

  ctx.fillStyle = '#33507a';
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    recap.bestNote ? `BEST NOTE · ${recap.bestNote.title.toUpperCase()}` : 'JOURNAL NOTE',
    paperX + 28,
    paperY + 38,
  );

  ctx.fillStyle = '#1e2430';
  ctx.font = 'italic 20px Georgia, serif';
  const noteText = recap.bestNote
    ? `“${recap.bestNote.note.trim()}”`
    : 'Keep logging episodes and writing what stayed with you.';
  const lines = wrapCanvasText(ctx, noteText, paperW - 56, 5);
  lines.forEach((l, idx) => {
    ctx.fillText(l, paperX + 28, paperY + 88 + idx * 32);
  });

  // Footer
  ctx.fillStyle = '#a8b0c0';
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Personal Anime & Book Journal', 64, height - 48);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animelog-recap-${recap.year}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

interface RecapStoryStageProps {
  recap: YearRecap;
}

const RecapStoryStage: React.FC<RecapStoryStageProps> = ({ recap }) => {
  const {
    composerOpen,
    paletteOpen,
    entryModalOpen,
    episodeNoteModalOpen,
    rewatchModalOpen,
    characterModalOpen,
    confirmDialog,
    finalePrompt,
  } = useJournalUI();

  const [slideIndex, setSlideIndex] = useState(0);
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const anyModalOpen =
    composerOpen ||
    paletteOpen ||
    entryModalOpen ||
    episodeNoteModalOpen ||
    rewatchModalOpen ||
    characterModalOpen ||
    confirmDialog.isOpen ||
    Boolean(finalePrompt);

  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(
    recap.topTitle?.title ?? `${recap.year} Recap`,
    recap.topTitle?.coverUrl,
  );

  const backdropUrl = useMemo(
    () => cloudinaryThumbUrl(recap.topTitle?.coverUrl, 'hero') ?? recap.topTitle?.coverUrl ?? null,
    [recap.topTitle?.coverUrl],
  );

  const goPrev = useCallback(() => {
    setSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setSlideIndex((prev) => Math.min(TOTAL_SLIDES - 1, prev + 1));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (anyModalOpen || e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          Boolean(target.closest('[contenteditable="true"]')))
      ) {
        return;
      }

      if (tablistRef.current && target && tablistRef.current.contains(target)) {
        return;
      }

      if (document.querySelector('dialog[open], [role="dialog"], [aria-modal="true"]')) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [anyModalOpen, goPrev, goNext]);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % TOTAL_SLIDES;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = TOTAL_SLIDES - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      e.stopPropagation();
      setSlideIndex(nextIdx);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const showFullColorBackdrop =
    recap.isFullColorUnlocked && backdropUrl && failedBackdropUrl !== backdropUrl;

  const editionStyle = recap.isFullColorUnlocked
    ? ({ '--title-accent': accent } as React.CSSProperties)
    : undefined;

  return (
    <div className="kf-recap-stage-wrap">
      {/* Edition Banner */}
      <div
        className={`kf-recap-edition ${recap.isFullColorUnlocked ? 'is-full-color' : 'is-sketch'}`}
        style={editionStyle}
      >
        <div className="kf-recap-edition-copy">
          <span className="kf-recap-edition-badge">
            <Sparkles size={13} aria-hidden="true" />
            <span>
              {recap.isFullColorUnlocked
                ? `${recap.year} Full-Color Edition`
                : `${recap.year} Ink Sketch Edition`}
            </span>
          </span>
          <p>
            {recap.isFullColorUnlocked
              ? `Your ${recap.year} story is glowing in full color — ${recap.titlesTouched} ${recap.titlesTouched === 1 ? 'title' : 'titles'} shaped this year.`
              : `Log a few more episodes or notes in ${recap.year} to unlock the full-color edition.`}
          </p>
        </div>
      </div>

      {/* Swipeable Story Card */}
      <section
        className={`kf-recap-deck ${recap.isFullColorUnlocked ? 'is-full-color' : 'is-sketch'}`}
        style={editionStyle}
        aria-roledescription="carousel"
        aria-label={`${recap.year} Yearly Recap`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {showFullColorBackdrop && (
          <div className="kf-recap-backdrop" aria-hidden="true">
            <img
              src={backdropUrl}
              alt=""
              className="kf-recap-backdrop-img"
              onError={() => setFailedBackdropUrl(backdropUrl)}
            />
          </div>
        )}

        {/* Top 6 progress bars */}
        <div
          ref={tablistRef}
          className="kf-recap-progress"
          role="tablist"
          aria-label="Recap slides"
        >
          {SLIDE_LABELS.map((label, idx) => (
            <button
              key={label}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              id={`kf-recap-tab-${idx}`}
              aria-selected={slideIndex === idx}
              aria-controls={`kf-recap-panel-${idx}`}
              tabIndex={slideIndex === idx ? 0 : -1}
              aria-label={`Slide ${idx + 1}: ${label}`}
              className={`kf-recap-seg${idx < slideIndex ? ' is-done' : ''}${idx === slideIndex ? ' is-current' : ''}`}
              onClick={() => setSlideIndex(idx)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
            >
              <span className="kf-recap-seg-bar" />
            </button>
          ))}
        </div>

        {/* Slide Content */}
        <div
          className="kf-recap-slide"
          role="tabpanel"
          id={`kf-recap-panel-${slideIndex}`}
          aria-labelledby={`kf-recap-tab-${slideIndex}`}
          tabIndex={0}
        >
          {/* Slide 1: Year in Numbers */}
          {slideIndex === 0 && (
            <div className="kf-recap-slide-body is-numbers">
              <span className="kf-recap-eyebrow">01 · Your Year in Numbers</span>
              <h2>{recap.year} in Motion</h2>
              <div className="kf-recap-hero-metric">
                <strong>{recap.hours.toLocaleString()}</strong>
                <span>hours watched</span>
              </div>
              <div className="kf-recap-number-grid">
                <div className="kf-recap-num-tile">
                  <Tv size={16} aria-hidden="true" />
                  <strong>{recap.episodes}</strong>
                  <span>Episodes</span>
                </div>
                <div className="kf-recap-num-tile">
                  <Film size={16} aria-hidden="true" />
                  <strong>{recap.movies}</strong>
                  <span>Movies</span>
                </div>
                <div className="kf-recap-num-tile">
                  <BookOpen size={16} aria-hidden="true" />
                  <strong>{recap.books}</strong>
                  <span>Books</span>
                </div>
                <div className="kf-recap-num-tile">
                  <PenLine size={16} aria-hidden="true" />
                  <strong>{recap.notesCount}</strong>
                  <span>Notes</span>
                </div>
              </div>
            </div>
          )}

          {/* Slide 2: Title of the Year */}
          {slideIndex === 1 && (
            <div className="kf-recap-slide-body is-title">
              <span className="kf-recap-eyebrow">02 · Title of the Year</span>
              {recap.topTitle ? (
                <div className="kf-recap-title-split">
                  <Link viewTransition to={recap.topTitle.href} className="kf-recap-poster-link">
                    <CoverArt
                      title={recap.topTitle.title}
                      imageUrl={recap.topTitle.coverUrl}
                      accent={accent}
                      size="card"
                      onImageReady={onImageReady}
                      onCorsBlocked={onCorsBlocked}
                    />
                  </Link>
                  <div className="kf-recap-title-info">
                    <div className="kf-recap-title-badges">
                      <ScoreTag score={recap.topTitle.rating} />
                      {recap.topTitle.subtitle && (
                        <span className="kf-recap-subpill">{recap.topTitle.subtitle}</span>
                      )}
                    </div>
                    <h2>{recap.topTitle.title}</h2>
                    {recap.topTitle.note ? (
                      <p className="kf-recap-quote">“{truncateText(recap.topTitle.note, 220)}”</p>
                    ) : (
                      <p className="kf-recap-muted">
                        Stood at the top of your {recap.year} shelf.
                      </p>
                    )}
                    <Link viewTransition to={recap.topTitle.href} className="kf-recap-inline-link">
                      <span>Open title page</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="kf-recap-empty-slide">
                  <h2>No standout title in {recap.year} yet</h2>
                  <p>Log episodes or finish a book dated in {recap.year} to crown your top pick.</p>
                </div>
              )}
            </div>
          )}

          {/* Slide 3: Your Taste */}
          {slideIndex === 2 && (
            <div className="kf-recap-slide-body is-taste">
              <span className="kf-recap-eyebrow">03 · Your Taste</span>
              <h2>What Drew You In</h2>
              <div className="kf-recap-taste-grid">
                <div className="kf-recap-taste-card">
                  <span className="kf-recap-taste-kicker">Top Genre</span>
                  <strong>{recap.topGenre ? recap.topGenre.name : 'Still exploring'}</strong>
                  <p>
                    {recap.topGenre
                      ? `Appeared across ${recap.topGenre.count} ${recap.topGenre.count === 1 ? 'title' : 'titles'} in ${recap.year}.`
                      : 'Tag genres on your titles to reveal your year’s pattern.'}
                  </p>
                </div>
                <div className="kf-recap-taste-card">
                  <span className="kf-recap-taste-kicker">Top Studio</span>
                  <strong>{recap.topStudio ? recap.topStudio.name : 'Independent mix'}</strong>
                  <p>
                    {recap.topStudio
                      ? `Crafted ${recap.topStudio.count} ${recap.topStudio.count === 1 ? 'series' : 'series'} you watched in ${recap.year}.`
                      : 'Add studios to your anime entries to spotlight them here.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Slide 4: Character Spotlight */}
          {slideIndex === 3 && (
            <div className="kf-recap-slide-body is-character">
              <span className="kf-recap-eyebrow">04 · Character Spotlight</span>
              {recap.mostWrittenCharacter ? (
                <div className="kf-recap-char-split">
                  <Link
                    viewTransition
                    to={recap.mostWrittenCharacter.href}
                    className="kf-recap-char-portrait"
                  >
                    <CoverArt
                      title={recap.mostWrittenCharacter.character.name}
                      imageUrl={
                        recap.mostWrittenCharacter.tier === 'sketch'
                          ? null
                          : recap.mostWrittenCharacter.coverUrl
                      }
                      variant="portrait"
                      size="card"
                    />
                  </Link>
                  <div className="kf-recap-title-info">
                    <div className="kf-recap-title-badges">
                      <span className="kf-recap-subpill">
                        {TIER_LABEL[recap.mostWrittenCharacter.tier]} card
                      </span>
                      {recap.mostWrittenCharacter.seriesTitle && (
                        <span className="kf-recap-subpill">
                          {recap.mostWrittenCharacter.seriesTitle}
                        </span>
                      )}
                    </div>
                    <h2>{recap.mostWrittenCharacter.character.name}</h2>
                    {recap.mostWrittenCharacter.character.why ? (
                      <p className="kf-recap-quote">
                        “{truncateText(recap.mostWrittenCharacter.character.why, 240)}”
                      </p>
                    ) : (
                      <p className="kf-recap-muted">
                        Saved from your most active series of {recap.year}.
                      </p>
                    )}
                    <Link
                      viewTransition
                      to={recap.mostWrittenCharacter.href}
                      className="kf-recap-inline-link"
                    >
                      <span>Open character card</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="kf-recap-empty-slide">
                  <Users size={24} aria-hidden="true" />
                  <h2>No character spotlight for {recap.year}</h2>
                  <p>Save a favorite character on any anime you watched in {recap.year}.</p>
                </div>
              )}
            </div>
          )}

          {/* Slide 5: Best Note on Paper */}
          {slideIndex === 4 && (
            <div className="kf-recap-slide-body is-paper">
              <span className="kf-recap-eyebrow">
                05 · Best Note on Paper
                {recap.bestNoteIsFallback ? ' (From Your Archive)' : ''}
              </span>
              {recap.bestNote ? (
                <div className="kf-recap-paper-wrap">
                  <NotePaper
                    slate={[
                      recap.bestNote.title,
                      recap.bestNote.context,
                      recap.bestNote.dateStr ? formatDate(recap.bestNote.dateStr) : String(recap.year),
                      recap.bestNote.rating ? `${recap.bestNote.rating}/10` : '',
                    ].filter(Boolean)}
                  >
                    <p>{truncateText(recap.bestNote.note, 360)}</p>
                  </NotePaper>
                </div>
              ) : (
                <div className="kf-recap-empty-slide">
                  <PenLine size={24} aria-hidden="true" />
                  <h2>No written notes yet</h2>
                  <p>Write what stayed with you after an episode, movie, or book to preserve it on paper.</p>
                </div>
              )}
            </div>
          )}

          {/* Slide 6: Summary & Share */}
          {slideIndex === 5 && (
            <div className="kf-recap-slide-body is-summary">
              <span className="kf-recap-eyebrow">06 · Summary & Share</span>
              <h2>Your {recap.year} Keyframe</h2>

              <div className="kf-recap-summary-card">
                <div className="kf-recap-summary-metrics">
                  <div>
                    <Clock size={14} aria-hidden="true" />
                    <strong>{recap.hours}h</strong>
                    <span>Watched</span>
                  </div>
                  <div>
                    <Tv size={14} aria-hidden="true" />
                    <strong>{recap.episodes}</strong>
                    <span>Episodes</span>
                  </div>
                  <div>
                    <BookOpen size={14} aria-hidden="true" />
                    <strong>{recap.books}</strong>
                    <span>Books</span>
                  </div>
                  <div>
                    <PenLine size={14} aria-hidden="true" />
                    <strong>{recap.notesCount}</strong>
                    <span>Notes</span>
                  </div>
                </div>

                <dl className="kf-recap-summary-list">
                  <div>
                    <dt>Title of the Year</dt>
                    <dd>{recap.topTitle ? recap.topTitle.title : '—'}</dd>
                  </div>
                  <div>
                    <dt>Top Genre</dt>
                    <dd>{recap.topGenre ? recap.topGenre.name : '—'}</dd>
                  </div>
                  <div>
                    <dt>Top Studio</dt>
                    <dd>{recap.topStudio ? recap.topStudio.name : '—'}</dd>
                  </div>
                  <div>
                    <dt>Character</dt>
                    <dd>
                      {recap.mostWrittenCharacter ? recap.mostWrittenCharacter.character.name : '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="kf-recap-share-actions">
                <KfButton
                  variant="primary"
                  size="lg"
                  icon={<Download size={17} />}
                  onClick={() => downloadRecapCard(recap, accent)}
                >
                  Download Recap Card
                </KfButton>
                {recap.bestNote && (
                  <KfButton
                    variant="secondary"
                    size="lg"
                    icon={<PenLine size={16} />}
                    onClick={() =>
                      downloadQuoteCard({
                        title: recap.bestNote!.title,
                        context: recap.bestNote!.context,
                        note: recap.bestNote!.note,
                        rating: recap.bestNote!.rating,
                      })
                    }
                  >
                    Download Quote Card
                  </KfButton>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Deck Controls */}
        <div className="kf-recap-controls">
          <button
            type="button"
            className="kf-recap-nav-btn"
            onClick={goPrev}
            disabled={slideIndex === 0}
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} aria-hidden="true" />
            <span>Prev</span>
          </button>

          <span className="kf-recap-counter">
            {slideIndex + 1} / {TOTAL_SLIDES}
          </span>

          <button
            type="button"
            className="kf-recap-nav-btn"
            onClick={goNext}
            disabled={slideIndex === TOTAL_SLIDES - 1}
            aria-label="Next slide"
          >
            <span>Next</span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
};

export const RecapPage: React.FC = () => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const {
    loading,
    loadFailed,
    seriesList,
    bookList,
    characterList,
    rewatchList,
    activityList,
  } = useJournalData();
  const { retryLoad } = useJournalActions();
  const { reflections } = useReflections();

  const analytics = useMemo(
    () =>
      computeLibraryAnalytics({
        seriesList,
        bookList,
        characterList,
        rewatchList,
        activityList,
      }),
    [seriesList, bookList, characterList, rewatchList, activityList],
  );

  const parsedParamYear = Number(yearParam);
  const selectedYear =
    Number.isInteger(parsedParamYear) && parsedParamYear >= 1900 && parsedParamYear <= 2100
      ? parsedParamYear
      : analytics.availableRecapYears[0] ?? new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const set = new Set<number>([selectedYear, ...analytics.availableRecapYears]);
    return Array.from(set).sort((a, b) => b - a);
  }, [selectedYear, analytics.availableRecapYears]);

  const recap = useMemo(
    () =>
      computeYearRecap(selectedYear, {
        seriesList,
        bookList,
        characterList,
        rewatchList,
        activityList,
        reflections,
      }),
    [selectedYear, seriesList, bookList, characterList, rewatchList, activityList, reflections],
  );

  const hasAnyData =
    seriesList.length > 0 || bookList.length > 0 || characterList.length > 0 || activityList.length > 0;

  if (loading && !hasAnyData) {
    return (
      <div className="kf kf-recap" aria-busy="true" aria-label="Loading yearly recap">
        <div className="kf-me-skeleton-header" />
        <div className="kf-me-skeleton-wide" />
      </div>
    );
  }

  if (loadFailed && !hasAnyData) {
    return (
      <div className="kf kf-recap">
        <div className="kf-me-error" role="alert">
          <AlertCircle size={26} aria-hidden="true" />
          <h2>Couldn’t load your {selectedYear} recap</h2>
          <p>Check that the backend server is running, then try again.</p>
          <KfButton variant="primary" onClick={retryLoad}>
            Retry
          </KfButton>
        </div>
      </div>
    );
  }

  return (
    <div className="kf kf-recap">
      <header className="kf-recap-topbar">
        <Link viewTransition to="/me" className="kf-recap-back">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Me</span>
        </Link>

        <div className="kf-recap-year-bar">
          <div className="kf-recap-year-pills" aria-label="Choose recap year">
            {yearOptions.slice(0, 5).map((yr) => (
              <Link
                key={yr}
                viewTransition
                to={`/me/recap/${yr}`}
                className={`kf-recap-year-pill${yr === selectedYear ? ' is-active' : ''}`}
                aria-current={yr === selectedYear ? 'page' : undefined}
              >
                {yr}
              </Link>
            ))}
          </div>

          {yearOptions.length > 5 && (
            <select
              className="kf-recap-year-select"
              aria-label="All recap years"
              value={selectedYear}
              onChange={(e) => navigate(`/me/recap/${e.target.value}`, { viewTransition: true })}
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <RecapStoryStage key={selectedYear} recap={recap} />
    </div>
  );
};
