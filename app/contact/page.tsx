'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState<'' | 'sent' | 'mailto'>('');
  const [brandData, setBrandData] = useState({
    brandName: '',
    category: '',
    website: '',
    country: '',
    contactName: '',
    email: '',
    phone: '',
    description: '',
  });
  const [brandSubmitted, setBrandSubmitted] = useState<'' | 'sent' | 'mailto'>('');

  const sendViaApi = async (subject: string, body: string, replyTo: string) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, replyTo }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[Contact] ${formData.subject}`;
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
    if (await sendViaApi(subject, body, formData.email)) {
      setSubmitted('sent');
    } else {
      window.location.href = `mailto:info@spintradehub.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setSubmitted('mailto');
    }
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted('');
    }, 4000);
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[Brand Listing] ${brandData.brandName}`;
    const body = [
      `Brand Name: ${brandData.brandName}`,
      `Category / Industry: ${brandData.category}`,
      `Website: ${brandData.website}`,
      `Country: ${brandData.country}`,
      `Contact Person: ${brandData.contactName}`,
      `Business Email: ${brandData.email}`,
      `Phone: ${brandData.phone}`,
      '',
      'About the brand:',
      brandData.description,
    ].join('\n');
    if (await sendViaApi(subject, body, brandData.email)) {
      setBrandSubmitted('sent');
    } else {
      window.location.href = `mailto:info@spintradehub.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setBrandSubmitted('mailto');
    }
    setTimeout(() => {
      setBrandData({
        brandName: '',
        category: '',
        website: '',
        country: '',
        contactName: '',
        email: '',
        phone: '',
        description: '',
      });
      setBrandSubmitted('');
    }, 4000);
  };

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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>Contact Us</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>We\'d love to hear from you</p>
        </div>
      </header>

      <div style={{ padding: '24px 16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>Contact Us</h1>
          <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>We'd love to hear from you</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '18px' }}>Get In Touch</h3>
            {[
              { icon: '📧', label: 'Email', value: 'info@spintradehub.com' },
              { icon: '📞', label: 'Phone', value: '+971541635009' },
              { icon: '🤝', label: 'Brand Partner Collaboration', value: 'info@spintradehub.com' },
              { icon: '🌍', label: 'Head Quarter', value: 'United Arab Emirates' }
            ].map((item, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#333', margin: '0 0 4px 0' }}>{item.icon} {item.label}</p>
                <p style={{ fontSize: '15px', color: '#555', margin: 0 }}>{item.value}</p>
              </div>
            ))}
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#333', margin: '0 0 8px 0' }}>Follow Us</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="https://www.instagram.com/spintradehub__/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
                <a href="https://www.linkedin.com/in/spintrade-hub-580371443" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                  </svg>
                  LinkedIn
                </a>
                <a href="https://play.google.com/store/apps/details?id=dev.rahulsuthar.spintradehub&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#00C4FF" d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924z"/>
                    <path fill="#FFCE00" d="M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973z"/>
                    <path fill="#00F076" d="M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/>
                    <path fill="#F63448" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z"/>
                  </svg>
                  Android App — Google Play
                </a>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Contact Form</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Your Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Subject" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <textarea placeholder="Your Message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', minHeight: '120px', fontFamily: 'inherit' }} />
              <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', transition: 'all 200ms' }} onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}>
                {submitted === 'sent' ? '✓ Message Sent!' : submitted === 'mailto' ? '✓ Opening your email app...' : 'Send Message'}
              </button>
            </form>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>List Your Brand</h3>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }}>Submit your business details to request listing on SpinTradeHub.</p>

              <form onSubmit={handleBrandSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Brand Name" value={brandData.brandName} onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Category / Industry" value={brandData.category} onChange={(e) => setBrandData({ ...brandData, category: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <input type="url" placeholder="Website" value={brandData.website} onChange={(e) => setBrandData({ ...brandData, website: e.target.value })} style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Country" value={brandData.country} onChange={(e) => setBrandData({ ...brandData, country: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Contact Person" value={brandData.contactName} onChange={(e) => setBrandData({ ...brandData, contactName: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <input type="email" placeholder="Business Email" value={brandData.email} onChange={(e) => setBrandData({ ...brandData, email: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <input type="tel" placeholder="Phone Number" value={brandData.phone} onChange={(e) => setBrandData({ ...brandData, phone: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
                <textarea placeholder="Tell us about your brand and why you want to list with us" value={brandData.description} onChange={(e) => setBrandData({ ...brandData, description: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit' }} />
                <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 200ms' }} onMouseOver={(e) => (e.currentTarget.style.background = '#0A4BB8')} onMouseOut={(e) => (e.currentTarget.style.background = '#0056D2')}>
                  {brandSubmitted === 'sent' ? '✓ Request Sent!' : brandSubmitted === 'mailto' ? '✓ Opening your email app...' : 'Submit Brand Request'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/faq" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>❓</span>
          <span>FAQ</span>
        </Link>
        <Link href="/about" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>ℹ️</span>
          <span>About</span>
        </Link>
        <Link href="/contact" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📧</span>
          <span>Contact</span>
        </Link>
      </nav>
    </div>
  );
}
