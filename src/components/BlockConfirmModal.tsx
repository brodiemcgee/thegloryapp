// Block confirmation modal - warns user before blocking

'use client';

import { XIcon } from './icons';

interface BlockConfirmModalProps {
  username: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function BlockConfirmModal({ username, onConfirm, onClose }: BlockConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-hole-surface border border-hole-border rounded-lg max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border">
          <h2 className="text-lg font-semibold">Block {username}?</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-border rounded-lg transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-gray-300">
            When you block {username}:
          </p>
          <ul className="space-y-2 text-sm text-hole-muted">
            <li className="flex items-start gap-2">
              <span className="text-hole-accent mt-0.5">•</span>
              <span>They won't be able to message you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-hole-accent mt-0.5">•</span>
              <span>You won't see their profile or messages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-hole-accent mt-0.5">•</span>
              <span>They won't be notified that you blocked them</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-hole-accent mt-0.5">•</span>
              <span>You can unblock them anytime from settings</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-hole-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted/20"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent-hover"
          >
            Block User
          </button>
        </div>
      </div>
    </div>
  );
}
