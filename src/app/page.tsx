// Main app entry - renders the app shell with navigation

'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MapView from '@/components/MapView';
import GridView from '@/components/GridView';
import MessagesView from '@/components/MessagesView';
import HealthView from '@/components/HealthView';
import ProfileView from '@/components/ProfileView';
import InAppNotification from '@/components/InAppNotification';
import { BetaFeedbackButton, BetaStatusBanner } from '@/components/beta';
import { ContactTracingProvider } from '@/contexts/ContactTracingContext';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';

function AppContent() {
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab } = useNavigation();

  // Handle URL tab parameter (e.g., from push notification clicks)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['map', 'grid', 'messages', 'health', 'me'].includes(tabParam)) {
      setActiveTab(tabParam as 'map' | 'grid' | 'messages' | 'health' | 'me');
      // Clean up URL without reloading
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams, setActiveTab]);

  // Handle in-app notification navigation
  const handleNotificationNavigate = useCallback((url: string) => {
    const urlObj = new URL(url, window.location.origin);
    const tabParam = urlObj.searchParams.get('tab');
    if (tabParam && ['map', 'grid', 'messages', 'health', 'me'].includes(tabParam)) {
      setActiveTab(tabParam as 'map' | 'grid' | 'messages' | 'health' | 'me');
    }
  }, [setActiveTab]);

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
    <main className="h-screen-safe w-screen flex flex-col bg-hole-bg overflow-hidden">
      {/* In-app notifications */}
      <InAppNotification onNavigate={handleNotificationNavigate} />

      {/* Beta tester status banner */}
      <BetaStatusBanner />

      {/* Beta feedback floating button */}
      <BetaFeedbackButton />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}

export default function Home() {
  return (
    <NavigationProvider>
      <ConversationsProvider>
        <ContactTracingProvider>
          <AppContent />
        </ContactTracingProvider>
      </ConversationsProvider>
    </NavigationProvider>
  );
}
