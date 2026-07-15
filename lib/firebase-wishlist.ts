/**
 * Wishlist Service
 * Manage saved/favorited products for users
 */

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export interface WishlistItem {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: string;
  productImage?: string;
  sellerName: string;
  sellerId: string;
  savedAt: number;
}

export const wishlistService = {
  /**
   * Add product to wishlist
   */
  async addToWishlist(
    userId: string,
    productId: string,
    productName: string,
    productPrice: string,
    sellerName: string,
    sellerId: string,
    productImage?: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'wishlists'), {
        userId,
        productId,
        productName,
        productPrice,
        productImage,
        sellerName,
        sellerId,
        savedAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(wishlistId: string) {
    try {
      await deleteDoc(doc(db, 'wishlists', wishlistId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },

  /**
   * Get user's wishlist
   */
  async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      const q = query(collection(db, 'wishlists'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as WishlistItem));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  },

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, 'wishlists'),
        where('userId', '==', userId),
        where('productId', '==', productId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0 ? snapshot.docs[0].id : null;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return null;
    }
  },

  /**
   * Listen to wishlist changes in real-time
   */
  listenToWishlist(userId: string, callback: (items: WishlistItem[]) => void) {
    try {
      const q = query(collection(db, 'wishlists'), where('userId', '==', userId));

      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as WishlistItem));
        callback(items);
      });
    } catch (error) {
      console.error('Error setting up wishlist listener:', error);
      return undefined;
    }
  },

  /**
   * Get wishlist count
   */
  async getWishlistCount(userId: string): Promise<number> {
    try {
      const items = await this.getUserWishlist(userId);
      return items.length;
    } catch (error) {
      console.error('Error getting wishlist count:', error);
      return 0;
    }
  },
};
