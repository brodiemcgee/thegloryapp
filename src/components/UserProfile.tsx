// User profile view - shown when tapping a user card

'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { ChevronLeftIcon, CheckIcon, MessageIcon, DotsVerticalIcon, FlagIcon, BlockIcon } from './icons';
import ReportModal from './ReportModal';
import BlockConfirmModal from './BlockConfirmModal';
import { useBlock } from '@/hooks/useBlock';
import { useReport } from '@/hooks/useReport';
import { useProfileViews } from '@/hooks/useProfileViews';

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

export default function UserProfile({ user, onBack }: UserProfileProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const { blockUser, isBlocked } = useBlock();
  const { submitReport } = useReport();
  const { logView } = useProfileViews();

  // Log profile view when component mounts
  useEffect(() => {
    logView(user.id);
  }, [user.id, logView]);

  const formatLastActive = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleReport = (reason: any, details: string) => {
    submitReport(user.id, 'user', reason, details);
    setShowReportModal(false);
  };

  const handleBlock = () => {
    blockUser(user.id);
    setShowBlockModal(false);
  };

  const intentLabels: Record<string, string> = {
    looking: 'Looking',
    hosting: 'Can host',
    traveling: 'Traveling',
    discrete: 'Discrete',
  };

  const availabilityLabels: Record<string, string> = {
    now: 'Available now',
    today: 'Available today',
    later: 'Available later',
    offline: 'Offline',
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
        <h1 className="text-lg font-semibold flex-1">Profile</h1>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
            aria-label="More options"
          >
            <DotsVerticalIcon className="w-5 h-5" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-hole-surface border border-hole-border rounded-lg shadow-lg overflow-hidden z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left"
                >
                  <FlagIcon className="w-5 h-5" />
                  <span>Report</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hole-border transition-colors text-left text-hole-accent"
                >
                  <BlockIcon className="w-5 h-5" />
                  <span>Block</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Photo */}
        <div className="aspect-square bg-hole-surface">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl text-hole-muted">?</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-4">
          {/* Name and verified */}
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            {user.is_verified && (
              <div className="flex items-center gap-1 text-blue-500">
                <CheckIcon className="w-5 h-5" />
                <span className="text-sm">Verified</span>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm">
            {user.age && <span>{user.age} y/o</span>}
            {user.distance_km && (
              <span className="text-hole-muted">
                {user.distance_km < 1
                  ? `${Math.round(user.distance_km * 1000)}m away`
                  : `${user.distance_km.toFixed(1)}km away`}
              </span>
            )}
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              user.is_online ? 'bg-green-500/20 text-green-500' : 'bg-hole-border text-hole-muted'
            }`}>
              {user.is_online ? 'Online' : formatLastActive(user.last_active)}
            </span>
            <span className="px-3 py-1 bg-hole-surface rounded-full text-sm capitalize">
              {intentLabels[user.intent]}
            </span>
            <span className="px-3 py-1 bg-hole-surface rounded-full text-sm">
              {availabilityLabels[user.availability]}
            </span>
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="text-sm text-hole-muted mb-1">About</h3>
              <p className="text-gray-300">{user.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="p-4 border-t border-hole-border safe-bottom">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent-hover">
          <MessageIcon className="w-5 h-5" />
          Send Message
        </button>
      </div>

      {/* Modals */}
      {showReportModal && (
        <ReportModal
          targetId={user.id}
          targetType="user"
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
        />
      )}
      {showBlockModal && (
        <BlockConfirmModal
          username={user.username}
          onConfirm={handleBlock}
          onClose={() => setShowBlockModal(false)}
        />
      )}
    </div>
  );
}
