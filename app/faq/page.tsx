'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FaqPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is SpinTradeHub?',
      a: 'SpinTradeHub is a B2B industrial trading platform that connects suppliers, manufacturers, and buyers globally. It enables businesses to buy and sell industrial products like bearings, lubricants, machinery, and more.'
    },
    {
      q: 'How do I create an account?',
      a: 'Click the Sign Up button on the homepage, fill in your details (name, email, phone, country, role), and create a password. You can sign up as either a Supplier or Buyer.'
    },
    {
      q: 'What are the costs?',
      a: 'SpinTradeHub is free to join. Basic account creation and browsing are completely free. We may offer premium features in the future.'
    },
    {
      q: 'How do I create a product listing?',
      a: 'After logging in, go to your Dashboard and click "Create New Listing". Fill in product details including name, description, price, category, and upload images. Your listing will be live immediately.'
    },
    {
      q: 'How do I send an inquiry to a supplier?',
      a: 'Browse products in the Marketplace, click on a product to view details, and click "Send Inquiry". You can include specific questions or request a quotation.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'SpinTradeHub facilitates connections between buyers and suppliers. Payment methods are agreed upon directly between trading partners.'
    },
    {
      q: 'How is my data secure?',
      a: 'We use Firebase for secure authentication and encryption. All data is encrypted in transit and at rest. We comply with international data protection standards.'
    },
    {
      q: 'How do I connect with other businesses?',
      a: 'Visit the Network section, browse suggested users or search for specific businesses. Send connection requests to other traders to build your professional network.'
    },
    {
      q: 'Can I send quotations and invoices?',
      a: 'Yes! Use the Commerce Management feature in your Dashboard to create quotations, invoices, and purchase orders. You can track their status and communicate with trading partners.'
    },
    {
      q: 'How do ratings and reviews work?',
      a: 'After completing trades, both parties can rate and review each other. These ratings help build trust and visibility in the marketplace.'
    },
    {
      q: 'Is there customer support?',
      a: 'Yes, we provide email support at support@spintradehub.com and phone support. Check the Settings page for contact details.'
    },
    {
      q: 'What languages are supported?',
      a: 'SpinTradeHub supports 40+ languages including English, Arabic, Hindi, Chinese, Spanish, French, and many more.'
    },
    {
      q: 'Can I use SpinTradeHub on mobile?',
      a: 'Yes, SpinTradeHub is fully responsive and works on all devices including smartphones and tablets.'
    },
    {
      q: 'How do I delete my account?',
      a: 'Go to Settings > Account and look for account deletion options, or contact our support team for assistance.'
    },
    {
      q: 'Is two-factor authentication available?',
      a: 'Yes, you can enable two-factor authentication in your Settings > Privacy & Safety to add extra security to your account.'
    }
  ];

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px', marginBottom: '8px' }}>
            <span>←</span> Back Home
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>FAQ</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Frequently Asked Questions</p>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
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
