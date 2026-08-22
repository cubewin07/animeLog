import React, { useState, useEffect, useRef } from 'react';
import { Folder, ImageAsset } from '../types';
import { folderApi, imageApi } from '../api/client';
import {
  X,
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
  CheckCircle2,
} from 'lucide-react';

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
  const [imageTitle, setImageTitle] = useState('');
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, activeFolderId]);

  if (!isOpen) return null;

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
      await loadMedia();
    } catch (err) {
      console.error('Error creating folder:', err);
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
          title: imageTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        });
      }
      setImageTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadMedia();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please verify Cloudinary credentials and network connection.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Delete this image from Cloudinary & library?')) return;
    try {
      await imageApi.delete(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, img: ImageAsset) => {
    e.stopPropagation();
    if (img.url) {
      navigator.clipboard.writeText(img.url);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1000px',
          width: '95%',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #091728 0%, #05101e 100%)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 24, 42, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700 }}>
                {onSelectImage ? 'Choose Cover Image' : 'Cloudinary Media Library'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Upload and manage image assets directly stored on Cloudinary
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content Layout: Left Folders Sidebar + Right Assets Grid */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div
            style={{
              width: '240px',
              borderRight: '1px solid var(--border-subtle)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
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
                style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--color-primary)' }}
                onClick={() => setShowNewFolder(true)}
                title="Create Folder"
              >
                <FolderPlus size={13} /> + New
              </button>
            </div>

            {/* New Folder Form Dialog */}
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
                  style={{ fontSize: '12px', padding: '5px 8px' }}
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
                  padding: '8px 10px',
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
                  padding: '8px 10px',
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
                      padding: '8px 10px',
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
                      <span
                        className="mono"
                        style={{ fontSize: '10px', color: 'var(--text-dim)', paddingLeft: '4px' }}
                      >
                        {f.images_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Gallery Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              background: 'rgba(8, 20, 36, 0.4)',
            }}
          >
            {/* Top Toolbar: Upload Area & Search */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(10, 22, 38, 0.6)',
              }}
            >
              {/* Drag & Drop Upload Zone */}
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
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.18)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {uploading ? <Loader2 size={20} className="spin" /> : <UploadCloud size={20} />}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                      {uploading ? 'Uploading to Cloudinary...' : 'Drag & drop image files here'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Supports PNG, JPG, WebP, AVIF up to 10MB
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    style={{ padding: '7px 14px', fontSize: '12px' }}
                  >
                    <Plus size={14} />
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                  <Search
                    size={14}
                    color="#64748b"
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '32px', paddingTop: '6px', paddingBottom: '6px', fontSize: '12px' }}
                  />
                </div>

                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  {filteredImages.length} image{filteredImages.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Images Grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} className="spin" />
                  <span style={{ marginLeft: '10px', fontSize: '13px' }}>Loading media...</span>
                </div>
              ) : filteredImages.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '240px',
                    color: 'var(--text-dim)',
                    gap: '10px',
                  }}
                >
                  <ImageIcon size={36} opacity={0.4} />
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No images found</p>
                  <p style={{ fontSize: '12px' }}>Upload your first image to Cloudinary using the dropzone above.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {filteredImages.map((img) => {
                    const isSelected = selectedImageId === img.id;
                    return (
                      <div
                        key={img.id}
                        onClick={() => onSelectImage && onSelectImage(img)}
                        className="glass-card"
                        style={{
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          cursor: onSelectImage ? 'pointer' : 'default',
                          border: isSelected
                            ? '2px solid var(--color-primary-action)'
                            : '1px solid var(--border-subtle)',
                          background: isSelected
                            ? 'rgba(99, 102, 241, 0.12)'
                            : 'rgba(13, 28, 48, 0.75)',
                          borderRadius: 'var(--radius-md)',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Thumbnail Container */}
                        <div
                          style={{
                            width: '100%',
                            height: '140px',
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

                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: 'var(--color-primary-action)',
                                borderRadius: '50%',
                                padding: '2px',
                                color: '#ffffff',
                              }}
                            >
                              <CheckCircle2 size={16} />
                            </div>
                          )}

                          {/* Hover action overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              right: '6px',
                              display: 'flex',
                              gap: '4px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleCopyUrl(e, img)}
                              className="btn-icon"
                              title="Copy Cloudinary URL"
                              style={{
                                width: '26px',
                                height: '26px',
                                background: 'rgba(0, 0, 0, 0.7)',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              {copiedId === img.id ? (
                                <Check size={12} color="#34d399" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteImage(e, img.id)}
                              className="btn-icon"
                              title="Delete Image"
                              style={{
                                width: '26px',
                                height: '26px',
                                background: 'rgba(0, 0, 0, 0.7)',
                                color: '#fb7185',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div>
                          <p
                            style={{
                              fontSize: '12px',
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
                          {img.folder_name && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                marginTop: '2px',
                              }}
                            >
                              <FolderIcon size={10} /> {img.folder_name}
                            </span>
                          )}
                        </div>

                        {onSelectImage && (
                          <button
                            type="button"
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '4px 8px', fontSize: '11px', width: '100%', marginTop: '2px' }}
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
  );
};
