// Reusable empty state component

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="w-16 h-16 bg-hole-surface rounded-full flex items-center justify-center mb-4 text-hole-muted">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-hole-muted text-sm max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-hole-accent hover:bg-hole-accent-hover text-white font-medium py-2.5 px-6 rounded-xl transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
