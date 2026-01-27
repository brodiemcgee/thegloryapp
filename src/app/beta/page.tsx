'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  Clock,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BetaStatus {
  is_open: boolean;
  max_testers: number;
  current_count: number;
  spots_available: number;
  is_full: boolean;
}

export default function BetaSplashPage() {
  const router = useRouter();
  const [status, setStatus] = useState<BetaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .rpc('get_beta_status');

        if (fetchError) throw fetchError;

        setStatus(data as BetaStatus);
      } catch (err) {
        console.error('Error fetching beta status:', err);
        setError('Unable to load beta program status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleJoinBeta = () => {
    // Redirect to home with beta flag
    router.push('/?beta=join');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hole-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-hole-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-hole-muted mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-hole-surface border border-hole-border rounded-lg text-white hover:bg-hole-border transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isFull = status?.is_full || !status?.is_open;

  return (
    <div className="min-h-screen bg-hole-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent" />

        <div className="relative max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-8">
            <FlaskConical className="w-4 h-4" />
            Beta Testing Program
          </div>

          {/* Logo */}
          <h1 className="text-5xl font-bold text-white mb-4">
            GLORY
          </h1>

          <p className="text-xl text-hole-muted mb-8">
            {isFull
              ? 'Thank you for your interest in our beta program'
              : 'Join our exclusive beta testing program'}
          </p>

          {/* Capacity Status */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-hole-surface border border-hole-border rounded-lg mb-8">
            <Users className="w-5 h-5 text-purple-400" />
            {isFull ? (
              <span className="text-red-400 font-medium">
                All spots are currently filled
              </span>
            ) : (
              <span className="text-green-400 font-medium">
                {status?.spots_available} spots left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {isFull ? (
          /* Full / Closed State */
          <div className="text-center">
            <div className="bg-hole-surface border border-hole-border rounded-xl p-8 mb-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">
                All Spots Are Currently Filled
              </h2>
              <p className="text-hole-muted mb-6">
                We've reached our current beta tester capacity. More spots will open up soon as we expand the program.
              </p>
              <p className="text-sm text-purple-400">
                Check back later for availability
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-hole-surface border border-hole-border rounded-lg text-white hover:bg-hole-border transition-colors"
            >
              Go to Home
            </button>
          </div>
        ) : (
          /* Open State - Show Requirements */
          <>
            {/* Simple Requirements */}
            <div className="text-center mb-6">
              <p className="text-hole-muted text-sm mb-3">How it works:</p>
              <div className="flex items-center justify-center gap-6 text-white">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Use the app
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Report bugs
                </span>
              </div>
              <p className="text-hole-muted text-sm mt-3">That's it.</p>
            </div>

            {/* Reward Section */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-purple-300">Your Reward</p>
                  <h2 className="text-xl font-bold text-white">Lifetime Free Premium</h2>
                </div>
              </div>

              <p className="text-hole-muted text-sm mb-4">
                Complete the beta program and get unlimited access to all premium features forever. No credit card required. No strings attached.
              </p>

              <ul className="grid grid-cols-2 gap-2 text-sm">
                {[
                  'Ghost Mode',
                  'See Who Viewed You',
                  'Unlimited Messages',
                  'Extended Reach',
                  'Read Receipts',
                  'Advanced Filters',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-hole-muted">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleJoinBeta}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors text-lg"
            >
              Join the Beta
            </button>

            <p className="text-center text-sm text-hole-muted mt-4">
              By joining, you agree to actively participate in the beta program
            </p>
          </>
        )}
      </div>
    </div>
  );
}
