// Contact trace alert component - displays anonymous health notifications

'use client';

import { ContactTraceNotification, STI_TYPES } from '@/contexts/ContactTracingContext';
import { XIcon } from './icons';

interface ContactTraceAlertProps {
  notification: ContactTraceNotification;
  onDismiss: (id: string) => void;
}

export default function ContactTraceAlert({
  notification,
  onDismiss,
}: ContactTraceAlertProps) {
  const stiInfo = STI_TYPES.find((s) => s.id === notification.sti_type);
  const stiLabel = stiInfo?.label || notification.sti_type;

  // Use vague time if available, otherwise fall back to approximate date
  const getTimeDescription = () => {
    if (notification.time_ago_text) {
      return notification.time_ago_text;
    }
    // Fallback for old notifications without time_ago_text
    const daysAgo = Math.floor(
      (Date.now() - new Date(notification.exposure_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo <= 7) return 'in the past week';
    if (daysAgo <= 14) return 'about 2 weeks ago';
    if (daysAgo <= 30) return 'about a month ago';
    return 'several weeks ago';
  };

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-400">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-red-400">Health Alert</h3>
          <p className="text-sm text-hole-muted mt-1">
            A recent partner has tested positive for{' '}
            <span className="font-medium text-white">{stiLabel}</span>.
          </p>
          <p className="text-sm text-hole-muted mt-1">
            Based on an encounter {getTimeDescription()}, you may have been exposed.
          </p>
          <p className="text-xs text-hole-muted mt-2">
            Consider getting tested. This notification is anonymous - no identifying
            information about the other person has been shared.
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-colors"
        >
          <XIcon className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// Component to display all unread contact trace notifications
interface ContactTraceAlertsProps {
  notifications: ContactTraceNotification[];
  onDismiss: (id: string) => void;
}

export function ContactTraceAlerts({
  notifications,
  onDismiss,
}: ContactTraceAlertsProps) {
  const unreadNotifications = notifications.filter((n) => n.read_at === null);

  if (unreadNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {unreadNotifications.map((notification) => (
        <ContactTraceAlert
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
