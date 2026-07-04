import React, { useState } from 'react';
import { X, Star, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { submitReview } from '../utils/api';

export default function ReviewModal({ isOpen, onClose, product, token, showNotification, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showNotification('Please add a comment for your review.', 'error');
      return;
    }

    setLoading(true);
    try {
      await submitReview(product.id, product.title, rating, comment, token);
      setSuccess(true);
      showNotification('Review submitted successfully! Pending admin approval.', 'success');
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        setRating(5);
        onClose();
      }, 2500);
    } catch (err) {
      showNotification(err.message || 'Failed to submit review.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#3A2E26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E6D5C3]/40 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-[#3A2E26]/40 hover:text-[#3A2E26] hover:bg-[#FDFBF7] rounded-xl transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-4 animate-scaleUp">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 border border-green-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#3A2E26]">Review Submitted!</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Thank you for sharing your experience. Your review will be published on the storefront after admin verification.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A8B6F]/10 border border-[#7A8B6F]/20 text-[#6B7C60] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Buyer Review</span>
              </div>
              <h3 className="text-xl font-bold text-[#3A2E26]">Share Your Experience</h3>
              <p className="text-xs text-[#3A2E26]/60 mt-1">
                You are reviewing: <strong className="text-[#3A2E26] font-semibold">{product.title}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-2">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-gray-300 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 stroke-1.5 ${
                          star <= (hoverRating || rating)
                            ? 'fill-[#C97C5D] text-[#C97C5D]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-[#3A2E26]/80 ml-2 font-mono">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Review Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">
                  Your Review
                </label>
                <textarea
                  required
                  rows="4"
                  placeholder="Tell us what you loved about this organic soap! How does it feel on your skin?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] placeholder-[#3A2E26]/40 transition-all font-sans"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#3A2E26] hover:bg-[#2A201A] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <span>Submit Verified Review</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
