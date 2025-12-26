// Ghost mode hook - browse anonymously without being seen

'use client';

import { useSettings } from './useSettings';
import { useSubscription } from './useSubscription';

export function useGhostMode() {
  const { settings, updateSettings } = useSettings();
  const { canAccess } = useSubscription();

  const isGhostModeEnabled = settings.ghost_mode;
  const canUseGhostMode = canAccess('ghost_mode');

  const toggleGhostMode = () => {
    if (!canUseGhostMode && !isGhostModeEnabled) {
      // Can't enable ghost mode without premium
      return { success: false, requiresPremium: true };
    }

    updateSettings({ ghost_mode: !settings.ghost_mode });
    return { success: true, requiresPremium: false };
  };

  return {
    isGhostModeEnabled,
    canUseGhostMode,
    toggleGhostMode,
  };
}
