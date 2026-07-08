/**
 * Firebase Data Sync Utility
 * Syncs user data from Firebase Auth to Firestore
 * Can be run as a utility or embedded in a page
 */

import { auth, db } from './firebase';
import { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  limit,
  writeBatch 
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  region?: string;
  role: 'supplier' | 'buyer';
  profileImage?: string;
  createdAt: number;
}

/**
 * Sync Firebase Auth users to Firestore users collection
 * This creates Firestore documents for authenticated users if they don't exist
 */
export async function syncAuthUsersToFirestore(): Promise<UserProfile | undefined> {
  console.log('🔄 Syncing Firebase Auth users to Firestore...');
  
  try {
    // Get current auth user's profile info
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('⚠️  No user logged in. Cannot sync.');
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    
    // Check if user document exists in Firestore
    const userDoc = await getDocs(query(collection(db, 'users'), limit(1)));
    
    if (!userDoc.empty) {
      console.log('✅ User already synced');
      return;
    }

    // Create user profile in Firestore from Auth
    const userData: UserProfile = {
      uid: currentUser.uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email || '',
      username: currentUser.email?.split('@')[0] || `user_${currentUser.uid.slice(0, 8)}`,
      phone: '',
      region: 'UAE',
      role: 'supplier',
      profileImage: currentUser.photoURL || '',
      createdAt: currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).getTime() : Date.now(),
    };

    await setDoc(userRef, userData);
    console.log('✅ User synced to Firestore');
    return userData;
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    throw error;
  }
}

/**
 * Batch sync multiple users (for admin purposes)
 */
export async function batchSyncUsersFromAuth(): Promise<void> {
  console.log('🔄 Batch syncing all Auth users to Firestore...');
  
  try {
    // Get all existing Firestore users
    const existingUsers = await getDocs(collection(db, 'users'));
    const existingUids = new Set(existingUsers.docs.map(doc => doc.id));

    // Get current user's info as reference
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('⚠️  No user logged in. Cannot determine which users to sync.');
      return;
    }

    // Try to sync current user if not exists
    if (!existingUids.has(currentUser.uid)) {
      await syncAuthUsersToFirestore();
    }

    console.log('✅ User sync complete');
  } catch (error) {
    console.error('❌ Error batch syncing users:', error);
  }
}

/**
 * Initialize data sync - call this when app loads
 */
export async function initializeDataSync(): Promise<void> {
  console.log('🚀 Initializing data sync...');
  
  try {
    // Wait for auth to initialize
    await new Promise<void>(resolve => {
      const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
        unsubscribe();
        resolve();
      });
    });

    // Sync current user to Firestore if needed
    if (auth.currentUser) {
      await syncAuthUsersToFirestore();
    }

    console.log('✅ Data sync initialized');
  } catch (error) {
    console.error('❌ Error initializing data sync:', error);
  }
}
