import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export interface PublicSupplier {
  id: string;
  name: string;
  username: string;
  region: string;
  joinedAt: number;
  productCount: number;
  avgRating: number;
  reviewCount: number;
}
export interface PopularSearch { term: string; count: number }
export type PublicBuyer = Omit<PublicSupplier, 'productCount'>;
export interface SavedSearch { id: string; brand: string; modelNumber: string }

export async function getPublicBuyers(): Promise<PublicBuyer[]> {
  const snapshot = await getDocs(query(collection(db, 'publicBuyers'), orderBy('joinedAt', 'desc'), limit(100)));
  return snapshot.docs.map(item => {
    const data = item.data();
    for (const key of ['joinedAt', 'avgRating', 'reviewCount']) {
      if (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0) throw new Error('Invalid buyer summary');
    }
    return {
      id: item.id, name: String(data.name || ''), username: String(data.username || ''), region: String(data.region || ''),
      joinedAt: data.joinedAt, avgRating: data.avgRating, reviewCount: data.reviewCount,
    };
  });
}

export async function getPublicSuppliers(): Promise<PublicSupplier[]> {
  const snapshot = await getDocs(query(collection(db, 'publicSuppliers'), orderBy('joinedAt', 'desc'), limit(100)));
  return snapshot.docs.map(item => {
    const data = item.data();
    for (const key of ['joinedAt', 'productCount', 'avgRating', 'reviewCount']) {
      if (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0) throw new Error('Invalid supplier summary');
    }
    return {
      id: item.id, name: String(data.name || ''), username: String(data.username || ''), region: String(data.region || ''),
      joinedAt: data.joinedAt, productCount: data.productCount, avgRating: data.avgRating, reviewCount: data.reviewCount,
    };
  });
}

export async function getPopularSearches(): Promise<PopularSearch[]> {
  const snapshot = await getDocs(query(collection(db, 'publicSearchStats'), orderBy('count', 'desc'), limit(6)));
  return snapshot.docs.map(item => {
    const data = item.data();
    if (typeof data.term !== 'string' || !data.term.trim() || !Number.isSafeInteger(data.count) || data.count < 1) throw new Error('Invalid search activity summary');
    return { term: data.term, count: data.count };
  });
}

export async function recordCatalogSearch(userId: string, productId: string, term: string): Promise<void> {
  const day = Math.floor(Date.now() / 86400000);
  const reference = doc(db, 'searchActivity', `${userId}_${day}`);
  if ((await getDoc(reference)).exists()) return;
  try {
    await setDoc(reference, { userId, productId, term: term.trim(), day });
  } catch (error) {
    // Concurrent tabs may submit the same account's first search together.
    if (!(await getDoc(reference)).exists()) throw error;
  }
}

export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  const snapshot = await getDocs(query(collection(db, 'savedSearches'), where('userId', '==', userId)));
  return snapshot.docs.map(item => ({ id: item.id, brand: String(item.data().brand || ''), modelNumber: String(item.data().modelNumber || '') }));
}

export async function saveSearch(userId: string, brand: string, modelNumber: string): Promise<void> {
  brand = brand.trim().replace(/\s+/g, ' ');
  modelNumber = modelNumber.trim().replace(/\s+/g, ' ');
  if ((!brand && !modelNumber) || brand.length > 100 || modelNumber.length > 100) {
    throw new Error('Enter a brand or part number, up to 100 characters each.');
  }
  const bytes = new TextEncoder().encode(`${userId}:${JSON.stringify([brand.toLowerCase(), modelNumber.toLowerCase()])}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const id = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const reference = doc(db, 'savedSearches', id);
  if ((await getDoc(reference)).exists()) return;
  try {
    await setDoc(reference, { userId, brand, modelNumber, createdAt: Date.now() });
  } catch (error) {
    if (!(await getDoc(reference)).exists()) throw error;
  }
}

export async function removeSavedSearch(id: string): Promise<void> {
  await deleteDoc(doc(db, 'savedSearches', id));
}
