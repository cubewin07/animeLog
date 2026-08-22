import React, { useState, useRef } from 'react';
import { ImageAsset } from '../types';
import { imageApi } from '../api/client';
import { MediaLibraryModal } from './MediaLibraryModal';
import { UploadCloud, X, Loader2, FolderOpen } from 'lucide-react';

interface ImageUploadFieldProps {
  label?: string;
  imageId?: number | null;
  imageUrl?: string | null;
  onChange: (imageId: number | null, imageUrl: string | null) => void;
  folderId?: number | null;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label = 'Cover Image',
  imageId,
  imageUrl,
  onChange,
  folderId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      setUploading(true);
      const asset = await imageApi.upload(file, {
        folder: folderId,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });
      onChange(asset.id, asset.url);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Upload failed. Please check network connection and Cloudinary settings.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFromLibrary = (asset: ImageAsset) => {
    onChange(asset.id, asset.url);
    setLibraryOpen(false);
  };

  const handleRemove = () => {
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>

      {imageUrl ? (
        /* Image Preview Box */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(13, 28, 48, 0.7)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <img
            src={imageUrl}
            alt="Selected cover"
            style={{
              width: '54px',
              height: '72px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              background: '#040d18',
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              Cover Image Selected
            </p>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-dim)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '2px',
              }}
            >
              {imageUrl}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setLibraryOpen(true)}
                style={{ padding: '3px 8px', fontSize: '11px' }}
              >
                Change from Library
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleRemove}
                style={{ padding: '3px 8px', fontSize: '11px', color: '#fb7185' }}
              >
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload Box */
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {uploading ? <Loader2 size={18} className="spin" /> : <UploadCloud size={18} />}
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                {uploading ? 'Uploading to Cloudinary...' : 'Upload cover or select from library'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                PNG, JPG, WebP
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setLibraryOpen(true)}
              style={{ padding: '6px 10px', fontSize: '11px' }}
            >
              <FolderOpen size={13} />
              <span>Library</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <UploadCloud size={13} />
              <span>Upload</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {libraryOpen && (
        <MediaLibraryModal
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onSelectImage={handleSelectFromLibrary}
          selectedImageId={imageId}
        />
      )}
    </div>
  );
};
