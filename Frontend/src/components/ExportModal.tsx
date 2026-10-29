import React, { useState, useRef } from 'react';
import { exportApi } from '../api/client';
import { X, Download, FileText, Database, Check, Loader2, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (text: string, type?: 'success' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onToast }) => {
  const [downloadingMd, setDownloadingMd] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
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

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
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
              <Download size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, color: 'var(--text-desk)', margin: 0 }}>
                Export & Back Up Journal
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-desk-muted)', margin: 0 }}>
                Keep your reflections portable across Obsidian, Markdown vaults, and agents.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Body options */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  Exports all franchises, seasons, episode notes, books, rewatches, and character lessons formatted with YAML frontmatter.
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
        </div>
      </div>
    </div>
  );
};
