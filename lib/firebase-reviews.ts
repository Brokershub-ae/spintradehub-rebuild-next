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
import type { User } from './firebase-service';

export interface PublicRatedUser extends Pick<User, 'uid' | 'name' | 'username' | 'region' | 'role'> {
  avgRating: number;
  reviewCount: number;
}

export async function getPublicRatedUsers(): Promise<PublicRatedUser[]> {
  const snapshot = await getDocs(collection(db, 'publicUserRatings'));
  return snapshot.docs.map((userDoc) => {
    const data = userDoc.data();
    if (!['buyer', 'supplier'].includes(data.role) ||
        typeof data.name !== 'string' || typeof data.username !== 'string' ||
        typeof data.region !== 'string' ||
        typeof data.avgRating !== 'number' || !Number.isFinite(data.avgRating) ||
        data.avgRating < 0 || data.avgRating > 5 ||
        !Number.isSafeInteger(data.reviewCount) || data.reviewCount < 0 ||
        (data.reviewCount === 0 ? data.avgRating !== 0 : data.avgRating < 1)) {
      throw new Error(`Invalid public rating summary: ${userDoc.id}`);
    }
    return {
      uid: userDoc.id,
      name: data.name,
      username: data.username,
      region: data.region,
      role: data.role,
      avgRating: data.avgRating,
      reviewCount: data.reviewCount,
    };
  });
}

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

export interface UserRatingSummary {
  avg: number;
  count: number;
}

export function compareUserRatings(
  a: { avgRating: number; reviewCount: number; uid: string },
  b: { avgRating: number; reviewCount: number; uid: string }
) {
  return b.avgRating - a.avgRating ||
    b.reviewCount - a.reviewCount ||
    a.uid.localeCompare(b.uid);
}

export const reviewService = {
  /**
   * Calculate user ratings in one query without requiring a composite index.
   */
  async getUserRatingSummaries(userId?: string): Promise<Map<string, UserRatingSummary>> {
    try {
      const reviewsRef = collection(db, 'reviews');
      const snapshot = await getDocs(userId === undefined
        ? reviewsRef
        : query(reviewsRef, where('revieweeId', '==', userId)));
      const totals = new Map<string, { sum: number; count: number }>();

      for (const reviewDoc of snapshot.docs) {
        const review = reviewDoc.data();
        const rating = Number(review.rating);
        if ((typeof review.rating !== 'number' && typeof review.rating !== 'string') ||
            typeof review.revieweeId !== 'string' || !review.revieweeId ||
            !Number.isFinite(rating) || rating < 1 || rating > 5) {
          console.warn('Skipping invalid user rating:', reviewDoc.id);
          continue;
        }

        const total = totals.get(review.revieweeId) || { sum: 0, count: 0 };
        total.sum += rating;
        total.count += 1;
        totals.set(review.revieweeId, total);
      }

      return new Map(
        Array.from(totals, ([userId, total]) => [
          userId,
          { avg: total.sum / total.count, count: total.count },
        ])
      );
    } catch (error) {
      console.error('Error loading user rating summaries:', error);
      throw error;
    }
  },

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
    const ratings = await this.getUserRatingSummaries(userId);
    return ratings.get(userId) ?? { avg: 0, count: 0 };
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
