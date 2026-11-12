import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Folder as FolderIcon,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { folderApi, imageApi } from '../../api/client';
import { cloudinaryThumbUrl } from '../../lib/images/cloudinary';
import type { Folder, ImageAsset } from '../../types';
import { KfButton } from '../../ui/keyframe';

export interface MediaPanelProps {
  onNotify?: (text: string, type?: 'success' | 'error' | 'info') => void;
  onRequestConfirm?: (options: { title: string; message: string; onConfirm: () => void }) => void;
}

type FolderFilter = number | 'all' | 'root';

export const MediaPanel: React.FC<MediaPanelProps> = ({ onNotify, onRequestConfirm }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<FolderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [foldersList, imagesList] = await Promise.all([
        folderApi.list(),
        imageApi.list(
          activeFolderId === 'all'
            ? undefined
            : activeFolderId === 'root'
              ? { folder: 'root' }
              : { folder: activeFolderId },
        ),
      ]);
      setFolders(foldersList);
      setImages(imagesList);
    } catch (err) {
      console.error('Failed to load media library:', err);
      const message = err instanceof Error ? err.message : 'Failed to load media assets';
      setLoadError(message);
      onNotify?.('Failed to load media assets', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFolderId, onNotify]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    try {
      setFolderSubmitting(true);
      await folderApi.create({
        name: trimmed,
        parent: typeof activeFolderId === 'number' ? activeFolderId : null,
      });
      setNewFolderName('');
      setShowNewFolder(false);
      onNotify?.(`Created folder "${trimmed}"`);
      await loadMedia();
    } catch (err) {
      console.error('Error creating folder:', err);
      onNotify?.('Error creating folder', 'error');
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const folderVal = typeof activeFolderId === 'number' ? activeFolderId : null;
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        await imageApi.upload(file, {
          folder: folderVal,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
      onNotify?.(`Successfully uploaded ${files.length} image(s)`);
      await loadMedia();
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      onNotify?.(msg, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = async (image: ImageAsset) => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopiedId(image.id);
      onNotify?.('Image URL copied to clipboard');
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      onNotify?.('Could not copy URL to clipboard', 'error');
    }
  };

  const handleDeleteImage = (id: number) => {
    const doDelete = async () => {
      try {
        await imageApi.delete(id);
        onNotify?.('Asset removed');
        await loadMedia();
      } catch {
        onNotify?.('Failed to delete asset', 'error');
      }
    };

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Delete Asset',
        message: 'Are you sure you want to delete this media asset?',
        onConfirm: () => {
          void doDelete();
        },
      });
    } else {
      void doDelete();
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    const doDelete = async () => {
      try {
        await folderApi.delete(folder.id);
        onNotify?.(`Deleted folder "${folder.name}"`);
        if (activeFolderId === folder.id) {
          setActiveFolderId('all');
        } else {
          await loadMedia();
        }
      } catch {
        onNotify?.('Failed to delete folder', 'error');
      }
    };

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Delete Folder',
        message: `Delete folder "${folder.name}"? Images inside will be moved to unorganized.`,
        onConfirm: () => {
          void doDelete();
        },
      });
    } else {
      void doDelete();
    }
  };

  const filteredImages = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();
    if (!needle) return images;
    return images.filter(
      (img) =>
        (img.title && img.title.toLowerCase().includes(needle)) ||
        img.id.toString() === needle,
    );
  }, [images, searchQuery]);

  return (
    <section className="kf-media" aria-labelledby="kf-media-heading">
      <div className="kf-media-header">
        <div className="kf-media-title-block">
          <div className="kf-media-eyebrow">
            <ImageIcon size={14} aria-hidden="true" />
            <span>Media Assets &amp; Stills</span>
          </div>
          <h2 id="kf-media-heading">Media Library</h2>
          <p>Organize uploaded cover art, episode stills, and character portraits.</p>
        </div>

        <KfButton
          variant="secondary"
          icon={<FolderPlus size={15} />}
          onClick={() => setShowNewFolder((prev) => !prev)}
          aria-expanded={showNewFolder}
        >
          New Folder
        </KfButton>
      </div>

      {showNewFolder && (
        <form className="kf-media-folder-form" onSubmit={handleCreateFolder}>
          <input
            type="text"
            className="kf-media-input"
            placeholder="Folder name (e.g. Frieren Stills, Character Portraits)…"
            aria-label="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <div className="kf-media-folder-actions">
            <KfButton
              variant="quiet"
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </KfButton>
            <KfButton
              type="submit"
              variant="primary"
              disabled={folderSubmitting || !newFolderName.trim()}
            >
              {folderSubmitting ? (
                <>
                  <Loader2 size={14} className="kf-spin" />
                  <span>Creating…</span>
                </>
              ) : (
                <span>Create Folder</span>
              )}
            </KfButton>
          </div>
        </form>
      )}

      <div className="kf-media-workspace">
        <aside className="kf-media-folders" aria-label="Media folders">
          <div className="kf-media-folders-label">Folders</div>

          <button
            type="button"
            className={`kf-media-folder-btn ${activeFolderId === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveFolderId('all')}
            aria-pressed={activeFolderId === 'all'}
          >
            <ImageIcon size={15} aria-hidden="true" />
            <span className="kf-media-folder-name">All Media</span>
          </button>

          <button
            type="button"
            className={`kf-media-folder-btn ${activeFolderId === 'root' ? 'is-active' : ''}`}
            onClick={() => setActiveFolderId('root')}
            aria-pressed={activeFolderId === 'root'}
          >
            <FolderIcon size={15} aria-hidden="true" />
            <span className="kf-media-folder-name">Unfiled</span>
          </button>

          {folders.map((folder) => {
            const isCurrent = activeFolderId === folder.id;
            return (
              <div key={folder.id} className={`kf-media-folder-row ${isCurrent ? 'is-active' : ''}`}>
                <button
                  type="button"
                  className="kf-media-folder-btn"
                  onClick={() => setActiveFolderId(folder.id)}
                  aria-pressed={isCurrent}
                  title={folder.name}
                >
                  <FolderIcon size={15} aria-hidden="true" />
                  <span className="kf-media-folder-name">{folder.name}</span>
                  {typeof folder.images_count === 'number' && (
                    <span className="kf-media-folder-count">{folder.images_count}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="kf-media-folder-del"
                  onClick={() => handleDeleteFolder(folder)}
                  aria-label={`Delete folder ${folder.name}`}
                  title={`Delete folder ${folder.name}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </aside>

        <div className="kf-media-main">
          <div
            className={`kf-media-dropzone ${dragActive ? 'is-drag-active' : ''}`}
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
          >
            <div className="kf-media-drop-info">
              <div className="kf-media-drop-icon" aria-hidden="true">
                <UploadCloud size={22} />
              </div>
              <div>
                <p className="kf-media-drop-title">Upload Images &amp; Stills</p>
                <p className="kf-media-drop-sub">
                  Drag and drop image files here, or pick files from your device.
                </p>
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
                icon={
                  uploading ? (
                    <Loader2 size={15} className="kf-spin" />
                  ) : (
                    <Plus size={15} />
                  )
                }
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Browse & Upload'}
              </KfButton>
            </div>
          </div>

          <div className="kf-media-toolbar">
            <div className="kf-media-search">
              <Search size={15} className="kf-media-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="kf-media-search-input"
                placeholder="Search media assets…"
                aria-label="Search media assets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="kf-media-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <span className="kf-media-count">
              {filteredImages.length} {filteredImages.length === 1 ? 'asset' : 'assets'}
            </span>
          </div>

          <div className="kf-media-surface">
            {loading ? (
              <div className="kf-media-state" role="status" aria-live="polite">
                <Loader2 size={24} className="kf-spin" aria-hidden="true" />
                <p>Loading media assets…</p>
              </div>
            ) : loadError ? (
              <div className="kf-media-state" role="alert">
                <h3>Couldn’t load media assets</h3>
                <p>{loadError}</p>
                <KfButton
                  variant="secondary"
                  icon={<RefreshCw size={14} />}
                  onClick={() => void loadMedia()}
                >
                  Retry
                </KfButton>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="kf-media-state">
                <ImageIcon size={28} aria-hidden="true" />
                <h3>No media found</h3>
                <p>
                  {searchQuery
                    ? `No assets matched “${searchQuery}”.`
                    : 'Upload stills, covers, or character portraits to use them across your journal.'}
                </p>
              </div>
            ) : (
              <div className="kf-media-grid">
                {filteredImages.map((img) => {
                  const thumbSrc = cloudinaryThumbUrl(img.url, 'card') ?? img.url;
                  const isCopied = copiedId === img.id;
                  return (
                    <article key={img.id} className="kf-media-card">
                      <div className="kf-media-thumb-wrap">
                        <img
                          src={thumbSrc}
                          alt={img.title || `Media asset ${img.id}`}
                          className="kf-media-thumb"
                          loading="lazy"
                        />
                      </div>

                      <div className="kf-media-card-meta">
                        <p className="kf-media-card-title" title={img.title || `Image #${img.id}`}>
                          {img.title || `Image #${img.id}`}
                        </p>
                        <span className="kf-media-card-sub">
                          ID {img.id}
                          {activeFolderId === 'all' && img.folder_name ? ` · ${img.folder_name}` : ''}
                        </span>
                      </div>

                      <div className="kf-media-card-actions">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="kf-media-icon-btn"
                          aria-label={`Open original image ${img.title || img.id}`}
                          title="Open original image"
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          className={`kf-media-icon-btn ${isCopied ? 'is-copied' : ''}`}
                          onClick={() => void handleCopyUrl(img)}
                          aria-label={`Copy URL for ${img.title || img.id}`}
                          title={isCopied ? 'Copied!' : 'Copy URL'}
                        >
                          {isCopied ? (
                            <>
                              <Check size={14} aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <Copy size={14} aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="kf-media-icon-btn is-danger"
                          onClick={() => handleDeleteImage(img.id)}
                          aria-label={`Delete ${img.title || `image ${img.id}`}`}
                          title="Delete asset"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
