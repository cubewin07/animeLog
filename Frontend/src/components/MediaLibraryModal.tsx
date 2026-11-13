import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Folder as FolderIcon,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { folderApi, imageApi } from '../api/client';
import { useJournalActions } from '../state/JournalContext';
import { Folder, ImageAsset } from '../types';
import { KfButton } from '../ui/keyframe';
import { useDialog } from '../ui/Sheet/useDialog';
import { ConfirmDialog } from './ConfirmDialog';
import './MediaLibraryModal.css';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (image: ImageAsset) => void;
  selectedImageId?: number | null;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  selectedImageId,
}) => {
  const { addToast } = useJournalActions();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | 'all' | 'root'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageAsset | null>(null);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialog(panelRef, isOpen, onClose);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [foldersList, imagesList] = await Promise.all([
        folderApi.list(),
        imageApi.list(
          activeFolderId === 'all'
            ? undefined
            : activeFolderId === 'root'
              ? { folder: 'root' }
              : { folder: activeFolderId }
        ),
      ]);
      setFolders(foldersList);
      setImages(imagesList);
    } catch (err) {
      console.error('Failed to load media assets:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load media assets.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFolderId, addToast]);

  useEffect(() => {
    if (isOpen) {
      void loadMedia();
    }
  }, [isOpen, loadMedia]);

  if (!isOpen) return null;

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      setFolderSubmitting(true);
      setErrorMessage(null);
      await folderApi.create({
        name: newFolderName.trim(),
        parent: typeof activeFolderId === 'number' ? activeFolderId : null,
      });
      setNewFolderName('');
      setShowNewFolder(false);
      await loadMedia();
    } catch (err) {
      console.error('Failed to create folder:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create folder.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setErrorMessage(null);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folderVal = typeof activeFolderId === 'number' ? activeFolderId : null;

        await imageApi.upload(file, {
          folder: folderVal,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
      await loadMedia();
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      const msg = err instanceof Error ? err.message : 'Check Cloudinary credentials.';
      const full = `Upload failed: ${msg}`;
      setErrorMessage(full);
      addToast(full, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, image: ImageAsset) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(image.url).catch(() => {});
    setCopiedId(image.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRequestDeleteImage = (e: React.MouseEvent, image: ImageAsset) => {
    e.stopPropagation();
    setDeleteTarget(image);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteTarget || deleting) return;
    try {
      setDeleting(true);
      setErrorMessage(null);
      await imageApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      addToast('Image deleted');
      await loadMedia();
    } catch (err) {
      console.error('Failed to delete image:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete image.';
      setErrorMessage(msg);
      addToast(`Failed to delete image: ${msg}`, 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredImages = images.filter((img) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (img.title && img.title.toLowerCase().includes(q)) ||
      (img.alt_text && img.alt_text.toLowerCase().includes(q)) ||
      (img.folder_name && img.folder_name.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div
        className="kf-ml-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && deleteTarget === null) onClose();
        }}
      >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="kf-ml-dialog"
      >
        <header className="kf-ml-header">
          <div className="kf-ml-header-main">
            <div className="kf-ml-header-icon" aria-hidden="true">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 id={titleId} className="kf-ml-title">
                {onSelectImage ? 'Choose Cover Image' : 'Cloudinary Media Library'}
              </h2>
              <p className="kf-ml-subtitle">
                Upload and manage image assets directly stored on Cloudinary
              </p>
            </div>
          </div>

          <button type="button" className="kf-ml-close" onClick={onClose} aria-label="Close modal">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="kf-ml-workspace">
          <aside className="kf-ml-sidebar" aria-label="Media folders">
            <div className="kf-ml-sidebar-head">
              <span className="kf-ml-sidebar-label">Folders</span>
              <button
                type="button"
                className="kf-ml-new-folder-toggle"
                onClick={() => setShowNewFolder((prev) => !prev)}
                title="Create Folder"
                aria-label="Create folder"
                aria-expanded={showNewFolder}
              >
                <FolderPlus size={14} aria-hidden="true" />
              </button>
            </div>

            {showNewFolder && (
              <form onSubmit={handleCreateFolder} className="kf-ml-new-folder-form">
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="kf-ml-input"
                  autoFocus
                  aria-label="New folder name"
                />
                <div className="kf-ml-new-folder-actions">
                  <button
                    type="button"
                    className="kf-ml-mini-btn is-quiet"
                    onClick={() => setShowNewFolder(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="kf-ml-mini-btn is-primary"
                    disabled={folderSubmitting || !newFolderName.trim()}
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="kf-ml-folders">
              <button
                type="button"
                className={`kf-ml-folder-btn ${activeFolderId === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveFolderId('all')}
              >
                <span className="kf-ml-folder-left">
                  <FolderIcon size={14} aria-hidden="true" />
                  <span className="kf-ml-folder-name">All Images</span>
                </span>
              </button>

              <button
                type="button"
                className={`kf-ml-folder-btn ${activeFolderId === 'root' ? 'is-active' : ''}`}
                onClick={() => setActiveFolderId('root')}
              >
                <span className="kf-ml-folder-left">
                  <FolderIcon size={14} aria-hidden="true" />
                  <span className="kf-ml-folder-name">Unorganized (Root)</span>
                </span>
              </button>

              {folders.map((f) => {
                const isActive = activeFolderId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`kf-ml-folder-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveFolderId(f.id)}
                  >
                    <span className="kf-ml-folder-left">
                      <FolderIcon size={14} aria-hidden="true" />
                      <span className="kf-ml-folder-name">{f.name}</span>
                    </span>
                    {f.images_count !== undefined && (
                      <span className="kf-ml-folder-count">{f.images_count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="kf-ml-main">
            <div className="kf-ml-toolbar">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  void handleFileUpload(e.dataTransfer.files);
                }}
                className={`kf-ml-dropzone ${dragActive ? 'is-drag-active' : ''}`}
              >
                <div className="kf-ml-drop-info">
                  <div className="kf-ml-drop-icon" aria-hidden="true">
                    {uploading ? (
                      <Loader2 size={20} className="kf-spin" />
                    ) : (
                      <UploadCloud size={20} />
                    )}
                  </div>
                  <div>
                    <p className="kf-ml-drop-title">
                      {uploading ? 'Uploading to Cloudinary…' : 'Drag & drop image files here'}
                    </p>
                    <p className="kf-ml-drop-sub">Supports PNG, JPG, WebP, AVIF up to 10MB</p>
                  </div>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => void handleFileUpload(e.target.files)}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <KfButton
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    icon={<Plus size={14} aria-hidden="true" />}
                  >
                    Browse Files
                  </KfButton>
                </div>
              </div>

              <div className="kf-ml-search-row">
                <div className="kf-ml-search-wrap">
                  <Search size={14} className="kf-ml-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    aria-label="Search images"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="kf-ml-search-input"
                  />
                </div>

                <span className="kf-ml-count">
                  {filteredImages.length} image{filteredImages.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                style={{
                  margin: 'var(--kf-3) var(--kf-5) 0',
                  padding: 'var(--kf-2) var(--kf-3)',
                  borderRadius: 'var(--kf-radius)',
                  background: 'var(--kf-danger-soft)',
                  border: '1px solid color-mix(in srgb, var(--kf-danger) 40%, transparent)',
                  color: 'var(--kf-danger)',
                  fontSize: 'var(--kf-text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--kf-2)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--kf-2)' }}>
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errorMessage}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  aria-label="Dismiss error"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="kf-ml-grid-wrap">
              {loading ? (
                <div className="kf-ml-state-inline">
                  <Loader2 size={22} className="kf-spin" aria-hidden="true" />
                  <span>Loading media…</span>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="kf-ml-state">
                  <ImageIcon size={36} opacity={0.45} aria-hidden="true" />
                  <p style={{ fontSize: 'var(--kf-text-sm)', color: 'var(--kf-text)' }}>
                    No images found
                  </p>
                  <p style={{ fontSize: 'var(--kf-text-xs)' }}>
                    Upload your first image to Cloudinary using the dropzone above.
                  </p>
                </div>
              ) : (
                <div className="kf-ml-grid">
                  {filteredImages.map((img) => {
                    const isSelected = selectedImageId === img.id;
                    return (
                      <div
                        key={img.id}
                        onClick={() => onSelectImage && onSelectImage(img)}
                        className={`kf-ml-card ${onSelectImage ? 'is-selectable' : ''} ${
                          isSelected ? 'is-selected' : ''
                        }`}
                      >
                        <div className="kf-ml-thumb-box">
                          <img src={img.url} alt={img.title || 'Asset'} loading="lazy" />

                          {isSelected && (
                            <div className="kf-ml-selected-badge" aria-hidden="true">
                              <CheckCircle2 size={16} />
                            </div>
                          )}

                          <div className="kf-ml-card-overlay-actions">
                            <button
                              type="button"
                              onClick={(e) => handleCopyUrl(e, img)}
                              className={`kf-ml-icon-btn ${copiedId === img.id ? 'is-copied' : ''}`}
                              title="Copy Cloudinary URL"
                              aria-label={`Copy URL for ${img.title || `Image ${img.id}`}`}
                            >
                              {copiedId === img.id ? (
                                <Check size={13} aria-hidden="true" />
                              ) : (
                                <Copy size={13} aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRequestDeleteImage(e, img)}
                              className="kf-ml-icon-btn is-danger"
                              title="Delete Image"
                              aria-label={`Delete ${img.title || `Image ${img.id}`}`}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="kf-ml-card-title" title={img.title}>
                            {img.title || `Image #${img.id}`}
                          </p>
                          {img.folder_name && (
                            <span className="kf-ml-card-folder">
                              <FolderIcon size={10} aria-hidden="true" /> {img.folder_name}
                            </span>
                          )}
                        </div>

                        {onSelectImage && (
                          <button
                            type="button"
                            className={`kf-ml-use-btn ${isSelected ? 'is-selected' : ''}`}
                          >
                            {isSelected ? 'Selected' : 'Use as Cover'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Image"
        message={`Are you sure you want to delete "${
          deleteTarget?.title || (deleteTarget ? `Image #${deleteTarget.id}` : 'this image')
        }"?`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete Image'}
        onConfirm={() => void handleConfirmDeleteImage()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </>
  );
};
