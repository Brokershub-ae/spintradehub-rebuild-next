'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { productService, type Product } from '@/lib/firebase-service';
import { getProductImages } from '@/lib/product-details';
import { readRecentlyViewed, recentProductsKey, recordRecentlyViewed } from '@/lib/recently-viewed';
import styles from './HomeDiscovery.module.css';

export function ViewedProductTracker({ id, postType }: { id: string; postType?: string }) {
  const { user } = useAuth();
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!user || postType === 'BUY') return;
    try {
      recordRecentlyViewed(window.localStorage, user.uid, id);
      setError(false);
    } catch (cause) {
      console.error('Unable to save recently viewed product:', cause);
      setError(true);
    }
  }, [user?.uid, id, postType]);
  return error ? <p role="alert">This device could not save your browsing history.</p> : null;
}

export default function RecentlyViewed() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Array<Product & { id: string }>>([]);
  const [error, setError] = useState(false);
  const [clearError, setClearError] = useState(false);
  const [owner, setOwner] = useState('');
  const version = useRef(0);
  useEffect(() => {
    let cancelled = false;
    setProducts([]);
    setError(false);
    setClearError(false);
    setOwner(user?.uid || '');
    if (!user) return;
    const load = async () => {
      const requestVersion = ++version.current;
      try {
        const ids = readRecentlyViewed(window.localStorage, user.uid);
        const results = await Promise.all(ids.map(id => productService.getPostById(id)));
        if (!cancelled && version.current === requestVersion) {
          setProducts(results.map((item, index) => item ? { ...item, id: ids[index] } : null)
            .filter((item): item is Product & { id: string } => Boolean(item && item.postType !== 'BUY')).slice(0, 6));
          setError(false);
        }
      } catch (cause) {
        console.error('Unable to load recently viewed products:', cause);
        if (!cancelled && version.current === requestVersion) setError(true);
      }
    };
    void load();
    const onStorage = (event: StorageEvent) => { if (event.key === recentProductsKey(user.uid) || event.key === null) void load(); };
    window.addEventListener('storage', onStorage);
    return () => { cancelled = true; window.removeEventListener('storage', onStorage); };
  }, [user?.uid]);
  if (!user || owner !== user.uid || (!error && !products.length)) return null;
  return <section className={styles.section} aria-labelledby="recent-heading">
    <div className={styles.heading}><h2 id="recent-heading">Recently viewed</h2>
      <button type="button" onClick={() => {
        try {
          window.localStorage.removeItem(recentProductsKey(user.uid));
          version.current++;
          setProducts([]);
          setError(false);
          setClearError(false);
        } catch (cause) {
          console.error('Unable to clear recently viewed products:', cause);
          setClearError(true);
        }
      }}>Clear history</button></div>
    <p>Saved on this device for your account. Up to six recent products.</p>
    {error && <p role="alert">Unable to load browsing history. Refresh to retry, or clear history to reset it.</p>}
    {clearError && <p role="alert">Unable to clear history. Check your browser storage settings.</p>}
    <div className={styles.products}>{products.map(product => <Link href={`/${encodeURIComponent(product.id)}`} key={product.id} className={styles.product}>
      {getProductImages(product)[0] ? <img src={getProductImages(product)[0]} alt={product.productName} className={styles.image} /> : <div className={styles.image}>No photo available</div>}
      <div className={styles.body}><h3>{product.productName}</h3><strong>{product.price?.trim() || 'Request price'}</strong></div>
    </Link>)}</div>
  </section>;
}
