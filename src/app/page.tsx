// Main app entry - renders the app shell with navigation

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MapView from '@/components/MapView';
import GridView from '@/components/GridView';
import MessagesView from '@/components/MessagesView';
import HealthView from '@/components/HealthView';
import ProfileView from '@/components/ProfileView';
import { ContactTracingProvider } from '@/contexts/ContactTracingContext';

type Tab = 'map' | 'grid' | 'messages' | 'health' | 'me';

export default function Home() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('map');

  // Handle URL tab parameter (e.g., from push notification clicks)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['map', 'grid', 'messages', 'health', 'me'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
      // Clean up URL without reloading
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return <MapView />;
      case 'grid':
        return <GridView />;
      case 'messages':
        return <MessagesView />;
      case 'health':
        return <HealthView />;
      case 'me':
        return <ProfileView />;
      default:
        return <MapView />;
    }
  };

  return (
    <ContactTracingProvider>
      <main className="h-screen w-screen flex flex-col bg-hole-bg overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Bottom navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </ContactTracingProvider>
  );
}
