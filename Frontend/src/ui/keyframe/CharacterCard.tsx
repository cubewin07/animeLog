import React from 'react';
import { CoverArt } from './CoverArt';
import './CharacterCard.css';

export type CardTier = 'sketch' | 'inked' | 'color' | 'foil';

export const TIER_LABEL: Record<CardTier, string> = {
  sketch: 'Sketch',
  inked: 'Inked',
  color: 'Full color',
  foil: 'Foil',
};

/** Tiers come from care, not luck: a portrait, a reason you care, then a gallery. */
export function cardTier(character: { hasPortrait: boolean; hasWhy: boolean; imageCount: number }): CardTier {
  if (!character.hasPortrait) return 'sketch';
  if (!character.hasWhy) return 'inked';
  return character.imageCount >= 3 ? 'foil' : 'color';
}

export interface KfCharacterCardProps {
  name: string;
  seriesTitle?: string;
  why?: string | null;
  imageUrl?: string | null;
  tier: CardTier;
}

export const KfCharacterCard: React.FC<KfCharacterCardProps> = ({ name, seriesTitle, why, imageUrl, tier }) => (
  <article className={`kf-charcard is-${tier}`}>
    <div className="kf-charcard-art">
      <CoverArt title={name} imageUrl={tier === 'sketch' ? null : imageUrl} variant="portrait" />
      <span className="kf-charcard-tier">{TIER_LABEL[tier]}</span>
    </div>
    <h3>{name}</h3>
    {seriesTitle && <p className="kf-charcard-series">{seriesTitle}</p>}
    {why && <p className="kf-charcard-why">{why}</p>}
  </article>
);
