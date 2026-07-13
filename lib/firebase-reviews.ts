/**
 * Reviews & Ratings Service
 * Handles user reviews and ratings
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Review {
  id?: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  rating: number; // 1-5
  text: string;
  orderId?: string;
  timestamp: number;
  helpful: number;
}

export const reviewService = {
  /**
   * Add a review for a user
   */
  async addReview(
    reviewerId: string,
    reviewerName: string,
    revieweeId: string,
    rating: number,
    text: string,
    orderId?: string
  ) {
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        reviewerId,
        reviewerName,
        revieweeId,
        rating: Math.min(5, Math.max(1, rating)),
        text,
        orderId,
        timestamp: Date.now(),
        helpful: 0,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  /**
   * Get reviews for a user
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('revieweeId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Review));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  /**
   * Get average rating for a user
   */
  async getUserAverageRating(userId: string): Promise<{ avg: number; count: number }> {
    try {
      const reviews = await this.getUserReviews(userId);
      if (reviews.length === 0) return { avg: 0, count: 0 };
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      return {
        avg: sum / reviews.length,
        count: reviews.length,
      };
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return { avg: 0, count: 0 };
    }
  },

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string) {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviews = await getDocs(query(collection(db, 'reviews'), where('id', '==', reviewId)));
      if (!reviews.empty) {
        const currentHelpful = reviews.docs[0].data().helpful || 0;
        await updateDoc(reviewRef, { helpful: currentHelpful + 1 });
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  },

  /**
   * Get all reviews (for dashboard)
   */
  async getAllReviews(): Promise<Review[]> {
    try {
      const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Review));
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return [];
    }
  },
};
