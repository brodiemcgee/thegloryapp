// Report modal - allows users to report inappropriate content or users

'use client';

import { useState } from 'react';
import { XIcon } from './icons';

export type ReportReason = 'harassment' | 'spam' | 'fake_profile' | 'inappropriate_content' | 'other';
export type TargetType = 'user' | 'location';

interface ReportModalProps {
  targetId: string;
  targetType: TargetType;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}

export default function ReportModal({ targetId, targetType, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reasons: { value: ReportReason; label: string }[] = [
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'spam', label: 'Spam or scam' },
    { value: 'fake_profile', label: 'Fake profile' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-hole-surface border border-hole-border rounded-lg p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Report Submitted</h2>
            <p className="text-hole-muted">Thank you for helping keep our community safe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-hole-surface border border-hole-border rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border sticky top-0 bg-hole-surface">
          <h2 className="text-lg font-semibold">Report {targetType}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-border rounded-lg transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-hole-muted">
            Please select a reason for reporting this {targetType}. Our moderation team will review your report.
          </p>

          {/* Reason selector */}
          <div className="space-y-2">
            {reasons.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  reason === r.value
                    ? 'bg-hole-accent/10 border-hole-accent text-white'
                    : 'bg-hole-bg border-hole-border text-gray-300 hover:border-hole-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Optional details */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              className="w-full bg-hole-bg border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-hole-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
