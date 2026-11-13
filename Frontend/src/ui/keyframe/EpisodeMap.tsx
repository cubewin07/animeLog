import React from 'react';
import './EpisodeMap.css';

export interface EpisodeMapNote {
  episode: number;
  rating?: number | null;
}

export interface EpisodeMapProps {
  total: number;
  watched: number;
  notes: EpisodeMapNote[];
  selected?: number | null;
  onSelect?: (episode: number) => void;
}

/**
 * The dope sheet. Each cell is an episode. Lit means watched, a filled cell has a note,
 * gold means a 9 or 10, and a heavier rule marks every 12 episodes (one cour).
 */
export const EpisodeMap: React.FC<EpisodeMapProps> = ({ total, watched, notes, selected, onSelect }) => {
  const byEpisode = new Map(notes.map((n) => [n.episode, n]));
  return (
    <div className="kf-epmap" role="group" aria-label={`Episodes, ${watched} of ${total} watched`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((episode) => {
        const note = byEpisode.get(episode);
        const isWatched = episode <= watched;
        const isNext = episode === watched + 1;
        const classes = [
          'kf-epcell',
          isWatched && 'is-watched',
          note && 'has-note',
          note?.rating && note.rating >= 9 && 'is-top',
          isNext && 'is-next',
          selected === episode && 'is-selected',
          episode % 12 === 0 && 'ends-cour',
        ].filter(Boolean).join(' ');
        const label = [
          `Episode ${episode}`,
          isWatched ? 'watched' : isNext ? 'up next' : 'not watched',
          note ? 'has a note' : '',
          note?.rating ? `rated ${note.rating}` : '',
        ].filter(Boolean).join(', ');
        return (
          <button
            key={episode}
            type="button"
            className={classes}
            aria-label={label}
            aria-pressed={selected === episode}
            onClick={() => onSelect?.(episode)}
          >
            {episode}
          </button>
        );
      })}
    </div>
  );
};
