// Contact card component - displays a single contact in the list

'use client';

import { UnifiedContact } from '@/types';
import { ChevronRightIcon } from '../icons';

interface ContactCardProps {
  contact: UnifiedContact;
  onClick?: () => void;
}

export default function ContactCard({ contact, onClick }: ContactCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-hole-surface rounded-lg hover:bg-hole-border transition-colors text-left flex items-center gap-3"
    >
      {/* Avatar */}
      <div className="w-12 h-12 bg-hole-border rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
        {contact.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg text-hole-muted">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{contact.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            contact.type === 'app_user'
              ? 'bg-hole-accent/20 text-hole-accent'
              : 'bg-hole-border text-hole-muted'
          }`}>
            {contact.type === 'app_user' ? 'App' : 'Manual'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-hole-muted">
          <span>{contact.encounter_count} encounter{contact.encounter_count !== 1 ? 's' : ''}</span>
          <span>Last: {formatDate(contact.last_met)}</span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRightIcon className="w-5 h-5 text-hole-muted flex-shrink-0" />
    </button>
  );
}
