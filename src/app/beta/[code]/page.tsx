'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FlaskConical,
  Clock,
  MessageSquare,
  Bug,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface InvitationData {
  id: string;
  code: string;
  email: string;
  status: string;
  expires_at: string;
}

export default function BetaSplashPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateCode = async () => {
      if (!code) {
        setError('Invalid invite code');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('beta_invitations')
          .select('id, code, email, status, expires_at')
          .eq('code', code)
          .single();

        if (fetchError || !data) {
          setError('This invite code is not valid');
          setIsLoading(false);
          return;
        }

        if (data.status !== 'pending') {
          if (data.status === 'accepted') {
            setError('This invitation has already been used');
          } else if (data.status === 'expired') {
            setError('This invitation has expired');
          } else if (data.status === 'revoked') {
            setError('This invitation has been revoked');
          }
          setIsLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired');
          setIsLoading(false);
          return;
        }

        setInvitation(data);
      } catch {
        setError('Failed to validate invite code');
      } finally {
        setIsLoading(false);
      }
    };

    validateCode();
  }, [code]);

  const handleJoinBeta = () => {
    // Redirect to home with beta code parameter
    router.push(`/?beta=${code}`);
  };

  const expiresIn = invitation
    ? Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

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
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-hole-muted mb-8">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-hole-surface border border-hole-border rounded-lg text-white hover:bg-hole-border transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

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
            Beta Tester Invitation
          </div>

          {/* Logo */}
          <h1 className="text-5xl font-bold text-white mb-4">
            GLORY
          </h1>

          <p className="text-xl text-hole-muted mb-8">
            You've been invited to join the exclusive beta testing program
          </p>

          {/* Invite Code Display */}
          <div className="inline-block px-6 py-3 bg-hole-surface border border-hole-border rounded-lg mb-8">
            <p className="text-sm text-hole-muted mb-1">Your Invite Code</p>
            <p className="text-2xl font-mono font-bold text-white tracking-widest">{code}</p>
          </div>

          {/* Expiry Notice */}
          {expiresIn > 0 && (
            <p className="text-sm text-yellow-500 mb-8">
              <Clock className="w-4 h-4 inline mr-1" />
              Expires in {expiresIn} day{expiresIn !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Requirements Section */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-hole-surface border border-hole-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Program Requirements
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">1 Hour Per Week</h3>
                <p className="text-sm text-hole-muted">
                  Engage with the app for at least 1 hour each week. Browse profiles, send messages, and explore features.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">10</span>
              </div>
              <div>
                <h3 className="font-medium text-white">10 Weeks Duration</h3>
                <p className="text-sm text-hole-muted">
                  Complete 10 consecutive weeks of active participation. We'll track your progress automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bug className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Report Bugs & Feedback</h3>
                <p className="text-sm text-hole-muted">
                  Help us improve by reporting any bugs you find and sharing your feedback on the experience.
                </p>
              </div>
            </div>
          </div>
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
      </div>
    </div>
  );
}
