'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { syncAuthUsersToFirestore } from './firebase-sync-utils';
import { initializeRealtimeSync, stopAllListeners } from './realtime-sync';
import { useToast } from './toast-context';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const lastMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Auto-sync user to Firestore when they login
          await syncAuthUsersToFirestore();

          // Initialize real-time sync with Firestore
          initializeRealtimeSync();
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      } else {
        // Stop all listeners when user logs out
        stopAllListeners();
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      stopAllListeners();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || !db) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;

        const message = change.doc.data() as any;
        const messageId = change.doc.id;
        if (lastMessageIdsRef.current.has(messageId)) return;

        lastMessageIdsRef.current.add(messageId);

        if (message.senderId === user.uid) return;

        const senderName = message.senderName || 'Someone';
        addToast({
          type: 'info',
          title: 'New message received',
          message: `${senderName}: ${message.text || 'Sent you a new message'}`,
          duration: 5000,
        });
      });
    });

    return () => unsubscribeMessages();
  }, [user?.uid, addToast]);

  const logout = async () => {
    if (!auth) {
      setUser(null);
      return;
    }

    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
