'use client';

import { useState } from 'react';
import Link from 'next/link';

const brandData = [
  {
    id: 'brand-partner',
    name: 'Trusted Industrial Partner',
    shortName: 'Brand',
    country: 'Global',
    tagline: 'Industrial products and sourcing solutions built for reliable trade growth.',
    about: 'This partner represents a trusted industrial brand focused on quality-driven solutions, dependable sourcing, and strong production support across machinery, automotive, and industrial supply networks. The business model is built around long-term buyer relationships, efficient global trade support, and reliable product availability for demanding operational environments.',
    products: [
      {
        name: 'Industrial Components',
        description: 'Reliable products designed for high-performance industrial operations and maintenance workflows.',
        badge: 'Core Supply',
      },
      {
        name: 'Machinery Accessories',
        description: 'Essential gear and support parts for equipment reliability and operational continuity.',
        badge: 'Reliable',
      },
      {
        name: 'Precision Parts',
        description: 'Durable precision components for manufacturing and heavy-duty industrial use.',
        badge: 'Precision',
      },
      {
        name: 'Automation Support',
        description: 'Efficient solutions that help improve machine uptime and production performance.',
        badge: 'Efficiency',
      },
      {
        name: 'OEM Solutions',
        description: 'Business-ready support for OEM supply, replacements, and industrial procurement needs.',
        badge: 'OEM',
      },
      {
        name: 'Aftermarket Supply',
        description: 'Service and replacement support for shops, distributors, and industrial buyers worldwide.',
        badge: 'Support',
      },
      {
        name: 'Bulk Trade Support',
        description: 'Flexible sourcing and distribution support for ongoing industrial operations and procurement teams.',
        badge: 'Bulk',
      },
    ],
    details: [
      { label: 'Brand Origin', value: 'Global' },
      { label: 'Industry', value: 'Industrial & Automotive Supply' },
      { label: 'Core Focus', value: 'Reliable solutions for sourcing, procurement, and mechanical performance' },
      { label: 'Typical Applications', value: 'Manufacturing, logistics, machinery, automotive, and maintenance operations' },
      { label: 'Quality Standard', value: 'Built for consistency, service life, and dependable performance' },
      { label: 'Business Value', value: 'Strong supply support for industrial buyers, partners, and trade networks' },
    ],
  },
];

export default function BrandPartnersPage() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003D9E 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ padding: '18px 16px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
            <span>←</span> Back Home
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0 }}>Brand Partners</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0' }}>Global collaboration for industrial products and trusted trade growth.</p>
        </div>
      </header>

      <div style={{ padding: '28px 16px 0' }}>
        <section style={{ backgroundColor: '#f3f4f6', borderRadius: '24px', boxShadow: '0 10px 30px rgba(15,23,42,0.06)', padding: '28px', marginBottom: '28px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              style={{
                background: 'linear-gradient(135deg, #0a63e5 0%, #0056d2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '18px',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(0,86,210,0.16)',
                minWidth: '230px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                letterSpacing: '0.02em',
              }}
            >
              <img
                src="/logo.png"
                alt="Brand logo"
                style={{
                  width: '30px',
                  height: '30px',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '4px',
                }}
              />
              Trusted Partner
            </button>
          </div>

          {isExpanded && (
            <div style={{ display: 'grid', gap: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '18px', alignItems: 'stretch' }}>
                <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eaf2ff 100%)', borderRadius: '20px', border: '1px solid #dbeafe', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                  <img
                    src="/logo.png"
                    alt="Brand logo"
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 18px rgba(37, 99, 235, 0.12))',
                    }}
                  />
                </div>

                <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f3f7ff 100%)', borderRadius: '20px', border: '1px solid #dfeafc', padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#0056D2', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '800', marginBottom: '8px' }}>Featured Partner</div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>{brandData[0].name}</h3>
                  <p style={{ margin: '0 0 14px', fontSize: '15px', lineHeight: '1.8', color: '#475569' }}>
                    {brandData[0].tagline}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {brandData[0].products.slice(0, 4).map((product) => (
                      <span key={product.name} style={{ backgroundColor: 'white', border: '1px solid #dbeafe', borderRadius: '999px', padding: '7px 10px', fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{product.name}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e5e7eb', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#0056D2', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '800', marginBottom: '8px' }}>About the brand</div>
                <h3 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>About this partner</h3>
                <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>{brandData[0].about}</p>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e5e7eb', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#0056D2', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '800', marginBottom: '8px' }}>Products</div>
                <h3 style={{ margin: '0 0 18px', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>Product Range</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                  {brandData[0].products.map((product) => (
                    <div key={product.name} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #edf4ff 100%)', border: '1px solid #dbeafe', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(15,23,42,0.04)' }}>
                      <div style={{ height: '110px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontWeight: '900', fontSize: '24px', letterSpacing: '0.06em' }}>
                        {product.badge}
                      </div>
                      <div style={{ padding: '18px 16px 20px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>{product.name}</div>
                        <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#475569' }}>{product.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e5e7eb', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#0056D2', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '800', marginBottom: '8px' }}>Brand Details</div>
                <h3 style={{ margin: '0 0 18px', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>Key Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                  {brandData[0].details.map((item) => (
                    <div key={item.label} style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '18px 16px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '800', color: '#0056D2', letterSpacing: '1px', textTransform: 'uppercase' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
