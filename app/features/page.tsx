'use client';

import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      icon: '🛒',
      title: 'Product Marketplace',
      desc: 'Browse thousands of industrial products from verified suppliers worldwide.'
    },
    {
      icon: '🔍',
      title: 'Advanced Search',
      desc: 'Filter by category, price range, supplier rating, and product specifications.'
    },
    {
      icon: '👥',
      title: 'Business Networking',
      desc: 'Connect with suppliers, manufacturers, and buyers to expand your network.'
    },
    {
      icon: '💬',
      title: 'Real-Time Messaging',
      desc: 'Communicate directly with suppliers and buyers through integrated chat.'
    },
    {
      icon: '📋',
      title: 'Inquiry Management',
      desc: 'Send product inquiries and receive quotations from multiple suppliers.'
    },
    {
      icon: '📄',
      title: 'Commerce Documents',
      desc: 'Create and manage quotations, invoices, and purchase orders seamlessly.'
    },
    {
      icon: '📦',
      title: 'Inventory Tracking',
      desc: 'Manage your product inventory and track order status in real-time.'
    },
    {
      icon: '⭐',
      title: 'Rating & Reviews',
      desc: 'Rate suppliers and share feedback to help the community make informed decisions.'
    },
    {
      icon: '🔐',
      title: 'Secure Platform',
      desc: 'Enterprise-grade security with Firebase authentication and encryption.'
    },
    {
      icon: '📱',
      title: 'Multi-Device Support',
      desc: 'Access SpinTradeHub on desktop, tablet, or smartphone seamlessly.'
    },
    {
      icon: '🌍',
      title: 'Multi-Language',
      desc: 'Support for 40+ languages to serve global traders and businesses.'
    },
    {
      icon: '✅',
      title: 'Verified Sellers',
      desc: 'Trade with confidence using our verified and rated supplier system.'
    }
  ];

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px', marginBottom: '8px' }}>
            <span>←</span> Back Home
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>Platform Features</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Everything for B2B trading</p>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {features.map((feat, idx) => (
            <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', textAlign: 'center', transition: 'all 200ms' }} onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)', e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)', e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>{feat.title}</h3>
              <p style={{ fontSize: '12px', color: '#999', margin: 0, lineHeight: '1.5' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/features" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>✨</span>
          <span>Features</span>
        </Link>
        <Link href="/about" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>ℹ️</span>
          <span>About</span>
        </Link>
        <Link href="/faq" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>❓</span>
          <span>FAQ</span>
        </Link>
      </nav>
    </div>
  );
}
