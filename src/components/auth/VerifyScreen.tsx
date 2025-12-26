// OTP verification screen with 6-digit code input

'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VerifyScreenProps {
  method: 'phone' | 'email';
  value: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function VerifyScreen({ method, value, onVerified, onBack }: VerifyScreenProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Enable resend after 30 seconds
    const timer = setTimeout(() => setCanResend(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value && newCode.every(digit => digit)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    const digits = pastedData.slice(0, 6).split('');

    const newCode = [...code];
    digits.forEach((digit, i) => {
      newCode[i] = digit;
    });
    setCode(newCode);

    // Focus last filled input
    const lastIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if complete
    if (digits.length === 6) {
      handleVerify(digits.join(''));
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setLoading(true);
    setError('');

    try {
      const otpParams = method === 'phone'
        ? { phone: value, token: verificationCode, type: 'sms' as const }
        : { email: value, token: verificationCode, type: 'email' as const };

      const { error } = await supabase.auth.verifyOtp(otpParams);

      if (error) {
        setError(error.message);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        onVerified();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError('');
    setCanResend(false);

    try {
      const signInParams = method === 'phone' ? { phone: value } : { email: value };
      const { error } = await supabase.auth.signInWithOtp(signInParams);

      if (error) {
        setError(error.message);
      } else {
        // Reset timer
        setTimeout(() => setCanResend(true), 30000);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-hole-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Enter Code</h1>
          <p className="text-hole-muted">
            We sent a code to{' '}
            <span className="text-white font-medium">{value}</span>
          </p>
        </div>

        <div className="bg-hole-surface rounded-lg p-6 space-y-6 border border-hole-border">
          {/* Code input */}
          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold bg-hole-bg border border-hole-border rounded-lg text-white focus:outline-none focus:border-hole-accent disabled:opacity-50"
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent text-center">{error}</p>
            </div>
          )}

          {/* Resend link */}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={!canResend}
              className="text-sm text-hole-accent hover:text-hole-accent-hover disabled:text-hole-muted disabled:cursor-not-allowed transition-colors"
            >
              {canResend ? 'Resend code' : 'Resend available in 30s'}
            </button>
          </div>

          {/* Back button */}
          <button
            onClick={onBack}
            disabled={loading}
            className="w-full bg-hole-bg hover:bg-hole-border text-white font-medium py-3 px-4 rounded-lg border border-hole-border transition-colors touch-target"
          >
            Back
          </button>
        </div>

        {loading && (
          <div className="text-center">
            <p className="text-hole-muted text-sm">Verifying...</p>
          </div>
        )}
      </div>
    </div>
  );
}
