'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const sampleProducts = [
    { id: 1, name: 'Deep Groove Ball Bearings', price: '$45.00', category: 'Bearings', image: 'https://via.placeholder.com/150/0056D2/ffffff?text=Bearing', rating: 4.5, seller: 'Industrial Solutions Inc' },
    { id: 2, name: 'Premium Lubricating Oil', price: '$120.00', category: 'Lubricants', image: 'https://via.placeholder.com/150/FF8C00/ffffff?text=Oil', rating: 4.8, seller: 'Oil Experts Ltd' },
    { id: 3, name: 'Industrial Grease 500g', price: '$35.50', category: 'Accessories', image: 'https://via.placeholder.com/150/0056D2/ffffff?text=Grease', rating: 4.2, seller: 'Grease World' }
  ];

  const categories = ['Bearings', 'Belts', 'Lubricants', 'Accessories', 'Materials', 'Machinery', 'Other'];

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0041A8 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} className="sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
          {/* Centered Logo & Brand */}
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="SpinTrade Logo" style={{ height: '80px', objectFit: 'contain' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', margin: 0, letterSpacing: '1px' }}>SpinTrade</h1>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#FF8C00', margin: '4px 0 0 0', letterSpacing: '3px' }}>HUB</p>
            </div>
          </div>

          {/* Login/Signup Buttons Centered */}
          <div className="flex gap-2">
            <Link href="/login" style={{ color: 'white', fontSize: '14px', padding: '10px 20px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', textDecoration: 'none', fontWeight: '600', border: '1px solid rgba(255,255,255,0.3)', transition: 'all 200ms' }} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)';}}>
              Login
            </Link>
            <Link href="/signup" style={{ color: '#0056D2', fontSize: '14px', padding: '10px 20px', borderRadius: '8px', backgroundColor: 'white', textDecoration: 'none', fontWeight: '600', transition: 'all 200ms' }} onMouseEnter={(e) => {e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)';}} onMouseLeave={(e) => {e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)';}}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0056D2', margin: '0 0 8px 0' }}>Welcome to SpinTradeHub</h2>
          <p style={{ fontSize: '14px', color: '#666', margin: 0, lineHeight: '1.6' }}>The world's leading B2B marketplace for industrial products. Connect with suppliers and buyers globally.</p>
          <div className="flex gap-3 mt-4">
            <Link href="/signup" style={{ backgroundColor: '#FF8C00', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' }}>Start Trading</Link>
            <Link href="/faq" style={{ backgroundColor: 'white', color: '#0056D2', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', display: 'inline-block', border: '2px solid #0056D2' }}>Learn More</Link>
          </div>
        </div>

        {/* Download Android App Promotion */}
        <div style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #E67E00 100%)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(255,140,0,0.3)', textAlign: 'center', color: 'white' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0' }}>📱 Trade On The Go</h3>
          <p style={{ fontSize: '16px', margin: '0 0 20px 0', opacity: 0.95 }}>Download our mobile app for seamless B2B trading anywhere, anytime</p>
          <a 
            href="https://play.google.com/store/apps/details?id=dev.rahulsuthar.spintradehub" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              backgroundColor: 'white', 
              color: '#FF8C00', 
              padding: '14px 32px', 
              borderRadius: '12px', 
              textDecoration: 'none', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              display: 'inline-block',
              transition: 'all 200ms',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';}}
          >
            🔗 Download on Google Play
          </a>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#999', fontSize: '20px' }}>🔍</span>
          <input type="text" placeholder="Search products..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {categories.map((cat) => (
            <button key={cat} style={{ backgroundColor: '#0056D2', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 200ms' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#003ba6')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#0056D2')}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingBottom: '12px' }}>
          <select style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '13px', backgroundColor: 'white' }}>
            <option>Sort: Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Rated</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sampleProducts.map((product) => (
            <Link key={product.id} href={`/${product.id}`} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 200ms', display: 'flex', flexDirection: 'column' }}
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', backgroundColor: '#E0E0E0' }} />
              <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#0056D2', backgroundColor: 'rgba(0,86,210,0.1)', borderRadius: '8px', padding: '4px 8px', alignSelf: 'flex-start', marginBottom: '8px' }}>{product.category}</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0', lineHeight: '1.3' }}>{product.name}</h3>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0' }}>by {product.seller}</p>
                <div style={{ fontSize: '12px', color: '#FF8C00', marginBottom: '8px' }}>⭐ {product.rating} (24 reviews)</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0056D2', marginTop: 'auto' }}>{product.price}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056D2', marginBottom: '16px' }}>Why Use SpinTradeHub?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { icon: '📦', title: 'Product Feed', desc: 'Browse thousands of products' },
              { icon: '✏️', title: 'Create Posts', desc: 'List SELL or BUY easily' },
              { icon: '🤝', title: 'Network', desc: 'Connect with traders' },
              { icon: '💬', title: 'Chat', desc: 'Direct messaging' },
              { icon: '🤖', title: 'Chatbot', desc: '24/7 AI support' },
              { icon: '❤️', title: 'Wishlist', desc: 'Save favorite deals' }
            ].map((feat, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{feat.icon}</div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>{feat.title}</h4>
                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#0056D2', borderRadius: '16px', padding: '24px', textAlign: 'center', marginTop: '32px', marginBottom: '32px', color: 'white' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Ready to Start Trading?</h2>
          <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: 'rgba(255,255,255,0.9)' }}>Join thousands of businesses buying and selling products</p>
          <Link href="/signup" style={{ backgroundColor: '#FF8C00', color: 'white', padding: '12px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' }}>Create Free Account</Link>
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px' }}>
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
