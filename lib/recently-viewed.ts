const LIMIT = 12;
export const recentProductsKey = (userId: string) => `spintradehub:recent-products:${userId}`;

export function readRecentlyViewed(storage: Pick<Storage, 'getItem'>, userId: string): string[] {
  const raw = storage.getItem(recentProductsKey(userId));
  if (!raw) return [];
  const ids: unknown = JSON.parse(raw);
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id || id.includes('/'))) {
    throw new Error('Saved browsing history is invalid. Clear history to reset it.');
  }
  return Array.from(new Set<string>(ids)).slice(0, LIMIT);
}

export function recordRecentlyViewed(storage: Pick<Storage, 'getItem' | 'setItem'>, userId: string, productId: string): void {
  if (!productId || productId.includes('/')) throw new Error('Invalid product reference.');
  const ids = [productId, ...readRecentlyViewed(storage, userId).filter(id => id !== productId)].slice(0, LIMIT);
  storage.setItem(recentProductsKey(userId), JSON.stringify(ids));
}
