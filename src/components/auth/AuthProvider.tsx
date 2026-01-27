// Auth provider that wraps the app with consent, login, onboarding, and age verification checks

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ConsentModal from '@/components/ConsentModal';
import LoginScreen from './LoginScreen';
import VerifyScreen from './VerifyScreen';
import OnboardingScreen from './OnboardingScreen';
import AgeVerificationGate from '@/components/AgeVerificationGate';

type AuthMethod = 'phone' | 'email';

interface Profile {
  id: string;
  username?: string;
  onboarded?: boolean;
  is_verified?: boolean;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [hasConsent, setHasConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [authStep, setAuthStep] = useState<'login' | 'verify' | 'onboarding' | 'authenticated'>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [authValue, setAuthValue] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [capturedReferralCode, setCapturedReferralCode] = useState<string | null>(null);
  const [capturedBetaCode, setCapturedBetaCode] = useState<string | null>(null);

  // Check consent on mount
  useEffect(() => {
    const consent = localStorage.getItem('glory_consent_accepted');
    setHasConsent(!!consent);
    setCheckingConsent(false);
  }, []);

  // Capture referral code and beta code from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);

      // Handle referral code
      const refCode = params.get('ref');
      if (refCode) {
        setCapturedReferralCode(refCode.toUpperCase());
        // Store in sessionStorage for persistence across auth flow
        sessionStorage.setItem('referral_code', refCode.toUpperCase());
      } else {
        // Check sessionStorage for previously captured code
        const stored = sessionStorage.getItem('referral_code');
        if (stored) setCapturedReferralCode(stored);
      }

      // Handle beta join flag
      const betaJoin = params.get('beta');
      if (betaJoin === 'join') {
        setCapturedBetaCode('join');
        // Store in sessionStorage for persistence across auth flow
        sessionStorage.setItem('beta_code', 'join');
      } else {
        // Check sessionStorage for previously captured flag
        const storedBeta = sessionStorage.getItem('beta_code');
        if (storedBeta) setCapturedBetaCode(storedBeta);
      }

      // Clean up URL without reload
      if (refCode || betaJoin) {
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        url.searchParams.delete('beta');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  // Fetch profile when user is authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setAuthStep('login');
      return;
    }

    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, onboarded, is_verified')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      setProfile(data || null);
      setLoadingProfile(false);

      // Determine auth step based on profile
      if (!data || !data.onboarded) {
        setAuthStep('onboarding');
      } else {
        setAuthStep('authenticated');
      }
    };

    fetchProfile();
  }, [user]);

  const handleCodeSent = (method: AuthMethod, value: string) => {
    setAuthMethod(method);
    setAuthValue(value);
    setAuthStep('verify');
  };

  const handleVerified = () => {
    // Will trigger profile fetch via useEffect
    setAuthStep('onboarding');
  };

  const handleOnboardingComplete = () => {
    setAuthStep('authenticated');
  };

  const handleBackToLogin = () => {
    setAuthStep('login');
    setAuthValue('');
  };

  // Show nothing while checking consent or auth
  if (checkingConsent || authLoading) {
    return (
      <div className="min-h-screen bg-hole-bg flex items-center justify-center">
        <div className="text-hole-muted">Loading...</div>
      </div>
    );
  }

  // Show consent modal if not accepted
  if (!hasConsent) {
    return <ConsentModal onAccept={() => setHasConsent(true)} />;
  }

  // Show login flow if not authenticated
  if (!user) {
    if (authStep === 'verify') {
      return (
        <VerifyScreen
          method={authMethod}
          value={authValue}
          onVerified={handleVerified}
          onBack={handleBackToLogin}
        />
      );
    }

    return <LoginScreen onCodeSent={handleCodeSent} />;
  }

  // Show loading while fetching profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-hole-bg flex items-center justify-center">
        <div className="text-hole-muted">Loading profile...</div>
      </div>
    );
  }

  // Show onboarding if profile is incomplete
  if (authStep === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        referralCode={capturedReferralCode}
        betaCode={capturedBetaCode}
      />
    );
  }

  // User is authenticated and onboarded - require age verification before showing app
  return (
    <AgeVerificationGate requireVerification={true}>
      {children}
    </AgeVerificationGate>
  );
}
