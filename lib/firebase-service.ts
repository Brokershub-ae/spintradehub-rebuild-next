import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  limit,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

export interface User {
  uid: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  region: string;
  role: 'supplier' | 'buyer';
  profileImageUri?: string;
  isTwoStepEnabled?: boolean;
  recoveryEmail?: string;
}

export interface Product {
  id?: string;
  creatorId: string;
  creatorName: string;
  productName: string;
  description: string;
  price: string;
  category: string;
  imageUri?: string;
  pdfUri?: string;
  attachmentUris?: string[];
  rating: number;
  reviewCount: number;
  isFavorite?: boolean;
  postType: 'SELL' | 'BUY';
  quantity?: string;
  unit?: string;
  location?: string;
  timestamp: number;
}

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ConnectionRequest {
  id?: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface CommerceDoc {
  id?: string;
  type: 'QUOTATION' | 'INVOICE' | 'PURCHASE_BILL';
  docNumber: string;
  date: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  timestamp: number;
}

// ============ AUTH SERVICES ============

export const authService = {
  async signup(email: string, password: string, userData: Omit<User, 'uid'>) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, 'users', uid), {
      uid,
      ...userData,
      email,
    });

    return userCredential.user;
  },

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },

  getCurrentUser() {
    return auth.currentUser;
  },
};

// ============ USER SERVICES ============

export const userService = {
  async getUserProfile(uid: string): Promise<User | null> {
    const doc_ref = doc(db, 'users', uid);
    const docSnap = await getDoc(doc_ref);
    return docSnap.exists() ? (docSnap.data() as User) : null;
  },

  async updateProfile(uid: string, updates: Partial<User>) {
    await updateDoc(doc(db, 'users', uid), updates);
  },

  async searchUsers(query: string): Promise<User[]> {
    const q = query_fn(
      collection(db, 'users'),
      where('username', '>=', query),
      where('username', '<=', query + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => doc.data() as User)
      .filter((u) => u.uid !== auth.currentUser?.uid);
  },

  async uploadProfileImage(uid: string, file: File): Promise<string> {
    const storageRef = ref(storage, `profiles/${uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },
};

// ============ PRODUCT/POST SERVICES ============

export const productService = {
  async createPost(product: Omit<Product, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...product,
      timestamp: Date.now(),
    });
    return docRef.id;
  },

  async getPosts(): Promise<Product[]> {
    const q = query(
      collection(db, 'posts'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  },

  async getPostsByCategory(category: string): Promise<Product[]> {
    const q = query(
      collection(db, 'posts'),
      where('category', '==', category),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  },

  async getPostsByCreator(creatorId: string): Promise<Product[]> {
    const q = query(
      collection(db, 'posts'),
      where('creatorId', '==', creatorId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  },

  async updatePost(postId: string, updates: Partial<Product>) {
    await updateDoc(doc(db, 'posts', postId), updates);
  },

  async deletePost(postId: string) {
    await deleteDoc(doc(db, 'posts', postId));
  },

  async uploadImage(postId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `posts/${postId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },
};

// ============ CONNECTION SERVICES ============

export const connectionService = {
  async sendConnectionRequest(request: Omit<ConnectionRequest, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'connectionRequests'), {
      ...request,
      timestamp: Date.now(),
    });
    return docRef.id;
  },

  async getConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    const q = query(
      collection(db, 'connectionRequests'),
      where('receiverId', '==', userId),
      where('status', '==', 'PENDING')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ConnectionRequest));
  },

  async acceptConnectionRequest(requestId: string) {
    await updateDoc(doc(db, 'connectionRequests', requestId), {
      status: 'ACCEPTED',
    });
  },

  async rejectConnectionRequest(requestId: string) {
    await updateDoc(doc(db, 'connectionRequests', requestId), {
      status: 'REJECTED',
    });
  },
};

// ============ MESSAGE SERVICES ============

export const messageService = {
  async sendMessage(message: Omit<Message, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...message,
      timestamp: Date.now(),
    });
    return docRef.id;
  },

  async getConversation(conversationId: string): Promise<Message[]> {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
  },

  async getConversations(userId: string) {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  },
};

// ============ COMMERCE SERVICES ============

export const commerceService = {
  async createDocument(doc_data: Omit<CommerceDoc, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'commerce'), {
      ...doc_data,
      timestamp: Date.now(),
    });
    return docRef.id;
  },

  async getDocuments(userId: string): Promise<CommerceDoc[]> {
    const q = query(
      collection(db, 'commerce'),
      where('senderId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CommerceDoc));
  },

  async updateDocumentStatus(docId: string, status: string) {
    await updateDoc(doc(db, 'commerce', docId), { status });
  },
};

// Alias for Firestore query function
const query_fn = query;
