// In-app notification toast for when push notifications arrive while app is open

'use client';

import { useState, useEffect, useCallback } from 'react';
import { XIcon } from './icons';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Notification {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
}

interface InAppNotificationProps {
  onNavigate?: (url: string) => void;
}

export default function InAppNotification({ onNavigate }: InAppNotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { playHeartbeat } = useNotificationSound();

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClick = useCallback((notification: Notification) => {
    dismissNotification(notification.id);
    if (notification.url && onNavigate) {
      onNavigate(notification.url);
    }
  }, [dismissNotification, onNavigate]);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const { title, body, url } = event.data.payload;

        const newNotification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          title: title || 'Notification',
          body: body || '',
          url,
          timestamp: Date.now(),
        };

        setNotifications(prev => [...prev, newNotification]);

        // Play sound
        playHeartbeat();

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          dismissNotification(newNotification.id);
        }, 10000);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [dismissNotification, playHeartbeat]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] p-4 space-y-2 pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-hole-surface border border-hole-border rounded-lg shadow-lg p-4 pointer-events-auto animate-slide-down cursor-pointer"
          onClick={() => handleClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-hole-accent/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-hole-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{notification.title}</p>
              <p className="text-sm text-hole-muted mt-0.5">{notification.body}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
              className="flex-shrink-0 p-1 hover:bg-hole-border rounded transition-colors"
            >
              <XIcon className="w-4 h-4 text-hole-muted" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
