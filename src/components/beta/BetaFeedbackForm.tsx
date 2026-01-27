'use client';

import { useState } from 'react';
import {
  Bug,
  MessageSquare,
  Lightbulb,
  Send,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBetaTester } from '@/hooks/useBetaTester';
import toast from 'react-hot-toast';

type FeedbackType = 'bug' | 'feedback' | 'suggestion';

interface BetaFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const feedbackTypes: { type: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { type: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
  { type: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { type: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-green-500 bg-green-500/10 border-green-500/30' },
];

export default function BetaFeedbackForm({ isOpen, onClose }: BetaFeedbackFormProps) {
  const { submitFeedback } = useBetaTester();
  const [selectedType, setSelectedType] = useState<FeedbackType>('feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    const result = await submitFeedback(selectedType, title.trim(), description.trim());

    if (result.success) {
      toast.success('Feedback submitted! Thank you for helping improve GLORY.');
      setTitle('');
      setDescription('');
      setSelectedType('feedback');
      onClose();
    } else {
      toast.error(result.error || 'Failed to submit feedback');
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-hole-surface border border-hole-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border">
          <h2 className="text-lg font-semibold text-white">Submit Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-border rounded-lg text-hole-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypes.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                    selectedType === type
                      ? color
                      : 'bg-hole-bg border-hole-border text-hole-muted hover:border-hole-accent/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedType === 'bug'
                  ? 'Describe the bug briefly'
                  : selectedType === 'suggestion'
                    ? 'What would you like to see?'
                    : 'What is your feedback about?'
              }
              className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-2.5 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                selectedType === 'bug'
                  ? 'Steps to reproduce, what you expected, what actually happened...'
                  : selectedType === 'suggestion'
                    ? 'Describe your idea in detail...'
                    : 'Share your thoughts...'
              }
              rows={5}
              className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-2.5 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent resize-none"
            />
          </div>

          {/* Tips */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <p className="text-sm text-purple-300">
              {selectedType === 'bug' && (
                <>Include steps to reproduce the issue. The more detail you provide, the faster we can fix it!</>
              )}
              {selectedType === 'feedback' && (
                <>Your feedback helps us understand what's working and what isn't. Be specific!</>
              )}
              {selectedType === 'suggestion' && (
                <>We love hearing your ideas! Explain how this feature would help you.</>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-hole-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-hole-muted bg-hole-bg border border-hole-border rounded-lg hover:bg-hole-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
