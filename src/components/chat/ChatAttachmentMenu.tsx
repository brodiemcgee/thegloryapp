// Chat attachment menu - Photo or Album options

'use client';

import { useState, useRef, useEffect } from 'react';
import { ImageIcon, AlbumIcon, PlusIcon } from '@/components/icons';

interface ChatAttachmentMenuProps {
  onSelectPhoto: () => void;
  onSelectAlbum: () => void;
  disabled?: boolean;
}

export default function ChatAttachmentMenu({
  onSelectPhoto,
  onSelectAlbum,
  disabled = false,
}: ChatAttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePhotoClick = () => {
    setIsOpen(false);
    onSelectPhoto();
  };

  const handleAlbumClick = () => {
    setIsOpen(false);
    onSelectAlbum();
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-3 rounded-full transition-colors ${
          isOpen
            ? 'bg-hole-accent text-white'
            : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
        } disabled:opacity-50`}
        aria-label="Attach media"
        aria-expanded={isOpen}
      >
        <PlusIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-hole-surface border border-hole-border rounded-lg shadow-lg overflow-hidden z-10 min-w-[160px]">
          <button
            onClick={handlePhotoClick}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left"
          >
            <ImageIcon className="w-5 h-5 text-hole-muted" />
            <span>Photo</span>
          </button>
          <button
            onClick={handleAlbumClick}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left"
          >
            <AlbumIcon className="w-5 h-5 text-hole-muted" />
            <span>Share Album</span>
          </button>
        </div>
      )}
    </div>
  );
}
