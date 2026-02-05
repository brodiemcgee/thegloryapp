// Reusable photo uploader component with drag-drop support

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { XIcon } from './icons';
import { toast } from 'react-hot-toast';

export interface PhotoUploaderProps {
  onUpload: (file: File) => void;
  maxSize?: number; // in bytes
  accept?: string;
  uploading?: boolean;
  progress?: number;
  error?: string | null;
}

export default function PhotoUploader({
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  uploading = false,
  progress = 0,
  error = null,
}: PhotoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-hole-accent bg-hole-accent/10'
              : 'border-hole-border bg-hole-surface hover:border-hole-accent/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto bg-hole-border rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-hole-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-hole-muted mt-1">
                Max {maxSize / 1024 / 1024}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden bg-hole-surface">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
            {!uploading && (
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                aria-label="Remove"
              >
                <XIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-hole-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-hole-accent h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-hole-muted text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Upload button */}
          {!uploading && !error && (
            <button
              onClick={handleUpload}
              className="w-full py-3 bg-hole-accent hover:bg-hole-accent-hover rounded-lg font-medium transition-colors"
            >
              Upload Photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
