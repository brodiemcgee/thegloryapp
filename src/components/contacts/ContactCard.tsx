// Contact card component - displays a single contact in the list

'use client';

import { UnifiedContact } from '@/types';
import { ChevronRightIcon } from '../icons';

interface ContactCardProps {
  contact: UnifiedContact;
  onClick?: () => void;
  onViewProfile?: () => void;
}

export default function ContactCard({ contact, onClick, onViewProfile }: ContactCardProps) {
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

  const isAppUser = contact.type === 'app_user';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className="flex-1 p-4 bg-hole-surface rounded-lg hover:bg-hole-border transition-colors text-left flex items-center gap-3"
      >
        {/* Avatar */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <div className="w-12 h-12 bg-hole-border rounded-full flex items-center justify-center overflow-hidden">
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
          {/* App user indicator icon */}
          {isAppUser && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-hole-accent rounded-full flex items-center justify-center border-2 border-hole-surface"
              title="App user"
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{contact.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-hole-muted">
            <span>{contact.encounter_count} encounter{contact.encounter_count !== 1 ? 's' : ''}</span>
            <span>Last: {formatDate(contact.last_met)}</span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-hole-muted flex-shrink-0" />
      </button>

      {/* View Profile button for app users */}
      {onViewProfile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
          className="p-3 bg-hole-surface rounded-lg hover:bg-hole-accent transition-colors flex-shrink-0"
          title="View profile"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}
