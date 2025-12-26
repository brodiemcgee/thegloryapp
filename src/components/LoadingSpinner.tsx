// Reusable loading spinner component

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-hole-border
          border-t-hole-accent
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <p className="text-sm text-hole-muted animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
