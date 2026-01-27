'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Image,
  MapPin,
  Flag,
  Scale,
  MessageSquare,
  BarChart3,
  UserCog,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { GloryIcon } from '@/components/icons';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Photos', href: '/admin/photos', icon: Image, badge: 0 },
  { label: 'Locations', href: '/admin/locations', icon: MapPin, badge: 0 },
  { label: 'Reports', href: '/admin/reports', icon: Flag, badge: 0 },
  { label: 'Appeals', href: '/admin/appeals', icon: Scale, badge: 0 },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare, badge: 0 },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Beta Testers', href: '/admin/beta-testers', icon: FlaskConical },
  { label: 'Team', href: '/admin/team', icon: UserCog, superAdminOnly: true },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', href: '/admin/audit', icon: FileText },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  role?: string | null;
}

export function AdminSidebar({ collapsed, onToggle, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut, adminProfile } = useAdminAuth();

  const isSuperAdmin = role === 'super_admin';

  const filteredNavItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  return (
    <aside
      className={cn(
        'bg-gray-900 text-gray-100 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <GloryIcon className="w-8 h-8 text-purple-500" />
            <span className="font-semibold text-lg">Admin</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.superAdminOnly && (
                        <Lock className="w-3 h-3 text-gray-500" />
                      )}
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-4">
        <div
          className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {adminProfile?.username?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {adminProfile?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={signOut}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
