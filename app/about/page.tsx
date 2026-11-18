'use client';

import Link from 'next/link';

const highlights = [
  { title: 'Global B2B Network', text: 'Connect buyers and suppliers from multiple industrial sectors in one trusted marketplace.' },
  { title: 'Verified Trust', text: 'Build business relationships on transparent communication, quality checks, and secured transactions.' },
  { title: 'Smart Trade Tools', text: 'Use product discovery, quotations, messaging, and AI-powered assistance to move faster.' },
];

const values = [
  { title: 'Transparency', desc: 'Clear listings, reliable communication, and honest business practices.' },
  { title: 'Efficiency', desc: 'Simplify sourcing, buying, and selling with streamlined workflows.' },
  { title: 'Security', desc: 'A safer environment for trade, verification, and account protection.' },
  { title: 'Innovation', desc: 'AI-powered support and digital tools designed for modern B2B growth.' },
];

const developerInfo = [
  { label: 'Developer Name', value: 'SpinTradeHub Team / Industrial Trading Platform Developer' },
  { label: 'Development Focus', value: 'B2B marketplace design, industrial product commerce, user experience, and business automation.' },
  { label: 'Technology Stack', value: 'Next.js, React, Firebase, Google Cloud, modern mobile-first web app architecture.' },
  { label: 'Primary Goal', value: 'To build a trusted digital marketplace that connects industrial buyers and suppliers efficiently.' },
];

const playStoreInfo = [
  { label: 'App Name', value: 'SpinTradeHub' },
  { label: 'Store', value: 'Google Play Store' },
  { label: 'Category', value: 'Business / Industrial Marketplace' },
  { label: 'Purpose', value: 'Provide mobile access to product browsing, buyer-seller communication, and on-the-go B2B trading.' },
  { label: 'Download Link', value: 'https://play.google.com/store/apps/details?id=dev.rahulsuthar.spintradehub' },
];

const websiteInfo = [
  { label: 'Website', value: 'https://spintradehub.com' },
  { label: 'Platform Type', value: 'Industrial B2B trading website and marketplace' },
  { label: 'Audience', value: 'Suppliers, buyers, manufacturers, distributors, and industrial business professionals' },
  { label: 'Core Features', value: 'Product feed, business networking, order support, AI assistant, messaging, and account management.' },
  { label: 'Mission', value: 'To simplify industrial trade by creating a trusted and digital-first environment for global business growth.' },
];

const appFeatures = [
  { icon: '📦', title: 'Product Marketplace', desc: 'Browse and discover industrial products from verified suppliers and businesses.' },
  { icon: '🧾', title: 'Posting & Listings', desc: 'Create product or business listings quickly with clear pricing and category tagging.' },
  { icon: '💬', title: 'Business Messaging', desc: 'Communicate directly with sellers, buyers, and partners through built-in chat tools.' },
  { icon: '🤝', title: 'Networking', desc: 'Connect with business professionals, create opportunities, and build long-term relationships.' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Use SpinBot for instant support, product guidance, platform help, and general business assistance.' },
  { icon: '✅', title: 'Verification & Trust', desc: 'Support secure account handling with login, profile setup, and trusted business identity management.' },
  { icon: '🔔', title: 'Notifications', desc: 'Stay informed with updates, inquiries, messages, and trade-related alerts.' },
  { icon: '📱', title: 'Mobile-Friendly Access', desc: 'Use the platform smoothly from both web and mobile-friendly experiences.' },
  { icon: '📈', title: 'Trade Support', desc: 'Help buyers and sellers manage sourcing, quotations, and business communication more efficiently.' },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003D9E 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <img src="/logo.png" alt="SpinTradeHub logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px', fontWeight: '600' }}>
              <span>←</span> Back Home
            </Link>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0 }}>About SpinTradeHub</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0' }}>Powering smarter industrial trade across the globe.</p>
        </div>
      </header>

      <div style={{ padding: '28px 16px 0' }}>
        <section style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: '28px 24px', marginBottom: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', letterSpacing: '1.2px', fontWeight: '700', color: '#0056D2', margin: '0 0 10px', textTransform: 'uppercase' }}>Who we are</p>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1F2937', margin: '0 0 14px' }}>We help businesses trade faster, smarter, and with more confidence.</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#4B5563', margin: 0 }}>
                SpinTradeHub is a modern B2B marketplace built for industrial buyers, suppliers, manufacturers, and service providers.
                We connect businesses across markets with a platform that makes product discovery, communication, sourcing, and transactions simpler.
              </p>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #0056D2 0%, #FF8C00 100%)', borderRadius: '20px', padding: '20px', color: 'white' }}>
              <div style={{ fontSize: '44px', marginBottom: '8px' }}>🏭</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px' }}>Built for industry</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: 'rgba(255,255,255,0.95)' }}>
                From bearings and machinery to lubricants and industrial accessories, we support the products businesses depend on every day.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0056D2', margin: '0 0 16px' }}>Why SpinTradeHub</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {highlights.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: '20px 18px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#EAF2FF', color: '#0056D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>
                  {idx === 0 ? '🌍' : idx === 1 ? '✅' : '⚙️'}
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.7' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0056D2', margin: '0 0 16px' }}>Our values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {values.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#1F2937' }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '12px', lineHeight: '1.7' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0056D2', margin: '0 0 16px' }}>Website Developer Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {developerInfo.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#0056D2', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ margin: 0, color: '#333', fontSize: '13px', lineHeight: '1.7' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0056D2', margin: '0 0 16px' }}>Google Play Store Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {playStoreInfo.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#0056D2', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{item.label}</p>
                {item.label === 'Download Link' ? (
                  <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: '#0056D2', fontSize: '13px', lineHeight: '1.7', textDecoration: 'underline', wordBreak: 'break-word' }}>
                    {item.value}
                  </a>
                ) : (
                  <p style={{ margin: 0, color: '#333', fontSize: '13px', lineHeight: '1.7' }}>{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0056D2', margin: '0 0 16px' }}>Website Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {websiteInfo.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#0056D2', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{item.label}</p>
                {item.label === 'Website' ? (
                  <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: '#0056D2', fontSize: '13px', lineHeight: '1.7', textDecoration: 'underline', wordBreak: 'break-word' }}>
                    {item.value}
                  </a>
                ) : (
                  <p style={{ margin: 0, color: '#333', fontSize: '13px', lineHeight: '1.7' }}>{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0056D2', margin: '0 0 16px' }}>App Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {appFeatures.map((feature, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#EAF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '10px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>{feature.title}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.7' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ backgroundColor: '#0056D2', borderRadius: '18px', padding: '26px 22px', textAlign: 'center', color: 'white', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: '800' }}>Ready to grow your trade network?</h2>
          <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            Join SpinTradeHub and start discovering reliable partners, products, and opportunities.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ backgroundColor: 'white', color: '#0056D2', padding: '12px 22px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>Sign Up</Link>
            <Link href="/login" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', padding: '12px 22px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', border: '1px solid rgba(255,255,255,0.3)' }}>Login</Link>
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
