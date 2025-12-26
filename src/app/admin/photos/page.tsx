'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Image,
  User,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import toast from 'react-hot-toast';

interface PhotoReview {
  id: string;
  photo_id: string;
  report_id: string | null;
  status: string;
  removal_reason: string | null;
  created_at: string;
  photo: {
    id: string;
    url: string;
    is_nsfw: boolean;
    profile_id: string;
    profile: {
      username: string;
      avatar_url: string | null;
    };
  };
  report?: {
    id: string;
    reason: string;
    details: string | null;
  };
}

type StatusFilter = 'pending' | 'under_review' | 'approved' | 'removed';
type ViewMode = 'grid' | 'list';

const removalReasons = [
  { value: 'illegal', label: 'Illegal Content' },
  { value: 'underage', label: 'Underage' },
  { value: 'non_consensual', label: 'Non-Consensual' },
  { value: 'prohibited_acts', label: 'Prohibited Acts' },
];

export default function PhotosPage() {
  const { adminRoleId } = useAdminAuth();
  const [reviews, setReviews] = useState<PhotoReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>('pending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoReview | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('reported_photo_reviews')
        .select(`
          *,
          photo:photos(
            id,
            url,
            is_nsfw,
            profile_id,
            profile:profiles(username, avatar_url)
          ),
          report:reports(id, reason, details)
        `)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading photo reviews:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Keyboard shortcuts for batch mode
  useEffect(() => {
    if (!batchMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBatchMode(false);
        return;
      }

      const currentReview = reviews[currentBatchIndex];
      if (!currentReview) return;

      if (e.key === 'a' || e.key === 'A') {
        approvePhoto(currentReview.id);
      } else if (e.key === 'r' || e.key === 'R') {
        // Show removal reason modal
        setSelectedPhoto(currentReview);
      } else if (e.key === 'ArrowRight') {
        if (currentBatchIndex < reviews.length - 1) {
          setCurrentBatchIndex(currentBatchIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentBatchIndex > 0) {
          setCurrentBatchIndex(currentBatchIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batchMode, currentBatchIndex, reviews]);

  async function approvePhoto(reviewId: string) {
    try {
      const { error } = await supabase
        .from('reported_photo_reviews')
        .update({
          status: 'approved',
          reviewed_by: adminRoleId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;
      toast.success('Photo approved');

      // Move to next in batch mode
      if (batchMode && currentBatchIndex < reviews.length - 1) {
        setCurrentBatchIndex(currentBatchIndex + 1);
      }

      loadReviews();
    } catch (error) {
      console.error('Error approving photo:', error);
      toast.error('Failed to approve photo');
    }
  }

  async function removePhoto(reviewId: string, reason: string) {
    try {
      const { error } = await supabase
        .from('reported_photo_reviews')
        .update({
          status: 'removed',
          removal_reason: reason,
          reviewed_by: adminRoleId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;
      toast.success('Photo removed');
      setSelectedPhoto(null);

      // Move to next in batch mode
      if (batchMode && currentBatchIndex < reviews.length - 1) {
        setCurrentBatchIndex(currentBatchIndex + 1);
      }

      loadReviews();
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    }
  }

  const pendingCount = reviews.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Moderation</h1>
          <p className="text-gray-600 mt-1">
            Review reported photos for policy violations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'pending' && reviews.length > 0 && (
            <button
              onClick={() => {
                setBatchMode(true);
                setCurrentBatchIndex(0);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Review All ({reviews.length})
            </button>
          )}
          <button
            onClick={loadReviews}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <nav className="flex gap-4">
          {(['pending', 'under_review', 'approved', 'removed'] as StatusFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </nav>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900">Queue Clear!</h2>
          <p className="text-gray-600 mt-2">No photos to review in this category</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reviews.map((review) => (
            <PhotoCard
              key={review.id}
              review={review}
              onApprove={() => approvePhoto(review.id)}
              onRemove={() => setSelectedPhoto(review)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {reviews.map((review) => (
            <PhotoListItem
              key={review.id}
              review={review}
              onApprove={() => approvePhoto(review.id)}
              onRemove={() => setSelectedPhoto(review)}
            />
          ))}
        </div>
      )}

      {/* Batch Review Modal */}
      {batchMode && reviews.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setBatchMode(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XCircle className="w-8 h-8" />
          </button>

          <div className="max-w-4xl w-full mx-4">
            {/* Progress */}
            <div className="text-center mb-4">
              <span className="text-white text-sm">
                {currentBatchIndex + 1} of {reviews.length}
              </span>
              <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                <div
                  className="bg-purple-500 h-1 rounded-full transition-all"
                  style={{ width: `${((currentBatchIndex + 1) / reviews.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Photo */}
            <div className="relative">
              <img
                src={reviews[currentBatchIndex]?.photo?.url}
                alt=""
                className="max-h-[60vh] mx-auto rounded-lg"
              />

              {/* Navigation */}
              <button
                onClick={() => setCurrentBatchIndex(Math.max(0, currentBatchIndex - 1))}
                disabled={currentBatchIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 disabled:opacity-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentBatchIndex(Math.min(reviews.length - 1, currentBatchIndex + 1))}
                disabled={currentBatchIndex === reviews.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 disabled:opacity-50"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Info & Actions */}
            <div className="mt-6 bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">
                    @{reviews[currentBatchIndex]?.photo?.profile?.username}
                  </span>
                </div>
                {reviews[currentBatchIndex]?.report && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    {reviews[currentBatchIndex]?.report?.reason}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => approvePhoto(reviews[currentBatchIndex]?.id)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve (A)
                </button>
                <button
                  onClick={() => setSelectedPhoto(reviews[currentBatchIndex])}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Remove (R)
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-3">
                Use arrow keys to navigate, A to approve, R to remove, Esc to exit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Removal Reason Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Removal Reason
            </h3>
            <div className="space-y-2">
              {removalReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => removePhoto(selectedPhoto.id, reason.value)}
                  className="w-full px-4 py-3 text-left font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  {reason.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  review,
  onApprove,
  onRemove,
}: {
  review: PhotoReview;
  onApprove: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden group">
      <div className="aspect-square relative">
        <img
          src={review.photo?.url}
          alt=""
          className="w-full h-full object-cover"
        />
        {review.report && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
              {review.report.reason}
            </span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onApprove}
            className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700"
            title="Approve"
          >
            <CheckCircle className="w-6 h-6" />
          </button>
          <button
            onClick={onRemove}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
            title="Remove"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 truncate">
            @{review.photo?.profile?.username}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(review.created_at)}
        </p>
      </div>
    </div>
  );
}

function PhotoListItem({
  review,
  onApprove,
  onRemove,
}: {
  review: PhotoReview;
  onApprove: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50">
      <img
        src={review.photo?.url}
        alt=""
        className="w-16 h-16 object-cover rounded-lg"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            @{review.photo?.profile?.username}
          </span>
          {review.report && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
              {review.report.reason}
            </span>
          )}
        </div>
        {review.report?.details && (
          <p className="text-sm text-gray-600 truncate">{review.report.details}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(review.created_at)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
          title="Approve"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Remove"
        >
          <XCircle className="w-5 h-5" />
        </button>
        <Link
          href={`/admin/users/${review.photo?.profile_id}`}
          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
          title="View user"
        >
          <ExternalLink className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
