// User profile view - shown when tapping a user card

'use client';

import { useState, useEffect } from 'react';
import { User, Position, BodyType, HostTravel, SmokingStatus, DrugStatus, SaferSex, HivStatus } from '@/types';
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

// Display labels for profile attributes
const positionLabels: Record<Position, string> = {
  top: 'Top',
  bottom: 'Bottom',
  vers: 'Vers',
  vers_top: 'Vers Top',
  vers_bottom: 'Vers Bottom',
  side: 'Side',
};

const bodyTypeLabels: Record<BodyType, string> = {
  slim: 'Slim',
  average: 'Average',
  athletic: 'Athletic',
  muscular: 'Muscular',
  stocky: 'Stocky',
  heavy: 'Heavy',
};

const hostTravelLabels: Record<HostTravel, string> = {
  host: 'Can Host',
  travel: 'Can Travel',
  both: 'Host or Travel',
  neither: 'Neither',
};

const smokingLabels: Record<SmokingStatus, string> = {
  never: 'Non-smoker',
  sometimes: 'Sometimes',
  often: 'Smoker',
};

const drugLabels: Record<DrugStatus, string> = {
  never: 'No drugs',
  sometimes: 'Sometimes',
  party: 'Party friendly',
};

const saferSexLabels: Record<SaferSex, string> = {
  always: 'Always safe',
  sometimes: 'Sometimes',
  never: 'Bareback',
};

const hivStatusLabels: Record<HivStatus, string> = {
  negative: 'Negative',
  positive: 'Positive',
  undetectable: 'Undetectable',
  on_prep: 'On PrEP',
  unknown: 'Unknown',
};

export default function UserProfile({ user, onBack }: UserProfileProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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
    looking_now: 'Looking Now',
    looking_later: 'Looking Later',
    chatting: 'Chatting',
    friends: 'Friends',
  };

  const availabilityLabels: Record<string, string> = {
    now: 'Available now',
    today: 'Available today',
    later: 'Available later',
    offline: 'Offline',
  };

  // Format height for display (cm to feet/inches option)
  const formatHeight = (cm: number) => {
    return `${cm} cm`;
  };

  // Format weight for display
  const formatWeight = (kg: number) => {
    return `${kg} kg`;
  };

  // Get all photos including avatar
  const allPhotos = user.photos.length > 0 ? user.photos : (user.avatar_url ? [user.avatar_url] : []);

  // Check if user has any stats to show
  const hasStats = user.height_cm || user.weight_kg || user.body_type || user.ethnicity || user.age;

  // Check if user has any about info
  const hasAboutInfo = user.position || user.host_travel || user.smoker || user.drugs || user.safer_sex || user.hiv_status;

  // Check if user has looking for preferences
  const hasLookingFor = user.looking_for && (
    user.looking_for.position?.length ||
    user.looking_for.body_type?.length ||
    user.looking_for.age_min ||
    user.looking_for.age_max ||
    user.looking_for.host_travel?.length
  );

  // Check if user has social links
  const hasSocials = user.instagram_handle || user.twitter_handle;

  // Check if user has kinks
  const hasKinks = user.kinks && user.kinks.length > 0;

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
        {/* Photo Gallery */}
        <div className="relative aspect-square bg-hole-surface">
          {allPhotos.length > 0 ? (
            <>
              <img
                src={allPhotos[currentPhotoIndex]}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Photo navigation dots */}
              {allPhotos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {allPhotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Tap zones for navigation */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    className="absolute left-0 top-0 w-1/3 h-full"
                    onClick={() => setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                  />
                  <button
                    className="absolute right-0 top-0 w-1/3 h-full"
                    onClick={() => setCurrentPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                  />
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl text-hole-muted">?</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-5">
          {/* Name and verified */}
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            {user.is_verified && (
              <div className="flex items-center gap-1 text-blue-500" title={user.verified_at ? `Verified ${new Date(user.verified_at).toLocaleDateString()}` : 'Verified'}>
                <CheckIcon className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {user.age && <span className="bg-hole-surface px-2 py-1 rounded">{user.age} y/o</span>}
            {user.position && <span className="bg-hole-surface px-2 py-1 rounded">{positionLabels[user.position]}</span>}
            {user.distance_km !== undefined && (
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
            <span className="px-3 py-1 bg-hole-accent/20 text-hole-accent rounded-full text-sm">
              {intentLabels[user.intent]}
            </span>
            <span className="px-3 py-1 bg-hole-surface rounded-full text-sm">
              {availabilityLabels[user.availability]}
            </span>
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="text-sm text-hole-muted mb-2 font-medium">About</h3>
              <p className="text-gray-300">{user.bio}</p>
            </div>
          )}

          {/* Stats Section */}
          {hasStats && (
            <div>
              <h3 className="text-sm text-hole-muted mb-2 font-medium">Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                {user.height_cm && (
                  <div className="bg-hole-surface p-3 rounded-lg">
                    <div className="text-xs text-hole-muted">Height</div>
                    <div className="font-medium">{formatHeight(user.height_cm)}</div>
                  </div>
                )}
                {user.weight_kg && (
                  <div className="bg-hole-surface p-3 rounded-lg">
                    <div className="text-xs text-hole-muted">Weight</div>
                    <div className="font-medium">{formatWeight(user.weight_kg)}</div>
                  </div>
                )}
                {user.body_type && (
                  <div className="bg-hole-surface p-3 rounded-lg">
                    <div className="text-xs text-hole-muted">Body Type</div>
                    <div className="font-medium">{bodyTypeLabels[user.body_type]}</div>
                  </div>
                )}
                {user.ethnicity && (
                  <div className="bg-hole-surface p-3 rounded-lg">
                    <div className="text-xs text-hole-muted">Ethnicity</div>
                    <div className="font-medium">{user.ethnicity}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* About Me Section */}
          {hasAboutInfo && (
            <div>
              <h3 className="text-sm text-hole-muted mb-2 font-medium">Details</h3>
              <div className="flex flex-wrap gap-2">
                {user.position && (
                  <span className="px-3 py-1.5 bg-hole-surface rounded-lg text-sm">
                    {positionLabels[user.position]}
                  </span>
                )}
                {user.host_travel && (
                  <span className="px-3 py-1.5 bg-hole-surface rounded-lg text-sm">
                    {hostTravelLabels[user.host_travel]}
                  </span>
                )}
                {user.safer_sex && (
                  <span className="px-3 py-1.5 bg-hole-surface rounded-lg text-sm">
                    {saferSexLabels[user.safer_sex]}
                  </span>
                )}
                {user.hiv_status && (
                  <span className="px-3 py-1.5 bg-hole-surface rounded-lg text-sm">
                    {hivStatusLabels[user.hiv_status]}
                  </span>
                )}
                {user.smoker && (
                  <span className="px-3 py-1.5 bg-hole-surface rounded-lg text-sm">
                    {smokingLabels[user.smoker]}
                  </span>
                )}
                {user.drugs && (
                  <span className="px-3 py-1.5 bg-hole-surface rounded-lg text-sm">
                    {drugLabels[user.drugs]}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Looking For Section */}
          {hasLookingFor && user.looking_for && (
            <div>
              <h3 className="text-sm text-hole-muted mb-2 font-medium">Looking For</h3>
              <div className="flex flex-wrap gap-2">
                {user.looking_for.position?.map((pos) => (
                  <span key={pos} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                    {positionLabels[pos]}
                  </span>
                ))}
                {user.looking_for.body_type?.map((bt) => (
                  <span key={bt} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                    {bodyTypeLabels[bt]}
                  </span>
                ))}
                {user.looking_for.host_travel?.map((ht) => (
                  <span key={ht} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                    {hostTravelLabels[ht]}
                  </span>
                ))}
                {(user.looking_for.age_min || user.looking_for.age_max) && (
                  <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                    Age: {user.looking_for.age_min || 18} - {user.looking_for.age_max || '99+'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Kinks Section */}
          {hasKinks && user.kinks && (
            <div>
              <h3 className="text-sm text-hole-muted mb-2 font-medium">Kinks</h3>
              <div className="flex flex-wrap gap-2">
                {user.kinks.map((kink) => (
                  <span key={kink} className="px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg text-sm">
                    {kink}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {hasSocials && (
            <div>
              <h3 className="text-sm text-hole-muted mb-2 font-medium">Socials</h3>
              <div className="flex gap-3">
                {user.instagram_handle && (
                  <a
                    href={`https://instagram.com/${user.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{user.instagram_handle}
                  </a>
                )}
                {user.twitter_handle && (
                  <a
                    href={`https://x.com/${user.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-hole-surface rounded-lg text-sm font-medium hover:bg-hole-border transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @{user.twitter_handle}
                  </a>
                )}
              </div>
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
