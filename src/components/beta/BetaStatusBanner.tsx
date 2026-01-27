'use client';

import { useState } from 'react';
import {
  FlaskConical,
  CheckCircle,
  Clock,
  Bug,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBetaTester } from '@/hooks/useBetaTester';
import BetaFeedbackForm from './BetaFeedbackForm';

export default function BetaStatusBanner() {
  const { isBetaTester, betaStatus, isLoading } = useBetaTester();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Don't show anything if not a beta tester or loading
  if (isLoading || !isBetaTester || !betaStatus) return null;

  // Don't show for completed or dropped testers who already got premium
  if (betaStatus.status !== 'active') return null;

  const progressPercent = (betaStatus.weeksCompleted / 10) * 100;
  const currentWeekScore = betaStatus.currentWeekProgress?.activityScore || 0;
  const currentWeekMet = betaStatus.currentWeekProgress?.meetsRequirement || false;

  return (
    <>
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
        {/* Collapsed view */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-white">
              Beta Tester - Week {betaStatus.currentWeek}/10
            </span>
            <div className="flex items-center gap-1">
              {currentWeekMet ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Week complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                  <Clock className="w-3 h-3" />
                  {currentWeekScore}/60 pts
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-purple-300">
              {betaStatus.weeksCompleted}/10 weeks
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            )}
          </div>
        </button>

        {/* Expanded view */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-purple-300">Overall Progress</span>
                <span className="text-white font-medium">{betaStatus.weeksCompleted}/10 weeks completed</span>
              </div>
              <div className="h-2 bg-hole-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Current week progress */}
            <div className="bg-hole-bg/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white font-medium">Week {betaStatus.currentWeek} Activity</span>
                {currentWeekMet ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                ) : (
                  <span className="text-xs text-yellow-400">
                    {60 - currentWeekScore} pts to go
                  </span>
                )}
              </div>

              {betaStatus.currentWeekProgress && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-hole-surface/50 rounded p-2">
                    <div className="text-white font-medium">{betaStatus.currentWeekProgress.messagesSent}</div>
                    <div className="text-hole-muted">Messages</div>
                  </div>
                  <div className="bg-hole-surface/50 rounded p-2">
                    <div className="text-white font-medium">{betaStatus.currentWeekProgress.profilesViewed}</div>
                    <div className="text-hole-muted">Views</div>
                  </div>
                  <div className="bg-hole-surface/50 rounded p-2">
                    <div className="text-white font-medium">{betaStatus.currentWeekProgress.photosUploaded}</div>
                    <div className="text-hole-muted">Photos</div>
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-hole-muted">
                Messages: 2pts | Profile views: 1pt | Photos: 5pts | Goal: 60pts/week
              </div>
            </div>

            {/* Reward reminder */}
            <div className="flex items-center gap-3 text-sm">
              <Crown className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300">
                Complete all 10 weeks to earn <strong className="text-white">Lifetime Premium</strong>
              </span>
            </div>

            {/* Feedback button */}
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
            >
              <Bug className="w-4 h-4" />
              Submit Feedback
            </button>
          </div>
        )}
      </div>

      {/* Feedback form modal */}
      <BetaFeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
      />
    </>
  );
}
