import React, { useState } from 'react';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  EpisodeNote,
  FavoriteCharacter,
  Rewatch,
} from '../types';
import { DetailIdentity, MoreMenuItem } from '../components/DetailIdentity';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { MemoryCueList } from '../components/MemoryCueList';
import { ReturnTimeline } from '../components/ReturnTimeline';
import { ReleaseLedger } from '../components/ReleaseLedger';
import { CharacterStrip } from '../components/CharacterStrip';
import { AboutTitle } from '../components/AboutTitle';
import { EpisodeMemoryModal } from '../components/EpisodeMemoryModal';
import { RewatchDetailModal } from '../components/RewatchDetailModal';
import { CharacterDetailModal } from '../components/CharacterDetailModal';
import { characterApi, episodeNoteApi } from '../api/client';
import {
  ArrowLeft,
  Plus,
  PenLine,
  Trash2,
} from 'lucide-react';

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
  onDeleteSeason: _onDeleteSeason,
  onSeasonProgressDelta,
  onEditMovie,
  onDeleteMovie: _onDeleteMovie,
  onMovieProgressDelta,
  onOpenEpisodeNotes,
  onAddRewatchSeries: _onAddRewatchSeries,
  onAddRewatchSeason,
  onAddRewatchMovie,
  onAddRewatchEpisode,
  onEditRewatch,
  onDeleteRewatch,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter: _onDeleteCharacter,
  onRefresh,
}) => {
  // Select active season/movie by default (prefer WATCHING or first available)
  const defaultSeason = series.seasons?.find((s) => s.status === 'WATCHING') || series.seasons?.[0];
  const initialType: 'season' | 'movie' = defaultSeason ? 'season' : series.movies?.[0] ? 'movie' : 'season';
  const initialId: number = defaultSeason?.id || series.movies?.[0]?.id || 0;

  const [selectedType, setSelectedType] = useState<'season' | 'movie'>(initialType);
  const [selectedId, setSelectedId] = useState<number>(initialId);
  const [lessonExpanded, setLessonExpanded] = useState(false);

  // Reader modals state
  const [selectedEpisodeNoteForDetail, setSelectedEpisodeNoteForDetail] = useState<EpisodeNote | null>(null);
  const [selectedRewatchForDetail, setSelectedRewatchForDetail] = useState<{
    rewatch: Rewatch;
    passNumber: number;
  } | null>(null);
  const [selectedCharacterForDetail, setSelectedCharacterForDetail] = useState<FavoriteCharacter | null>(null);

  const currentSeason = series.seasons?.find((s) => s.id === selectedId);
  const currentMovie = series.movies?.find((m) => m.id === selectedId);

  // Active release
  const activeRelease =
    selectedType === 'season'
      ? currentSeason || series.seasons?.[0] || null
      : currentMovie || series.movies?.[0] || null;

  const activeStatus = activeRelease?.status || 'PLAN_TO_WATCH';
  const activeRating = activeRelease?.rating;

  const coverUrl =
    (activeRelease as any)?.cover_image_url ||
    ((activeRelease as any)?.cover_image as any)?.image_url ||
    series.cover_image_url ||
    (series.cover_image as any)?.image_url;

  const releaseLabel =
    selectedType === 'season'
      ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} · TV Series`
      : 'Anime Film';

  const formatLabel =
    selectedType === 'season'
      ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} · TV Series`
      : 'Anime Film';

  const franchiseCharacters = series.favorite_characters || [];

  // More menu items for franchise & releases
  const moreMenuItems: MoreMenuItem[] = [
    {
      label: 'Edit Franchise Metadata',
      icon: <PenLine size={13} />,
      onClick: () => onEditSeries(series),
    },
    {
      label: 'Add Season',
      icon: <Plus size={13} />,
      onClick: () => onAddSeason(series),
    },
    {
      label: 'Add Movie',
      icon: <Plus size={13} />,
      onClick: () => onAddMovie(series),
    },
    {
      label: 'Delete Franchise',
      icon: <Trash2 size={13} />,
      onClick: () => onDeleteSeries(series.id),
      danger: true,
    },
  ];

  const handleDeleteEpisodeNote = async (noteId: number) => {
    try {
      await episodeNoteApi.delete(noteId);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to delete episode note:', err);
    }
  };

  return (
    <div className="detail-page">
      {/* Top Breadcrumb / Back Navigation */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            fontSize: 14,
            color: 'var(--text-desk-muted)',
          }}
          aria-label="Back to anime journal"
        >
          <ArrowLeft size={16} />
          <span>Back to Anime Journal</span>
        </button>
      </div>

      <div className="detail-page-intro">
        <p className="detail-section-kicker">Series journal · {series.seasons.length} seasons · {series.movies.length} films</p>
        <p>{series.romaji_title || series.japanese_title || 'A collection of the parts worth keeping.'}</p>
      </div>

      {/* 1. Identity Band */}
      <div className="detail-active-identity" key={`identity-${selectedType}-${selectedId}`}>
      <DetailIdentity
        type="anime"
        title={series.title}
        coverUrl={coverUrl}
        status={activeStatus}
        rating={activeRating}
        releaseLabel={releaseLabel}
        progress={
          selectedType === 'season'
            ? (activeRelease as AnimeSeason)?.progress || 0
            : (activeRelease as AnimeMovie)?.progress_minutes || 0
        }
        totalUnits={
          selectedType === 'season'
            ? (activeRelease as AnimeSeason)?.total_episodes
            : (activeRelease as AnimeMovie)?.total_minutes
        }
        unitLabel={selectedType === 'season' ? 'eps' : 'mins'}
        onProgressDelta={(delta) => {
          if (activeRelease) {
            if (selectedType === 'season') {
              onSeasonProgressDelta(activeRelease.id, delta);
            } else {
              onMovieProgressDelta(activeRelease.id, delta);
            }
          }
        }}
        progressStep={selectedType === 'movie' ? 10 : 1}
        progressTone="watching"
        ariaLabelPrefix={
          selectedType === 'season'
            ? `${series.title} S${(activeRelease as AnimeSeason)?.season_number || 1}`
            : (activeRelease as AnimeMovie)?.title || series.title
        }
        onEditRelease={() => {
          if (activeRelease) {
            if (selectedType === 'season') {
              onEditSeason(activeRelease as AnimeSeason);
            } else {
              onEditMovie(activeRelease as AnimeMovie);
            }
          }
        }}
        moreMenuItems={moreMenuItems}
      />
      </div>

      <ReleaseLedger
        series={series}
        rewatches={allRewatches}
        selectedType={selectedType}
        selectedId={selectedId}
        onSelect={(type, id) => {
          setSelectedType(type);
          setSelectedId(id);
          setLessonExpanded(false);
        }}
      />

      {/* Content changes as the selected release changes. */}
      <div className="detail-release-content" key={`release-${selectedType}-${selectedId}`}>
      {/* 2. One Clamped Lesson Sheet (The only paper on the page) */}
      <section className="detail-section-takeaway">
        <TakeawaySlip
          isDetail
          className="lesson-sheet"
          clamped={!lessonExpanded}
          onToggleClamp={() => setLessonExpanded(!lessonExpanded)}
          status={activeStatus}
          label={
            selectedType === 'season'
              ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} Lesson`
              : 'Film Lesson'
          }
          text={activeRelease?.notes}
          onWrite={() => {
            if (activeRelease) {
              if (selectedType === 'season') {
                onEditSeason(activeRelease as AnimeSeason);
              } else {
                onEditMovie(activeRelease as AnimeMovie);
              }
            }
          }}
          emptyText="No lesson captured yet."
          emptyCtaText="Write the lesson"
        />
      </section>

      {/* 3. Episode Memories Cue Sheet (TV Season only) */}
      {selectedType === 'season' && activeRelease && (
        <MemoryCueList
          season={activeRelease as AnimeSeason}
          onLogMemory={onOpenEpisodeNotes}
          onSelectMemory={(ep) => setSelectedEpisodeNoteForDetail(ep)}
        />
      )}

      {/* 4. Returns, placed on a dated rail rather than in a list */}
      <ReturnTimeline
        series={series}
        selectedReleaseType={selectedType}
        selectedRelease={activeRelease}
        allRewatches={allRewatches}
        onLogRewatch={(tType, target) => {
          if (tType === 'season') {
            onAddRewatchSeason(target as AnimeSeason);
          } else {
            onAddRewatchMovie(target as AnimeMovie);
          }
        }}
        onSelectRewatch={(r, passNum) => {
          setSelectedRewatchForDetail({ rewatch: r, passNumber: passNum });
        }}
      />

      </div>

      {/* 5. Memorable Characters (Portrait strip) */}
      <CharacterStrip
        characters={franchiseCharacters}
        onAddCharacter={() => onAddCharacter(series)}
        onSelectCharacter={(char) => setSelectedCharacterForDetail(char)}
      />

      {/* 6. About this title (<details> facts drawer) */}
      <AboutTitle
        format={formatLabel}
        studios={series.studios}
        genres={series.genres}
        startDate={activeRelease?.start_date}
        finishDate={activeRelease?.finish_date}
        japaneseTitle={series.japanese_title}
        romajiTitle={series.romaji_title}
        onEdit={() => onEditSeries(series)}
        editLabel="Edit Franchise Metadata"
      />

      {/* Dedicated Reader Modal 1: Episode Memory */}
      {selectedEpisodeNoteForDetail && (
        <EpisodeMemoryModal
          isOpen={Boolean(selectedEpisodeNoteForDetail)}
          onClose={() => setSelectedEpisodeNoteForDetail(null)}
          season={currentSeason || (activeRelease as AnimeSeason) || null}
          note={selectedEpisodeNoteForDetail}
          onEdit={(season, note) => {
            onOpenEpisodeNotes(season, note);
          }}
          onDelete={handleDeleteEpisodeNote}
          onAddRewatchEpisode={onAddRewatchEpisode}
        />
      )}

      {/* Dedicated Reader Modal 2: Rewatch Return */}
      {selectedRewatchForDetail && (
        <RewatchDetailModal
          isOpen={Boolean(selectedRewatchForDetail)}
          onClose={() => setSelectedRewatchForDetail(null)}
          rewatch={selectedRewatchForDetail.rewatch}
          passNumber={selectedRewatchForDetail.passNumber}
          onEdit={onEditRewatch}
          onDelete={onDeleteRewatch}
          onNavigateSeries={undefined}
        />
      )}

      {/* Dedicated Reader Modal 3: Character Reflection */}
      {selectedCharacterForDetail && (
        <CharacterDetailModal
          isOpen={Boolean(selectedCharacterForDetail)}
          onClose={() => setSelectedCharacterForDetail(null)}
          character={selectedCharacterForDetail}
          onEdit={onEditCharacter}
          onSetCoverImage={async (charId, imageId) => {
            try {
              const char = franchiseCharacters.find((c) => c.id === charId);
              const existingImageIds = (char?.images || []).map((img) => img.id);
              const updatedImages = existingImageIds.includes(imageId)
                ? existingImageIds
                : [...existingImageIds, imageId];

              const updated = await characterApi.update(charId, {
                cover_image: imageId,
                images: updatedImages,
              });
              setSelectedCharacterForDetail(updated);
              if (onRefresh) await onRefresh();
            } catch (err) {
              console.error('Failed to set cover image:', err);
            }
          }}
          onAddImage={async (charId, image) => {
            try {
              const char = franchiseCharacters.find((c) => c.id === charId);
              const existingImageIds = (char?.images || []).map((img) => img.id);
              if (existingImageIds.includes(image.id)) return;

              const updatedImages = [...existingImageIds, image.id];
              const updated = await characterApi.update(charId, {
                images: updatedImages,
              });
              setSelectedCharacterForDetail(updated);
              if (onRefresh) await onRefresh();
            } catch (err) {
              console.error('Failed to attach image to character:', err);
            }
          }}
          onRemoveImage={async (charId, imageId) => {
            try {
              const char = franchiseCharacters.find((c) => c.id === charId);
              const existingImageIds = (char?.images || []).map((img) => img.id);
              const updatedImages = existingImageIds.filter((id) => id !== imageId);
              const newCoverImage =
                char?.cover_image === imageId ? updatedImages[0] || null : char?.cover_image;

              const updated = await characterApi.update(charId, {
                cover_image: newCoverImage,
                images: updatedImages,
              });
              setSelectedCharacterForDetail(updated);
              if (onRefresh) await onRefresh();
            } catch (err) {
              console.error('Failed to remove image from character:', err);
            }
          }}
        />
      )}
    </div>
  );
};
