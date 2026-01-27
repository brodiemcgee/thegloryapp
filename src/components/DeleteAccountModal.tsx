// GDPR-compliant account deletion modal
// Requires user to type "DELETE MY ACCOUNT" to confirm

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type exactly: DELETE MY ACCOUNT');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { confirmPhrase: confirmText },
      });

      if (fnError) {
        setError(fnError.message || 'Failed to delete account');
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Account deleted successfully - sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('warning');
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-hole-surface rounded-lg max-w-md w-full border border-hole-border overflow-hidden">
        {/* Header */}
        <div className="bg-red-500/10 border-b border-red-500/20 p-4">
          <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Delete Account
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {step === 'warning' ? (
            <>
              <p className="text-white">
                This action is <strong className="text-red-500">permanent and irreversible</strong>.
              </p>

              <div className="bg-hole-bg rounded-lg p-4 space-y-2 text-sm text-hole-muted">
                <p className="font-medium text-white">The following will be permanently deleted:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your profile and all photos</li>
                  <li>All messages and conversations</li>
                  <li>All albums and shared media</li>
                  <li>Encounter history and health logs</li>
                  <li>Your account and login credentials</li>
                </ul>
              </div>

              <p className="text-sm text-hole-muted">
                This complies with GDPR Article 17 &quot;Right to Erasure&quot;.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-hole-bg hover:bg-hole-border text-white font-medium py-3 px-4 rounded-lg border border-hole-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-white">
                To confirm deletion, please type:
              </p>

              <div className="bg-hole-bg rounded-lg p-3 text-center">
                <code className="text-red-500 font-mono font-bold">DELETE MY ACCOUNT</code>
              </div>

              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Type here to confirm..."
                className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-red-500"
                disabled={loading}
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('warning')}
                  disabled={loading}
                  className="flex-1 bg-hole-bg hover:bg-hole-border text-white font-medium py-3 px-4 rounded-lg border border-hole-border transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || confirmText !== 'DELETE MY ACCOUNT'}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
