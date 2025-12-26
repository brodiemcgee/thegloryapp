'use client';

import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'U'], description: 'Go to Users' },
      { keys: ['G', 'P'], description: 'Go to Photos' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
      { keys: ['G', 'L'], description: 'Go to Locations' },
      { keys: ['G', 'M'], description: 'Go to Messages' },
      { keys: ['G', 'A'], description: 'Go to Analytics' },
      { keys: ['G', 'T'], description: 'Go to Team' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
      { keys: ['G', 'E'], description: 'Go to Appeals' },
    ],
  },
  {
    title: 'Review Actions',
    shortcuts: [
      { keys: ['A'], description: 'Approve item' },
      { keys: ['R'], description: 'Reject item' },
      { keys: ['\u2190'], description: 'Previous item' },
      { keys: ['\u2192'], description: 'Next item' },
      { keys: ['B'], description: 'Toggle batch mode' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Esc'], description: 'Close modal' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);
    window.addEventListener('show-shortcuts-help', handleShowHelp);
    return () => window.removeEventListener('show-shortcuts-help', handleShowHelp);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx}>
                            <kbd className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-gray-400">then</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}
