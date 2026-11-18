'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { wishlistService } from '@/lib/firebase-wishlist';
import { productService } from '@/lib/firebase-service';
import type { HomeProduct } from '@/lib/homepage-products';

export default function HomepageSaveButton({ product }: { product: HomeProduct }) {
  const { user, loading: authLoading } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const currentUser = useRef(user?.uid);
  currentUser.current = user?.uid;
  useEffect(() => {
    let cancelled = false;
    setSavedIds([]);
    setError('');
    setOwner(user?.uid || '');
    setLoading(true);
    if (!user) return;
    const unsubscribe = wishlistService.listenToWishlist(user.uid, items => {
      if (!cancelled) {
        setSavedIds(items.filter(item => item.productId === product.id && item.id).map(item => item.id!));
        setLoading(false);
        setError('');
      }
    }, cause => {
      if (!cancelled) setError('Saved status could not load. Refresh to retry.');
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [user?.uid, product.id]);
  if (authLoading) return <p role="status">Checking your account...</p>;
  if (!user) return <Link href="/login">Sign in to save</Link>;
  const saved = owner === user.uid && savedIds.length > 0;
  return <div style={{ padding: 12 }}>
    <button type="button" disabled={busy || loading || owner !== user.uid || Boolean(error)} aria-pressed={saved}
      onClick={async () => {
        if (inFlight.current) return;
        const uid = user.uid;
        inFlight.current = true;
        setBusy(true);
        try {
          if (saved) {
            await Promise.all(savedIds.map(id => wishlistService.removeFromWishlist(id)));
            if (currentUser.current === uid) setSavedIds([]);
          } else {
            const post = await productService.getPostById(product.id);
            if (!post) throw new Error('This listing is no longer available.');
            if (currentUser.current !== uid) return;
            const sellerId = post.creatorId || post.userId || '';
            const id = await wishlistService.addToWishlist(uid, product.id, product.productName, product.price, post.creatorName || '', sellerId, product.imageUri || '');
            if (currentUser.current === uid) setSavedIds([id]);
          }
        } catch (cause) {
          console.error('Unable to update saved product:', cause);
          if (currentUser.current === uid) setError('Saved product could not be updated. Refresh to retry.');
        } finally { inFlight.current = false; setBusy(false); }
      }} style={{ padding: '10px 14px', minHeight: 44, border: '1px solid #0056d2', borderRadius: 8, background: saved ? '#eff6ff' : 'white', color: '#0056d2', cursor: 'pointer' }}>
      {loading ? 'Loading saved status...' : busy ? 'Saving...' : saved ? 'Remove from saved' : 'Save product'}
    </button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
