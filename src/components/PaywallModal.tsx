// Paywall modal - shown when accessing premium features without subscription

'use client';

import { XIcon, LockIcon, CrownIcon } from './icons';

interface PaywallModalProps {
  featureName: string;
  featureDescription?: string;
  onClose: () => void;
  onSubscribe: () => void;
}

const FEATURE_BENEFITS: Record<string, { title: string; description: string; benefits: string[] }> = {
  ghost_mode: {
    title: 'Ghost Mode',
    description: 'Browse anonymously without being seen',
    benefits: [
      'Hide from grid and nearby lists',
      'Browse profiles without leaving a trace',
      'View others without appearing online',
      'Toggle on/off anytime',
    ],
  },
  who_viewed_me: {
    title: 'Who Viewed Me',
    description: 'See exactly who\'s checking out your profile',
    benefits: [
      'View full list of profile visitors',
      'See when they viewed you',
      'Connect with interested users',
      'Never miss a potential match',
    ],
  },
  unlimited_messages: {
    title: 'Unlimited Messages',
    description: 'Chat without limits',
    benefits: [
      'Send unlimited messages',
      'No daily message cap',
      'Chat with multiple users',
      'Never run out of conversations',
    ],
  },
  read_receipts: {
    title: 'Read Receipts',
    description: 'Know when your messages are read',
    benefits: [
      'See when messages are delivered',
      'Know when they\'re read',
      'Better conversation timing',
      'Reduce uncertainty',
    ],
  },
  visibility_controls: {
    title: 'Privacy Controls',
    description: 'Control where you appear',
    benefits: [
      'Hide from grid view',
      'Hide from map view',
      'Browse completely privately',
      'Toggle visibility anytime',
    ],
  },
  default: {
    title: 'Premium Feature',
    description: 'Unlock premium features',
    benefits: [
      'Ghost mode browsing',
      'See who viewed you',
      'Unlimited messages',
      'Read receipts',
    ],
  },
};

export default function PaywallModal({
  featureName,
  featureDescription,
  onClose,
  onSubscribe,
}: PaywallModalProps) {
  const feature = FEATURE_BENEFITS[featureName] || FEATURE_BENEFITS.default;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-hole-surface border border-hole-border rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-hole-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <LockIcon className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold">Premium Feature</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-border rounded-lg transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CrownIcon className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-hole-muted mb-6">{featureDescription || feature.description}</p>

          {/* Benefits */}
          <div className="bg-hole-bg border border-hole-border rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-hole-muted mb-3 text-left">
              What you get with Premium:
            </h4>
            <ul className="space-y-2 text-left">
              {feature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-sm text-hole-muted">/month</span>
            </div>
            <p className="text-xs text-hole-muted">Cancel anytime</p>
          </div>

          {/* CTA */}
          <button
            onClick={onSubscribe}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium transition-transform hover:scale-105"
          >
            Upgrade to Premium
          </button>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-sm text-hole-muted hover:text-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
