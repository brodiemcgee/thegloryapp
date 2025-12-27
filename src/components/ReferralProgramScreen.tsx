// Referral Program Screen - Shows referral link, credits, and referral history

'use client';

import { useState } from 'react';
import { ChevronLeftIcon, GiftIcon, CopyIcon, ShareIcon, CheckIcon } from './icons';
import { useReferral } from '@/hooks/useReferral';

interface ReferralProgramScreenProps {
  onClose: () => void;
}

export default function ReferralProgramScreen({ onClose }: ReferralProgramScreenProps) {
  const {
    referralCode,
    referralLink,
    creditBalance,
    creditBalanceFormatted,
    referrals,
    activeReferralsCount,
    totalEarnedFormatted,
    transactions,
    loading,
    copyReferralLink,
    shareReferralLink,
  } = useReferral();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await shareReferralLink();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-hole-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-hole-bg border-b border-hole-border z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 -m-2 text-hole-muted hover:text-white"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Referral Program</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Credit Balance Card */}
        <div className="bg-gradient-to-r from-hole-accent/20 to-hole-accent/10 rounded-xl p-6 border border-hole-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-hole-muted text-sm">Your Credit Balance</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : creditBalanceFormatted}
              </p>
              <p className="text-xs text-hole-muted mt-1">
                Applied automatically to your next payment
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-hole-accent/20 flex items-center justify-center">
              <GiftIcon className="w-8 h-8 text-hole-accent" />
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-hole-surface rounded-xl p-4 border border-hole-border">
          <h2 className="text-white font-medium mb-3">Your Referral Link</h2>

          <div className="bg-hole-bg rounded-lg p-3 mb-3">
            <p className="text-sm text-hole-muted break-all font-mono">
              {loading ? 'Loading...' : referralLink || 'No referral code available'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={!referralLink || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-hole-bg hover:bg-hole-border disabled:opacity-50 text-white py-3 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-5 h-5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              disabled={!referralLink || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-hole-accent hover:bg-hole-accent-hover disabled:opacity-50 text-white py-3 rounded-lg transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-hole-surface rounded-xl p-4 border border-hole-border">
          <h2 className="text-white font-medium mb-4">How It Works</h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-hole-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-hole-accent font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Share your link</p>
                <p className="text-sm text-hole-muted">Send your unique link to friends</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-hole-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-hole-accent font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-white font-medium">They sign up and subscribe</p>
                <p className="text-sm text-hole-muted">When they become a paid member</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-hole-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-hole-accent font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-white font-medium">Earn 10% monthly</p>
                <p className="text-sm text-hole-muted">Get 10% of their subscription every month as credit</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-hole-bg rounded-lg">
            <p className="text-xs text-hole-muted">
              Credits never expire and are automatically applied before your card is charged.
              Refer 10 Premium subscribers to get a free month!
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-hole-surface rounded-xl p-4 border border-hole-border text-center">
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : referrals.length}
            </p>
            <p className="text-sm text-hole-muted">Total Referrals</p>
          </div>
          <div className="bg-hole-surface rounded-xl p-4 border border-hole-border text-center">
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : activeReferralsCount}
            </p>
            <p className="text-sm text-hole-muted">Active Subscribers</p>
          </div>
        </div>

        {/* Your Referrals */}
        {referrals.length > 0 && (
          <div className="bg-hole-surface rounded-xl p-4 border border-hole-border">
            <h2 className="text-white font-medium mb-4">Your Referrals</h2>

            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-2 border-b border-hole-border last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">@{referral.referred_username}</p>
                    <p className="text-xs text-hole-muted">
                      Joined {formatDate(referral.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    {referral.subscription_status === 'active' && referral.subscription_tier !== 'free' ? (
                      <>
                        <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                          Active
                        </span>
                        {referral.total_earned_cents > 0 && (
                          <p className="text-xs text-hole-muted mt-1">
                            ${(referral.total_earned_cents / 100).toFixed(2)} earned
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-hole-border text-hole-muted text-xs rounded">
                        Free
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="bg-hole-surface rounded-xl p-4 border border-hole-border">
            <h2 className="text-white font-medium mb-4">Credit History</h2>

            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-hole-border last:border-0"
                >
                  <div>
                    <p className="text-white text-sm">
                      {tx.transaction_type === 'referral_earning' && 'Referral Credit'}
                      {tx.transaction_type === 'subscription_payment' && 'Subscription Payment'}
                      {tx.transaction_type === 'manual_adjustment' && 'Adjustment'}
                    </p>
                    {tx.description && (
                      <p className="text-xs text-hole-muted">{tx.description}</p>
                    )}
                    <p className="text-xs text-hole-muted">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className={`font-medium ${tx.amount_cents >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount_cents >= 0 ? '+' : ''}${(tx.amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {transactions.length > 10 && (
              <p className="text-center text-sm text-hole-muted mt-4">
                Showing latest 10 transactions
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && referrals.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-hole-surface flex items-center justify-center mx-auto mb-4">
              <GiftIcon className="w-8 h-8 text-hole-muted" />
            </div>
            <h3 className="text-white font-medium mb-2">No referrals yet</h3>
            <p className="text-hole-muted text-sm max-w-xs mx-auto">
              Share your link with friends to start earning credits!
            </p>
          </div>
        )}

        {/* Total Earned */}
        {!loading && creditBalance > 0 && (
          <div className="text-center py-4">
            <p className="text-hole-muted text-sm">
              Total earned from referrals: <span className="text-white font-medium">{totalEarnedFormatted}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
