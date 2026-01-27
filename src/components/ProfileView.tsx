// Profile/Me screen - user's own profile with settings

'use client';

import { useState, useEffect } from 'react';
import { currentUser } from '@/data/mockData';
import { useSettings } from '@/hooks/useSettings';
import { SettingsIcon, CheckIcon, BlockIcon, EyeIcon, CrownIcon, GiftIcon, AlbumIcon, TrashIcon } from './icons';
import DeleteAccountModal from './DeleteAccountModal';
import { Intent, Availability } from '@/types';
import BlockedUsersScreen from './BlockedUsersScreen';
import ReferralProgramScreen from './ReferralProgramScreen';
import ProfilePhotoEditor from './ProfilePhotoEditor';
import { AlbumList } from './albums';
import ProfileDetailsEditor from './ProfileDetailsEditor';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileViews } from '@/hooks/useProfileViews';
import { useGhostMode } from '@/hooks/useGhostMode';
import { useVisibilityControls } from '@/hooks/useVisibilityControls';
import SubscriptionModal from './SubscriptionModal';
import ProfileViewersScreen from './ProfileViewersScreen';
import PaywallModal from './PaywallModal';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

export default function ProfileView() {
  const { settings, toggleSfwMode, toggleLocation, updateSettings } = useSettings();
  const { user: authUser } = useAuth();
  const { subscription, isPremium } = useSubscription();
  const { viewCount } = useProfileViews();
  const { isGhostModeEnabled, canUseGhostMode, toggleGhostMode } = useGhostMode();
  const { showInGrid, showOnMap, canUseVisibilityControls, isFullyHidden, toggleShowInGrid, toggleShowOnMap } = useVisibilityControls();
  const [user, setUser] = useState(currentUser);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showReferralProgram, setShowReferralProgram] = useState(false);
  const [showAlbums, setShowAlbums] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showProfileViewers, setShowProfileViewers] = useState(false);
  const [showPaywall, setShowPaywall] = useState<string | null>(null);
  const [showDetailsEditor, setShowDetailsEditor] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const intentOptions: { value: Intent; label: string }[] = [
    { value: 'looking_now', label: 'Looking Now' },
    { value: 'looking_later', label: 'Looking Later' },
    { value: 'chatting', label: 'Chatting' },
    { value: 'friends', label: 'Friends' },
  ];

  const availabilityOptions: { value: Availability; label: string }[] = [
    { value: 'now', label: 'Now' },
    { value: 'today', label: 'Today' },
    { value: 'later', label: 'Later' },
    { value: 'offline', label: 'Offline' },
  ];

  const handleSignOut = () => {
    // TODO: Implement actual sign out
    alert('Sign out clicked');
  };

  const handleGhostModeToggle = () => {
    const result = toggleGhostMode();
    if (result.requiresPremium) {
      setShowPaywall('ghost_mode');
    }
  };

  const handleToggleShowInGrid = () => {
    const result = toggleShowInGrid();
    if (result.requiresPremium) {
      setShowPaywall('visibility_controls');
    }
  };

  const handleToggleShowOnMap = () => {
    const result = toggleShowOnMap();
    if (result.requiresPremium) {
      setShowPaywall('visibility_controls');
    }
  };

  const handleProfileDetailsUpdate = (updates: Partial<User>) => {
    setUser({ ...user, ...updates });
    // TODO: Save to Supabase
  };

  // Handle display name editing
  const startEditingName = () => {
    setEditNameValue(user.display_name || user.username);
    setIsEditingName(true);
  };

  const saveDisplayName = async () => {
    const trimmedName = editNameValue.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      return; // Invalid length
    }

    // Update local state
    setUser({ ...user, display_name: trimmedName });
    setIsEditingName(false);

    // Save to Supabase if authenticated
    if (authUser) {
      try {
        await supabase
          .from('profiles')
          .update({ display_name: trimmedName })
          .eq('id', authUser.id);
      } catch (err) {
        console.error('Failed to save display name:', err);
      }
    }
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditNameValue('');
  };

  // Load profile and photos from database when user is authenticated
  useEffect(() => {
    if (!authUser) return;

    const loadProfile = async () => {
      try {
        // Load profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, display_name, bio, is_verified, verified_at')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
        } else if (profileData) {
          setUser((prev) => ({
            ...prev,
            username: profileData.username,
            display_name: profileData.display_name,
            bio: profileData.bio,
            is_verified: profileData.is_verified,
            verified_at: profileData.verified_at,
          }));
        }

        // Load photos
        const { data: photosData, error: photosError } = await supabase
          .from('photos')
          .select('*')
          .eq('profile_id', authUser.id)
          .order('created_at', { ascending: true });

        if (photosError) {
          console.error('Error loading photos:', photosError);
        } else if (photosData && photosData.length > 0) {
          const photoUrls = photosData.map((photo) => photo.url);
          const primaryPhoto = photosData.find((p) => p.is_primary) || photosData[0];
          setUser((prev) => ({
            ...prev,
            photos: photoUrls,
            avatar_url: primaryPhoto?.url || null,
          }));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    loadProfile();
  }, [authUser]);

  if (showDetailsEditor) {
    return (
      <ProfileDetailsEditor
        user={user}
        onSave={handleProfileDetailsUpdate}
        onBack={() => setShowDetailsEditor(false)}
      />
    );
  }

  if (showBlockedUsers) {
    return <BlockedUsersScreen onBack={() => setShowBlockedUsers(false)} />;
  }

  if (showReferralProgram) {
    return <ReferralProgramScreen onClose={() => setShowReferralProgram(false)} />;
  }

  if (showAlbums) {
    return <AlbumList onBack={() => setShowAlbums(false)} />;
  }

  if (showProfileViewers) {
    return (
      <ProfileViewersScreen
        onBack={() => setShowProfileViewers(false)}
        onUpgrade={() => {
          setShowProfileViewers(false);
          setShowSubscriptionModal(true);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-hole-bg overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hole-border">
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <input
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveDisplayName();
                if (e.key === 'Escape') cancelEditingName();
              }}
              maxLength={50}
              autoFocus
              className="flex-1 text-lg font-semibold bg-hole-surface border border-hole-border rounded-lg px-3 py-1 outline-none focus:border-hole-accent"
            />
            <button
              onClick={saveDisplayName}
              className="p-1.5 bg-hole-accent text-white rounded-lg hover:bg-hole-accent-hover"
              aria-label="Save"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={cancelEditingName}
              className="p-1.5 bg-hole-surface text-hole-muted rounded-lg hover:bg-hole-border"
              aria-label="Cancel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={startEditingName}
            className="flex items-center gap-2 group"
          >
            <h1 className="text-lg font-semibold">{user.display_name || user.username}</h1>
            <svg
              className="w-4 h-4 text-hole-muted opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            showSettings ? 'bg-hole-accent text-white' : 'hover:bg-hole-surface'
          }`}
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {showSettings ? (
        // Settings view
        <div className="flex-1 p-4 space-y-6">
          <h2 className="text-lg font-semibold">Settings</h2>

          {/* Toggle settings */}
          <div className="space-y-4">
            <ToggleSetting
              label="SFW Mode"
              description="Hide explicit content"
              enabled={settings.sfw_mode}
              onToggle={toggleSfwMode}
            />
            <ToggleSetting
              label="Location Sharing"
              description="Show your location to others"
              enabled={settings.location_enabled}
              onToggle={toggleLocation}
            />
            <ToggleSetting
              label="Push Notifications"
              description="Get notified of new messages"
              enabled={settings.push_notifications}
              onToggle={() => updateSettings({ push_notifications: !settings.push_notifications })}
            />
            <ToggleSetting
              label="Ghost Mode"
              description="Browse without being seen"
              enabled={isGhostModeEnabled}
              onToggle={handleGhostModeToggle}
              isPremium={!canUseGhostMode}
            />
            <ToggleSetting
              label="Hide from Contacts"
              description="Don't show to phone contacts"
              enabled={settings.hide_from_contacts}
              onToggle={() => updateSettings({ hide_from_contacts: !settings.hide_from_contacts })}
            />

            {/* Visibility Controls Section */}
            <div className="pt-4 border-t border-hole-border">
              <h3 className="text-sm font-medium text-hole-muted mb-3">Visibility Controls</h3>

              {/* Warning banner when fully hidden */}
              {isFullyHidden && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3 mb-4">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-400">You&apos;re invisible</p>
                    <p className="text-sm text-hole-muted">
                      You won&apos;t appear in the grid or on the map. Others can&apos;t discover you.
                    </p>
                  </div>
                </div>
              )}

              <ToggleSetting
                label="Appear in Grid"
                description="Show your profile in the grid view"
                enabled={showInGrid}
                onToggle={handleToggleShowInGrid}
                isPremium={!canUseVisibilityControls}
              />
              <ToggleSetting
                label="Appear on Map"
                description="Show your location on the map"
                enabled={showOnMap}
                onToggle={handleToggleShowOnMap}
                isPremium={!canUseVisibilityControls}
              />
            </div>
          </div>

          {/* My Albums link */}
          <button
            onClick={() => setShowAlbums(true)}
            className="w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
          >
            <div className="flex items-center gap-3">
              <AlbumIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">My Albums</div>
                <div className="text-sm text-hole-muted">Private photos &amp; videos</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Blocked Users link */}
          <button
            onClick={() => setShowBlockedUsers(true)}
            className="w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
          >
            <div className="flex items-center gap-3">
              <BlockIcon className="w-5 h-5" />
              <span className="font-medium">Blocked Users</span>
            </div>
            <svg className="w-5 h-5 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Referral Program */}
          <button
            onClick={() => setShowReferralProgram(true)}
            className="w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
          >
            <div className="flex items-center gap-3">
              <GiftIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Referral Program</div>
                <div className="text-sm text-hole-muted">Earn credits for referrals</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Legal Section */}
          <div className="pt-4 border-t border-hole-border">
            <h3 className="text-sm font-medium text-hole-muted mb-3">Legal</h3>
            <div className="space-y-2">
              <a
                href="/terms"
                className="w-full flex items-center justify-between p-3 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
              >
                <span className="text-sm">Terms of Service</span>
                <svg className="w-4 h-4 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/privacy"
                className="w-full flex items-center justify-between p-3 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
              >
                <span className="text-sm">Privacy Policy</span>
                <svg className="w-4 h-4 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/data-protection"
                className="w-full flex items-center justify-between p-3 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
              >
                <span className="text-sm">Data Protection</span>
                <svg className="w-4 h-4 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-hole-surface border border-hole-border text-hole-accent rounded-lg font-medium transition-colors hover:bg-hole-border"
          >
            Sign Out
          </button>

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-hole-surface border border-red-500/30 text-red-500 rounded-lg font-medium transition-colors hover:bg-red-500/10"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      ) : (
        // Profile view
        <div className="flex-1 p-4 space-y-6">
          {/* Username handle */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-hole-muted">@{user.username}</span>
              {user.is_verified && <CheckIcon className="w-4 h-4 text-blue-500" />}
            </div>
            {!user.is_verified && (
              <button className="mt-1 text-sm text-blue-500 underline">
                Get verified
              </button>
            )}
          </div>

          {/* Photo Editor */}
          {authUser && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-hole-muted">Photos</label>
                <button
                  onClick={() => setShowPhotoEditor(!showPhotoEditor)}
                  className="text-sm text-hole-accent hover:underline"
                >
                  {showPhotoEditor ? 'Done' : 'Edit'}
                </button>
              </div>
              {showPhotoEditor ? (
                <ProfilePhotoEditor
                  userId={authUser.id}
                  currentPhotos={user.photos.map((url, index) => ({
                    name: `photo-${index}`,
                    path: url,
                    url: url,
                    isPrimary: index === 0,
                  }))}
                  onPhotosChange={(photos) => {
                    const photoUrls = photos.map(p => p.url);
                    setUser({ ...user, photos: photoUrls, avatar_url: photos.find(p => p.isPrimary)?.url || photoUrls[0] || null });
                  }}
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {user.photos.slice(0, 6).map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-hole-surface">
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {user.photos.length === 0 && (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-hole-border flex items-center justify-center">
                      <span className="text-xs text-hole-muted">No photos</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Intent selector */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Intent</label>
            <div className="grid grid-cols-2 gap-2">
              {intentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUser({ ...user, intent: opt.value })}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                    user.intent === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability selector */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Availability</label>
            <div className="grid grid-cols-4 gap-2">
              {availabilityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUser({ ...user, availability: opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    user.availability === opt.value
                      ? 'bg-green-500 text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">About</label>
            <textarea
              value={user.bio || ''}
              onChange={(e) => setUser({ ...user, bio: e.target.value })}
              placeholder="Write something about yourself..."
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Profile Details Button */}
          <button
            onClick={() => setShowDetailsEditor(true)}
            className="w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="text-left">
                <div className="font-medium">Profile Details</div>
                <div className="text-sm text-hole-muted">
                  Stats, preferences, kinks, socials
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Subscription status */}
          {isPremium ? (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CrownIcon className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">
                  {subscription.tier === 'premium' ? 'Premium' : 'Premium+'} Member
                </h3>
              </div>
              <p className="text-sm text-gray-300 mb-3">
                {subscription.expiresAt &&
                  `Renews ${new Date(subscription.expiresAt).toLocaleDateString()}`}
              </p>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full py-2 bg-white/10 border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Upgrade to Premium</h3>
              <p className="text-sm text-gray-300 mb-3">
                Unlimited messages, ghost mode, see who viewed you
              </p>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                View Plans
              </button>
            </div>
          )}

          {/* Who Viewed Me */}
          <button
            onClick={() => setShowProfileViewers(true)}
            className="w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
          >
            <div className="flex items-center gap-3">
              <EyeIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Who Viewed Me</div>
                <div className="text-sm text-hole-muted">
                  {viewCount > 0 ? `${viewCount} recent views` : 'See who checked you out'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewCount > 0 && (
                <span className="bg-hole-accent text-white text-xs font-medium px-2 py-1 rounded-full">
                  {viewCount}
                </span>
              )}
              {!isPremium && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                  Premium
                </span>
              )}
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
          </button>
        </div>
      )}

      {/* Modals */}
      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
      {showPaywall && (
        <PaywallModal
          featureName={showPaywall}
          onClose={() => setShowPaywall(null)}
          onSubscribe={() => {
            setShowPaywall(null);
            setShowSubscriptionModal(true);
          }}
        />
      )}
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />
    </div>
  );
}

// Toggle setting component
interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  isPremium?: boolean;
}

function ToggleSetting({ label, description, enabled, onToggle, isPremium }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {isPremium && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
              Premium
            </span>
          )}
        </div>
        <p className="text-sm text-hole-muted">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-colors relative ${
          enabled ? 'bg-hole-accent' : 'bg-hole-border'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
