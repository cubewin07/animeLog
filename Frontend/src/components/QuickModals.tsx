import React, { useState } from 'react';
import { Anime, FavoriteCharacter, Rewatch } from '../types';
import { X, RotateCcw, Sparkles, Star } from 'lucide-react';

interface RewatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime | null;
  onSave: (data: Omit<Rewatch, 'id'>) => void;
}

export const RewatchModal: React.FC<RewatchModalProps> = ({
  isOpen,
  onClose,
  anime,
  onSave,
}) => {
  const [rating, setRating] = useState<number | null>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !anime) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      anime: anime.id,
      start_date: startDate || null,
      finish_date: finishDate || null,
      rating,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} color="var(--color-secondary)" />
            <h3 style={{ fontSize: '16px', color: '#ffffff' }}>Log Rewatch for "{anime.title}"</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Rewatch Rating
            </label>
            <select
              value={rating || ''}
              onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
              className="form-select"
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  ★ {n} / 10
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              How did your perspective change? (Notes & Insights)
            </label>
            <textarea
              rows={3}
              placeholder="What new details did you notice? How did this pass feel different?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Rewatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeList: Anime[];
  preselectedAnime?: Anime | null;
  onSave: (data: Omit<FavoriteCharacter, 'id'>) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  animeList,
  preselectedAnime,
  onSave,
}) => {
  const [animeId, setAnimeId] = useState<number>(
    preselectedAnime ? preselectedAnime.id : animeList[0]?.id || 1
  );
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      anime: animeId,
      name: name.trim(),
      why: why.trim() || null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-accent-emerald)" />
            <h3 style={{ fontSize: '16px', color: '#ffffff' }}>Remember a Character</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Associated Anime
            </label>
            <select
              value={animeId}
              onChange={(e) => setAnimeId(Number(e.target.value))}
              className="form-select"
            >
              {animeList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Character Name <span style={{ color: '#fb7185' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Himmel, Thorfinn, Kurisu Makise..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Why is this character worth remembering? (Lesson / Memory)
            </label>
            <textarea
              rows={3}
              placeholder="What actions, philosophies, or moments made them unforgettable?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
