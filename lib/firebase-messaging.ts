/**
 * Messaging Service
 * Handles direct messages between users
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id?: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export const messagingService = {
  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    text: string
  ) {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        senderId,
        senderName,
        receiverId,
        receiverName,
        text,
        timestamp: Date.now(),
        read: false,
      });
      return { id: docRef.id, senderId, senderName, receiverId, receiverName, text, timestamp: Date.now(), read: false };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get all messages where user is sender or receiver
      const sentQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const receivedQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery),
      ]);

      const conversationMap = new Map<string, Conversation>();

      // Process sent messages
      sentSnap.docs.forEach((doc) => {
        const msg = doc.data() as Message;
        const key = [userId, msg.receiverId].sort().join('_');
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: key,
            userId,
            otherUserId: msg.receiverId,
            otherUserName: msg.receiverName,
            lastMessage: msg.text,
            lastMessageTime: msg.timestamp,
            unreadCount: 0,
          });
        }
      });

      // Process received messages
      receivedSnap.docs.forEach((doc) => {
        const msg = doc.data() as Message;
        const key = [userId, msg.senderId].sort().join('_');
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: key,
            userId,
            otherUserId: msg.senderId,
            otherUserName: msg.senderName,
            lastMessage: msg.text,
            lastMessageTime: msg.timestamp,
            unreadCount: msg.read ? 0 : 1,
          });
        } else {
          const conv = conversationMap.get(key)!;
          if (!msg.read) conv.unreadCount++;
          if (msg.timestamp > conv.lastMessageTime) {
            conv.lastMessage = msg.text;
            conv.lastMessageTime = msg.timestamp;
          }
        }
      });

      return Array.from(conversationMap.values()).sort(
        (a, b) => b.lastMessageTime - a.lastMessageTime
      );
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Get messages between two users
   */
  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', 'in', [userId1, userId2]),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Message))
        .filter(
          (msg) =>
            (msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1)
        );
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Listen to messages in real-time
   */
  listenToMessages(
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void
  ) {
    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Message))
          .filter(
            (msg) =>
              (msg.senderId === userId1 && msg.receiverId === userId2) ||
              (msg.senderId === userId2 && msg.receiverId === userId1)
          );
        callback(messages);
      });
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return undefined;
    }
  },
};
