// Bottom navigation bar - 5 tabs: Map, Grid, Messages, Health, Me

'use client';

import { MapIcon, GridIcon, MessageIcon, HealthIcon, UserIcon } from './icons';

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
  return (
    <nav className="bg-hole-surface border-t border-hole-border safe-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
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
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
