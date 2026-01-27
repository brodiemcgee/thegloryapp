// Visibility controls hook - control where you appear in the app

'use client';

import { useSettings } from './useSettings';
import { useSubscription } from './useSubscription';

export function useVisibilityControls() {
  const { settings, updateSettings } = useSettings();
  const { canAccess } = useSubscription();

  const canUseVisibilityControls = canAccess('visibility_controls');
  const showInGrid = settings.show_in_grid;
  const showOnMap = settings.show_on_map;
  const isFullyHidden = !showInGrid && !showOnMap;

  const toggleShowInGrid = () => {
    // Can always turn visibility ON, but need premium to turn it OFF
    if (!canUseVisibilityControls && showInGrid) {
      return { success: false, requiresPremium: true };
    }

    updateSettings({ show_in_grid: !showInGrid });
    return { success: true, requiresPremium: false };
  };

  const toggleShowOnMap = () => {
    // Can always turn visibility ON, but need premium to turn it OFF
    if (!canUseVisibilityControls && showOnMap) {
      return { success: false, requiresPremium: true };
    }

    updateSettings({ show_on_map: !showOnMap });
    return { success: true, requiresPremium: false };
  };

  return {
    showInGrid,
    showOnMap,
    canUseVisibilityControls,
    isFullyHidden,
    toggleShowInGrid,
    toggleShowOnMap,
  };
}
