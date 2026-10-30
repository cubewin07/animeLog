import React, { useState } from 'react';
import { FavoriteCharacter, ImageAsset } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { CharacterDetailModal } from '../components/CharacterDetailModal';
import { Button, EmptyState } from '../ui';
import { useJournal } from '../state/JournalContext';
import { Plus, Search, Sparkles, User, X } from 'lucide-react';
import { characterApi } from '../api/client';

interface CharactersViewProps {
  characters: FavoriteCharacter[];
  searchQuery: string;
  onEdit?: (character: FavoriteCharacter) => void;
  onDelete: (id: number) => void;
  onOpenAddModal: () => void;
  onRefresh?: () => Promise<void>;
}

export const CharactersView: React.FC<CharactersViewProps> = ({
  characters,
  searchQuery,
  onEdit,
  onDelete,
  onOpenAddModal,
  onRefresh,
}) => {
  const { openComposer } = useJournal();
  const [selectedCharacter, setSelectedCharacter] = useState<FavoriteCharacter | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  // Keep selectedCharacter in sync if list updates
  const activeChar = selectedCharacter
    ? characters.find((c) => c.id === selectedCharacter.id) || selectedCharacter
    : null;

  const q = localQuery.toLowerCase().trim();
  const filtered = characters.filter((c) => {
    return (
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      (c.series_title && c.series_title.toLowerCase().includes(q)) ||
      (c.why && c.why.toLowerCase().includes(q))
    );
  });

  const charactersWithWhyCount = characters.filter((c) => Boolean(c.why?.trim())).length;

  const handleSetCoverImage = async (characterId: number, imageId: number) => {
    try {
      const char = characters.find((c) => c.id === characterId);
      const existingImageIds = (char?.images || []).map((img) => img.id);
      const updatedImages = existingImageIds.includes(imageId)
        ? existingImageIds
        : [...existingImageIds, imageId];

      const updated = await characterApi.update(characterId, {
        cover_image: imageId,
        images: updatedImages,
      });
      setSelectedCharacter(updated);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to set cover image:', err);
    }
  };

  const handleAddImage = async (characterId: number, image: ImageAsset) => {
    try {
      const char = characters.find((c) => c.id === characterId);
      const existingImageIds = (char?.images || []).map((img) => img.id);
      if (existingImageIds.includes(image.id)) return;

      const updatedImages = [...existingImageIds, image.id];
      const updated = await characterApi.update(characterId, {
        images: updatedImages,
      });
      setSelectedCharacter(updated);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to attach image to character:', err);
    }
  };

  const handleRemoveImage = async (characterId: number, imageId: number) => {
    try {
      const char = characters.find((c) => c.id === characterId);
      const existingImageIds = (char?.images || []).map((img) => img.id);
      const updatedImages = existingImageIds.filter((id) => id !== imageId);
      const newCoverImage =
        char?.cover_image === imageId ? updatedImages[0] || null : char?.cover_image;

      const updated = await characterApi.update(characterId, {
        cover_image: newCoverImage,
        images: updatedImages,
      });
      setSelectedCharacter(updated);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to remove image from character:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeIn var(--dur-base) var(--ease-smooth)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--lamp)',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            <User size={14} />
            <span>People & Virtues</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.2vw, 36px)',
              color: 'var(--text)',
              lineHeight: 1.15,
            }}
          >
            People Remembered
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 6, maxWidth: 620, lineHeight: 1.5 }}>
            The characters worth remembering—and the specific virtues, philosophies, and lessons they represent.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              fontSize: 12,
              color: 'var(--text-3)',
            }}
          >
            <span>{characters.length} {characters.length === 1 ? 'person' : 'people'} logged</span>
            <span>·</span>
            <span>{charactersWithWhyCount} with reflections</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={onOpenAddModal}
          >
            Add Person
          </Button>
        </div>
      </header>

      {/* Filter / Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 16,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search characters by name, series, or virtue…"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 34,
              paddingRight: localQuery ? 32 : 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color var(--dur-fast) var(--ease-smooth)',
            }}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => setLocalQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: 2,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<User size={32} />}
          title={localQuery ? 'No characters match your search' : 'No people remembered yet'}
          description={
            localQuery
              ? `No characters found matching "${localQuery}".`
              : 'Remember the figures who challenged your thinking or embodied virtues worth carrying.'
          }
          action={
            !localQuery && (
              <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenAddModal}>
                Add first character
              </Button>
            )
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 22,
          }}
        >
          {filtered.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onClick={(char) => setSelectedCharacter(char)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Character Detail & Stills Modal */}
      {activeChar && (
        <CharacterDetailModal
          isOpen={Boolean(activeChar)}
          onClose={() => setSelectedCharacter(null)}
          character={activeChar}
          onEdit={onEdit}
          onSetCoverImage={handleSetCoverImage}
          onAddImage={handleAddImage}
          onRemoveImage={handleRemoveImage}
        />
      )}
    </div>
  );
};
