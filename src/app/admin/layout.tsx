'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/Header';
import { KeyboardShortcutsHelp } from '@/components/admin/KeyboardShortcutsHelp';
import { useAdminAuth, AdminAuthProvider } from '@/hooks/admin/useAdminAuth';
import { useGlobalNavShortcuts } from '@/hooks/admin/useKeyboardShortcuts';
import LoadingScreen from '@/components/LoadingScreen';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, adminRole, user } = useAdminAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDebug, setShowDebug] = useState(true);

  // Enable global keyboard shortcuts for navigation
  useGlobalNavShortcuts();

  // Debug: Show auth state for 5 seconds before redirecting
  useEffect(() => {
    if (!isLoading && !isAdmin && showDebug) {
      console.log('[AdminLayout] Not admin, will redirect in 5s. User:', user?.id, 'isAdmin:', isAdmin);
      const timer = setTimeout(() => {
        setShowDebug(false);
        router.push('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoading, router, user, showDebug]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    // Show debug info before redirecting
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Denied</h1>
          <div className="bg-gray-800 rounded-lg p-4 text-left text-sm mb-4">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>isAdmin:</strong> {String(isAdmin)}</p>
            <p><strong>adminRole:</strong> {adminRole || 'null'}</p>
          </div>
          <p className="text-gray-400 mb-4">
            {user ? 'You are logged in but not an admin.' : 'You are not logged in.'}
          </p>
          <p className="text-gray-500 text-sm">Redirecting to home in 5 seconds...</p>
          <p className="text-gray-600 text-xs mt-2">Check browser console for [AdminAuth] logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={adminRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
      <KeyboardShortcutsHelp />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
