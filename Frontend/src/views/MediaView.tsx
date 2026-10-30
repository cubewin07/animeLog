import React, { useState, useEffect, useRef } from 'react';
import { Folder, ImageAsset } from '../types';
import { folderApi, imageApi } from '../api/client';
import { Button, EmptyState } from '../ui';
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
  X,
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
        message: `Delete folder "${folder.name}"? Images inside will be moved to unorganized.`,
        onConfirm: doDelete,
      });
    } else {
      doDelete();
    }
  };

  const filteredImages = images.filter((img) => {
    if (!searchQuery.trim()) return true;
    return (
      (img.title && img.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      img.id.toString() === searchQuery.trim()
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeIn var(--dur-base) var(--ease-smooth)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--lamp)',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            <ImageIcon size={14} />
            <span>Media Assets & Stills</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.2vw, 36px)',
              color: 'var(--text)',
              lineHeight: 1.15,
            }}
          >
            Media Library
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 6, maxWidth: 620, lineHeight: 1.5 }}>
            Manage uploaded cover art, anime stills, and character portraits across journal entries.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<FolderPlus size={15} />}
          onClick={() => setShowNewFolder(!showNewFolder)}
        >
          New Folder
        </Button>
      </header>

      {/* New Folder Form */}
      {showNewFolder && (
        <form
          onSubmit={handleCreateFolder}
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
          }}
        >
          <input
            type="text"
            placeholder="Folder name (e.g. Frieren Stills, Character Portraits)…"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            style={{
              flex: '1',
              minWidth: '220px',
              height: 38,
              padding: '0 12px',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewFolder(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={folderSubmitting || !newFolderName.trim()}
              loading={folderSubmitting}
            >
              Create Folder
            </Button>
          </div>
        </form>
      )}

      {/* Main Workspace Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: 20,
          minHeight: 520,
          alignItems: 'start',
        }}
      >
        {/* Left: Folder Navigation Sidebar */}
        <aside
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              letterSpacing: '0.08em',
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            Folders
          </div>

          <button
            type="button"
            onClick={() => setActiveFolderId('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 'var(--r-md)',
              backgroundColor: activeFolderId === 'all' ? 'var(--lamp-soft)' : 'transparent',
              color: activeFolderId === 'all' ? 'var(--lamp)' : 'var(--text-2)',
              border: `1px solid ${activeFolderId === 'all' ? 'var(--lamp)' : 'transparent'}`,
              fontWeight: activeFolderId === 'all' ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all var(--dur-fast) ease',
            }}
          >
            <ImageIcon size={14} />
            <span>All Assets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFolderId('root')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 'var(--r-md)',
              backgroundColor: activeFolderId === 'root' ? 'var(--lamp-soft)' : 'transparent',
              color: activeFolderId === 'root' ? 'var(--lamp)' : 'var(--text-2)',
              border: `1px solid ${activeFolderId === 'root' ? 'var(--lamp)' : 'transparent'}`,
              fontWeight: activeFolderId === 'root' ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all var(--dur-fast) ease',
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
                  borderRadius: 'var(--r-md)',
                  backgroundColor: isCurrent ? 'var(--lamp-soft)' : 'transparent',
                  border: `1px solid ${isCurrent ? 'var(--lamp)' : 'transparent'}`,
                  transition: 'all var(--dur-fast) ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFolderId(folder.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    padding: '8px 10px',
                    fontSize: 13,
                    color: isCurrent ? 'var(--lamp)' : 'var(--text-2)',
                    fontWeight: isCurrent ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    textAlign: 'left',
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
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 4,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </aside>

        {/* Right: Upload Dropzone and Assets Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload Dropzone */}
          <div
            style={{
              padding: 20,
              border: `1px dashed ${dragActive ? 'var(--lamp)' : 'var(--line)'}`,
              borderRadius: 'var(--r-lg)',
              backgroundColor: dragActive ? 'var(--lamp-soft)' : 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              transition: 'all var(--dur-fast) ease',
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
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--r-md)',
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--lamp)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={22} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  Upload Images & Stills
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
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
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                disabled={uploading}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Browse & Upload
              </Button>
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
                  color: 'var(--text-3)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search media assets…"
                aria-label="Search media assets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 32,
                  paddingRight: searchQuery ? 30 : 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3)',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {filteredImages.length} {filteredImages.length === 1 ? 'asset' : 'assets'}
            </span>
          </div>

          {/* Grid */}
          <div
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              padding: 20,
              minHeight: 280,
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--text-3)' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: 10, fontSize: 14 }}>Loading media assets…</span>
              </div>
            ) : filteredImages.length === 0 ? (
              <EmptyState
                icon={<ImageIcon size={32} />}
                title="No media found"
                description={
                  searchQuery
                    ? `No assets matched "${searchQuery}".`
                    : 'Upload image stills, covers, or portraits to use them across your journal.'
                }
              />
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
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 130,
                        borderRadius: 'var(--r-sm)',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: 'var(--surface-sunken)',
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.title || 'Asset'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        width={180}
                        height={130}
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
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--r-sm)',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          aria-label="Open original image"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(img)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--r-sm)',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: copiedId === img.id ? 'var(--green)' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          aria-label="Copy image URL"
                        >
                          {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--r-sm)',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: 'var(--red)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          aria-label="Delete image asset"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={img.title}
                      >
                        {img.title || `Image #${img.id}`}
                      </p>
                      <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
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
