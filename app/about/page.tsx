'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px', marginBottom: '8px' }}>
            <span>←</span> Back Home
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>About SpinTradeHub</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Revolutionizing B2B Trading</p>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        {[
          { title: 'Our Mission', content: 'SpinTradeHub simplifies industrial procurement worldwide, connecting suppliers, manufacturers, and buyers in a transparent, secure, and efficient digital marketplace.' },
          { title: 'Our Vision', content: 'To become the world\'s leading B2B industrial trading platform, enabling businesses to access global markets and build reliable relationships.' }
        ].map((sec, idx) => (
          <section key={idx} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056D2', marginBottom: '12px' }}>{sec.title}</h2>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>{sec.content}</p>
          </section>
        ))}

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056D2', marginBottom: '16px' }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {[
              { title: 'Transparency', desc: 'Complete visibility' },
              { title: 'Security', desc: 'Enterprise-grade' },
              { title: 'Efficiency', desc: 'Streamlined processes' },
              { title: 'Reliability', desc: 'Verified partners' },
              { title: 'Innovation', desc: 'Cutting-edge tech' },
              { title: 'Community', desc: 'Global business' }
            ].map((val, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '16px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', margin: '0 0 4px 0' }}>{val.title}</h3>
                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{val.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ backgroundColor: '#0056D2', borderRadius: '16px', padding: '24px', textAlign: 'center', color: 'white', marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Ready to Join?</h2>
          <p style={{ fontSize: '13px', margin: '0 0 16px 0', color: 'rgba(255,255,255,0.9)' }}>Start trading industrial products today</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Link href="/signup" style={{ backgroundColor: 'white', color: '#0056D2', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Sign Up</Link>
            <Link href="/login" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', border: '1px solid white' }}>Login</Link>
          </div>
        </section>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/features" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>✨</span>
          <span>Features</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
