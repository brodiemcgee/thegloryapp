'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

// Breadcrumb generation from pathname
function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    breadcrumbs.push({ label, path });
  }

  return breadcrumbs;
}

export function AdminHeader({ sidebarCollapsed, onToggleSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname || '/admin');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Mock notifications
  const notifications = [
    { id: 1, type: 'critical', message: 'High priority report needs attention', time: '2m ago' },
    { id: 2, type: 'warning', message: '5+ reports on user @suspicious123', time: '15m ago' },
    { id: 3, type: 'info', message: 'New location submitted for review', time: '1h ago' },
  ];

  const unreadCount = notifications.length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
              <span
                className={cn(
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                )}
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Search, Notifications */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search users, reports..."
                className="w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="ml-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 mt-2 rounded-full flex-shrink-0',
                            notification.type === 'critical' && 'bg-red-500',
                            notification.type === 'warning' && 'bg-yellow-500',
                            notification.type === 'info' && 'bg-blue-500'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
