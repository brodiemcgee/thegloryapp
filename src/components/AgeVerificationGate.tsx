// Age Verification Gate
// Blocks access to adult content until user completes age verification
// Required for legal compliance with adult content laws

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AgeVerificationGateProps {
  children: React.ReactNode;
  requireVerification?: boolean; // Default true for adult content
}

type VerificationStatus = 'loading' | 'verified' | 'unverified' | 'pending' | 'rejected';

export default function AgeVerificationGate({
  children,
  requireVerification = true
}: AgeVerificationGateProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setStatus('loading');
      return;
    }

    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    try {
      // Check if user is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified, verified_at')
        .eq('id', user.id)
        .single();

      if (profile?.is_verified) {
        setStatus('verified');
        return;
      }

      // Check for pending verification
      const { data: verificationRequest } = await supabase
        .from('age_verification_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (verificationRequest?.status === 'pending') {
        setStatus('pending');
      } else if (verificationRequest?.status === 'rejected') {
        setStatus('rejected');
      } else {
        setStatus('unverified');
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
      setStatus('unverified');
    }
  };

  const startVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'create-verification-session'
      );

      if (fnError) {
        setError(fnError.message);
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data?.status === 'approved') {
        setStatus('verified');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Identity verification
      if (data?.client_secret) {
        // Load Stripe.js and launch verification modal
        const stripe = (window as unknown as { Stripe?: (key: string) => { verifyIdentity: (secret: string) => Promise<{ error?: { message: string } }> } }).Stripe?.(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
        );

        if (stripe) {
          const result = await stripe.verifyIdentity(data.client_secret);

          if (result.error) {
            setError(result.error.message);
          } else {
            // Verification started - check status
            setStatus('pending');
          }
        } else {
          setError('Unable to load verification system');
        }
      }
    } catch (err) {
      setError('Failed to start verification');
    } finally {
      setLoading(false);
    }
  };

  // If verification is not required, show content
  if (!requireVerification) {
    return <>{children}</>;
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-hole-bg flex items-center justify-center">
        <div className="text-hole-muted">Checking verification status...</div>
      </div>
    );
  }

  // Verified - show content
  if (status === 'verified') {
    return <>{children}</>;
  }

  // Unverified or pending - show gate
  return (
    <div className="min-h-screen bg-hole-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🔞</div>
          <h1 className="text-2xl font-bold text-white">Age Verification Required</h1>
          <p className="text-hole-muted">
            This app contains adult content. You must verify your age before continuing.
          </p>
        </div>

        <div className="bg-hole-surface rounded-lg p-6 border border-hole-border space-y-4">
          {status === 'pending' ? (
            <>
              <div className="flex items-center gap-3 text-yellow-500">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="font-medium">Verification in progress</span>
              </div>
              <p className="text-sm text-hole-muted">
                Your verification is being processed. This usually takes a few minutes.
              </p>
              <button
                onClick={checkVerificationStatus}
                className="w-full bg-hole-bg hover:bg-hole-border text-white font-medium py-3 px-4 rounded-lg border border-hole-border transition-colors"
              >
                Check Status
              </button>
            </>
          ) : status === 'rejected' ? (
            <>
              <div className="flex items-center gap-3 text-red-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Verification failed</span>
              </div>
              <p className="text-sm text-hole-muted">
                We couldn&apos;t verify your age. Please try again with a valid government-issued ID.
              </p>
              <button
                onClick={startVerification}
                disabled={loading}
                className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Starting...' : 'Try Again'}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3 text-sm text-hole-muted">
                <p>To verify your age, you&apos;ll need:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>A valid government-issued ID (passport, driver&apos;s license)</li>
                  <li>A device with a camera for a selfie</li>
                </ul>
                <p className="text-xs">
                  Your ID is securely processed by Stripe Identity. We only receive confirmation
                  that you&apos;re 18+ - we don&apos;t store your ID or personal details.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <button
                onClick={startVerification}
                disabled={loading}
                className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Starting Verification...' : 'Verify My Age'}
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-hole-muted">
          By continuing, you confirm you are at least 18 years old and agree to our{' '}
          <a href="/terms" className="text-hole-accent hover:underline">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}
