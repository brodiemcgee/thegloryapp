// Full screen loading component for initial app load

import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
  text?: string;
}

export default function LoadingScreen({ text = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-hole-bg flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* App Logo/Name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            thehole.app
          </h1>
          <p className="text-hole-muted text-sm mt-2">
            Real-time cruising
          </p>
        </div>

        {/* Loading Spinner */}
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}
