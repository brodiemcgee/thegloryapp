// Login/signup screen with phone or email OTP

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type AuthMethod = 'phone' | 'email';

interface LoginScreenProps {
  onCodeSent: (method: AuthMethod, value: string) => void;
}

export default function LoginScreen({ onCodeSent }: LoginScreenProps) {
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signInWithPhone } = useAuth();

  const handleSendCode = async () => {
    setError('');
    setLoading(true);

    try {
      let result;

      if (method === 'phone') {
        const fullPhone = `${countryCode}${phone}`;
        if (!phone || phone.length < 10) {
          setError('Please enter a valid phone number');
          setLoading(false);
          return;
        }
        result = await signInWithPhone(fullPhone);
        if (!result.error) {
          onCodeSent('phone', fullPhone);
        }
      } else {
        if (!email || !email.includes('@')) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }
        result = await signIn(email);
        if (!result.error) {
          onCodeSent('email', email);
        }
      }

      if (result.error) {
        setError(result.error.message);
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
          <h1 className="text-3xl font-bold text-white">thehole</h1>
          <p className="text-hole-muted">Sign in or create an account</p>
        </div>

        <div className="bg-hole-surface rounded-lg p-6 space-y-6 border border-hole-border">
          {/* Method selector */}
          <div className="flex gap-2 bg-hole-bg rounded-lg p-1">
            <button
              onClick={() => setMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                method === 'phone'
                  ? 'bg-hole-surface text-white'
                  : 'text-hole-muted hover:text-white'
              }`}
            >
              Phone
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                method === 'email'
                  ? 'bg-hole-surface text-white'
                  : 'text-hole-muted hover:text-white'
              }`}
            >
              Email
            </button>
          </div>

          {/* Phone input */}
          {method === 'phone' && (
            <div className="space-y-2">
              <label className="block text-sm text-hole-muted">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-hole-bg border border-hole-border rounded-lg px-3 py-3 text-white focus:outline-none focus:border-hole-accent"
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+61">+61</option>
                  <option value="+91">+91</option>
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="5551234567"
                  className="flex-1 bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent"
                  maxLength={10}
                />
              </div>
            </div>
          )}

          {/* Email input */}
          {method === 'email' && (
            <div className="space-y-2">
              <label className="block text-sm text-hole-muted">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">{error}</p>
            </div>
          )}

          {/* Send code button */}
          <button
            onClick={handleSendCode}
            disabled={loading}
            className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>

          <p className="text-xs text-center text-hole-muted">
            We'll send you a one-time code to verify your {method === 'phone' ? 'number' : 'email'}
          </p>
        </div>
      </div>
    </div>
  );
}
