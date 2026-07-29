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
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id?: string;
  userId: string;
  type: 'ORDER' | 'MESSAGE' | 'CONNECTION' | 'REVIEW' | 'SYSTEM' | 'NEW_USER_JOINED';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  link?: string;
  newUserId?: string;
  newUserName?: string;
  newUserRole?: string;
  newUserRegion?: string;
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

  /**
   * Notify all existing users about a new user signup
   */
  async notifyAllUsersAboutNewSignup(newUser: {
    uid: string;
    name: string;
    username: string;
    role: 'supplier' | 'buyer';
    email: string;
    region: string;
  }) {
    try {
      // Get all existing users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const existingUsers = usersSnapshot.docs
        .map((doc) => doc.data() as any)
        .filter((user) => user.uid !== newUser.uid);

      // Create notification for each existing user
      const notificationPromises = existingUsers.map((user) =>
        addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          type: 'NEW_USER_JOINED',
          title: `🎉 New ${newUser.role === 'buyer' ? '🛍️ Buyer' : '📦 Supplier'} Joined!`,
          message: `${newUser.name} from ${newUser.region} just joined as a ${newUser.role}. View profile and connect!`,
          read: false,
          timestamp: Date.now(),
          link: `/profile/${newUser.uid}`,
          newUserId: newUser.uid,
          newUserName: newUser.name,
          newUserRole: newUser.role,
          newUserRegion: newUser.region,
        })
      );

      await Promise.all(notificationPromises);
      console.log(`✅ Notifications sent to ${existingUsers.length} users about new ${newUser.role} signup`);
      return true;
    } catch (error) {
      console.error('Error notifying users about new signup:', error);
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },
};
