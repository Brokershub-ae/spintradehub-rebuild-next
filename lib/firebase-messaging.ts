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
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { userService } from './firebase-service';

export interface Attachment {
  id?: string;
  type: 'image' | 'pdf' | 'document';
  fileName: string;
  fileUrl: string;
  documentType?: 'quotation' | 'invoice' | 'bill'; // For document type
  size?: number;
  uploadedAt?: number;
}

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: number;
  read: boolean;
  attachments?: Attachment[];
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
   * Upload attachment file
   */
  async uploadAttachment(
    userId: string,
    file: File,
    attachmentType: 'image' | 'pdf' | 'document'
  ): Promise<{ url: string; name: string }> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const storagePath = `messages/${userId}/${attachmentType}s/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      return { url, name: file.name };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  },

  /**
   * Send a message with optional attachments
   */
  async sendMessage(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    text: string,
    attachments?: Attachment[]
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
        attachments: attachments || [],
      });
      return { id: docRef.id, senderId, senderName, receiverId, receiverName, text, timestamp: Date.now(), read: false, attachments };
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

  /**
   * Get or create a conversation with a specific user
   * Used when clicking message button on connected users
   */
  async getOrCreateConversation(
    currentUserId: string,
    otherUserId: string
  ): Promise<Conversation> {
    try {
      // First try to find existing conversation
      const messages = await this.getMessages(currentUserId, otherUserId);
      if (messages.length > 0) {
        // Conversation exists, return it
        const lastMsg = messages[messages.length - 1];
        return {
          id: [currentUserId, otherUserId].sort().join('_'),
          userId: currentUserId,
          otherUserId,
          otherUserName: lastMsg.receiverId === otherUserId ? lastMsg.receiverName : lastMsg.senderName,
          lastMessage: lastMsg.text,
          lastMessageTime: lastMsg.timestamp,
          unreadCount: 0,
        };
      }

      // No existing conversation, fetch the other user's profile
      const userProfile = await userService.getUserProfile(otherUserId);
      return {
        id: [currentUserId, otherUserId].sort().join('_'),
        userId: currentUserId,
        otherUserId,
        otherUserName: userProfile?.name || 'User',
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0,
      };
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      // Return a minimal conversation object
      return {
        id: [currentUserId, otherUserId].sort().join('_'),
        userId: currentUserId,
        otherUserId,
        otherUserName: 'User',
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0,
      };
    }
  },

  /**
   * Listen to conversations in real-time
   * Updates whenever new messages arrive or are sent
   */
  listenToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ) {
    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const conversationMap = new Map<string, Conversation>();

        snapshot.docs.forEach((doc) => {
          const msg = doc.data() as Message;

          // Process if user is sender
          if (msg.senderId === userId) {
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
            } else {
              // Update existing conversation with newer message
              const conv = conversationMap.get(key)!;
              if (msg.timestamp > conv.lastMessageTime) {
                conv.lastMessage = msg.text;
                conv.lastMessageTime = msg.timestamp;
              }
            }
          }

          // Process if user is receiver
          if (msg.receiverId === userId) {
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
          }
        });

        const conversations = Array.from(conversationMap.values()).sort(
          (a, b) => b.lastMessageTime - a.lastMessageTime
        );
        callback(conversations);
      });
    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      return undefined;
    }
  },
};
