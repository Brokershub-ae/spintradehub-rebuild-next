'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHomeProducts, type HomeProduct } from '@/lib/homepage-products';
import { getPopularSearches, recordCatalogSearch, type PopularSearch } from '@/lib/homepage-discovery';
import styles from './HomepageExtras.module.css';

export default function HomepageSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [popular, setPopular] = useState<PopularSearch[]>([]);
  const [popularReady, setPopularReady] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const listId = useId();
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getHomeProducts(), getPopularSearches()]).then(([catalog, searches]) => {
      if (cancelled) return;
      if (catalog.status === 'fulfilled') setProducts(catalog.value);
      else { console.error('Unable to load search suggestions:', catalog.reason); setError('Suggestions unavailable. You can still search the feed.'); }
      if (searches.status === 'fulfilled') { setPopular(searches.value); setPopularReady(true); }
      else { console.error('Unable to load popular searches:', searches.reason); setError(previous => `${previous} Popular searches could not load.`.trim()); }
    });
    return () => { cancelled = true; };
  }, []);
  const terms = new Map<string, { label: string; product: HomeProduct }>();
  for (const product of products) {
    for (const label of [product.brand, product.modelNumber, product.productName]) {
      if (label?.trim() && !terms.has(label.toLowerCase())) terms.set(label.toLowerCase(), { label, product });
    }
  }
  const suggestions = search.trim() ? [...terms.values()].filter(item => item.label.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6) : [];
  const go = async (term: string, product?: HomeProduct) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      if (user && product) await recordCatalogSearch(user.uid, product.id, term);
    } catch (cause) {
      console.error('Unable to record catalog search:', cause);
      setError('Search activity could not be recorded. Your search will still open.');
    } finally {
      router.push(term.trim() ? `/feed?search=${encodeURIComponent(term.trim())}` : '/feed');
      inFlight.current = false;
      setBusy(false);
      setExpanded(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const selected = expanded && active >= 0 ? suggestions[active] : terms.get(search.trim().toLowerCase());
    void go(selected?.label || search, selected?.product);
  };
  return <div className={styles.search} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setExpanded(false); setActive(-1); }
  }}>
    <form onSubmit={submit} className={styles.searchRow}>
      <input aria-label="Search products, brands and part numbers" role="combobox"
        aria-expanded={expanded && suggestions.length > 0} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 && suggestions[active] ? `${listId}-${active}` : undefined}
        value={search} placeholder="Product, brand or part number..."
        onFocus={() => setExpanded(true)} onChange={event => { setSearch(event.target.value); setExpanded(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setExpanded(true); setActive((active + 1) % suggestions.length); }
          if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setExpanded(true); setActive(active < 0 ? suggestions.length - 1 : (active - 1 + suggestions.length) % suggestions.length); }
          if (event.key === 'Escape') { setExpanded(false); setActive(-1); }
          if (event.key === 'Tab') setExpanded(false);
        }} />
      <button type="submit" disabled={busy}>Search</button>
    </form>
    {expanded && suggestions.length > 0 && <ul id={listId} role="listbox" aria-label="Catalog suggestions" className={styles.suggestions}>
      {suggestions.map((item, index) => <li id={`${listId}-${index}`} key={item.label} role="option" aria-selected={index === active} aria-disabled={busy}
        onMouseDown={event => event.preventDefault()} onClick={() => void go(item.label, item.product)}>
        {item.label}
      </li>)}
    </ul>}
    {error && <p role="alert" className={styles.searchNotice}>{error}</p>}
    {popular.length > 0 && <div className={styles.shortcuts}><span>Popular catalog searches</span>{popular.map(item =>
      <button type="button" key={item.term} disabled={busy} onClick={() => void go(item.term, terms.get(item.term.toLowerCase())?.product)}>{item.term}</button>
    )}<small>Based on signed-in activity: one catalog search per account per day.</small></div>}
    {popularReady && popular.length === 0 && <p className={styles.searchHint}>Popular catalog searches will appear as members search.</p>}
  </div>;
}
