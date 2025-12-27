// Bottom navigation bar - 5 tabs: Map, Grid, Messages, Health, Me

'use client';

import { MapIcon, GridIcon, MessageIcon, HealthIcon, UserIcon } from './icons';
import { useContactTracingContext } from '@/contexts/ContactTracingContext';

type Tab = 'map' | 'grid' | 'messages' | 'health' | 'me';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'grid', label: 'Grid', Icon: GridIcon },
  { id: 'messages', label: 'Messages', Icon: MessageIcon },
  { id: 'health', label: 'Health', Icon: HealthIcon },
  { id: 'me', label: 'Me', Icon: UserIcon },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { unreadCount } = useContactTracingContext();

  return (
    <nav className="bg-hole-surface border-t border-hole-border safe-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const showHealthBadge = id === 'health' && unreadCount > 0;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`
                flex flex-col items-center justify-center
                w-full h-full touch-target
                transition-colors duration-200
                ${isActive ? 'text-hole-accent' : 'text-hole-muted'}
              `}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="w-6 h-6 mb-1" />
                {showHealthBadge && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
