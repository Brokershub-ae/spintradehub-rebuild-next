'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { compareUserRatings, getPublicRatedUsers, type PublicRatedUser } from '@/lib/firebase-reviews';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import HomeDiscovery from '@/components/HomeDiscovery';
import discoveryStyles from './HomepageExtras.module.css';

export default function HomeMarketplaceView() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [topRatedUsers, setTopRatedUsers] = useState<PublicRatedUser[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [ratingsError, setRatingsError] = useState(false);
  const hasShownWelcomeRef = useRef(false);
  const offersRef = useRef<HTMLDivElement | null>(null);

  const scrollOffers = (direction: number) => {
    const el = offersRef.current;
    if (el) el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  const offerBanners = [
    { href: '/feed', src: '/offer-banner.png', alt: 'White Friday Sale, 19 - 30 Nov - bearings, belts, grease and lubricants', external: false },
    { href: '/feed?category=Lubricants', src: '/lubricants-offer.png', alt: 'Shop deals ending soon - get up to 25% off on lubricants', external: false },
    { href: '/feed?category=V-Belts', src: '/offer-vbelts.png', alt: 'Shop the best V-Belts and get up to 15% off', external: false },
    { href: '/feed?search=ball%20bearing', src: '/offer-bearings.png', alt: 'Up to 40% off on ball bearings - Superbrands awarded', external: false },
    { href: '/feed', src: '/offer-yearend.png', alt: 'Year End Sale is live - get your offers today from 15 Nov to 31 Dec', external: false },
    { href: 'https://play.google.com/store/apps/details?id=dev.rahulsuthar.spintradehub', src: '/offer-app.png', alt: 'SpinTradeHub app - scan to download on Android, only on Google Play', external: true },
  ];

  useEffect(() => {
    if (!hasShownWelcomeRef.current) {
      hasShownWelcomeRef.current = true;
      const timer = window.setTimeout(() => {
        addToast({
          type: 'info',
          title: 'Welcome to SpinTradeHub',
          message: 'Browse trusted industrial offers, connect with suppliers, and request quotes faster.',
          duration: 4200,
        });
      }, 700);

      return () => window.clearTimeout(timer);
    }
  }, [addToast]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const loadTopRatedUsers = async () => {
      setLoadingRatings(true);
      setRatingsError(false);
      try {
        const rankedUsers = await getPublicRatedUsers();

        rankedUsers.sort(compareUserRatings);
        if (!cancelled) setTopRatedUsers(rankedUsers.slice(0, 4));
      } catch (error) {
        console.error('Error loading top-rated users:', error);
        if (!cancelled) setRatingsError(true);
      } finally {
        if (!cancelled) setLoadingRatings(false);
      }
    };

    loadTopRatedUsers();
    return () => { cancelled = true; };
  }, [authLoading, user?.uid]);

  const categories = [
    { label: 'Bearings', slug: 'Bearings', icon: '⚙️', accent: '#2563eb', description: 'Ball, roller, and industrial bearing solutions', badge: 'Fast movers' },
    { label: 'V-Belts', slug: 'V-Belts', icon: '🔗', accent: '#0f766e', description: 'Power transmission belts for heavy-duty machines', badge: 'Popular' },
    { label: 'Grease', slug: 'Grease', icon: '🛢️', accent: '#f59e0b', description: 'Premium grease for protection and smooth operation', badge: 'High demand' },
    { label: 'Lubricants', slug: 'Lubricants', icon: '🧴', accent: '#7c3aed', description: 'Industrial oils and lubricants for maintenance', badge: 'Bulk ready' },
    { label: 'Machinery', slug: 'Machinery', icon: '🏭', accent: '#dc2626', description: 'Equipment and machine parts for production setups', badge: 'New arrivals' },
    { label: 'Accessories', slug: 'Accessories', icon: '🧰', accent: '#ea580c', description: 'Fast-moving support components and spares', badge: 'Daily stock' },
  ];

  const deals = [
    { title: 'Bulk industrial sourcing', subtitle: 'Request quotations for the quantity you need', badge: 'Buying requests' },
    { title: 'Explore supplier storefronts', subtitle: 'Browse real member catalogues and review status', badge: 'Suppliers' },
    { title: 'Find your next part', subtitle: 'Search by product, brand or part number', badge: 'Discovery' },
  ];

  return (
    <div className={discoveryStyles.home} style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f8ff 0%, #eef5ff 100%)', paddingBottom: '90px' }}>
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0041A8 100%)', color: 'white', padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', animation: 'fadeInUp 650ms ease-out both', position: 'relative', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo_latest.png" alt="SpinTradeHub logo" style={{ width: '260px', height: '90px', objectFit: 'contain', display: 'block' }} />
          </Link>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', minWidth: 0, marginLeft: 'auto' }}>
            {[
              {
                href: 'mailto:info@spintradehub.com',
                label: 'info@spintradehub.com',
                external: false,
                icon: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#0056D2" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2v.511l-8 5.333-8-5.333V6h16zM4 18V8.914l7.445 4.963a1 1 0 0 0 1.11 0L20 8.914V18H4z"/>
                </svg>,
              },
              {
                href: 'https://play.google.com/store/apps/details?id=dev.rahulsuthar.spintradehub&pcampaignid=web_share',
                label: 'Android App',
                external: true,
                icon: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#00C4FF" d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924z"/>
                  <path fill="#FFCE00" d="M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973z"/>
                  <path fill="#00F076" d="M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/>
                  <path fill="#F63448" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z"/>
                </svg>,
              },
              {
                href: 'https://www.instagram.com/spintradehub__/',
                label: 'Instagram',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>,
              },
              {
                href: 'https://www.linkedin.com/in/spintrade-hub-580371443',
                label: 'LinkedIn',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                </svg>,
              },
            ].map(item => (
              <a key={item.label} href={item.href} {...(item.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#111827', padding: '10px 16px', borderRadius: '999px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                {item.icon} {item.label}
              </a>
            ))}
          </div>

          <details className="aboutMenu" style={{ position: 'relative' }}>
            <summary style={{ listStyle: 'none', cursor: 'pointer', background: '#f3f4f6', color: '#111827', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', userSelect: 'none', whiteSpace: 'nowrap' }}>
              About us <span aria-hidden="true" style={{ fontSize: '11px' }}>▼</span>
            </summary>
            <div className="aboutMenuList" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 12px 30px rgba(15,23,42,0.25)', padding: '8px', minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact Us' },
                { href: '/features', label: 'Features' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ padding: '10px 14px', borderRadius: '8px', color: '#111827', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#0056D2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111827'; }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </header>

      <section aria-label="Current offers" className={discoveryStyles.offerCarousel}>
        <div className={discoveryStyles.offerTrack} ref={offersRef}>
          {offerBanners.map(banner => {
            const image = <img src={banner.src} alt={banner.alt} />;
            return banner.external ?
              <a key={banner.src} className={discoveryStyles.offerCard} href={banner.href} target="_blank" rel="noopener noreferrer" aria-label={banner.alt}>{image}</a> :
              <Link key={banner.src} className={discoveryStyles.offerCard} href={banner.href} aria-label={banner.alt}>{image}</Link>;
          })}
        </div>
        <button type="button" className={`${discoveryStyles.offerNav} ${discoveryStyles.offerNavLeft}`} aria-label="Scroll offers left" onClick={() => scrollOffers(-1)}>‹</button>
        <button type="button" className={`${discoveryStyles.offerNav} ${discoveryStyles.offerNavRight}`} aria-label="Scroll offers right" onClick={() => scrollOffers(1)}>›</button>
      </section>

      <main style={{ padding: '4px 16px 0' }}>

        <HomeDiscovery afterProducts={
          <section style={{ marginTop: '18px', background: 'white', borderRadius: '22px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 12px 30px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EAF2FF', color: '#0056D2', borderRadius: '999px', padding: '8px 12px', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Premium offers</div>
                <h2 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: '900', color: '#111827' }}>Browse high-demand industrial categories with a polished offer experience</h2>
              </div>
              <Link href="/feed" style={{ color: '#0056D2', fontWeight: '800', textDecoration: 'none' }}>Open full marketplace →</Link>
            </div>

            <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {categories.map((category, index) => (
                <Link
                  key={category.label}
                  href={`/feed?category=${encodeURIComponent(category.label)}`}
                  style={{
                    minHeight: '210px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    borderRadius: '24px',
                    padding: '18px',
                    border: `1px solid ${category.accent}30`,
                    background: `linear-gradient(135deg, ${category.accent}16 0%, #ffffff 100%)`,
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
                    animation: `fadeInUp 700ms ease-out ${index * 100}ms both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 18px 38px rgba(15, 23, 42, 0.14)';
                    e.currentTarget.style.borderColor = category.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.06)';
                    e.currentTarget.style.borderColor = `${category.accent}30`;
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${category.accent}20 0%, transparent 55%)`, pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.9)', color: category.accent, padding: '6px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{category.badge}</span>
                      <span style={{ fontSize: '30px' }}>{category.icon}</span>
                    </div>
                    <div style={{ fontWeight: '900', fontSize: '17px', color: '#111827', marginBottom: '8px' }}>{category.label}</div>
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>{category.description}</div>
                    <div style={{ marginTop: 'auto', paddingTop: '14px', color: category.accent, fontWeight: '800', fontSize: '13px' }}>View offers →</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        } />

        <section style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)', borderRadius: '20px', padding: '20px', border: '1px solid #fed7aa' }}>
            <div style={{ color: '#c2410c', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Today’s deals</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#111827' }}>Big savings on premium industrial essentials</h3>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>Explore the best offers curated for trade-heavy businesses and fast-moving suppliers.</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)', borderRadius: '20px', padding: '20px', border: '1px solid #bfdbfe' }}>
            <div style={{ color: '#0056D2', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Smart support</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#111827' }}>Request quotes and chat instantly</h3>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>Move from browsing to conversation with one tap and keep your trade pipeline active.</p>
          </div>
        </section>

        <section style={{ marginTop: '18px', background: 'white', borderRadius: '22px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 12px 30px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EAF2FF', color: '#0056D2', borderRadius: '999px', padding: '8px 12px', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Trusted buyers &amp; suppliers</div>
              <h2 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: '900', color: '#111827' }}>{topRatedUsers.some(profile => profile.reviewCount > 0) ? 'Buyer & supplier ratings' : 'Discover buyers & suppliers'}</h2>
            </div>
            <Link href="/network" style={{ color: '#0056D2', fontWeight: '800', textDecoration: 'none' }}>Explore network →</Link>
          </div>

          {loadingRatings ? (
            <div style={{ padding: '16px', color: '#64748b' }}>Loading buyers and suppliers...</div>
          ) : ratingsError ? (
            <div role="alert" style={{ padding: '16px', color: '#dc2626' }}>Unable to load user ratings. Please refresh to try again.</div>
          ) : topRatedUsers.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
              {topRatedUsers.map((ratedUser) => {
                const role = ratedUser.role === 'buyer' ? 'Buyer' : 'Supplier';
                const badge = ratedUser.avgRating >= 4.8 ? 'Top Rated' : role;
                return (
                  <div key={ratedUser.uid} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: '16px', padding: '16px', border: '1px solid #dbeafe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ backgroundColor: '#0056D2', color: 'white', borderRadius: '999px', padding: '6px 10px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{badge}</span>
                      <span style={{ color: '#f59e0b', fontWeight: '800' }}>{ratedUser.reviewCount > 0 ? `★ ${ratedUser.avgRating.toFixed(1)}` : 'No reviews'}</span>
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#111827', marginBottom: '6px' }}>{ratedUser.name || ratedUser.username || role}</div>
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>Industrial {role.toLowerCase()}</div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>📍 {ratedUser.region || 'Global'} • 📝 {ratedUser.reviewCount} reviews</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '16px', border: '1px dashed #dbeafe', borderRadius: '16px', color: '#64748b' }}>Buyer and supplier profiles will appear here once available.</div>
          )}
        </section>
      </main>

      <style jsx>{`
        .aboutMenu summary::-webkit-details-marker {
          display: none;
        }
        .aboutMenuList {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          z-index: 60;
        }
        @media (max-width: 760px) {
          .aboutMenuList {
            right: auto;
            left: 0;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          60% {
            opacity: 1;
            transform: scale(1.02) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pulseSoft {
          0%, 100% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.06);
            opacity: 0.95;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '700' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/messages" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>💬</span>
          <span>Messages</span>
        </Link>
        <Link href="/network" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🤝</span>
          <span>Network</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
