// Navigation context for cross-component navigation

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';

type Tab = 'map' | 'grid' | 'messages' | 'health' | 'me';

interface NavigationContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  targetMessageUser: User | null;
  navigateToMessages: (user: User) => void;
  clearTargetMessageUser: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  initialTab?: Tab;
}

export function NavigationProvider({ children, initialTab = 'map' }: NavigationProviderProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [targetMessageUser, setTargetMessageUser] = useState<User | null>(null);

  const navigateToMessages = useCallback((user: User) => {
    setTargetMessageUser(user);
    setActiveTab('messages');
  }, []);

  const clearTargetMessageUser = useCallback(() => {
    setTargetMessageUser(null);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        targetMessageUser,
        navigateToMessages,
        clearTargetMessageUser,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
