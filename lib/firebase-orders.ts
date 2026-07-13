/**
 * Order Management Service
 * Handles order creation, tracking, and management
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Order {
  id?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export const orderService = {
  /**
   * Create a new order
   */
  async createOrder(orderData: any) {
    try {
      const now = Date.now();
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      return { id: docRef.id, ...orderData, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Get orders where user is buyer
   */
  async getBuyerOrders(buyerId: string): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order));
    } catch (error) {
      console.error('Error fetching buyer orders:', error);
      return [];
    }
  },

  /**
   * Get orders where user is seller
   */
  async getSellerOrders(sellerId: string): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order));
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      return [];
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * Get single order
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'orders'), where('id', '==', orderId))
      );
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  /**
   * Get all orders (for admin)
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order));
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  },
};
