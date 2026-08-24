import React, { useState, useRef } from 'react';
import { FavoriteCharacter, ImageAsset } from '../types';
import {
  X,
  Sparkles,
  Film,
  PenLine,
  Image as ImageIcon,
  Plus,
  Star,
  Maximize2,
  Trash2,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { TakeawaySlip } from './TakeawaySlip';
import { MediaLibraryModal } from './MediaLibraryModal';

interface CharacterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: FavoriteCharacter | null;
  onEdit?: (character: FavoriteCharacter) => void;
  onSetCoverImage?: (characterId: number, imageId: number) => Promise<void>;
  onAddImage?: (characterId: number, image: ImageAsset) => Promise<void>;
  onRemoveImage?: (characterId: number, imageId: number) => Promise<void>;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  isOpen,
  onClose,
  character,
  onEdit,
  onSetCoverImage,
  onAddImage,
  onRemoveImage,
}) => {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ImageAsset | null>(null);
  const [settingCoverId, setSettingCoverId] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.95, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  if (!isOpen || !character) return null;

  // Resolve cover image and full gallery list
  const coverUrl =
    character.cover_image_url ||
    character.image_url ||
    (character.images && character.images.length > 0
      ? (character.images[0] as any).image_url || (character.images[0] as any).url
      : null);

  const galleryImages: ImageAsset[] = character.images || [];

  const handleSetCover = async (imageId: number) => {
    if (!onSetCoverImage || settingCoverId) return;
    try {
      setSettingCoverId(imageId);
      await onSetCoverImage(character.id, imageId);
    } finally {
      setSettingCoverId(null);
    }
  };

  const handleSelectMediaImage = async (image: ImageAsset) => {
    setShowMediaLibrary(false);
    if (onAddImage) {
      await onAddImage(character.id, image);
    }
  };

  const handleRemoveImageFromGallery = async (imageId: number) => {
    if (onRemoveImage) {
      await onRemoveImage(character.id, imageId);
    }
  };

  return (
    <>
      <div
        ref={overlayRef}
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1000 }}
      >
        <div
          ref={modalRef}
          className="modal-container"
          style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-desk-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--desk-surface)',
                  color: 'var(--tungsten)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, color: 'var(--text-desk)', margin: 0, fontWeight: 600 }}>
                  Character Reflection
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onEdit && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onEdit(character);
                  }}
                  style={{ gap: 6 }}
                >
                  <PenLine size={14} />
                  <span>Edit Reflection</span>
                </button>
              )}
              <button className="btn-icon" onClick={onClose} aria-label="Close modal">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Hero Profile Row */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 14,
                padding: '12px 0 6px 0',
              }}
            >
              {/* Circular Avatar */}
              <div
                style={{
                  position: 'relative',
                  width: 112,
                  height: 112,
                  borderRadius: '50%',
                  backgroundColor: 'var(--desk-surface)',
                  padding: 3,
                  boxShadow: '0 0 0 4px var(--desk-surface), var(--shadow-paper), 0 8px 24px rgba(0,0,0,0.3)',
                  border: '2px solid var(--border-desk-medium)',
                  flexShrink: 0,
                  cursor: coverUrl ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (coverUrl) {
                    const currentImg = galleryImages.find((img) => img.id === character.cover_image);
                    setLightboxImage(currentImg || ({ id: 0, file: coverUrl, url: coverUrl, title: character.name, created_at: '' } as any));
                  }
                }}
                title={coverUrl ? 'Click to view high-res avatar' : undefined}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={character.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    width={112}
                    height={112}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--graphite)',
                    }}
                  >
                    <Sparkles size={36} />
                  </div>
                )}
              </div>

              {/* Series and Name */}
              <div>
                {character.series_title && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-desk-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      marginBottom: 4,
                    }}
                  >
                    <Film size={12} /> {character.series_title}
                  </div>
                )}
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--text-desk)',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {character.name}
                </h2>
              </div>
            </div>

            {/* Why Worth Remembering (Takeaway Slip) */}
            <div>
              <TakeawaySlip
                label="WHY THEY MATTERED TO ME"
                text={character.why}
                onWrite={
                  onEdit
                    ? () => {
                        onClose();
                        onEdit(character);
                      }
                    : undefined
                }
                emptyText="No character reflection recorded yet. Record why this character made a lasting impression."
                emptyCtaText="Record Reflection"
                isDetail
              />
            </div>

            {/* Memories & Stills Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: 16,
                      color: 'var(--text-desk)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 600,
                    }}
                  >
                    <ImageIcon size={16} color="var(--tungsten)" />
                    <span>Memories & Stills</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--desk-surface)',
                        color: 'var(--text-desk-muted)',
                      }}
                    >
                      {galleryImages.length}
                    </span>
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-desk-muted)', margin: '2px 0 0 0' }}>
                    Stills, concept art, and moments featuring {character.name}.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowMediaLibrary(true)}
                  style={{ gap: 6 }}
                >
                  <Plus size={14} />
                  <span>Attach Still</span>
                </button>
              </div>

              {galleryImages.length === 0 ? (
                <div
                  style={{
                    padding: '28px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px dashed var(--border-desk-medium)',
                    backgroundColor: 'var(--desk-surface)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <ImageIcon size={28} color="var(--graphite)" />
                  <p style={{ fontSize: 14, color: 'var(--text-desk-muted)', margin: 0 }}>
                    No stills or images attached to this character yet.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowMediaLibrary(true)}
                    style={{ marginTop: 4 }}
                  >
                    <Plus size={14} />
                    <span>Browse Media Library</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 14,
                  }}
                >
                  {galleryImages.map((img) => {
                    const imgUrl = (img as any).image_url || img.url || img.file;
                    const isCover =
                      character.cover_image === img.id ||
                      (!character.cover_image && galleryImages[0]?.id === img.id);

                    return (
                      <div
                        key={img.id}
                        style={{
                          position: 'relative',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--still-well)',
                          border: isCover
                            ? '2px solid var(--tungsten)'
                            : '1px solid var(--border-desk-subtle)',
                          boxShadow: 'var(--shadow-desk)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Thumbnail View */}
                        <div
                          style={{
                            width: '100%',
                            height: 130,
                            position: 'relative',
                            cursor: 'pointer',
                            overflow: 'hidden',
                          }}
                          onClick={() => setLightboxImage(img)}
                          title="Click to view fullscreen"
                        >
                          <img
                            src={imgUrl}
                            alt={img.title || character.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.25s ease',
                            }}
                            loading="lazy"
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              padding: 4,
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(0,0,0,0.65)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Maximize2 size={12} />
                          </div>
                        </div>

                        {/* Image Footer / Controls */}
                        <div
                          style={{
                            padding: '8px 10px',
                            backgroundColor: 'var(--desk-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          {isCover ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--tungsten)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Star size={11} fill="var(--tungsten)" /> Cover Avatar
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                height: 24,
                                color: 'var(--text-desk-muted)',
                              }}
                              onClick={() => handleSetCover(img.id)}
                              disabled={settingCoverId === img.id}
                              title="Set this image as the representative avatar"
                            >
                              <Star size={11} /> Set as Avatar
                            </button>
                          )}

                          {onRemoveImage && galleryImages.length > 1 && (
                            <button
                              type="button"
                              className="btn-icon danger"
                              style={{ width: 22, height: 22, padding: 0 }}
                              onClick={() => handleRemoveImageFromGallery(img.id)}
                              title="Remove from character stills"
                              aria-label="Remove image"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media Library Picker Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelectImage={handleSelectMediaImage}
        />
      )}

      {/* Fullscreen Lightbox Zoom Modal */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{
            zIndex: 1200,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-icon"
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
              }}
              onClick={() => setLightboxImage(null)}
              aria-label="Close zoomed image"
            >
              <X size={18} />
            </button>

            <img
              src={(lightboxImage as any).image_url || lightboxImage.url || lightboxImage.file}
              alt={lightboxImage.title || character.name}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
              }}
            />

            {lightboxImage.title && (
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-desk-muted)',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                {lightboxImage.title}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
