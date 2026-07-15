/**
 * User Verification Service
 * Manages seller/buyer verification badges and trust indicators
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserVerification {
  userId: string;
  isVerified: boolean;
  verificationType: 'BUYER' | 'SELLER' | 'BOTH' | 'NONE';
  businessLicense?: string;
  businessName?: string;
  verificationDate?: number;
  trustScore: number;
  badges: string[];
}

export const verificationService = {
  /**
   * Get user verification status
   */
  async getUserVerification(userId: string): Promise<UserVerification | null> {
    try {
      const docRef = doc(db, 'verifications', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserVerification;
      }

      // Return default verification if not found
      return {
        userId,
        isVerified: false,
        verificationType: 'NONE',
        trustScore: 50,
        badges: [],
      };
    } catch (error) {
      console.error('Error getting verification:', error);
      return null;
    }
  },

  /**
   * Verify a seller
   */
  async verifyAsSeeller(
    userId: string,
    businessName: string,
    businessLicense: string
  ) {
    try {
      const docRef = doc(db, 'verifications', userId);
      await setDoc(
        docRef,
        {
          userId,
          isVerified: true,
          verificationType: 'SELLER',
          businessName,
          businessLicense,
          verificationDate: Date.now(),
          trustScore: 75,
          badges: ['verified-seller'],
        },
        { merge: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Error verifying seller:', error);
      throw error;
    }
  },

  /**
   * Calculate trust score based on:
   * - Order completion rate
   * - Average rating
   * - Response time
   * - Account age
   */
  async calculateTrustScore(
    userId: string,
    completedOrders: number,
    totalOrders: number,
    averageRating: number,
    accountAgeInDays: number
  ): Promise<number> {
    let score = 50; // Base score

    // Order completion rate (max 15 points)
    const completionRate = totalOrders > 0 ? completedOrders / totalOrders : 0;
    score += Math.min(completionRate * 15, 15);

    // Rating (max 20 points)
    score += Math.min((averageRating / 5) * 20, 20);

    // Account age (max 10 points)
    const ageScore = Math.min(accountAgeInDays / 365, 10);
    score += ageScore;

    // Cap at 100
    score = Math.min(score, 100);

    return Math.round(score);
  },

  /**
   * Get badges for a user
   */
  async getUserBadges(userId: string): Promise<string[]> {
    try {
      const verification = await this.getUserVerification(userId);
      return verification?.badges || [];
    } catch (error) {
      console.error('Error getting badges:', error);
      return [];
    }
  },

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badge: string) {
    try {
      const docRef = doc(db, 'verifications', userId);
      const verification = await this.getUserVerification(userId);

      const currentBadges = verification?.badges || [];
      if (!currentBadges.includes(badge)) {
        currentBadges.push(badge);
      }

      await updateDoc(docRef, {
        badges: currentBadges,
      });

      return { success: true };
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  },

  /**
   * Get badge display info
   */
  getBadgeInfo(badge: string) {
    const badges: Record<string, { label: string; icon: string; color: string }> = {
      'verified-seller': {
        label: 'Verified Seller',
        icon: '✅',
        color: '#4CAF50',
      },
      'top-seller': {
        label: 'Top Seller',
        icon: '👑',
        color: '#FFB300',
      },
      'fast-responder': {
        label: 'Fast Responder',
        icon: '⚡',
        color: '#2196F3',
      },
      'quality-items': {
        label: 'Quality Items',
        icon: '⭐',
        color: '#FF8C00',
      },
      'buyer-protection': {
        label: 'Buyer Protection',
        icon: '🛡️',
        color: '#10B981',
      },
      'trusted-buyer': {
        label: 'Trusted Buyer',
        icon: '💎',
        color: '#9C27B0',
      },
    };

    return badges[badge] || { label: badge, icon: '🏆', color: '#666' };
  },

  /**
   * Get trusted sellers (sorted by trust score)
   */
  async getTrustedSellers(limit: number = 10): Promise<Array<any>> {
    try {
      const q = query(
        collection(db, 'verifications'),
        where('verificationType', '==', 'SELLER'),
        where('isVerified', '==', true)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((doc) => ({
          userId: doc.data().userId,
          trustScore: doc.data().trustScore,
          businessName: doc.data().businessName,
        }))
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting trusted sellers:', error);
      return [];
    }
  },
};
