'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { syncAuthUsersToFirestore } from './firebase-sync-utils';
import { initializeRealtimeSync, stopAllListeners } from './realtime-sync';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const logout = async () => {
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
