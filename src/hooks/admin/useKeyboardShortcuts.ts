'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
  onApprove?: () => void;
  onReject?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onBatchMode?: () => void;
  onCloseModal?: () => void;
  onFocusSearch?: () => void;
}

export function useKeyboardShortcuts(config: ShortcutConfig = {}) {
  const router = useRouter();
  const gPressedRef = useRef(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (event.key === 'Escape' && config.onCloseModal) {
          config.onCloseModal();
          return;
        }
        return;
      }

      // Handle G + key combinations for navigation
      if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey) {
        gPressedRef.current = true;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
        gTimeoutRef.current = setTimeout(() => {
          gPressedRef.current = false;
        }, 500);
        return;
      }

      // G + navigation shortcuts
      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);

        switch (event.key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            router.push('/admin');
            break;
          case 'u':
            event.preventDefault();
            router.push('/admin/users');
            break;
          case 'p':
            event.preventDefault();
            router.push('/admin/photos');
            break;
          case 'r':
            event.preventDefault();
            router.push('/admin/reports');
            break;
          case 'l':
            event.preventDefault();
            router.push('/admin/locations');
            break;
          case 'm':
            event.preventDefault();
            router.push('/admin/messages');
            break;
          case 'a':
            event.preventDefault();
            router.push('/admin/analytics');
            break;
          case 't':
            event.preventDefault();
            router.push('/admin/team');
            break;
          case 's':
            event.preventDefault();
            router.push('/admin/settings');
            break;
          case 'e':
            event.preventDefault();
            router.push('/admin/appeals');
            break;
        }
        return;
      }

      // Single key shortcuts
      switch (event.key) {
        case '/':
          if (config.onFocusSearch) {
            event.preventDefault();
            config.onFocusSearch();
          }
          break;
        case 'Escape':
          if (config.onCloseModal) {
            event.preventDefault();
            config.onCloseModal();
          }
          break;
        case 'a':
        case 'A':
          if (config.onApprove && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            config.onApprove();
          }
          break;
        case 'r':
        case 'R':
          if (config.onReject && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            config.onReject();
          }
          break;
        case 'ArrowLeft':
          if (config.onPrevious) {
            event.preventDefault();
            config.onPrevious();
          }
          break;
        case 'ArrowRight':
          if (config.onNext) {
            event.preventDefault();
            config.onNext();
          }
          break;
        case 'b':
        case 'B':
          if (config.onBatchMode && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            config.onBatchMode();
          }
          break;
        case '?':
          if (event.shiftKey) {
            event.preventDefault();
            // Show keyboard shortcuts help modal
            window.dispatchEvent(new CustomEvent('show-shortcuts-help'));
          }
          break;
      }
    },
    [router, config]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
    };
  }, [handleKeyDown]);
}

// Hook for navigation-only shortcuts (used in layout)
export function useGlobalNavShortcuts() {
  useKeyboardShortcuts({});
}
