/**
 * Notifications Service
 * Handles real-time notifications for users
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
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id?: string;
  userId: string;
  type: 'ORDER' | 'MESSAGE' | 'CONNECTION' | 'REVIEW' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  link?: string;
}

export const notificationService = {
  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    link?: string
  ) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        read: false,
        timestamp: Date.now(),
        link,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Notification));
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  },

  /**
   * Get all notifications
   */
  async getAllNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Notification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  /**
   * Listen to notifications in real-time
   */
  listenToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Notification));
        callback(notifications);
      });
    } catch (error) {
      console.error('Error setting up notification listener:', error);
      return undefined;
    }
  },
};
