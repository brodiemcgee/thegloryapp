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
  const { isAdmin, isLoading, adminRole } = useAdminAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Enable global keyboard shortcuts for navigation
  useGlobalNavShortcuts();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return null;
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
