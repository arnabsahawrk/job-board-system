import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { reviewsApi } from '../../api/reviews';
import { Star, ThumbsUp, Pencil, Trash2, Plus, X } from 'lucide-react';
import { formatRelativeDate } from '../../utils/helpers';

interface ReviewFormData {
  rating: number;
  comment: string;
  job_id: number;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReviewFormData>();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = user?.role === 'seeker'
        ? await reviewsApi.myReviews()
        : await reviewsApi.myReceivedReviews();
      setReviews((res.data as any).reviews || res.data || []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSubmitReview = async (data: ReviewFormData) => {
    if (!selectedRating) { toast.error('Please select a rating'); return; }
    try {
      if (editingReview) {
        await reviewsApi.update(editingReview.id, { rating: selectedRating, comment: data.comment });
        toast.success('Review updated!');
      } else {
        await reviewsApi.create({ ...data, rating: selectedRating });
        toast.success('Review submitted!');
      }
      setShowForm(false);
      setEditingReview(null);
      setSelectedRating(0);
      reset();
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    try {
      await reviewsApi.delete(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setSelectedRating(review.rating);
    setValue('comment', review.comment);
    setValue('job_id', review.job_id);
    setShowForm(true);
  };

  const handleHelpful = async (id: number) => {
    try {
      await reviewsApi.toggleHelpful(id);
      fetchReviews();
    } catch {
      toast.error('Failed to mark helpful');
    }
  };

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => setSelectedRating(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={interactive ? 24 : 16}
            className={
              star <= (interactive ? (hoverRating || selectedRating) : value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'seeker' ? 'My Reviews' : 'Reviews Received'}
          </h1>
          {user?.role === 'seeker' && !showForm && (
            <button onClick={() => { setShowForm(true); setEditingReview(null); reset(); setSelectedRating(0); }} className="btn btn-primary flex items-center gap-2">
              <Plus size={16} /> Write Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showForm && user?.role === 'seeker' && (
          <form onSubmit={handleSubmit(handleSubmitReview)} className="card p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editingReview ? 'Edit Review' : 'Write a Review'}
              </h2>
              <button type="button" onClick={() => { setShowForm(false); setEditingReview(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {!editingReview && (
              <div>
                <label className="label">Job ID</label>
                <input {...register('job_id', { required: true, valueAsNumber: true })} type="number" className="input" placeholder="Enter job ID" />
              </div>
            )}

            <div>
              <label className="label">Rating</label>
              <StarRating value={selectedRating} interactive />
            </div>

            <div>
              <label className="label">Comment</label>
              <textarea
                {...register('comment', { required: true })}
                className="input min-h-[100px] resize-none"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">
                {editingReview ? 'Update' : 'Submit'} Review
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="card p-12 text-center">
            <Star size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No reviews yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {user?.role === 'seeker' ? 'Share your experience by writing a review.' : 'Reviews from job seekers will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-semibold flex-shrink-0">
                      {(review.reviewer_name || review.recruiter_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {review.reviewer_name || review.recruiter_name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {user?.role === 'seeker' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(review)} className="text-gray-400 hover:text-primary-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(review.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <ThumbsUp size={14} />
                    <span>Helpful ({review.helpful_count || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
