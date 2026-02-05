// Multi-step onboarding: Identity, About You, Photo

'use client';

import { useState, useEffect, useRef, useCallback, ChangeEvent, DragEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { XIcon } from '@/components/icons';

interface OnboardingScreenProps {
  onComplete: () => void;
  referralCode?: string | null;
  betaCode?: string | null;
}

type Position = 'top' | 'bottom' | 'vers' | 'vers_top' | 'vers_bottom' | 'side';

interface OnboardingState {
  step: 1 | 2 | 3;
  // Step 1
  username: string;
  age: number | '';
  usernameAvailable: boolean | null;
  checkingUsername: boolean;
  // Step 2
  bio: string;
  position: Position | '';
  // Step 3
  uploadedPhotoUrl: string | null;
  uploadedPhotoPath: string | null;
  uploadingPhoto: boolean;
  uploadProgress: number;
  uploadError: string | null;
  photoPreview: string | null;
  // Global
  loading: boolean;
  error: string;
}

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'vers', label: 'Vers' },
  { value: 'vers_top', label: 'Vers Top' },
  { value: 'vers_bottom', label: 'Vers Bottom' },
  { value: 'side', label: 'Side' },
];

export default function OnboardingScreen({ onComplete, referralCode, betaCode }: OnboardingScreenProps) {
  const { user } = useAuth();
  const { upload, uploading, progress, error: uploadHookError, reset: resetUpload } = usePhotoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<OnboardingState>({
    step: 1,
    username: '',
    age: '',
    usernameAvailable: null,
    checkingUsername: false,
    bio: '',
    position: '',
    uploadedPhotoUrl: null,
    uploadedPhotoPath: null,
    uploadingPhoto: false,
    uploadProgress: 0,
    uploadError: null,
    photoPreview: null,
    loading: false,
    error: '',
  });

  // Debounced username availability check
  useEffect(() => {
    if (state.username.length < 3) {
      setState(s => ({ ...s, usernameAvailable: null }));
      return;
    }

    const timer = setTimeout(async () => {
      setState(s => ({ ...s, checkingUsername: true }));

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', state.username.toLowerCase())
        .single();

      setState(s => ({
        ...s,
        usernameAvailable: !data,
        checkingUsername: false,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [state.username]);

  // Sync upload hook state
  useEffect(() => {
    setState(s => ({
      ...s,
      uploadingPhoto: uploading,
      uploadProgress: progress,
      uploadError: uploadHookError,
    }));
  }, [uploading, progress, uploadHookError]);

  // Step 1 validation
  const isStep1Valid = () => {
    return (
      state.username.length >= 3 &&
      state.usernameAvailable === true &&
      typeof state.age === 'number' &&
      state.age >= 18 &&
      state.age <= 99
    );
  };

  // Step 2 validation
  const isStep2Valid = () => {
    return state.bio.trim().length >= 10 && state.position !== '';
  };

  // Step 3 validation
  const isStep3Valid = () => {
    return state.uploadedPhotoUrl !== null && !state.uploadingPhoto;
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setState(s => ({
      ...s,
      username: sanitized,
      usernameAvailable: null,
      error: '',
    }));
  };

  const handleAgeChange = (delta: number) => {
    setState(s => {
      const currentAge = typeof s.age === 'number' ? s.age : 18;
      const newAge = Math.min(99, Math.max(18, currentAge + delta));
      return { ...s, age: newAge, error: '' };
    });
  };

  const handleAgeInput = (value: string) => {
    if (value === '') {
      setState(s => ({ ...s, age: '', error: '' }));
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setState(s => ({ ...s, age: Math.min(99, Math.max(0, num)), error: '' }));
    }
  };

  const handleBioChange = (value: string) => {
    setState(s => ({ ...s, bio: value, error: '' }));
  };

  const handlePositionSelect = (position: Position) => {
    setState(s => ({ ...s, position, error: '' }));
  };

  // Photo handling
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  const handlePhotoFile = async (file: File) => {
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use JPEG, PNG, GIF, or WebP.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size: 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setState(s => ({ ...s, photoPreview: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload immediately
    if (!user) {
      setState(s => ({ ...s, uploadError: 'Not authenticated' }));
      return;
    }

    try {
      const result = await upload(file, user.id, 'profile');
      setState(s => ({
        ...s,
        uploadedPhotoUrl: result.url,
        uploadedPhotoPath: result.path,
        uploadError: null,
      }));
    } catch {
      // Error is handled by the hook
    }
  };

  const handleRemovePhoto = () => {
    setState(s => ({
      ...s,
      uploadedPhotoUrl: null,
      uploadedPhotoPath: null,
      photoPreview: null,
      uploadError: null,
    }));
    resetUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    if (state.step === 1 && isStep1Valid()) {
      setState(s => ({ ...s, step: 2, error: '' }));
    } else if (state.step === 2 && isStep2Valid()) {
      setState(s => ({ ...s, step: 3, error: '' }));
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState(s => ({ ...s, step: (s.step - 1) as 1 | 2 | 3, error: '' }));
    }
  };

  const handleFinish = useCallback(async () => {
    if (!isStep3Valid() || !user) return;

    setState(s => ({ ...s, loading: true, error: '' }));

    try {
      // Final username availability check (race condition prevention)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', state.username.toLowerCase())
        .single();

      if (existingUser) {
        setState(s => ({ ...s, loading: false, error: 'Username was taken. Please go back and choose another.' }));
        return;
      }

      // Upsert profile with all collected data
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: state.username.toLowerCase(),
        display_name: state.username.toLowerCase(),
        age: state.age,
        bio: state.bio.trim(),
        position: state.position,
        intent: 'chatting',
        availability: 'now',
        onboarded: true,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        setState(s => ({ ...s, loading: false, error: upsertError.message }));
        return;
      }

      // Insert photo record
      if (state.uploadedPhotoUrl && state.uploadedPhotoPath) {
        const { error: photoError } = await supabase.from('photos').insert({
          user_id: user.id,
          url: state.uploadedPhotoUrl,
          storage_path: state.uploadedPhotoPath,
          is_primary: true,
        });

        if (photoError) {
          console.error('Failed to save photo record:', photoError);
          // Continue anyway - the profile is created
        }
      }

      // Process referral code if provided
      if (referralCode) {
        try {
          const { data: codeData } = await supabase
            .from('referral_codes')
            .select('user_id')
            .eq('code', referralCode.toUpperCase())
            .single();

          if (codeData && codeData.user_id !== user.id) {
            await supabase.from('referrals').insert({
              referrer_id: codeData.user_id,
              referred_id: user.id,
              referral_code_used: referralCode.toUpperCase(),
            });
          }
        } catch {
          // Referral failed silently
        }

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('referral_code');
        }
      }

      // Process beta join flag if provided
      if (betaCode === 'join') {
        try {
          const { data, error: betaError } = await supabase.rpc('join_beta_program', {
            p_user_id: user.id,
          });

          if (betaError) {
            toast.error('Could not join beta program');
          } else if (data?.success) {
            toast.success('Welcome to the beta! You have premium access.');
          } else if (data?.error === 'already_enrolled') {
            toast.success("You're already in the beta program!");
          } else if (data?.error === 'program_full') {
            toast.error('Beta program is currently full');
          } else {
            toast.error('Could not join beta program');
          }
        } catch {
          toast.error('Beta enrollment failed');
        }

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('beta_code');
        }
      }

      onComplete();
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Something went wrong. Please try again.' }));
    }
  }, [state, user, referralCode, betaCode, onComplete]);

  // Progress dots
  const ProgressDots = () => (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3].map(step => (
        <div
          key={step}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            step === state.step
              ? 'bg-hole-accent'
              : step < state.step
                ? 'bg-hole-accent/50'
                : 'bg-hole-border'
          }`}
        />
      ))}
    </div>
  );

  // Step 1: Identity
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Create Your Profile</h1>
        <p className="text-hole-muted">Let&apos;s start with the basics</p>
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Username</label>
          <div className="relative">
            <input
              type="text"
              value={state.username}
              onChange={e => handleUsernameChange(e.target.value)}
              placeholder="username"
              maxLength={20}
              className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent"
            />
            {state.checkingUsername && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-hole-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!state.checkingUsername && state.username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {state.usernameAvailable ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-hole-muted">Lowercase letters, numbers, and underscores only</p>
          {state.usernameAvailable === false && (
            <p className="text-xs text-red-500">Username is already taken</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Age</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAgeChange(-1)}
              className="w-12 h-12 bg-hole-surface border border-hole-border rounded-lg text-white text-xl font-bold hover:bg-hole-border transition-colors touch-target"
            >
              −
            </button>
            <input
              type="number"
              value={state.age}
              onChange={e => handleAgeInput(e.target.value)}
              min={18}
              max={99}
              className="flex-1 bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white text-center text-lg focus:outline-none focus:border-hole-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="18"
            />
            <button
              type="button"
              onClick={() => handleAgeChange(1)}
              className="w-12 h-12 bg-hole-surface border border-hole-border rounded-lg text-white text-xl font-bold hover:bg-hole-border transition-colors touch-target"
            >
              +
            </button>
          </div>
          <p className="text-xs text-hole-muted">Must be 18 or older</p>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!isStep1Valid()}
        className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
      >
        Next
      </button>
    </div>
  );

  // Step 2: About You
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">About You</h1>
        <p className="text-hole-muted">Tell others a bit about yourself</p>
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Bio</label>
          <textarea
            value={state.bio}
            onChange={e => handleBioChange(e.target.value)}
            placeholder="A few words about you..."
            rows={3}
            maxLength={300}
            className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent resize-none"
          />
          <p className="text-xs text-hole-muted">
            {state.bio.trim().length}/10 minimum characters
            {state.bio.trim().length >= 10 && ' ✓'}
          </p>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {POSITIONS.map(pos => (
              <button
                key={pos.value}
                type="button"
                onClick={() => handlePositionSelect(pos.value)}
                className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors touch-target ${
                  state.position === pos.value
                    ? 'bg-hole-accent text-white'
                    : 'bg-hole-surface border border-hole-border text-white hover:bg-hole-border'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleBack}
          className="flex-1 bg-hole-surface border border-hole-border hover:bg-hole-border text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isStep2Valid()}
          className="flex-1 bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Step 3: Photo
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Add a Photo</h1>
        <p className="text-hole-muted">Show others what you look like</p>
      </div>

      <div className="space-y-4">
        {!state.photoPreview ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer border-hole-border bg-hole-surface hover:border-hole-accent/50"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handlePhotoClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
            />
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-hole-border rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Tap to upload or drag and drop</p>
                <p className="text-xs text-hole-muted mt-1">Max 5MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden bg-hole-surface">
              <img src={state.photoPreview} alt="Preview" className="w-full h-64 object-cover" />
              {!state.uploadingPhoto && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  aria-label="Remove"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress bar */}
            {state.uploadingPhoto && (
              <div className="space-y-2">
                <div className="w-full bg-hole-border rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-hole-accent h-full transition-all duration-300"
                    style={{ width: `${state.uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-hole-muted text-center">Uploading... {state.uploadProgress}%</p>
              </div>
            )}

            {/* Upload success indicator */}
            {state.uploadedPhotoUrl && !state.uploadingPhoto && (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Photo uploaded</span>
              </div>
            )}

            {/* Error message */}
            {state.uploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{state.uploadError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {state.error && (
        <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
          <p className="text-sm text-hole-accent">{state.error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleBack}
          disabled={state.loading}
          className="flex-1 bg-hole-surface border border-hole-border hover:bg-hole-border disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
        >
          Back
        </button>
        <button
          onClick={handleFinish}
          disabled={!isStep3Valid() || state.loading}
          className="flex-1 bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
        >
          {state.loading ? 'Creating Profile...' : 'Finish'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-hole-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ProgressDots />
        <div className="bg-hole-surface rounded-lg p-6 border border-hole-border">
          {state.step === 1 && renderStep1()}
          {state.step === 2 && renderStep2()}
          {state.step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
}
