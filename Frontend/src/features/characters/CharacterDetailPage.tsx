import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Film,
  Image as ImageIcon,
  Images,
  Maximize2,
  Pencil,
  PenLine,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { characterApi, imageApi } from '../../api/client';
import { MediaLibraryModal } from '../../components/MediaLibraryModal';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { cloudinaryThumbUrl } from '../../lib/images/cloudinary';
import { getGamePrefs } from '../../lib/progression';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import type { ImageAsset } from '../../types';
import { CardTier, CoverArt, KfButton, NotePaper, TIER_LABEL } from '../../ui/keyframe';
import {
  CARD_TIER_ORDER,
  getCharacterCoverUrl,
  getCharacterTier,
  getNextTierStep,
  resolveImageAssetUrl,
} from './characterUtils';
import './Characters.css';

const TIER_REQUIREMENT: Record<CardTier, string> = {
  sketch: 'Name logged',
  inked: 'Portrait added',
  color: 'Why note written',
  foil: '3+ gallery images',
};

const TIER_INDEX: Record<CardTier, number> = {
  sketch: 0,
  inked: 1,
  color: 2,
  foil: 3,
};

export const CharacterDetailPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { loading, characterList } = useJournalData();
  const {
    openComposer,
    openEditCharacterModal,
    handleDeleteCharacter,
    refreshAll,
    addToast,
  } = useJournalActions();

  const numericId = Number(characterId);
  const character = useMemo(
    () =>
      Number.isInteger(numericId) && numericId > 0
        ? characterList.find((c) => c.id === numericId) ?? null
        : null,
    [characterList, numericId],
  );

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<ImageAsset | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const lightboxTitleId = useId();

  useEffect(() => {
    if (pendingDeleteId !== null && !character) {
      navigate('/characters', { replace: true });
    }
  }, [pendingDeleteId, character, navigate]);

  useEffect(() => {
    const dialog = lightboxRef.current;
    if (!dialog) return;

    if (lightboxImage) {
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.showModal();
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    } else if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    }
    return undefined;
  }, [lightboxImage]);

  const coverUrl = character ? getCharacterCoverUrl(character) : null;
  const tier: CardTier = character ? getCharacterTier(character) : 'sketch';
  const nextStep = character ? getNextTierStep(character) : null;
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(
    character?.name ?? '',
    coverUrl,
  );

  if (loading && characterList.length === 0 && !character) {
    return (
      <div className="kf kf-char" aria-label="Loading character">
        <div className="kf-char-hero">
          <div className="kf-char-hero-top">
            <Link viewTransition to="/characters" className="kf-char-back">
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Characters</span>
            </Link>
          </div>
          <div className="kf-char-hero-inner">
            <div className="kf-chars-skeleton" />
            <div className="kf-char-hero-copy">
              <p className="kf-char-hero-meta">Loading character…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!character || !nextStep) {
    return (
      <div className="kf kf-char">
        <div className="kf-chars-empty">
          <div className="kf-chars-empty-icon">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <h2>Character not found</h2>
          <p>This character isn’t in your journal.</p>
          <Link viewTransition to="/characters" className="kf-btn is-secondary is-md">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to Characters</span>
          </Link>
        </div>
      </div>
    );
  }

  const showXp = getGamePrefs().xp;
  const galleryImages = character.images ?? [];
  const backdropUrl =
    tier !== 'sketch' && coverUrl ? (cloudinaryThumbUrl(coverUrl, 'card') ?? coverUrl) : null;
  const showBackdrop = Boolean(backdropUrl && failedBackdropUrl !== backdropUrl);
  const hasWhy = Boolean(character.why?.trim());
  const currentStepIdx = TIER_INDEX[tier];
  const lightboxUrl = lightboxImage ? resolveImageAssetUrl(lightboxImage) : null;

  const openWhyComposer = () => {
    openComposer({
      targetKind: 'character',
      id: character.id,
      title: character.name,
      context: character.series_title || undefined,
      defaultKind: 'why',
    });
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploading) return;

    try {
      setUploading(true);
      const uploaded = await imageApi.upload(file, { title: character.name });
      const existingIds = galleryImages.map((img) => img.id);
      const updatedIds = existingIds.includes(uploaded.id)
        ? existingIds
        : [...existingIds, uploaded.id];

      await characterApi.update(character.id, {
        images: updatedIds,
        ...(coverUrl ? {} : { cover_image: uploaded.id }),
      });
      await refreshAll();
      addToast('Portrait uploaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      addToast(`Couldn’t upload image: ${msg}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromMediaLibrary = async (image: ImageAsset) => {
    setShowMediaLibrary(false);
    const existingIds = galleryImages.map((img) => img.id);
    if (existingIds.includes(image.id) && (coverUrl || character.cover_image === image.id)) {
      addToast('That image is already in this character’s gallery.', 'info');
      return;
    }

    try {
      setBusyImageId(image.id);
      const updatedIds = existingIds.includes(image.id)
        ? existingIds
        : [...existingIds, image.id];

      await characterApi.update(character.id, {
        images: updatedIds,
        ...(coverUrl ? {} : { cover_image: image.id }),
      });
      await refreshAll();
      addToast('Image added to character');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to attach image';
      addToast(`Couldn’t attach image: ${msg}`, 'error');
    } finally {
      setBusyImageId(null);
    }
  };

  const handleSetCover = async (img: ImageAsset) => {
    if (busyImageId !== null) return;
    try {
      setBusyImageId(img.id);
      await characterApi.update(character.id, { cover_image: img.id });
      await refreshAll();
      addToast('Cover portrait updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update cover';
      addToast(`Couldn’t set cover: ${msg}`, 'error');
    } finally {
      setBusyImageId(null);
    }
  };

  const handleRemoveImage = async (img: ImageAsset) => {
    if (busyImageId !== null) return;
    try {
      setBusyImageId(img.id);
      const existingIds = galleryImages.map((item) => item.id);
      const remainingIds = existingIds.filter((id) => id !== img.id);
      const wasCover = character.cover_image === img.id;

      await characterApi.update(character.id, {
        images: remainingIds,
        ...(wasCover ? { cover_image: remainingIds[0] ?? null } : {}),
      });
      if (lightboxImage?.id === img.id) {
        setLightboxImage(null);
      }
      await refreshAll();
      addToast('Image removed from character');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove image';
      addToast(`Couldn’t remove image: ${msg}`, 'error');
    } finally {
      setBusyImageId(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="kf kf-char"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      {/* Hidden file input shared by Upload buttons */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="kf-char-file-input"
        onChange={handleUploadFile}
        aria-label={`Upload image for ${character.name}`}
      />

      {/* 1. Keyframe Character Hero */}
      <header className={`kf-char-hero ${tier === 'foil' ? 'is-foil' : ''}`}>
        <div className="kf-char-hero-media" aria-hidden="true">
          {showBackdrop && backdropUrl && (
            <img
              key={backdropUrl}
              src={backdropUrl}
              alt=""
              loading="eager"
              decoding="async"
              className="kf-char-hero-backdrop-img"
              onError={() => setFailedBackdropUrl(backdropUrl)}
            />
          )}
        </div>

        <div className="kf-char-hero-top">
          <Link viewTransition to="/characters" className="kf-char-back">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Characters</span>
          </Link>

          <div className="kf-char-hero-top-actions">
            <KfButton
              variant="secondary"
              icon={<Pencil size={14} />}
              onClick={() => openEditCharacterModal(character)}
            >
              Edit
            </KfButton>
            <KfButton
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => {
                setPendingDeleteId(character.id);
                handleDeleteCharacter(character.id);
              }}
            >
              Delete
            </KfButton>
          </div>
        </div>

        <div className="kf-char-hero-inner">
          <div className={`kf-char-hero-portrait is-${tier}`}>
            <CoverArt
              title={character.name}
              imageUrl={tier === 'sketch' ? null : coverUrl}
              accent={accent}
              variant="portrait"
              size="hero"
              fetchPriority="high"
              onImageReady={onImageReady}
              onCorsBlocked={onCorsBlocked}
            />
          </div>

          <div className="kf-char-hero-copy">
            <div className="kf-char-hero-badges">
              <span className={`kf-char-tier-badge is-${tier}`}>
                <Sparkles size={13} aria-hidden="true" />
                <span>{TIER_LABEL[tier]}</span>
              </span>

              <Link
                viewTransition
                to={character.series ? `/anime/${character.series}` : '/anime'}
                className="kf-char-series-link"
              >
                <Film size={13} aria-hidden="true" />
                <span>{character.series_title || 'Anime Series'}</span>
              </Link>
            </div>

            <h1 className="kf-char-hero-heading">{character.name}</h1>

            <p className="kf-char-hero-meta">
              {galleryImages.length} gallery {galleryImages.length === 1 ? 'image' : 'images'}
              {' · '}
              {hasWhy ? 'Why note written' : 'No why note yet'}
            </p>

            <div className="kf-char-hero-actions">
              <KfButton
                variant="primary"
                size="lg"
                icon={<PenLine size={16} />}
                onClick={openWhyComposer}
              >
                {hasWhy ? 'Add to Note' : 'Write Note'}
              </KfButton>

              <KfButton
                variant="secondary"
                size="lg"
                icon={<Upload size={16} />}
                disabled={uploading}
                onClick={triggerUpload}
              >
                {uploading ? 'Uploading…' : 'Upload Portrait'}
              </KfButton>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Card Upgrade Progress Box */}
      <section
        className={`kf-char-upgrade ${tier === 'foil' ? 'is-foil' : ''}`}
        aria-label="Card upgrade progress"
      >
        <div className="kf-char-upgrade-head">
          <div>
            <span className="kf-char-upgrade-eyebrow">
              <Sparkles size={13} aria-hidden="true" />
              <span>
                {nextStep.nextTier
                  ? `Next tier: ${TIER_LABEL[nextStep.nextTier]}`
                  : 'Collection complete'}
              </span>
            </span>
            <h2 className="kf-char-upgrade-title">{nextStep.stepLabel}</h2>
            <p className="kf-char-upgrade-hint">{nextStep.hint}</p>
          </div>

          <div className="kf-char-upgrade-actions">
            {nextStep.currentTier === 'inked' && (
              <KfButton
                variant="primary"
                icon={<PenLine size={15} />}
                onClick={openWhyComposer}
              >
                Write why
              </KfButton>
            )}

            {(nextStep.currentTier === 'sketch' || nextStep.currentTier === 'color') && (
              <>
                <KfButton
                  variant="primary"
                  icon={<Upload size={15} />}
                  disabled={uploading}
                  onClick={triggerUpload}
                >
                  {uploading ? 'Uploading…' : 'Upload image'}
                </KfButton>
                <KfButton
                  variant="secondary"
                  icon={<Images size={15} />}
                  onClick={() => setShowMediaLibrary(true)}
                >
                  Media Library
                </KfButton>
              </>
            )}
          </div>
        </div>

        <ol className="kf-char-steps">
          {CARD_TIER_ORDER.map((stepTier, idx) => {
            const isDone = idx <= currentStepIdx;
            const isNext = nextStep.nextTier === stepTier;
            return (
              <li
                key={stepTier}
                className={`kf-char-step is-${stepTier} ${isDone ? 'is-done' : ''} ${
                  isNext ? 'is-next' : ''
                }`}
              >
                <div className="kf-char-step-top">
                  <span className="kf-char-step-name">{TIER_LABEL[stepTier]}</span>
                  <span className="kf-char-step-state" aria-hidden="true">
                    {isDone ? <Check size={13} /> : idx + 1}
                  </span>
                </div>
                <span className="kf-char-step-req">{TIER_REQUIREMENT[stepTier]}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 3. Why on Keyframe NotePaper */}
      <section className="kf-char-section" aria-labelledby="kf-char-why-heading">
        <div className="kf-char-section-head">
          <div>
            <h2 id="kf-char-why-heading">Why they stayed</h2>
            <p className="kf-char-section-sub">
              Adding to your note keeps everything you wrote before.
            </p>
          </div>

          <KfButton
            variant={hasWhy ? 'secondary' : 'primary'}
            icon={<PenLine size={15} />}
            onClick={openWhyComposer}
          >
            {hasWhy ? 'Add to why' : 'Write why'}
          </KfButton>
        </div>

        <NotePaper
          slate={[
            character.name,
            character.series_title || 'Character',
            TIER_LABEL[tier],
          ]}
        >
          {hasWhy ? (
            <p>{character.why}</p>
          ) : (
            <div className="kf-char-empty-paper-wrap">
              <p className="kf-char-empty-paper">
                What made this character stay with you?
              </p>
              {showXp && <span className="kf-char-xp-badge">+10 XP</span>}
            </div>
          )}
        </NotePaper>
      </section>

      {/* 4. Portrait & Stills Gallery */}
      <section className="kf-char-section" aria-labelledby="kf-char-gallery-heading">
        <div className="kf-char-section-head">
          <div>
            <div className="kf-char-section-title-row">
              <h2 id="kf-char-gallery-heading">Portrait Gallery</h2>
              <span className="kf-char-count-pill">{galleryImages.length}</span>
            </div>
            <p className="kf-char-section-sub">
              Collect portraits and stills for {character.name}. Save 3 or more to unlock Foil.
            </p>
          </div>

          <div className="kf-char-gallery-actions">
            <KfButton
              variant="secondary"
              icon={<Upload size={15} />}
              disabled={uploading}
              onClick={triggerUpload}
            >
              {uploading ? 'Uploading…' : 'Upload image'}
            </KfButton>
            <KfButton
              variant="secondary"
              icon={<Images size={15} />}
              onClick={() => setShowMediaLibrary(true)}
            >
              Media Library
            </KfButton>
          </div>
        </div>

        {galleryImages.length === 0 ? (
          <div className="kf-char-gallery-empty">
            <ImageIcon size={26} color="var(--kf-text-2)" aria-hidden="true" />
            <p>
              No gallery images saved yet. Upload a portrait or pick one from your Media Library.
            </p>
            <div className="kf-char-gallery-actions">
              <KfButton
                variant="primary"
                icon={<Upload size={15} />}
                disabled={uploading}
                onClick={triggerUpload}
              >
                {uploading ? 'Uploading…' : 'Upload image'}
              </KfButton>
              <KfButton
                variant="secondary"
                icon={<Images size={15} />}
                onClick={() => setShowMediaLibrary(true)}
              >
                Media Library
              </KfButton>
            </div>
          </div>
        ) : (
          <div className="kf-char-gallery-grid">
            {galleryImages.map((img, idx) => {
              const imgUrl = resolveImageAssetUrl(img);
              const thumbUrl = imgUrl ? (cloudinaryThumbUrl(imgUrl, 'card') ?? imgUrl) : null;
              const isCover =
                character.cover_image === img.id ||
                (!character.cover_image && idx === 0);
              const isBusy = busyImageId === img.id;

              return (
                <article
                  key={img.id}
                  className={`kf-char-gallery-item ${isCover ? 'is-cover' : ''}`}
                >
                  <button
                    type="button"
                    className="kf-char-gallery-thumb"
                    onClick={() => setLightboxImage(img)}
                    aria-label={`Preview ${img.title || `${character.name} portrait ${idx + 1}`}`}
                  >
                    {thumbUrl && (
                      <img
                        src={thumbUrl}
                        alt={img.alt_text || img.title || character.name}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="kf-char-gallery-zoom" aria-hidden="true">
                      <Maximize2 size={13} />
                    </span>
                  </button>

                  <div className="kf-char-gallery-footer">
                    {isCover ? (
                      <span className="kf-char-cover-pill">
                        <Star size={12} fill="currentColor" aria-hidden="true" />
                        <span>Cover</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="kf-char-gallery-btn"
                        disabled={busyImageId !== null}
                        onClick={() => handleSetCover(img)}
                      >
                        <Star size={12} aria-hidden="true" />
                        <span>{isBusy ? 'Saving…' : 'Set as cover'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="kf-char-gallery-btn is-danger"
                      disabled={busyImageId !== null}
                      onClick={() => handleRemoveImage(img)}
                      aria-label={`Remove ${img.title || `image ${idx + 1}`} from ${character.name}`}
                      title="Remove from character"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Media Library Picker Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelectImage={handlePickFromMediaLibrary}
        />
      )}

      {/* Accessible Native <dialog> Lightbox */}
      <dialog
        ref={lightboxRef}
        className="kf-char-lightbox"
        aria-labelledby={lightboxTitleId}
        onCancel={(e) => {
          e.preventDefault();
          setLightboxImage(null);
        }}
        onClick={(e) => {
          if (e.target === lightboxRef.current) {
            setLightboxImage(null);
          }
        }}
      >
        <div className="kf-char-lightbox-head">
          <h2 id={lightboxTitleId} className="kf-char-lightbox-title">
            {lightboxImage?.title || character.name}
          </h2>
          <button
            type="button"
            className="kf-char-lightbox-close"
            onClick={() => setLightboxImage(null)}
            aria-label="Close image preview"
          >
            <X size={15} aria-hidden="true" />
            <span>Close</span>
          </button>
        </div>

        <div className="kf-char-lightbox-body">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt={lightboxImage?.alt_text || lightboxImage?.title || character.name}
            />
          )}
        </div>
      </dialog>
    </div>
  );
};
