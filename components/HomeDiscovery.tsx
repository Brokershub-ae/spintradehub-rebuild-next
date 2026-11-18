'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { productService } from '@/lib/firebase-service';
import { getHomeProducts, getHomeBrands, type HomeProduct } from '@/lib/homepage-products';
import styles from './HomeDiscovery.module.css';
import RecentlyViewed from './RecentlyViewed';
import HomepageSaveButton from './HomepageSaveButton';
import { sameTradingCountry } from '@/lib/discovery-country';

const emptyRequest = { productName: '', quantity: '', category: 'Bearings', location: '', description: '' };

export default function HomeDiscovery({ afterProducts }: { afterProducts?: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [request, setRequest] = useState(emptyRequest);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savedId, setSavedId] = useState('');
  const submissionInFlight = useRef(false);
  const productsRef = useRef<HTMLDivElement | null>(null);

  const scrollProducts = (direction: number) => {
    const el = productsRef.current;
    if (el) el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };
  const [country, setCountry] = useState('');

  useEffect(() => {
    let cancelled = false;
    getHomeProducts().then((items) => {
      if (!cancelled) setProducts(items);
    }).catch((error) => {
      console.error('Unable to load homepage products:', error);
      if (!cancelled) setLoadError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const brands = getHomeBrands(products);
  const visibleProducts = products.filter(product => sameTradingCountry(product.location, country));
  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlight.current) return;
    setSubmitError('');
    if (!user) {
      setSubmitError('Please sign in before publishing your buying request.');
      return;
    }
    const details = Object.fromEntries(Object.entries(request).map(([key, value]) => [key, value.trim()]));
    if (!details.productName || !details.quantity || !details.description || !details.location) {
      setSubmitError('Complete the product, quantity, delivery location and specifications.');
      return;
    }
    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      const id = await productService.createPost({
        productName: details.productName,
        quantity: details.quantity,
        description: `Quantity required: ${details.quantity}\n${details.description}`,
        category: details.category,
        location: details.location,
        postType: 'BUY',
        price: '',
        creatorId: user.uid,
        userId: user.uid,
        creatorName: user.displayName || 'Buyer',
        timestamp: Date.now(),
      });
      setSavedId(id);
      setRequest(emptyRequest);
    } catch (error) {
      console.error('Unable to publish buying request:', error);
      setSubmitError('Your buying request could not be published. Please try again.');
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <>
      <RecentlyViewed />
      <section className={`${styles.section} ${styles.bleed}`} aria-labelledby="latest-products-heading">
        <div className={styles.heading}>
          <h2 id="latest-products-heading">Latest products</h2>
          <Link href="/feed">View all products →</Link>
        </div>
        {loading ? <p role="status">Loading latest products...</p> :
          loadError ? <p role="alert">Unable to load products. Please refresh to try again.</p> :
          visibleProducts.length === 0 ? <p>{country ? 'No products match this country yet.' : 'No products available yet.'} <Link href="/create-post">Be the first to list a product.</Link></p> :
          <div className={styles.carousel}>
          <div className={styles.products} ref={productsRef}>
            {visibleProducts.slice(0, 20).map((product) => (
              <article key={product.id} className={styles.product}>
              <Link href={`/${encodeURIComponent(product.id)}`}>
                {product.imageUri ? <img src={product.imageUri} alt={product.productName} className={styles.image} loading="lazy" /> :
                  <div className={styles.image}>No photo available</div>}
                <div className={styles.body}>
                  <h3>{product.productName}</h3>
                  <strong>{product.price || 'Contact for price'}</strong>
                  <p>{product.location || 'Location not provided'}</p>
                  <span>View product →</span>
                </div>
              </Link>
              <HomepageSaveButton product={product} />
              </article>
            ))}
          </div>
          <button type="button" className={`${styles.carouselNav} ${styles.carouselNavLeft}`} aria-label="Scroll products left" onClick={() => scrollProducts(-1)}>‹</button>
          <button type="button" className={`${styles.carouselNav} ${styles.carouselNavRight}`} aria-label="Scroll products right" onClick={() => scrollProducts(1)}>›</button>
          </div>}
      </section>

      {afterProducts}
    </>
  );
}
