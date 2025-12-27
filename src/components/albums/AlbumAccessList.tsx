// List of users who have access to an album

'use client';

import { useState, useEffect } from 'react';
import { XIcon, LockIcon, UnlockIcon, TrashIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAlbumAccess } from '@/hooks/useAlbumAccess';
import AccessExpiryBadge from './AccessExpiryBadge';
import type { AlbumAccessGrant } from '@/types';

interface UserWithGrant extends AlbumAccessGrant {
  username?: string;
  avatar_url?: string;
}

interface AlbumAccessListProps {
  albumId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AlbumAccessList({
  albumId,
  isOpen,
  onClose,
}: AlbumAccessListProps) {
  const [grants, setGrants] = useState<UserWithGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const { lockAccess, unlockAccess, revokeAccess, error } = useAlbumAccess();

  useEffect(() => {
    if (!isOpen || !albumId) return;

    const fetchGrants = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('album_access_grants')
          .select(`
            *,
            recipient:profiles!album_access_grants_granted_to_fkey(username, avatar_url)
          `)
          .eq('album_id', albumId)
          .order('granted_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching grants:', fetchError);
        } else {
          const transformed = (data || []).map((grant: any) => ({
            ...grant,
            username: grant.recipient?.username,
            avatar_url: grant.recipient?.avatar_url,
          }));
          setGrants(transformed);
        }
      } catch (err) {
        console.error('Error fetching grants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [isOpen, albumId]);

  if (!isOpen) return null;

  const handleLock = async (grantId: string) => {
    await lockAccess(grantId);
    setGrants((prev) =>
      prev.map((g) => (g.id === grantId ? { ...g, is_locked: true } : g))
    );
  };

  const handleUnlock = async (grantId: string) => {
    await unlockAccess(grantId);
    setGrants((prev) =>
      prev.map((g) => (g.id === grantId ? { ...g, is_locked: false } : g))
    );
  };

  const handleRevoke = async (grantId: string) => {
    if (confirm('Remove access for this user? They will need you to share again.')) {
      await revokeAccess(grantId);
      setGrants((prev) => prev.filter((g) => g.id !== grantId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border">
          <h2 className="text-lg font-semibold text-white">Who Has Access</h2>
          <button
            onClick={onClose}
            className="p-2 text-hole-muted hover:text-white rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-hole-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">{error}</p>
            </div>
          ) : grants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-hole-muted">
                No one has access to this album yet.
              </p>
              <p className="text-sm text-hole-muted mt-1">
                Share it in a chat to grant access.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className="flex items-center gap-3 p-3 bg-hole-surface border border-hole-border rounded-lg"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center flex-shrink-0">
                    {grant.avatar_url ? (
                      <img
                        src={grant.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg text-hole-muted">?</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {grant.username || 'Unknown user'}
                    </p>
                    <AccessExpiryBadge
                      expiresAt={grant.expires_at}
                      isLocked={grant.is_locked}
                      compact
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {grant.is_locked ? (
                      <button
                        onClick={() => handleUnlock(grant.id)}
                        className="p-2 text-hole-muted hover:text-green-400 rounded-lg transition-colors"
                        title="Unlock access"
                      >
                        <UnlockIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLock(grant.id)}
                        className="p-2 text-hole-muted hover:text-hole-accent rounded-lg transition-colors"
                        title="Lock access"
                      >
                        <LockIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRevoke(grant.id)}
                      className="p-2 text-hole-muted hover:text-hole-accent rounded-lg transition-colors"
                      title="Remove access"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hole-border">
          <p className="text-xs text-hole-muted text-center">
            Locked users cannot view your album until you unlock it
          </p>
        </div>
      </div>
    </div>
  );
}
