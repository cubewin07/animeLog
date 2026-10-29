import React, { useState, useRef } from 'react';
import { exportApi, importApi } from '../api/client';
import { X, Download, Upload, FileText, Database, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (text: string, type?: 'success' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onToast }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [downloadingMd, setDownloadingMd] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  // Import state
  const [malUsername, setMalUsername] = useState('');
  const [importingMal, setImportingMal] = useState(false);
  const [restoringJson, setRestoringJson] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
          { opacity: 0, scale: 0.95, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

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
      triggerDownload(res.content, `animelog-journal-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
      if (onToast) onToast('Exported journal to Markdown (Obsidian-ready)!');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to export markdown', 'error');
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
        'application/json'
      );
      if (onToast) onToast('Exported complete JSON backup!');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to export JSON', 'error');
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleImportMal = async () => {
    const user = malUsername.trim();
    if (!user) return;
    try {
      setImportingMal(true);
      setImportResult(null);
      const res = await importApi.importMal(user, 60);
      const msg = `Imported ${res.imported_count} new and updated ${res.updated_count} series from MyAnimeList (${res.total_processed} total).`;
      setImportResult(msg);
      if (onToast) onToast(msg);
      setMalUsername('');
    } catch (err: any) {
      console.error(err);
      const errText = err?.message || 'Failed to import MyAnimeList profile';
      setImportResult(`Error: ${errText}`);
      if (onToast) onToast('MyAnimeList import failed', 'error');
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
      const parsed = JSON.parse(text);
      const res = await importApi.importJson(parsed);
      const msg = `Restored ${res.imported.series} series, ${res.imported.books} books, and ${res.imported.characters} characters!`;
      setImportResult(msg);
      if (onToast) onToast(msg);
    } catch (err: any) {
      console.error(err);
      setImportResult('Failed to parse or restore backup file.');
      if (onToast) onToast('Invalid backup file', 'error');
    } finally {
      setRestoringJson(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              {activeTab === 'export' ? <Download size={18} /> : <Upload size={18} />}
            </div>
            <div>
              <h3 style={{ fontSize: 17, color: 'var(--text-desk)', margin: 0 }}>
                {activeTab === 'export' ? 'Export Journal & Backups' : 'Import Media History'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-desk-muted)', margin: 0 }}>
                Keep your lessons portable across Obsidian, MyAnimeList, and backups.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-desk-subtle)', padding: '0 24px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('export'); setImportResult(null); }}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'export' ? '2px solid var(--tungsten)' : '2px solid transparent',
              color: activeTab === 'export' ? 'var(--text-desk)' : 'var(--text-desk-dim)',
              fontSize: 13,
              fontWeight: activeTab === 'export' ? 600 : 400,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Download size={14} /> Export Journal
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('import'); setImportResult(null); }}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'import' ? '2px solid var(--tungsten)' : '2px solid transparent',
              color: activeTab === 'import' ? 'var(--text-desk)' : 'var(--text-desk-dim)',
              fontSize: 13,
              fontWeight: activeTab === 'import' ? 600 : 400,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Upload size={14} /> Import History
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeTab === 'export' ? (
            <>
              {/* Option 1: Obsidian / Markdown */}
              <div
                className="desk-card"
                style={{
                  padding: 18,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  background: 'var(--desk-surface)',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: 'var(--desk-raised)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--tungsten)',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-desk)', fontWeight: 600 }}>
                      Obsidian & Markdown Document (.md)
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-desk-muted)', lineHeight: 1.4 }}>
                      Exports all franchises, seasons, episode notes, books, rewatches, and characters with YAML frontmatter and [[wikilinks]].
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportMarkdown}
                  disabled={downloadingMd}
                  style={{ flexShrink: 0, fontSize: 13 }}
                >
                  {downloadingMd ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                  <span>Download .md</span>
                </button>
              </div>

              {/* Option 2: JSON Backup */}
              <div
                className="desk-card"
                style={{
                  padding: 18,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  background: 'var(--desk-surface)',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: 'var(--desk-raised)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--spine-text)',
                      flexShrink: 0,
                    }}
                  >
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-desk)', fontWeight: 600 }}>
                      Full Structured Backup (.json)
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-desk-muted)', lineHeight: 1.4 }}>
                      Complete database dump of titles, timestamps, ratings, relational links, and notes for migrations or backup.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportJson}
                  disabled={downloadingJson}
                  style={{ flexShrink: 0, fontSize: 13 }}
                >
                  {downloadingJson ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                  <span>Download .json</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Import 1: MyAnimeList Profile */}
              <div
                className="desk-card"
                style={{
                  padding: 18,
                  background: 'var(--desk-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: 'var(--desk-raised)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--tungsten)',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-desk)', fontWeight: 600 }}>
                      Import from MyAnimeList
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-desk-muted)', lineHeight: 1.4 }}>
                      Import your watched and completed titles, ratings, and episode progress via public MyAnimeList profile.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    type="text"
                    value={malUsername}
                    onChange={(e) => setMalUsername(e.target.value)}
                    placeholder="Enter MAL username (e.g. cubewin07)..."
                    style={{
                      flex: 1,
                      background: 'var(--desk-raised)',
                      border: '1px solid var(--border-desk-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      color: 'var(--text-desk)',
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleImportMal}
                    disabled={importingMal || !malUsername.trim()}
                    style={{ fontSize: 13, flexShrink: 0 }}
                  >
                    {importingMal ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                    <span>Import MAL</span>
                  </button>
                </div>
              </div>

              {/* Import 2: JSON Backup Restore */}
              <div
                className="desk-card"
                style={{
                  padding: 18,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  background: 'var(--desk-surface)',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: 'var(--desk-raised)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--spine-text)',
                      flexShrink: 0,
                    }}
                  >
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-desk)', fontWeight: 600 }}>
                      Restore JSON Backup
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-desk-muted)', lineHeight: 1.4 }}>
                      Merge or restore titles, books, and characters from an exported .json backup file.
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoringJson}
                  style={{ flexShrink: 0, fontSize: 13 }}
                >
                  {restoringJson ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                  <span>Select File</span>
                </button>
              </div>

              {importResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    background: importResult.startsWith('Error') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    border: `1px solid ${importResult.startsWith('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    color: importResult.startsWith('Error') ? '#f87171' : 'var(--spine-text)',
                  }}
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
