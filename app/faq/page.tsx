'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQS } from '@/lib/faq-data';

export default function FaqPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const faqs = FAQS;

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <img src="/logo.png" alt="SpinTradeHub logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px' }}>
              <span>←</span> Back Home
            </Link>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>FAQ</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Frequently Asked Questions</p>
        </div>
      </header>

      <div style={{ padding: '24px 16px' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '8px', overflow: 'hidden' }}>
            <button onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)} style={{ width: '100%', padding: '16px', textAlign: 'left', backgroundColor: expandedIdx === idx ? '#F0F7FF' : 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 200ms' }}>
              <span>{faq.q}</span>
              <span style={{ fontSize: '16px' }}>{expandedIdx === idx ? '−' : '+'}</span>
            </button>
            {expandedIdx === idx && (
              <div style={{ padding: '12px 16px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E0E0E0', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/features" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>✨</span>
          <span>Features</span>
        </Link>
        <Link href="/faq" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>❓</span>
          <span>FAQ</span>
        </Link>
        <Link href="/contact" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📧</span>
          <span>Contact</span>
        </Link>
      </nav>
    </div>
  );
}
