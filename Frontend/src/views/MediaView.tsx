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
}

export const MediaView: React.FC<MediaViewProps> = ({ onNotify }) => {
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onNotify) onNotify(`Uploaded ${files.length} image(s) to Cloudinary`);
      await loadMedia();
    } catch (err) {
      console.error('Upload failed:', err);
      if (onNotify) onNotify('Upload failed. Check Cloudinary credentials.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    if (!window.confirm('Delete this image from Cloudinary & library?')) return;
    try {
      await imageApi.delete(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (onNotify) onNotify('Image deleted');
    } catch (err) {
      console.error('Failed to delete image:', err);
      if (onNotify) onNotify('Failed to delete image', 'error');
    }
  };

  const handleCopyUrl = (img: ImageAsset) => {
    if (img.url) {
      navigator.clipboard.writeText(img.url);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
      if (onNotify) onNotify('Cloudinary URL copied to clipboard');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
            Cloudinary Media Library
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Upload, organize, and inspect posters, covers, and screenshots synced to Cloudinary.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          minHeight: '600px',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, #091728 0%, #05101e 100%)',
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '260px',
            borderRight: '1px solid var(--border-subtle)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: 'rgba(5, 16, 28, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
                letterSpacing: '0.05em',
              }}
            >
              Folders
            </span>
            <button
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-primary)' }}
              onClick={() => setShowNewFolder(true)}
              title="Create Folder"
            >
              <FolderPlus size={13} /> + New Folder
            </button>
          </div>

          {/* New Folder Form */}
          {showNewFolder && (
            <form
              onSubmit={handleCreateFolder}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--border-glow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px', padding: '6px 8px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 6px' }}
                  onClick={() => setShowNewFolder(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  disabled={folderSubmitting || !newFolderName.trim()}
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Folder List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            <button
              className={`folder-pill ${activeFolderId === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFolderId('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeFolderId === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeFolderId === 'all' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: activeFolderId === 'all' ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <FolderIcon size={14} color={activeFolderId === 'all' ? 'var(--color-primary)' : '#64748b'} />
              <span>All Images</span>
            </button>

            <button
              className={`folder-pill ${activeFolderId === 'root' ? 'active' : ''}`}
              onClick={() => setActiveFolderId('root')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeFolderId === 'root' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeFolderId === 'root' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: activeFolderId === 'root' ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <FolderIcon size={14} color={activeFolderId === 'root' ? 'var(--color-primary)' : '#64748b'} />
              <span>Unorganized (Root)</span>
            </button>

            {folders.map((f) => {
              const isActive = activeFolderId === f.id;
              return (
                <button
                  key={f.id}
                  className={`folder-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveFolderId(f.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <FolderIcon size={14} color={isActive ? 'var(--color-primary)' : '#64748b'} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                  </div>
                  {f.images_count !== undefined && (
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {f.images_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Toolbar */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(10, 22, 38, 0.6)',
            }}
          >
            {/* Upload Dropzone */}
            <div
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
              style={{
                border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                background: dragActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.18)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {uploading ? <Loader2 size={22} className="spin" /> : <UploadCloud size={22} />}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                    {uploading ? 'Uploading to Cloudinary...' : 'Upload Image Asset to Cloudinary'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Drop image files here, or click Browse to upload to current folder
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
                >
                  <Plus size={15} />
                  <span>Browse & Upload</span>
                </button>
              </div>
            </div>

            {/* Search and Counts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
                <Search
                  size={14}
                  color="#64748b"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', paddingTop: '7px', paddingBottom: '7px', fontSize: '13px' }}
                />
              </div>

              <span className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                {filteredImages.length} asset{filteredImages.length === 1 ? '' : 's'} in library
              </span>
            </div>
          </div>

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="spin" />
                <span style={{ marginLeft: '10px', fontSize: '13px' }}>Loading media assets...</span>
              </div>
            ) : filteredImages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '280px',
                  color: 'var(--text-dim)',
                  gap: '12px',
                }}
              >
                <ImageIcon size={42} opacity={0.4} />
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  No media uploaded yet
                </p>
                <p style={{ fontSize: '13px' }}>
                  Use the upload area above to test Cloudinary upload and organize folders.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '20px',
                }}
              >
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className="glass-card"
                    style={{
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      background: 'rgba(13, 28, 48, 0.75)',
                      borderRadius: 'var(--radius-md)',
                      position: 'relative',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '100%',
                        height: '160px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#040d18',
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.title || 'Asset'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                      />

                      {/* Action buttons */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          display: 'flex',
                          gap: '4px',
                        }}
                      >
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-icon"
                          title="Open original Cloudinary URL"
                          style={{
                            width: '28px',
                            height: '28px',
                            background: 'rgba(0, 0, 0, 0.75)',
                            color: '#ffffff',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(img)}
                          className="btn-icon"
                          title="Copy Cloudinary URL"
                          style={{
                            width: '28px',
                            height: '28px',
                            background: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          {copiedId === img.id ? (
                            <Check size={13} color="#34d399" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="btn-icon"
                          title="Delete from Cloudinary"
                          style={{
                            width: '28px',
                            height: '28px',
                            background: 'rgba(0, 0, 0, 0.75)',
                            color: '#fb7185',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Meta */}
                    <div>
                      <p
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={img.title}
                      >
                        {img.title || `Image #${img.id}`}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                        }}
                      >
                        {img.folder_name ? (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--color-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <FolderIcon size={11} /> {img.folder_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            Root
                          </span>
                        )}
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                          ID: {img.id}
                        </span>
                      </div>
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
