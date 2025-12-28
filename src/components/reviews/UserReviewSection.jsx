import React, { useState } from "react";
import { FiStar, FiUser, FiCheckCircle, FiFlag } from "react-icons/fi";
import { useGetUserReviewsQuery, useAddUserReviewMutation, useGetMeQuery } from "../../redux/services/api";
import toast from "react-hot-toast";
import Spinner from "../Spinner";

const UserReviewSection = ({ userId, carId, sellerName }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { data: reviews, isLoading, refetch } = useGetUserReviewsQuery(userId, {
    skip: !userId,
  });
  const { data: currentUser } = useGetMeQuery();
  const [addReview, { isLoading: isSubmitting }] = useAddUserReviewMutation();

  const averageRating = reviews?.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    if (!currentUser) {
      toast.error("Please login to submit a review");
      return;
    }

    try {
      await addReview({
        targetUserId: userId,
        rating,
        comment: comment.trim(),
        carId: carId || null,
      }).unwrap();
      
      toast.success("Review submitted successfully!");
      setComment("");
      setRating(5);
      setShowReviewForm(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit review");
    }
  };

  const canReview = currentUser && currentUser._id !== userId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Seller Reviews</h3>
          {reviews?.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`${
                      i < Math.round(averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    size={20}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">{averageRating}</span>
              <span className="text-gray-500">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        {canReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner fullScreen={false} />
        </div>
      ) : reviews?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiUser size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No reviews yet. Be the first to review {sellerName || "this seller"}!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.slice(0, 5).map((review) => (
            <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    {review.reviewer?.avatar ? (
                      <img
                        src={review.reviewer.avatar}
                        alt={review.reviewer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-primary-500" size={20} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {review.reviewer?.name || "Anonymous"}
                      </span>
                      {review.isApproved && (
                        <FiCheckCircle className="text-green-500" size={16} title="Verified Review" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`${
                            i < review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                          size={14}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
              {review.transaction && (
                <p className="text-xs text-gray-500 mt-2">
                  Review for: {review.transaction?.title || "Transaction"}
                </p>
              )}
            </div>
          ))}
          {reviews.length > 5 && (
            <button className="w-full py-2 text-primary-500 hover:text-primary-500 font-medium">
              View All {reviews.length} Reviews
            </button>
          )}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Write a Review</h3>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setComment("");
                  setRating(5);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiStar className="rotate-45" size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-all hover:scale-110 ${
                        star <= rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-gray-600 font-medium self-center">
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={5}
                  placeholder="Share your experience with this seller..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length} characters
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setComment("");
                    setRating(5);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="px-6 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReviewSection;

