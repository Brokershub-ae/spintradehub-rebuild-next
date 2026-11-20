export const MAX_PRODUCT_PHOTOS = 10;
export const MAX_PRODUCT_PHOTO_BYTES = 50 * 1024 * 1024;
export const PRODUCT_CONDITIONS = ['New', 'Used', 'Refurbished'] as const;

export interface ProductSpecifications {
  brand: string;
  modelNumber: string;
  condition: string;
  minimumOrderQuantity: string;
  minimumOrderUnit: string;
}

export const emptySpecifications: ProductSpecifications = {
  brand: '', modelNumber: '', condition: '', minimumOrderQuantity: '', minimumOrderUnit: '',
};

export function validateSpecifications(details: ProductSpecifications): void {
  if (details.condition && !PRODUCT_CONDITIONS.some(value => value === details.condition)) {
    throw new Error('Choose New, Used or Refurbished for the condition.');
  }
  const quantity = details.minimumOrderQuantity.trim();
  if (quantity && (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0)) {
    throw new Error('Minimum order quantity must be a positive number.');
  }
  if (Boolean(quantity) !== Boolean(details.minimumOrderUnit.trim())) {
    throw new Error('Provide both the minimum order quantity and its unit, or leave both blank.');
  }
}

export function validateProductPhotos(files: readonly File[], existingCount = 0): void {
  if (files.length + existingCount > MAX_PRODUCT_PHOTOS) {
    throw new Error(`A listing can have up to ${MAX_PRODUCT_PHOTOS} photos.`);
  }
  for (const file of files) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      throw new Error(`${file.name}: choose a PNG, JPEG, WebP or GIF image.`);
    }
    if (file.size > MAX_PRODUCT_PHOTO_BYTES) {
      throw new Error(`${file.name}: each photo must be 50 MB or smaller.`);
    }
  }
}

export function getProductImages(product: {
  imageUris?: unknown; imageUri?: unknown; imageUrl?: unknown; photo?: unknown;
}): string[] {
  const candidates = [
    product.imageUri || product.imageUrl || product.photo,
    ...(Array.isArray(product.imageUris) ? product.imageUris : []),
  ];
  return Array.from(new Set(candidates.filter((value): value is string =>
    typeof value === 'string' && /^https?:\/\//i.test(value)
  ))).slice(0, MAX_PRODUCT_PHOTOS);
}

export function matchesProductSearch(product: {
  productName?: string; description?: string; brand?: string; modelNumber?: string;
}, search: string): boolean {
  const text = [product.productName, product.description, product.brand, product.modelNumber]
    .filter(value => typeof value === 'string').join(' ').toLowerCase();
  return search.trim().toLowerCase().split(/\s+/).every(term => text.includes(term));
}
