// Subscription plans modal - shows pricing and features

'use client';

import { XIcon, CheckIcon, CrownIcon } from './icons';
import { useSubscription } from '@/hooks/useSubscription';
import type { SubscriptionTier } from '@/contexts/SubscriptionContext';

interface SubscriptionModalProps {
  onClose: () => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  priceDetail: string;
  features: PlanFeature[];
  popular?: boolean;
  priceId?: string; // Stripe price ID
}

const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    priceDetail: 'Forever',
    features: [
      { text: 'Basic profile', included: true },
      { text: 'Limited messages (10/day)', included: true },
      { text: 'See nearby users', included: true },
      { text: 'Ghost mode', included: false },
      { text: 'See who viewed you', included: false },
      { text: 'Read receipts', included: false },
    ],
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: '$9.99',
    priceDetail: 'per month',
    popular: true,
    priceId: 'price_premium_monthly', // Mock Stripe price ID
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited messages', included: true },
      { text: 'Ghost mode', included: true },
      { text: 'See who viewed you', included: true },
      { text: 'Read receipts', included: true },
      { text: 'Priority placement', included: false },
    ],
  },
  {
    tier: 'premium_plus',
    name: 'Premium+',
    price: '$19.99',
    priceDetail: 'per month',
    priceId: 'price_premium_plus_monthly', // Mock Stripe price ID
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Priority placement in grid', included: true },
      { text: 'Advanced filters', included: true },
      { text: 'Featured profile badge', included: true },
      { text: 'Unlimited photo uploads', included: true },
      { text: '24/7 priority support', included: true },
    ],
  },
];

export default function SubscriptionModal({ onClose }: SubscriptionModalProps) {
  const { subscription, subscribe, cancelSubscription } = useSubscription();

  const handleSubscribe = async (tier: SubscriptionTier, priceId?: string) => {
    if (tier === 'free') {
      // Cancel subscription
      await cancelSubscription();
      onClose();
    } else {
      // In production, this would redirect to Stripe Checkout
      // For now, just subscribe directly
      await subscribe(tier);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-hole-surface border border-hole-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-hole-surface border-b border-hole-border p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">Upgrade Your Experience</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-border rounded-lg transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative bg-hole-bg border rounded-xl p-6 ${
                  plan.popular
                    ? 'border-purple-500'
                    : subscription.tier === plan.tier
                    ? 'border-hole-accent'
                    : 'border-hole-border'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Current plan badge */}
                {subscription.tier === plan.tier && subscription.isActive && (
                  <div className="absolute -top-3 right-4 bg-hole-accent text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current Plan
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  {plan.tier !== 'free' && (
                    <CrownIcon className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  )}
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-hole-muted">{plan.priceDetail}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckIcon
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          feature.included ? 'text-green-500' : 'text-hole-border'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-gray-300' : 'text-hole-muted line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => handleSubscribe(plan.tier, plan.priceId)}
                  disabled={subscription.tier === plan.tier && subscription.isActive}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    subscription.tier === plan.tier && subscription.isActive
                      ? 'bg-hole-border text-hole-muted cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105'
                      : plan.tier === 'free'
                      ? 'bg-hole-border text-white hover:bg-hole-muted'
                      : 'bg-hole-accent text-white hover:bg-hole-accent-hover'
                  }`}
                >
                  {subscription.tier === plan.tier && subscription.isActive
                    ? 'Current Plan'
                    : plan.tier === 'free'
                    ? 'Downgrade'
                    : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>

          {/* Additional info */}
          <div className="mt-6 text-center text-sm text-hole-muted">
            <p>All subscriptions auto-renew monthly. Cancel anytime.</p>
            <p className="mt-1">Payments processed securely through Stripe.</p>
          </div>

          {/* Cancel subscription */}
          {subscription.tier !== 'free' && subscription.isActive && (
            <div className="mt-6 pt-6 border-t border-hole-border text-center">
              <button
                onClick={() => handleSubscribe('free')}
                className="text-sm text-hole-accent hover:underline"
              >
                Cancel subscription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
