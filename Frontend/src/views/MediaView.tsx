import React, { useState, useEffect, useRef } from 'react';
import { Folder, ImageAsset } from '../types';
import { folderApi, imageApi } from '../api/client';
import {
  UploadCloud,
  Folder as FolderIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Image as ImageIcon,
  Loader2,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';

interface MediaViewProps {
  onNotify?: (text: string, type?: 'success' | 'error' | 'info') => void;
  onRequestConfirm?: (options: { title: string; message: string; onConfirm: () => void }) => void;
}

export const MediaView: React.FC<MediaViewProps> = ({ onNotify, onRequestConfirm }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | 'all' | 'root'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // New folder dialog state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  // Upload inputs
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
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
      console.error('Failed to load media library:', err);
      if (onNotify) onNotify('Failed to load media assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [activeFolderId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      setFolderSubmitting(true);
      await folderApi.create({
        name: newFolderName.trim(),
        parent: typeof activeFolderId === 'number' ? activeFolderId : null,
      });
      setNewFolderName('');
      setShowNewFolder(false);
      if (onNotify) onNotify(`Created folder "${newFolderName.trim()}"`);
      await loadMedia();
    } catch (err) {
      console.error('Error creating folder:', err);
      if (onNotify) onNotify('Error creating folder', 'error');
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folderVal = typeof activeFolderId === 'number' ? activeFolderId : null;

        await imageApi.upload(file, {
          folder: folderVal,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
      if (onNotify) onNotify(`Successfully uploaded ${files.length} image(s)`);
      await loadMedia();
    } catch (err: any) {
      console.error('Upload failed:', err);
      if (onNotify) onNotify(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (image: ImageAsset) => {
    navigator.clipboard.writeText(image.url);
    setCopiedId(image.id);
    if (onNotify) onNotify('Image URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteImage = async (id: number) => {
    const doDelete = async () => {
      try {
        await imageApi.delete(id);
        if (onNotify) onNotify('Asset removed');
        await loadMedia();
      } catch (err) {
        if (onNotify) onNotify('Failed to delete asset', 'error');
      }
    };

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Delete Asset',
        message: 'Are you sure you want to delete this media asset?',
        onConfirm: doDelete,
      });
    } else {
      doDelete();
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    const doDelete = async () => {
      try {
        await folderApi.delete(folder.id);
        if (onNotify) onNotify(`Deleted folder "${folder.name}"`);
        if (activeFolderId === folder.id) {
          setActiveFolderId('all');
        }
        await loadMedia();
      } catch (err) {
        if (onNotify) onNotify('Failed to delete folder', 'error');
      }
    };

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Delete Folder',
        message: `Delete folder "${folder.name}" and move assets to root?`,
        onConfirm: doDelete,
      });
    } else {
      doDelete();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="display-title" style={{ color: 'var(--text-desk)', marginBottom: 4 }}>
            Media Library
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-desk-muted)' }}>
            Asset management for franchise posters, stills, book covers, and portraits.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setShowNewFolder(!showNewFolder)}
          style={{ fontSize: 13, padding: '6px 14px' }}
        >
          <FolderPlus size={15} />
          <span>New Folder</span>
        </button>
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <form
          onSubmit={handleCreateFolder}
          className="desk-card"
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            placeholder="Folder name (e.g. Frieren Stills, Character Portraits)..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="form-input"
            style={{ flex: '1', minWidth: '220px' }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowNewFolder(false)}
              style={{ fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={folderSubmitting || !newFolderName.trim()}
              style={{ fontSize: 13 }}
            >
              {folderSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      )}

      {/* Main Workspace Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 20,
          minHeight: 520,
        }}
      >
        {/* Left: Folder Navigation Sidebar */}
        <div
          className="desk-card"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: 'var(--text-desk-dim)',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            Folders
          </div>

          <button
            type="button"
            onClick={() => setActiveFolderId('all')}
            className="btn btn-ghost"
            style={{
              justifyContent: 'flex-start',
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeFolderId === 'all' ? 'var(--desk-surface-high)' : 'transparent',
              color: activeFolderId === 'all' ? 'var(--text-desk)' : 'var(--text-desk-muted)',
              border: activeFolderId === 'all' ? '1px solid var(--border-desk-medium)' : '1px solid transparent',
              fontWeight: activeFolderId === 'all' ? 600 : 400,
            }}
          >
            <ImageIcon size={14} />
            <span>All Assets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFolderId('root')}
            className="btn btn-ghost"
            style={{
              justifyContent: 'flex-start',
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeFolderId === 'root' ? 'var(--desk-surface-high)' : 'transparent',
              color: activeFolderId === 'root' ? 'var(--text-desk)' : 'var(--text-desk-muted)',
              border: activeFolderId === 'root' ? '1px solid var(--border-desk-medium)' : '1px solid transparent',
              fontWeight: activeFolderId === 'root' ? 600 : 400,
            }}
          >
            <FolderIcon size={14} />
            <span>Root (Unorganized)</span>
          </button>

          {folders.map((folder) => {
            const isCurrent = activeFolderId === folder.id;
            return (
              <div
                key={folder.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isCurrent ? 'var(--desk-surface-high)' : 'transparent',
                  border: isCurrent ? '1px solid var(--border-desk-medium)' : '1px solid transparent',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFolderId(folder.id)}
                  className="btn btn-ghost"
                  style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    fontSize: 13,
                    color: isCurrent ? 'var(--text-desk)' : 'var(--text-desk-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={folder.name}
                >
                  <FolderIcon size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder);
                  }}
                  aria-label={`Delete folder ${folder.name}`}
                  className="btn-icon danger"
                  style={{
                    border: 'none',
                    padding: '6px',
                    minWidth: 'auto',
                    minHeight: 'auto',
                    background: 'transparent',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Upload Dropzone and Assets Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload Dropzone */}
          <div
            className="desk-card"
            style={{
              padding: 20,
              border: '1px dashed',
              borderColor: dragActive ? 'var(--tungsten)' : 'var(--border-desk-medium)',
              backgroundColor: dragActive ? 'var(--tungsten-dim)' : 'var(--desk-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileUpload(e.dataTransfer.files);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--desk-surface)',
                  color: 'var(--tungsten)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={22} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-desk)' }}>
                  Upload Images & Stills
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-desk-muted)' }}>
                  Drag and drop files here, or click Browse to upload.
                </p>
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
                disabled={uploading}
                style={{ fontSize: 13 }}
              >
                <Plus size={14} />
                <span>{uploading ? 'Uploading...' : 'Browse & Upload'}</span>
              </button>
            </div>
          </div>

          {/* Search bar & count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-desk-dim)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search media assets..."
                aria-label="Search media assets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 32, paddingTop: 6, paddingBottom: 6, fontSize: 13 }}
              />
            </div>

            <span className="mono" style={{ fontSize: 12, color: 'var(--text-desk-dim)' }}>
              {filteredImages.length} asset{filteredImages.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Grid */}
          <div className="desk-card" style={{ flex: 1, padding: 20 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--text-desk-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: 10, fontSize: 14 }}>Loading media assets...</span>
              </div>
            ) : filteredImages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 240,
                  color: 'var(--text-desk-dim)',
                  gap: 12,
                }}
              >
                <ImageIcon size={40} opacity={0.3} />
                <p style={{ fontSize: 15, color: 'var(--text-desk-muted)', fontWeight: 600 }}>
                  No media found
                </p>
                <p style={{ fontSize: 13 }}>
                  Upload image stills, covers, or portraits to use them across journal entries.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className="desk-panel"
                    style={{
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: 'var(--still-well)',
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.title || 'Asset'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        width={180}
                        height={140}
                        loading="lazy"
                      />

                      <div
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          right: 6,
                          display: 'flex',
                          gap: 4,
                        }}
                      >
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-icon"
                          aria-label="Open original image"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: 'var(--text-desk)',
                          }}
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(img)}
                          className="btn-icon"
                          aria-label="Copy image URL"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: copiedId === img.id ? 'var(--spine-text)' : 'var(--text-desk)',
                          }}
                        >
                          {copiedId === img.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="btn-icon danger"
                          aria-label="Delete image asset"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-desk)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={img.title}
                      >
                        {img.title || `Image #${img.id}`}
                      </p>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--text-desk-dim)' }}>
                        ID: {img.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
