// Badge showing time remaining for album access

'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, LockIcon, UnlockIcon } from '@/components/icons';

interface AccessExpiryBadgeProps {
  expiresAt: string | null;
  isLocked: boolean;
  compact?: boolean;
}

export default function AccessExpiryBadge({
  expiresAt,
  isLocked,
  compact = false,
}: AccessExpiryBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isLocked) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-hole-accent`}>
        <LockIcon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Locked</span>
      </div>
    );
  }

  if (expiresAt === null) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-green-400`}>
        <UnlockIcon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Never expires</span>
      </div>
    );
  }

  if (timeRemaining === null) return null;

  const isExpired = timeRemaining <= 0;

  if (isExpired) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-hole-accent`}>
        <LockIcon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Expired</span>
      </div>
    );
  }

  const formatTime = () => {
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isUrgent = timeRemaining < 2 * 60 * 60 * 1000; // Less than 2 hours

  return (
    <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} ${isUrgent ? 'text-yellow-400' : 'text-hole-muted'}`}>
      <ClockIcon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{formatTime()} left</span>
    </div>
  );
}
