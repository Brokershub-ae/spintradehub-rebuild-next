import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

export interface HomeProduct {
  id: string;
  productName: string;
  brand: string;
  modelNumber?: string;
  category: string;
  price: string;
  location: string;
  imageUri: string;
  timestamp: number;
}

export async function getHomeProducts(): Promise<HomeProduct[]> {
  const snapshot = await getDocs(query(
    collection(db, 'publicProducts'), orderBy('timestamp', 'desc'), limit(60)
  ));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    if (typeof data.productName !== 'string' || !data.productName.trim() ||
        typeof data.timestamp !== 'number' || !Number.isFinite(data.timestamp) || data.timestamp <= 0) {
      throw new Error(`Invalid public product summary: ${doc.id}`);
    }
    const text = (key: string) => typeof data[key] === 'string' ? data[key] : '';
    return {
      id: doc.id, productName: data.productName, timestamp: data.timestamp,
      brand: text('brand'), modelNumber: text('modelNumber'), category: text('category'), price: text('price'),
      location: text('location'), imageUri: text('imageUri'),
    };
  });
}

export function getHomeBrands(products: HomeProduct[]): string[] {
  const brands = new Map<string, string>();
  for (const product of products) {
    const brand = product.brand.trim();
    if (brand && !brands.has(brand.toLowerCase())) brands.set(brand.toLowerCase(), brand);
  }
  return Array.from(brands.values()).sort((a, b) => a.localeCompare(b)).slice(0, 6);
}
