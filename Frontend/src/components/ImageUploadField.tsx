import React, { useRef, useState } from 'react';
import { AlertCircle, FolderOpen, Loader2, UploadCloud, X } from 'lucide-react';
import { imageApi } from '../api/client';
import { useJournalActions } from '../state/JournalContext';
import { ImageAsset } from '../types';
import { MediaLibraryModal } from './MediaLibraryModal';
import './ImageUploadField.css';

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
  const { addToast } = useJournalActions();
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      setUploading(true);
      setUploadError(null);
      const asset = await imageApi.upload(file, {
        folder: folderId,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });
      onChange(asset.id, asset.url);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to upload image:', err);
      const detail =
        err instanceof Error ? err.message : 'Please check network connection and Cloudinary settings.';
      const msg = `Upload failed: ${detail}`;
      setUploadError(msg);
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFromLibrary = (asset: ImageAsset) => {
    setUploadError(null);
    onChange(asset.id, asset.url);
    setLibraryOpen(false);
  };

  const handleRemove = () => {
    setUploadError(null);
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="kf-upload">
      <span className="kf-upload-label">{label}</span>

      {imageUrl ? (
        <div className="kf-upload-preview">
          <img src={imageUrl} alt="Selected cover" className="kf-upload-thumb" />

          <div className="kf-upload-meta">
            <p className="kf-upload-title">Cover Image Selected</p>
            <p className="kf-upload-url">{imageUrl}</p>

            <div className="kf-upload-actions">
              <button
                type="button"
                className="kf-upload-btn is-quiet"
                onClick={() => setLibraryOpen(true)}
              >
                Change from Library
              </button>
              <button
                type="button"
                className="kf-upload-btn is-danger"
                onClick={handleRemove}
                title="Remove image"
              >
                <X size={13} aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="kf-upload-dropzone">
          <div className="kf-upload-drop-info">
            <div className="kf-upload-icon" aria-hidden="true">
              {uploading ? <Loader2 size={18} className="kf-spin" /> : <UploadCloud size={18} />}
            </div>
            <div>
              <p className="kf-upload-title">
                {uploading ? 'Uploading to Cloudinary…' : 'Upload cover or select from library'}
              </p>
              <p className="kf-upload-sub">PNG, JPG, WebP</p>
            </div>
          </div>

          <div className="kf-upload-actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="kf-upload-btn is-quiet"
              onClick={() => setLibraryOpen(true)}
            >
              <FolderOpen size={14} aria-hidden="true" />
              <span>Library</span>
            </button>
            <button
              type="button"
              className="kf-upload-btn is-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadCloud size={14} aria-hidden="true" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: 'var(--kf-2) var(--kf-3)',
            borderRadius: 'var(--kf-radius)',
            background: 'var(--kf-danger-soft)',
            border: '1px solid color-mix(in srgb, var(--kf-danger) 40%, transparent)',
            color: 'var(--kf-danger)',
            fontSize: 'var(--kf-text-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--kf-2)',
          }}
        >
          <AlertCircle size={14} aria-hidden="true" />
          <span>{uploadError}</span>
        </p>
      )}

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
