import React, { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Film, PenLine, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { useJournalActions } from '../../state/JournalContext';
import { KfButton } from '../../ui/keyframe';
import { useDialog } from '../../ui/Sheet/useDialog';
import './QuickLog.css';

export interface QuickLogActiveItem {
  key: string;
  title: string;
  context: string;
  href: string;
  stepLabel: string;
  onStep: () => void;
  onNote: () => void;
}

export interface QuickLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeItems: QuickLogActiveItem[];
}

export const QuickLogSheet: React.FC<QuickLogSheetProps> = ({
  isOpen,
  onClose,
  activeItems,
}) => {
  const {
    openComposer,
    openNewFranchiseModal,
    openNewBookModal,
    openAddCharacterModal,
    openAddRewatch,
  } = useJournalActions();

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="kf-ql-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="kf-ql-panel"
      >
        <header className="kf-ql-header">
          <h2 id={titleId} className="kf-ql-title">
            Quick Log
          </h2>
          <button
            type="button"
            className="kf-ql-close"
            onClick={onClose}
            aria-label="Close Quick Log"
          >
            <X size={18} />
          </button>
        </header>

        <div className="kf-ql-body">
          <section className="kf-ql-section" aria-label="In progress">
            <h3 className="kf-ql-heading">Continue</h3>
            {activeItems.length > 0 ? (
              <div className="kf-ql-list">
                {activeItems.map((item) => (
                  <div key={item.key} className="kf-ql-row">
                    <Link
                      viewTransition
                      to={item.href}
                      className="kf-ql-item-link"
                      onClick={onClose}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.context}</span>
                    </Link>
                    <div className="kf-ql-row-actions">
                      <button
                        type="button"
                        className="kf-ql-step-btn"
                        onClick={() => {
                          onClose();
                          item.onStep();
                        }}
                      >
                        {item.stepLabel}
                      </button>
                      <button
                        type="button"
                        className="kf-ql-note-btn"
                        onClick={item.onNote}
                        aria-label={`Write note for ${item.title}`}
                      >
                        <PenLine size={14} aria-hidden="true" />
                        <span>Note</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kf-ql-empty">
                <p>Nothing in progress yet.</p>
                <KfButton
                  variant="primary"
                  icon={<Plus size={15} />}
                  onClick={() => {
                    onClose();
                    openNewFranchiseModal();
                  }}
                >
                  Add Title
                </KfButton>
              </div>
            )}
          </section>

          <section className="kf-ql-section" aria-label="Actions">
            <h3 className="kf-ql-heading">Log or Write</h3>
            <div className="kf-ql-actions-grid">
              <button
                type="button"
                className="kf-ql-action-card"
                onClick={() => {
                  onClose();
                  openComposer();
                }}
              >
                <PenLine size={16} color="var(--kf-brand)" aria-hidden="true" />
                <div>
                  <strong>Write a note</strong>
                  <span>Episode, season, movie, book or character</span>
                </div>
                <kbd className="kf-ql-kbd">W</kbd>
              </button>

              <button
                type="button"
                className="kf-ql-action-card"
                onClick={() => {
                  onClose();
                  openNewFranchiseModal();
                }}
              >
                <Film size={16} color="var(--kf-brand)" aria-hidden="true" />
                <div>
                  <strong>Add anime series</strong>
                  <span>Start tracking a new series or season</span>
                </div>
                <kbd className="kf-ql-kbd">N</kbd>
              </button>

              <button
                type="button"
                className="kf-ql-action-card"
                onClick={() => {
                  onClose();
                  openNewBookModal();
                }}
              >
                <BookOpen size={16} color="var(--kf-plan)" aria-hidden="true" />
                <div>
                  <strong>Add book</strong>
                  <span>Log a book or light novel</span>
                </div>
                <Plus size={14} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="kf-ql-action-card"
                onClick={() => {
                  onClose();
                  openAddCharacterModal();
                }}
              >
                <Sparkles size={16} color="var(--kf-gold)" aria-hidden="true" />
                <div>
                  <strong>Add character</strong>
                  <span>Collect a character worth remembering</span>
                </div>
                <Plus size={14} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="kf-ql-action-card"
                onClick={() => {
                  onClose();
                  openAddRewatch();
                }}
              >
                <RotateCcw size={16} color="var(--kf-completed)" aria-hidden="true" />
                <div>
                  <strong>Log a rewatch</strong>
                  <span>Record another pass through a title</span>
                </div>
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
