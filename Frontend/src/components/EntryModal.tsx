import React, { useState, useEffect, useRef } from 'react';
import {
  AnimeSeries,
  BookStatus,
  Genre,
  Studio,
} from '../types';
import { X, Film, BookOpen, Tv, Clapperboard, ChevronDown, ChevronUp } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { ImageUploadField } from './ImageUploadField';

export type EntryModalMode =
  | 'new-franchise'
  | 'add-season'
  | 'add-movie'
  | 'book'
  | 'edit-series'
  | 'edit-season'
  | 'edit-movie'
  | 'edit-book';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: EntryModalMode;
  editTarget?: {
    type: 'series' | 'season' | 'movie' | 'book';
    data: any;
  } | null;
  targetSeries?: AnimeSeries | null;
  seriesList: AnimeSeries[];
  genres: Genre[];
  studios: Studio[];
  onSaveSeries: (data: { title: string; japanese_title?: string | null; romaji_title?: string | null; cover_image?: number | null; genres: number[]; initial_season?: any }, id?: number) => Promise<void>;
  onSaveSeason: (data: any, id?: number) => Promise<void>;
  onSaveMovie: (data: any, id?: number) => Promise<void>;
  onSaveBook: (data: any, id?: number) => Promise<void>;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  mode = 'new-franchise',
  editTarget,
  targetSeries,
  seriesList,
  genres,
  studios,
  onSaveSeries,
  onSaveSeason,
  onSaveMovie,
  onSaveBook,
}) => {
  const [activeTab, setActiveTab] = useState<EntryModalMode>(mode);

  // Form states
  const [seriesId, setSeriesId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [japaneseTitle, setJapaneseTitle] = useState('');
  const [romajiTitle, setRomajiTitle] = useState('');
  const [seasonTitle, setSeasonTitle] = useState('Season 1');
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<string>('WATCHING');
  const [rating, setRating] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedStudioIds, setSelectedStudioIds] = useState<number[]>([]);
  const [showCatalogDetails, setShowCatalogDetails] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setActiveTab(mode);
    setShowCatalogDetails(Boolean(editTarget));

    if (editTarget) {
      const { type, data } = editTarget;
      setCoverImageId(data.cover_image ?? null);
      setCoverImageUrl(data.cover_image_url || data.image_url || null);

      if (type === 'series') {
        setTitle(data.title || '');
        setJapaneseTitle(data.japanese_title || '');
        setRomajiTitle(data.romaji_title || '');
        setSelectedGenreIds(data.genres ? data.genres.map((g: Genre) => g.id) : []);
      } else if (type === 'season') {
        setSeriesId(data.series);
        setTitle(data.title || '');
        setSeasonNumber(data.season_number || 1);
        setStatus(data.status || 'WATCHING');
        setRating(data.rating || null);
        setProgress(data.progress || 0);
        setTotalCount(data.total_episodes ?? '');
        setStartDate(data.start_date || '');
        setFinishDate(data.finish_date || '');
        setNotes(data.notes || '');
        setSelectedStudioIds(data.studios ? data.studios.map((s: Studio) => s.id) : []);
      } else if (type === 'movie') {
        setSeriesId(data.series);
        setTitle(data.title || '');
        setStatus(data.status || 'WATCHING');
        setRating(data.rating || null);
        setProgress(data.progress_minutes || 0);
        setTotalCount(data.total_minutes ?? '');
        setStartDate(data.start_date || '');
        setFinishDate(data.finish_date || '');
        setNotes(data.notes || '');
        setSelectedStudioIds(data.studios ? data.studios.map((s: Studio) => s.id) : []);
      } else if (type === 'book') {
        setTitle(data.title || '');
        setAuthor(data.author || '');
        setStatus(data.status || 'READING');
        setRating(data.rating || null);
        setProgress(data.progress || 0);
        setTotalCount(data.total_pages ?? '');
        setStartDate(data.start_date || '');
        setFinishDate(data.finish_date || '');
        setNotes(data.notes || '');
        setSelectedGenreIds(data.genres ? data.genres.map((g: Genre) => g.id) : []);
      }
    } else {
      const chosenSeriesId = targetSeries ? targetSeries.id : seriesList[0]?.id || 1;
      setSeriesId(chosenSeriesId);
      setTitle('');
      setSeasonTitle('Season 1');
      setSeasonNumber(1);
      setCoverImageId(null);
      setCoverImageUrl(null);
      setAuthor('');
      setStatus(mode === 'book' ? 'READING' : 'WATCHING');
      setRating(null);
      setProgress(0);
      setTotalCount('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
      setSelectedGenreIds([]);
      setSelectedStudioIds([]);
    }
  }, [isOpen, mode, editTarget, targetSeries, seriesList]);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.95, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  if (!isOpen) return null;

  const isEditing = Boolean(editTarget);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);

      if (activeTab === 'new-franchise') {
        if (!title.trim()) {
          setErrorMsg('Franchise title is required.');
          return;
        }
        await onSaveSeries({
          title: title.trim(),
          japanese_title: japaneseTitle.trim() || null,
          romaji_title: romajiTitle.trim() || null,
          cover_image: coverImageId,
          genres: selectedGenreIds,
          initial_season: {
            title: seasonTitle.trim() || 'Season 1',
            season_number: 1,
            status,
            progress: Number(progress) || 0,
            total_episodes: totalCount !== '' ? Number(totalCount) : null,
            rating,
            start_date: startDate || null,
            finish_date: finishDate || null,
            notes: notes.trim() || null,
            studios: selectedStudioIds,
          },
        });
      } else if (activeTab === 'add-season') {
        if (!title.trim()) {
          setErrorMsg('Season title is required.');
          return;
        }
        await onSaveSeason({
          series: seriesId,
          title: title.trim(),
          season_number: Number(seasonNumber),
          cover_image: coverImageId,
          status,
          progress: Number(progress) || 0,
          total_episodes: totalCount !== '' ? Number(totalCount) : null,
          rating,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          studios: selectedStudioIds,
        });
      } else if (activeTab === 'add-movie') {
        if (!title.trim()) {
          setErrorMsg('Film title is required.');
          return;
        }
        await onSaveMovie({
          series: seriesId,
          title: title.trim(),
          cover_image: coverImageId,
          status,
          progress_minutes: Number(progress) || 0,
          total_minutes: totalCount !== '' ? Number(totalCount) : null,
          rating,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          studios: selectedStudioIds,
        });
      } else if (activeTab === 'book' || activeTab === 'edit-book') {
        if (!title.trim()) {
          setErrorMsg('Book title is required.');
          return;
        }
        await onSaveBook(
          {
            title: title.trim(),
            author: author.trim() || null,
            cover_image: coverImageId,
            status: status as BookStatus,
            rating,
            progress: Number(progress) || 0,
            total_pages: totalCount !== '' ? Number(totalCount) : null,
            start_date: startDate || null,
            finish_date: finishDate || null,
            notes: notes.trim() || null,
            genres: selectedGenreIds,
          },
          editTarget?.data?.id
        );
      } else if (activeTab === 'edit-series') {
        if (!title.trim()) {
          setErrorMsg('Franchise title is required.');
          return;
        }
        await onSaveSeries(
          {
            title: title.trim(),
            japanese_title: japaneseTitle.trim() || null,
            romaji_title: romajiTitle.trim() || null,
            cover_image: coverImageId,
            genres: selectedGenreIds,
          },
          editTarget?.data?.id
        );
      } else if (activeTab === 'edit-season') {
        if (!title.trim()) {
          setErrorMsg('Season title is required.');
          return;
        }
        await onSaveSeason(
          {
            series: seriesId,
            title: title.trim(),
            season_number: Number(seasonNumber),
            cover_image: coverImageId,
            status,
            progress: Number(progress) || 0,
            total_episodes: totalCount !== '' ? Number(totalCount) : null,
            rating,
            start_date: startDate || null,
            finish_date: finishDate || null,
            notes: notes.trim() || null,
            studios: selectedStudioIds,
          },
          editTarget?.data?.id
        );
      } else if (activeTab === 'edit-movie') {
        if (!title.trim()) {
          setErrorMsg('Film title is required.');
          return;
        }
        await onSaveMovie(
          {
            series: seriesId,
            title: title.trim(),
            cover_image: coverImageId,
            status,
            progress_minutes: Number(progress) || 0,
            total_minutes: totalCount !== '' ? Number(totalCount) : null,
            rating,
            start_date: startDate || null,
            finish_date: finishDate || null,
            notes: notes.trim() || null,
            studios: selectedStudioIds,
          },
          editTarget?.data?.id
        );
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving journal entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const getHeaderTitle = () => {
    if (isEditing) {
      if (editTarget?.type === 'series') return 'Edit Franchise';
      if (editTarget?.type === 'season') return `Edit Season: ${editTarget.data.title}`;
      if (editTarget?.type === 'movie') return `Edit Film: ${editTarget.data.title}`;
      if (editTarget?.type === 'book') return `Edit Book: ${editTarget.data.title}`;
    }
    if (activeTab === 'new-franchise') return 'Log New Anime Franchise';
    if (activeTab === 'add-season') return 'Add TV Season';
    if (activeTab === 'add-movie') return 'Add Anime Film';
    if (activeTab === 'book') return 'Log Book Entry';
    return 'Log Journal Entry';
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={modalRef} className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--desk-surface)',
                color: 'var(--text-desk)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeTab === 'book' || activeTab === 'edit-book' ? (
                <BookOpen size={18} />
              ) : activeTab === 'add-movie' || activeTab === 'edit-movie' ? (
                <Clapperboard size={18} />
              ) : (
                <Film size={18} />
              )}
            </div>
            <h2 style={{ fontSize: 18, color: 'var(--text-desk)' }}>{getHeaderTitle()}</h2>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector for New Entries */}
        {!isEditing && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '16px 24px 0 24px',
              overflowX: 'auto',
            }}
          >
            <button
              type="button"
              className={`btn ${activeTab === 'new-franchise' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 13, padding: '5px 12px' }}
              onClick={() => setActiveTab('new-franchise')}
            >
              <Film size={14} /> New Franchise
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'add-season' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 13, padding: '5px 12px' }}
              onClick={() => setActiveTab('add-season')}
            >
              <Tv size={14} /> + Season
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'add-movie' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 13, padding: '5px 12px' }}
              onClick={() => setActiveTab('add-movie')}
            >
              <Clapperboard size={14} /> + Film
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'book' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 13, padding: '5px 12px' }}
              onClick={() => setActiveTab('book')}
            >
              <BookOpen size={14} /> Book
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errorMsg && (
            <div className="form-error">
              {errorMsg}
            </div>
          )}

          {/* Franchise Selector when adding season/movie */}
          {(activeTab === 'add-season' || activeTab === 'add-movie') && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                Target Franchise <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(Number(e.target.value))}
                className="form-select"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. PRIMARY TITLE (Required) */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              {activeTab === 'new-franchise' || activeTab === 'edit-series'
                ? 'Franchise Title'
                : activeTab === 'add-season' || activeTab === 'edit-season'
                ? 'Season Title'
                : activeTab === 'add-movie' || activeTab === 'edit-movie'
                ? 'Film Title'
                : 'Book Title'}{' '}
              <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                activeTab === 'new-franchise'
                  ? 'e.g. Frieren: Beyond Journey\'s End'
                  : activeTab === 'add-season'
                  ? 'e.g. Season 2'
                  : activeTab === 'add-movie'
                  ? 'e.g. Mugen Train'
                  : 'e.g. Dune'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Romaji & Japanese Native Titles for Franchises */}
          {(activeTab === 'new-franchise' || activeTab === 'edit-series') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                  Romaji Name <span style={{ fontSize: 11, color: 'var(--text-desk-dim)', fontWeight: 400 }}>(e.g. Kimetsu no Yaiba)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kimetsu no Yaiba"
                  value={romajiTitle}
                  onChange={(e) => setRomajiTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                  Japanese Native <span style={{ fontSize: 11, color: 'var(--text-desk-dim)', fontWeight: 400 }}>(e.g. 鬼滅の刃)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 鬼滅の刃, 葬送のフリーレン"
                  value={japaneseTitle}
                  onChange={(e) => setJapaneseTitle(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Author if Book */}
          {(activeTab === 'book' || activeTab === 'edit-book') && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                Author
              </label>
              <input
                type="text"
                placeholder="e.g. Frank Herbert"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {/* Initial Season Name if New Franchise */}
          {activeTab === 'new-franchise' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                Initial TV Season Title
              </label>
              <input
                type="text"
                placeholder="e.g. Season 1"
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {/* Season Number if Season */}
          {(activeTab === 'add-season' || activeTab === 'edit-season') && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                Season Number
              </label>
              <input
                type="number"
                min="1"
                required
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(Number(e.target.value))}
                className="form-input mono"
              />
            </div>
          )}

          {/* 2. NOTES & LESSONS FIRST (Prominent, 16px font, 6-8 rows) */}
          {activeTab !== 'edit-series' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                Memories, Insights & Lessons (Takeaway)
              </label>
              <textarea
                rows={6}
                placeholder="Record the philosophical insights, emotional impressions, or life lessons this title left with you..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  lineHeight: 1.6,
                  backgroundColor: 'var(--desk)',
                  borderColor: 'var(--border-desk-medium)',
                }}
              />
            </div>
          )}

          {/* 3. STATUS, RATING, PROGRESS */}
          {activeTab !== 'edit-series' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                  Status
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                  {activeTab === 'book' || activeTab === 'edit-book' ? (
                    <>
                      <option value="READING">Reading</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PLAN_TO_READ">Plan to Read</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="DROPPED">Dropped</option>
                    </>
                  ) : (
                    <>
                      <option value="WATCHING">Watching</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PLAN_TO_WATCH">Plan to Watch</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="DROPPED">Dropped</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                  Rating (1–10)
                </label>
                <select
                  value={rating || ''}
                  onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
                  className="form-select mono"
                >
                  <option value="">No rating</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      ★ {n} / 10
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                  Progress {activeTab === 'book' || activeTab === 'edit-book' ? '(Pages)' : activeTab === 'add-movie' || activeTab === 'edit-movie' ? '(Minutes)' : '(Episodes)'}
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Done"
                    value={progress}
                    onChange={(e) => setProgress(Math.max(0, Number(e.target.value)))}
                    className="form-input mono"
                  />
                  <span style={{ color: 'var(--text-desk-dim)' }}>/</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Total"
                    value={totalCount}
                    onChange={(e) => setTotalCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-input mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. SECONDARY CATALOG DETAILS (Collapsible) */}
          <div style={{ borderTop: '1px solid var(--border-desk-subtle)', paddingTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowCatalogDetails(!showCatalogDetails)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-desk-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <span>{showCatalogDetails ? 'Hide catalog details' : 'Show catalog details (cover, genres, studios, dates)'}</span>
              {showCatalogDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showCatalogDetails && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                {/* Cover Image */}
                <ImageUploadField
                  label={
                    activeTab === 'book' || activeTab === 'edit-book'
                      ? 'Book Cover Image'
                      : activeTab === 'new-franchise' || activeTab === 'edit-series'
                      ? 'Franchise Poster / Cover'
                      : 'Release Poster / Still'
                  }
                  imageId={coverImageId}
                  imageUrl={coverImageUrl}
                  onChange={(id, url) => {
                    setCoverImageId(id);
                    setCoverImageUrl(url);
                  }}
                />

                {/* Dates */}
                {activeTab !== 'edit-series' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4 }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4 }}>
                        Finish Date
                      </label>
                      <input
                        type="date"
                        value={finishDate}
                        onChange={(e) => setFinishDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {/* Genres */}
                {(activeTab === 'new-franchise' || activeTab === 'edit-series' || activeTab === 'book' || activeTab === 'edit-book') && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 6 }}>
                      Genres
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {genres.map((g) => {
                        const isSelected = selectedGenreIds.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setSelectedGenreIds(
                                isSelected
                                  ? selectedGenreIds.filter((id) => id !== g.id)
                                  : [...selectedGenreIds, g.id]
                              );
                            }}
                            style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12,
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--border-desk-medium)' : 'var(--border-desk-subtle)',
                              backgroundColor: isSelected ? 'var(--desk-surface-high)' : 'var(--desk-surface)',
                              color: isSelected ? 'var(--text-desk)' : 'var(--text-desk-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            {g.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Studios */}
                {activeTab !== 'book' && activeTab !== 'edit-book' && activeTab !== 'edit-series' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 6 }}>
                      Animation Studios
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {studios.map((st) => {
                        const isSelected = selectedStudioIds.includes(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudioIds(
                                isSelected
                                  ? selectedStudioIds.filter((id) => id !== st.id)
                                  : [...selectedStudioIds, st.id]
                              );
                            }}
                            style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12,
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--border-desk-medium)' : 'var(--border-desk-subtle)',
                              backgroundColor: isSelected ? 'var(--desk-surface-high)' : 'var(--desk-surface)',
                              color: isSelected ? 'var(--text-desk)' : 'var(--text-desk-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            {st.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
