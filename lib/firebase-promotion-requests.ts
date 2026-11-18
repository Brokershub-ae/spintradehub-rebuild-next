import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface PromotionRequestInput {
  companyName: string;
  brandName: string;
  products: string;
  category: string;
  website: string;
  country: string;
  contactName: string;
  email: string;
  description: string;
}

export async function submitPromotionRequest(input: PromotionRequestInput): Promise<string> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Please sign in to submit a promotion request.');
  if (!db) throw new Error('Promotion requests are currently unavailable. Please try again later.');

  const details = {
    companyName: input.companyName.trim(),
    brandName: input.brandName.trim(),
    products: input.products.trim(),
    category: input.category.trim(),
    website: input.website.trim(),
    country: input.country.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim(),
    description: input.description.trim(),
  };
  const requiredFields = [
    details.companyName, details.brandName, details.products, details.category,
    details.country, details.contactName, details.email, details.description,
  ];
  if (requiredFields.some((value) => !value)) {
    throw new Error('Please complete all required fields.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    throw new Error('Please enter a valid business email.');
  }
  for (const [field, value] of Object.entries(details)) {
    const maxLength = field === 'products' || field === 'description' ? 2000 : 254;
    if (value.length > maxLength) throw new Error(`${field} exceeds the maximum length.`);
  }
  if (details.website) {
    let website: URL;
    try {
      website = new URL(details.website);
    } catch {
      throw new Error('Please enter a valid website URL.');
    }
    if (!['https:', 'http:'].includes(website.protocol)) {
      throw new Error('Website must start with https:// or http://.');
    }
  }

  const request = await addDoc(collection(db, 'promotionRequests'), {
    ...details,
    userId: user.uid,
    status: 'PENDING',
    createdAt: serverTimestamp(),
  });
  return request.id;
}
