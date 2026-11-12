import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { exportApi, importApi } from '../api/client';
import { KfButton } from '../ui/keyframe';
import { useDialog } from '../ui/Sheet/useDialog';
import '../styles/keyframe.css';
import '../features/settings/Settings.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (text: string, type?: 'success' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onToast }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [downloadingMd, setDownloadingMd] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  const [malUsername, setMalUsername] = useState('');
  const [importingMal, setImportingMal] = useState(false);
  const [restoringJson, setRestoringJson] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  useDialog(overlayRef, isOpen, onClose);

  if (!isOpen) return null;

  const triggerDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = async () => {
    try {
      setDownloadingMd(true);
      const res = await exportApi.exportMarkdown();
      triggerDownload(
        res.content,
        `animelog-journal-${new Date().toISOString().split('T')[0]}.md`,
        'text/markdown',
      );
      onToast?.('Exported journal to Markdown (Obsidian-ready)!');
    } catch (err) {
      console.error(err);
      onToast?.('Failed to export markdown', 'error');
    } finally {
      setDownloadingMd(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setDownloadingJson(true);
      const data = await exportApi.exportJson();
      triggerDownload(
        JSON.stringify(data, null, 2),
        `animelog-backup-${new Date().toISOString().split('T')[0]}.json`,
        'application/json',
      );
      onToast?.('Exported complete JSON backup!');
    } catch (err) {
      console.error(err);
      onToast?.('Failed to export JSON', 'error');
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleImportMal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const user = malUsername.trim();
    if (!user || importingMal) return;
    try {
      setImportingMal(true);
      setImportResult(null);
      const res = await importApi.importMal(user, 60);
      const msg = `Imported ${res.imported_count} new and updated ${res.updated_count} series from MyAnimeList (${res.total_processed} total).`;
      setImportResult(msg);
      onToast?.(msg);
      setMalUsername('');
    } catch (err) {
      console.error(err);
      const errText =
        err instanceof Error ? err.message : 'Failed to import MyAnimeList profile';
      setImportResult(`Error: ${errText}`);
      onToast?.('MyAnimeList import failed', 'error');
    } finally {
      setImportingMal(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setRestoringJson(true);
      setImportResult(null);
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const res = await importApi.importJson(parsed);
      const msg = `Restored ${res.imported.series} series, ${res.imported.books} books, and ${res.imported.characters} characters!`;
      setImportResult(msg);
      onToast?.(msg);
    } catch (err) {
      console.error(err);
      setImportResult('Error: Failed to parse or restore backup file.');
      onToast?.('Invalid backup file', 'error');
    } finally {
      setRestoringJson(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      ref={overlayRef}
      className="kf kf-export-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kf-export-dialog-title"
    >
      <div className="kf-export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="kf-export-header">
          <div className="kf-export-header-main">
            <div className="kf-export-header-icon" aria-hidden="true">
              {activeTab === 'export' ? <Download size={18} /> : <Upload size={18} />}
            </div>
            <div>
              <h2 id="kf-export-dialog-title" className="kf-export-title">
                {activeTab === 'export' ? 'Export Journal & Backups' : 'Import Media History'}
              </h2>
              <p className="kf-export-subtitle">
                Keep your notes portable across Obsidian, MyAnimeList, and JSON backups.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="kf-export-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="kf-export-tabs" role="tablist" aria-label="Export or import mode">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'export'}
            className={`kf-export-tab ${activeTab === 'export' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('export');
              setImportResult(null);
            }}
          >
            <Download size={14} aria-hidden="true" />
            <span>Export Journal</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'import'}
            className={`kf-export-tab ${activeTab === 'import' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('import');
              setImportResult(null);
            }}
          >
            <Upload size={14} aria-hidden="true" />
            <span>Import History</span>
          </button>
        </div>

        <div className="kf-export-body">
          {activeTab === 'export' ? (
            <>
              <div className="kf-export-card">
                <div className="kf-export-card-info">
                  <div className="kf-export-card-icon" aria-hidden="true">
                    <FileText size={19} />
                  </div>
                  <div>
                    <h3 className="kf-export-card-title">
                      Obsidian &amp; Markdown Document (.md)
                    </h3>
                    <p className="kf-export-card-desc">
                      Exports all series, seasons, episode notes, books, rewatches, and characters
                      with YAML frontmatter and [[wikilinks]].
                    </p>
                  </div>
                </div>
                <div className="kf-export-card-action">
                  <KfButton
                    variant="primary"
                    onClick={() => void handleExportMarkdown()}
                    disabled={downloadingMd}
                    icon={
                      downloadingMd ? (
                        <Loader2 size={14} className="kf-spin" />
                      ) : (
                        <Download size={14} />
                      )
                    }
                  >
                    Download .md
                  </KfButton>
                </div>
              </div>

              <div className="kf-export-card">
                <div className="kf-export-card-info">
                  <div className="kf-export-card-icon is-teal" aria-hidden="true">
                    <Database size={19} />
                  </div>
                  <div>
                    <h3 className="kf-export-card-title">Full Structured Backup (.json)</h3>
                    <p className="kf-export-card-desc">
                      Complete database dump of titles, timestamps, ratings, relational links, and
                      notes for migrations or backup.
                    </p>
                  </div>
                </div>
                <div className="kf-export-card-action">
                  <KfButton
                    variant="secondary"
                    onClick={() => void handleExportJson()}
                    disabled={downloadingJson}
                    icon={
                      downloadingJson ? (
                        <Loader2 size={14} className="kf-spin" />
                      ) : (
                        <Download size={14} />
                      )
                    }
                  >
                    Download .json
                  </KfButton>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="kf-export-card is-column">
                <div className="kf-export-card-info">
                  <div className="kf-export-card-icon" aria-hidden="true">
                    <Sparkles size={19} />
                  </div>
                  <div>
                    <h3 className="kf-export-card-title">Import from MyAnimeList</h3>
                    <p className="kf-export-card-desc">
                      Import your watched and completed titles, ratings, and episode progress from a
                      public MyAnimeList profile.
                    </p>
                  </div>
                </div>

                <form className="kf-export-mal-form" onSubmit={(e) => void handleImportMal(e)}>
                  <input
                    type="text"
                    className="kf-media-input"
                    value={malUsername}
                    onChange={(e) => setMalUsername(e.target.value)}
                    placeholder="Enter MAL username (e.g. cubewin07)…"
                    aria-label="MyAnimeList username"
                  />
                  <KfButton
                    type="submit"
                    variant="primary"
                    disabled={importingMal || !malUsername.trim()}
                    icon={
                      importingMal ? (
                        <Loader2 size={14} className="kf-spin" />
                      ) : (
                        <Upload size={14} />
                      )
                    }
                  >
                    Import MAL
                  </KfButton>
                </form>
              </div>

              <div className="kf-export-card">
                <div className="kf-export-card-info">
                  <div className="kf-export-card-icon is-teal" aria-hidden="true">
                    <RefreshCw size={19} />
                  </div>
                  <div>
                    <h3 className="kf-export-card-title">Restore JSON Backup</h3>
                    <p className="kf-export-card-desc">
                      Merge or restore titles, books, and characters from an exported .json backup
                      file.
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => void handleRestoreFile(e)}
                  style={{ display: 'none' }}
                />
                <div className="kf-export-card-action">
                  <KfButton
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={restoringJson}
                    icon={
                      restoringJson ? (
                        <Loader2 size={14} className="kf-spin" />
                      ) : (
                        <Upload size={14} />
                      )
                    }
                  >
                    Select File
                  </KfButton>
                </div>
              </div>

              {importResult && (
                <div
                  role="status"
                  className={`kf-export-status ${importResult.startsWith('Error') ? 'is-error' : ''}`}
                >
                  {importResult}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
