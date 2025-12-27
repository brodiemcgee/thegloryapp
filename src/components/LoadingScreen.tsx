// Full screen loading component for initial app load

import LoadingSpinner from './LoadingSpinner';
import { GloryLogo } from './icons';

interface LoadingScreenProps {
  text?: string;
}

export default function LoadingScreen({ text = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-hole-bg flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* App Logo/Name */}
        <div className="text-center">
          <GloryLogo className="h-12 w-auto text-white" />
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
