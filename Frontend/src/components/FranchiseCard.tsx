import React from 'react';
import { AnimeSeries } from '../types';
import { Tv, Star, RotateCcw } from 'lucide-react';

interface FranchiseCardProps {
  series: AnimeSeries;
  onOpenDetail?: (seriesId: number) => void;
}

// Fallback dictionary for popular anime to show Japanese/Romaji titles
const KNOWN_ROMAJI_MAP: Record<string, { romaji: string; kanji?: string }> = {
  "frieren: beyond journey's end": { romaji: 'Sousou no Frieren', kanji: '葬送のフリーレン' },
  'attack on titan': { romaji: 'Shingeki no Kyojin', kanji: '進撃の巨人' },
  'steins;gate': { romaji: 'Steins;Gate', kanji: 'シュタインズ・ゲート' },
  'demon slayer: kimetsu no yaiba': { romaji: 'Kimetsu no Yaiba', kanji: '鬼滅の刃' },
  'demon slayer': { romaji: 'Kimetsu no Yaiba', kanji: '鬼滅の刃' },
  'oshi no ko': { romaji: 'Oshi no Ko', kanji: '【推しの子】' },
  'jujutsu kaisen': { romaji: 'Jujutsu Kaisen', kanji: '呪術廻戦' },
  'my hero academia': { romaji: 'Boku no Hero Academia', kanji: '僕のヒーローアカデミア' },
  'chainsaw man': { romaji: 'Chainsaw Man', kanji: 'チェンソーマン' },
  'fullmetal alchemist: brotherhood': { romaji: 'Hagane no Renkinjutsushi', kanji: '鋼の錬金術師' },
  'vinland saga': { romaji: 'Vinland Saga', kanji: 'ヴィンランド・サガ' },
  'death note': { romaji: 'Death Note', kanji: 'デスノート' },
  'hunter x hunter': { romaji: 'Hunter × Hunter', kanji: 'ハンター×ハンター' },
  'bleach': { romaji: 'Bleach', kanji: 'BLEACH' },
  'naruto': { romaji: 'Naruto', kanji: 'NARUTO -ナルト-' },
  'one piece': { romaji: 'One Piece', kanji: 'ONE PIECE' },
  'solo leveling': { romaji: 'Ore dake Level Up na Ken', kanji: '俺だけレベルアップな件' },
  'bocchi the rock!': { romaji: 'Bocchi the Rock!', kanji: 'ぼっち・ざ・ろっく！' },
  'mob psycho 100': { romaji: 'Mob Psycho 100', kanji: 'モブサイコ100' },
  'spy x family': { romaji: 'SPY×FAMILY', kanji: 'スパイファミリー' },
};

export const FranchiseCard: React.FC<FranchiseCardProps> = ({
  series,
  onOpenDetail,
}) => {
  // Find active watching release first, or primary season/movie
  const watchingSeason = series.seasons?.find((s) => s.status === 'WATCHING');
  const watchingMovie = series.movies?.find((m) => m.status === 'WATCHING');
  const primarySeason = watchingSeason || series.seasons?.[0];
  const primaryMovie = watchingMovie || series.movies?.[0];

  // Resolve cover image
  const coverUrl =
    (watchingSeason as any)?.cover_image_url ||
    ((watchingSeason as any)?.cover_image as any)?.image_url ||
    watchingSeason?.image_url ||
    (watchingMovie as any)?.cover_image_url ||
    ((watchingMovie as any)?.cover_image as any)?.image_url ||
    watchingMovie?.image_url ||
    series.cover_image_url ||
    (series.cover_image as any)?.image_url ||
    series.image_url ||
    (primarySeason as any)?.cover_image_url ||
    primarySeason?.image_url;

  const totalSeasons = series.seasons?.length || 0;
  const totalMovies = series.movies?.length || 0;

  // Compute Overall Status
  let overallStatus = 'PLAN_TO_WATCH';
  if (watchingSeason || watchingMovie) {
    overallStatus = 'WATCHING';
  } else if (
    (totalSeasons > 0 || totalMovies > 0) &&
    series.seasons?.every((s) => s.status === 'COMPLETED') &&
    (totalMovies === 0 || series.movies?.every((m) => m.status === 'COMPLETED'))
  ) {
    overallStatus = 'COMPLETED';
  } else if (
    series.seasons?.some((s) => s.status === 'ON_HOLD') ||
    series.movies?.some((m) => m.status === 'ON_HOLD')
  ) {
    overallStatus = 'ON_HOLD';
  } else if (
    series.seasons?.some((s) => s.status === 'DROPPED') ||
    series.movies?.some((m) => m.status === 'DROPPED')
  ) {
    overallStatus = 'DROPPED';
  }

  // Calculate personal rating/score across releases
  const ratings = [
    ...(series.seasons?.map((s) => s.rating) || []),
    ...(series.movies?.map((m) => m.rating) || []),
  ].filter((r): r is number => r !== null && r !== undefined);

  let formattedRating: string | null = null;
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    formattedRating = Number.isInteger(avg) ? `${avg}` : avg.toFixed(1);
  }

  // Calculate rewatch count
  const totalRewatches =
    (series.rewatches?.length || 0) +
    (series.seasons?.reduce((acc, s) => acc + (s.rewatches?.length || 0), 0) || 0) +
    (series.movies?.reduce((acc, m) => acc + (m.rewatches?.length || 0), 0) || 0);

  // Resolve Romaji & Japanese Title
  const normalizedTitle = series.title.toLowerCase().trim();
  const knownMatch = KNOWN_ROMAJI_MAP[normalizedTitle];

  const romajiName =
    series.romaji_title ||
    knownMatch?.romaji ||
    (series.japanese_title ? series.japanese_title : null);

  const kanjiName =
    series.japanese_title && series.japanese_title !== romajiName
      ? series.japanese_title
      : knownMatch?.kanji;

  const japaneseDisplay = romajiName
    ? kanjiName && kanjiName !== romajiName
      ? `${romajiName} · ${kanjiName}`
      : romajiName
    : null;

  // Format Season descriptor
  let seasonLabel = '';
  if (watchingSeason) {
    seasonLabel = `Season ${watchingSeason.season_number}${
      watchingSeason.title && watchingSeason.title !== `Season ${watchingSeason.season_number}`
        ? ` · ${watchingSeason.title}`
        : ''
    }`;
  } else if (totalSeasons === 1 && totalMovies === 0) {
    seasonLabel = primarySeason?.title && primarySeason.title !== 'Season 1' 
      ? primarySeason.title 
      : '1 Season';
  } else if (totalSeasons > 1 && totalMovies === 0) {
    seasonLabel = `${totalSeasons} Seasons`;
  } else if (totalSeasons === 0 && totalMovies > 0) {
    seasonLabel = `${totalMovies} ${totalMovies === 1 ? 'Movie' : 'Movies'}`;
  } else if (totalSeasons > 0 && totalMovies > 0) {
    seasonLabel = `${totalSeasons} ${totalSeasons === 1 ? 'Season' : 'Seasons'} · ${totalMovies} Film${totalMovies > 1 ? 's' : ''}`;
  } else {
    seasonLabel = '1 Season';
  }

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(series.id);
    }
  };

  return (
    <article
      className="anime-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${series.title}, ${seasonLabel}`}
    >
      {/* 100% Full Bleed Poster Image */}
      <div className="anime-card-poster-wrap">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={series.title}
            className="anime-card-poster"
            loading="lazy"
          />
        ) : (
          <div className="anime-card-poster-fallback">
            <div className="anime-fallback-icon-wrap">
              <Tv size={32} />
            </div>
            <span className="anime-fallback-title-hint">{series.title}</span>
          </div>
        )}

        {/* Ambient Bottom Gradient for Title Readability */}
        <div className="anime-card-overlay" />

        {/* Personal Star Rating Badge floating top left */}
        {formattedRating && (
          <div
            className={`anime-card-rating-badge ${
              parseFloat(formattedRating) >= 9
                ? 'rating-band-high'
                : parseFloat(formattedRating) >= 7
                ? 'rating-band-mid'
                : parseFloat(formattedRating) >= 5
                ? 'rating-band-normal'
                : 'rating-band-low'
            }`}
            title={`Personal Rating: ${formattedRating} / 10`}
          >
            <Star size={13} fill="currentColor" color="currentColor" />
            <span>{formattedRating}</span>
          </div>
        )}

        {/* Status Badge floating top right */}
        <div className="anime-card-badge">
          <span className={`status-badge ${overallStatus.toLowerCase()}`}>
            {overallStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Rewatch indicator floating bottom right above footer */}
        {totalRewatches > 0 && (
          <div
            className="anime-card-rewatch-badge"
            title={`Rewatched ${totalRewatches} time${totalRewatches > 1 ? 's' : ''}`}
          >
            <RotateCcw size={11} />
            <span>{totalRewatches > 1 ? `${totalRewatches}x` : 'Rewatched'}</span>
          </div>
        )}
      </div>

      {/* Card Content Overlay directly over the bottom of the poster */}
      <div className="anime-card-body">
        <div className="anime-card-title-group">
          {/* Top Line: Japanese / Romaji Name (Cyan/Aqua Accent) */}
          {japaneseDisplay && (
            <span className="anime-card-jp-title" title={japaneseDisplay}>
              {japaneseDisplay}
            </span>
          )}

          {/* Main Line: English / Main Title */}
          <h3 className="anime-card-main-title" title={series.title}>
            {series.title}
          </h3>
        </div>

        {/* Season & Release Tag */}
        <div className="anime-card-season-row" title={seasonLabel}>
          <Tv size={13} className="anime-season-icon" />
          <span className="anime-season-text">{seasonLabel}</span>
        </div>
      </div>
    </article>
  );
};
