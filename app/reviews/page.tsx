'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { reviewService } from '@/lib/firebase-reviews';
import Link from 'next/link';

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadReviews();
  }, [user, authLoading, router]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const userReviews = await reviewService.getUserReviews(user!.uid);
      const rating = await reviewService.getUserAverageRating(user!.uid);
      
      setReviews(userReviews);
      setAvgRating(rating.avg);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.text.trim()) {
      alert('Please enter a review');
      return;
    }

    try {
      await reviewService.addReview(
        user!.uid,
        user!.displayName || user!.email || 'User',
        user!.uid,
        newReview.rating,
        newReview.text
      );
      alert('✅ Review submitted!');
      setNewReview({ rating: 5, text: '' });
      setShowForm(false);
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#F5F5F5',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <Link href="/profile">
          <span style={{ color: '#0056D2', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>← Back to Profile</span>
        </Link>
      </div>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '30px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', margin: '0 0 15px 0' }}>
          ⭐ Your Reviews
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Average Rating</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFB300', margin: '5px 0 0 0' }}>
              {avgRating.toFixed(1)} {'⭐'.repeat(Math.round(avgRating))}
            </p>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              background: '#0056D2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              marginLeft: 'auto',
            }}
          >
            {showForm ? '✕ Cancel' : '+ Add Review'}
          </button>
        </div>
      </div>

      {/* New Review Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '15px' }}>
            Write a Review
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
              Rating
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <span
                  key={num}
                  onClick={() => setNewReview({ ...newReview, rating: num })}
                  style={{
                    fontSize: '28px',
                    cursor: 'pointer',
                    opacity: num <= newReview.rating ? 1 : 0.3,
                    transition: 'opacity 200ms',
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
              Review Text
            </label>
            <textarea
              value={newReview.text}
              onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
              placeholder="Share your experience..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E0E0E0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                minHeight: '100px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSubmitReview}
              style={{
                flex: 1,
                padding: '12px',
                background: '#0056D2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Submit Review
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: '#F0F0F0',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reviews.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#999' }}>
            <p style={{ fontSize: '24px', margin: '0 0 10px 0' }}>📝</p>
            <p style={{ margin: 0 }}>No reviews yet. Get started by having customers review your products!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: '4px solid #FFB300',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 5px 0', color: '#333' }}>
                    {review.reviewerName}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                    {new Date(review.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ fontSize: '16px' }}>
                  {'⭐'.repeat(review.rating)}
                </div>
              </div>
              <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                {review.text}
              </p>
              {review.helpful > 0 && (
                <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#999' }}>
                  👍 {review.helpful} people found this helpful
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
