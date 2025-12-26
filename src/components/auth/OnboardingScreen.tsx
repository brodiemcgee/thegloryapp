// New user onboarding - just username

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
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
          intent: 'chatting',  // Default intent, can be changed in-app
          availability: 'now',  // Default availability
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
          <p className="text-hole-muted">Choose your username</p>
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

          {/* Error message */}
          {error && (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || username.length < 3}
            className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
          >
            {loading ? 'Creating Profile...' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
