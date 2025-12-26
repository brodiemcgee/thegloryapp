// Profile viewers screen - shows who viewed your profile (premium feature)

'use client';

import { ChevronLeftIcon, LockIcon } from './icons';
import { useProfileViews } from '@/hooks/useProfileViews';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';

interface ProfileViewersScreenProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export default function ProfileViewersScreen({ onBack, onUpgrade }: ProfileViewersScreenProps) {
  const { views, viewCount } = useProfileViews();
  const { canAccess } = useSubscription();
  const canViewList = canAccess('who_viewed_me');

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-hole-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold flex-1">Who Viewed Me</h1>
        <span className="text-sm text-hole-muted">{viewCount} views</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!canViewList ? (
          // Paywall for free users
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <LockIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
            <p className="text-hole-muted mb-6 max-w-sm">
              Upgrade to Premium to see who's checking out your profile. Don't miss out on potential
              connections!
            </p>
            <button
              onClick={onUpgrade}
              className="w-full max-w-xs py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium transition-transform hover:scale-105"
            >
              Upgrade to Premium
            </button>

            {/* Blurred preview */}
            <div className="w-full max-w-sm mt-8 space-y-3 opacity-50 blur-sm pointer-events-none">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-hole-surface rounded-lg">
                  <div className="w-12 h-12 bg-hole-border rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-hole-border rounded w-24 mb-2" />
                    <div className="h-3 bg-hole-border rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : views.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="text-6xl mb-4">👀</div>
            <h2 className="text-xl font-semibold mb-2">No views yet</h2>
            <p className="text-hole-muted max-w-sm">
              When someone views your profile, they'll appear here. Keep your profile active to get
              more views!
            </p>
          </div>
        ) : (
          // List of viewers
          <div className="p-4 space-y-2">
            {views.map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-3 p-3 bg-hole-surface border border-hole-border rounded-lg hover:bg-hole-border transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-hole-border rounded-full overflow-hidden flex-shrink-0">
                  {view.viewer_avatar_url ? (
                    <img
                      src={view.viewer_avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-hole-muted">
                      ?
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-medium">{view.viewer_username}</div>
                  <div className="text-sm text-hole-muted">{formatTimeAgo(view.viewed_at)}</div>
                </div>

                {/* Arrow */}
                <svg
                  className="w-5 h-5 text-hole-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
