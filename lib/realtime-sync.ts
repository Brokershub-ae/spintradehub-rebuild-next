/**
 * Real-time Sync Service
 * Automatically syncs data between Android app and website via Firestore listeners
 */

import { db } from './firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  Query,
  Unsubscribe,
} from 'firebase/firestore';

// Store active listeners for cleanup
const activeListeners: Map<string, Unsubscribe> = new Map();

/**
 * Listen to all users in real-time
 * Called on app load to watch for new users from Android app
 */
export const listenToAllUsers = (callback: (users: any[]) => void) => {
  if (typeof window === 'undefined') return;

  // Cleanup previous listener if exists
  if (activeListeners.has('users')) {
    activeListeners.get('users')?.();
  }

  const usersRef = collection(db, 'users');
  const unsubscribe = onSnapshot(
    usersRef,
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(users);
    },
    (error) => {
      console.error('Error listening to users:', error);
    }
  );

  activeListeners.set('users', unsubscribe);
  return unsubscribe;
};

/**
 * Listen to all products/posts in real-time
 * Called on feed page to watch for new products from Android app
 */
export const listenToAllPosts = (callback: (posts: any[]) => void) => {
  if (typeof window === 'undefined') return;

  // Cleanup previous listener if exists
  if (activeListeners.has('posts')) {
    activeListeners.get('posts')?.();
  }

  const postsRef = collection(db, 'posts');
  const unsubscribe = onSnapshot(
    postsRef,
    (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(posts);
    },
    (error) => {
      console.error('Error listening to posts:', error);
    }
  );

  activeListeners.set('posts', unsubscribe);
  return unsubscribe;
};

/**
 * Listen to all connections in real-time
 * Called on network/profile pages to watch for new connections from Android app
 */
export const listenToAllConnections = (callback: (connections: any[]) => void) => {
  if (typeof window === 'undefined') return;

  // Cleanup previous listener if exists
  if (activeListeners.has('connections')) {
    activeListeners.get('connections')?.();
  }

  const connectionsRef = collection(db, 'connectionRequests');
  const unsubscribe = onSnapshot(
    connectionsRef,
    (snapshot) => {
      const connections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(connections);
    },
    (error) => {
      console.error('Error listening to connections:', error);
    }
  );

  activeListeners.set('connections', unsubscribe);
  return unsubscribe;
};

/**
 * Listen to specific user's data
 */
export const listenToUser = (userId: string, callback: (user: any) => void) => {
  if (typeof window === 'undefined') return;

  const userRef = collection(db, 'users');
  const q = query(userRef, where('uid', '==', userId));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const user = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
        callback(user);
      }
    },
    (error) => {
      console.error(`Error listening to user ${userId}:`, error);
    }
  );

  return unsubscribe;
};

/**
 * Listen to user's posts
 */
export const listenToUserPosts = (userId: string, callback: (posts: any[]) => void) => {
  if (typeof window === 'undefined') return;

  const postsRef = collection(db, 'posts');
  const q = query(postsRef, where('creatorId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(posts);
    },
    (error) => {
      console.error(`Error listening to user posts for ${userId}:`, error);
    }
  );

  return unsubscribe;
};

/**
 * Listen to user's connections
 */
export const listenToUserConnections = (userId: string, callback: (connections: any[]) => void) => {
  if (typeof window === 'undefined') return;

  const connectionsRef = collection(db, 'connectionRequests');
  const q = query(
    connectionsRef,
    where('status', '==', 'ACCEPTED')
    // Filter where sender or receiver is the user
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const connections = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((conn: any) => 
          conn.senderId === userId || conn.receiverId === userId
        );
      callback(connections);
    },
    (error) => {
      console.error(`Error listening to user connections for ${userId}:`, error);
    }
  );

  return unsubscribe;
};

/**
 * Stop listening to a specific data type
 */
export const stopListening = (listenerKey: string) => {
  const unsubscribe = activeListeners.get(listenerKey);
  if (unsubscribe) {
    unsubscribe();
    activeListeners.delete(listenerKey);
  }
};

/**
 * Stop all listeners (cleanup on unmount)
 */
export const stopAllListeners = () => {
  activeListeners.forEach(unsubscribe => unsubscribe());
  activeListeners.clear();
};

/**
 * Initialize real-time sync on app load
 * Start listening to all main data collections
 */
export const initializeRealtimeSync = () => {
  if (typeof window === 'undefined') return;

  console.log('🔄 Initializing real-time sync with Firebase...');

  // Listen to users
  listenToAllUsers((users) => {
    console.log('👥 Users updated from Firebase:', users.length);
  });

  // Listen to posts
  listenToAllPosts((posts) => {
    console.log('📦 Posts updated from Firebase:', posts.length);
  });

  // Listen to connections
  listenToAllConnections((connections) => {
    console.log('🤝 Connections updated from Firebase:', connections.length);
  });

  console.log('✅ Real-time sync initialized');
};
