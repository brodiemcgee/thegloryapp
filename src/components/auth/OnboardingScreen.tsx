// New user onboarding - username, intent, photo

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Intent = 'looking' | 'hosting' | 'traveling' | 'discrete';

const INTENTS: { value: Intent; label: string; emoji: string }[] = [
  { value: 'looking', label: 'Looking', emoji: '👀' },
  { value: 'hosting', label: 'Hosting', emoji: '🏠' },
  { value: 'traveling', label: 'Traveling', emoji: '✈️' },
  { value: 'discrete', label: 'Discrete', emoji: '🔒' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [username, setUsername] = useState('');
  const [selectedIntents, setSelectedIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const toggleIntent = (intent: Intent) => {
    setSelectedIntents((prev) =>
      prev.includes(intent)
        ? prev.filter((i) => i !== intent)
        : [...prev, intent]
    );
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (selectedIntents.length === 0) {
      setError('Please select at least one intent');
      return;
    }

    if (!user) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if username is available
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        setError('Username already taken');
        setLoading(false);
        return;
      }

      // Create or update profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.toLowerCase(),
          display_name: username,
          intents: selectedIntents,
          onboarded: true,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        setError(upsertError.message);
      } else {
        onComplete();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hole-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Welcome</h1>
          <p className="text-hole-muted">Set up your profile</p>
        </div>

        <div className="bg-hole-surface rounded-lg p-6 space-y-6 border border-hole-border">
          {/* Username input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setUsername(value);
                setError('');
              }}
              placeholder="username"
              maxLength={20}
              className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent"
            />
            <p className="text-xs text-hole-muted">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          {/* Intent selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              What are you looking for?
            </label>
            <p className="text-xs text-hole-muted mb-3">
              Select all that apply
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INTENTS.map((intent) => (
                <button
                  key={intent.value}
                  onClick={() => toggleIntent(intent.value)}
                  className={`p-4 rounded-lg border-2 transition-all touch-target ${
                    selectedIntents.includes(intent.value)
                      ? 'border-hole-accent bg-hole-accent/10'
                      : 'border-hole-border bg-hole-bg hover:border-hole-muted'
                  }`}
                >
                  <div className="text-2xl mb-1">{intent.emoji}</div>
                  <div className="text-sm font-medium text-white">
                    {intent.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload placeholder */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Profile Photo
            </label>
            <div className="border-2 border-dashed border-hole-border rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm text-hole-muted">
                Photo upload coming soon
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !username || selectedIntents.length === 0}
            className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
          >
            {loading ? 'Creating Profile...' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
