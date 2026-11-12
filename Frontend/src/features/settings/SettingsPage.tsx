import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Database, Download, ImagePlus, Upload } from 'lucide-react';
import type { AppOutletContext } from '../../app/AppLayout';
import { getGamePrefs, saveGamePrefs, type GamePrefs } from '../../lib/progression';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { KfButton } from '../../ui/keyframe';
import { buildFindArtItems, summarizeFindArt } from '../find-art/findArtQueue';
import { MediaPanel } from './MediaPanel';
import '../../styles/keyframe.css';
import './Settings.css';

interface PrefToggleItem {
  key: keyof GamePrefs;
  title: string;
  desc: string;
}

const PREF_ITEMS: PrefToggleItem[] = [
  {
    key: 'xp',
    title: 'XP & Levels',
    desc: 'Earn XP and track level tiers from watching and writing notes',
  },
  {
    key: 'streak',
    title: 'Weekly Streak',
    desc: 'Count active days with 1 rest day automatically forgiven per week',
  },
  {
    key: 'celebrations',
    title: 'Finale Celebrations',
    desc: 'Show the full-art celebration card when finishing a season, movie, or book',
  },
];

export const SettingsPage: React.FC = () => {
  const { seriesList, bookList, characterList } = useJournalData();
  const { addToast, requestConfirm } = useJournalActions();
  const outlet = useOutletContext<AppOutletContext | undefined>();

  const findArtSummary = useMemo(
    () => summarizeFindArt(buildFindArtItems({ seriesList, bookList, characterList })),
    [seriesList, bookList, characterList],
  );

  const [prefs, setPrefs] = useState<GamePrefs>(() => getGamePrefs());

  useEffect(() => {
    const syncPrefs = () => setPrefs(getGamePrefs());
    window.addEventListener('focus', syncPrefs);
    window.addEventListener('storage', syncPrefs);
    return () => {
      window.removeEventListener('focus', syncPrefs);
      window.removeEventListener('storage', syncPrefs);
    };
  }, []);

  const togglePref = (key: keyof GamePrefs) => {
    setPrefs((prev) => saveGamePrefs({ [key]: !prev[key] }));
  };

  return (
    <div className="kf kf-settings">
      <header className="kf-settings-header">
        <div className="kf-settings-title-block">
          <h1>Settings</h1>
          <p>
            Backup and import your journal, tune progression features, and manage your media
            library.
          </p>
        </div>

        {outlet?.onOpenExport && (
          <KfButton
            variant="primary"
            icon={<Download size={15} />}
            onClick={outlet.onOpenExport}
          >
            Export &amp; Import
          </KfButton>
        )}
      </header>

      <section className="kf-settings-section" aria-labelledby="kf-prefs-heading">
        <div className="kf-settings-section-head">
          <h2 id="kf-prefs-heading" className="kf-settings-section-title">
            Progression &amp; Celebrations
          </h2>
        </div>

        <div className="kf-prefs-grid">
          {PREF_ITEMS.map((item) => {
            const enabled = prefs[item.key];
            return (
              <label
                key={item.key}
                className={`kf-pref-card ${enabled ? 'is-enabled' : ''}`}
              >
                <span className="kf-pref-copy">
                  <span className="kf-pref-title">{item.title}</span>
                  <span className="kf-pref-desc">{item.desc}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={enabled}
                  className="kf-switch"
                  checked={enabled}
                  onChange={() => togglePref(item.key)}
                />
              </label>
            );
          })}
        </div>
      </section>

      <div className="kf-spotlights-grid">
        <section className="kf-spotlight-card is-art" aria-labelledby="kf-findart-card-heading">
          <div className="kf-spotlight-head">
            <div className="kf-spotlight-title-row">
              <ImagePlus size={18} className="kf-spotlight-icon" aria-hidden="true" />
              <h2 id="kf-findart-card-heading">Find Art</h2>
              <span
                className={`kf-spotlight-badge ${findArtSummary.missing === 0 ? 'is-done' : ''}`}
              >
                {findArtSummary.missing > 0
                  ? `${findArtSummary.missing} missing`
                  : `All ${findArtSummary.total} saved`}
              </span>
            </div>
            <p className="kf-spotlight-desc">
              {findArtSummary.missing > 0
                ? `${findArtSummary.missing} of ${findArtSummary.total} entries (anime, books, and characters) don’t have cover art yet. Review matches or upload local art one step at a time.`
                : `All ${findArtSummary.total} entries already have cover art. You can still review matches or swap artwork anytime.`}
            </p>
          </div>

          <div className="kf-spotlight-actions">
            <Link viewTransition to="/settings/find-art" className="kf-settings-cta-link">
              {findArtSummary.missing > 0 ? 'Open Find Art' : 'Review Cover Art'}
            </Link>
          </div>
        </section>

        <section className="kf-spotlight-card" aria-labelledby="kf-backup-card-heading">
          <div className="kf-spotlight-head">
            <div className="kf-spotlight-title-row">
              <Database size={18} className="kf-spotlight-icon" aria-hidden="true" />
              <h2 id="kf-backup-card-heading">Journal Backup &amp; Import</h2>
            </div>
            <p className="kf-spotlight-desc">
              Export an Obsidian-ready Markdown archive or full JSON backup, import history from
              MyAnimeList, or restore a saved backup file.
            </p>
          </div>

          {outlet?.onOpenExport && (
            <div className="kf-spotlight-actions">
              <KfButton
                variant="secondary"
                icon={<Upload size={15} />}
                onClick={outlet.onOpenExport}
              >
                Export &amp; Import
              </KfButton>
            </div>
          )}
        </section>
      </div>

      <MediaPanel onNotify={addToast} onRequestConfirm={requestConfirm} />
    </div>
  );
};
