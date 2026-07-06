'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('privacy');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>Settings</h1>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>Back</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: 'white', borderRadius: '8px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
          {['privacy', 'notifications', 'account', 'help'].map((tab, idx) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: '1', padding: '10px 12px', backgroundColor: activeTab === tab ? '#0056D2' : 'white', color: activeTab === tab ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', minWidth: '100px' }}>
              {tab === 'privacy' ? '🔒 Privacy' : tab === 'notifications' ? '🔔 Notify' : tab === 'account' ? '👤 Account' : '❓ Help'}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>Privacy & Safety</h2>
              {[
                { title: '🔐 Two-Factor Authentication', desc: 'Add extra security', enabled: twoFactorEnabled, toggle: () => setTwoFactorEnabled(!twoFactorEnabled) },
                { title: '👁️ Profile Visibility', desc: 'Control who sees your profile', enabled: true }
              ].map((item, idx) => (
                <div key={idx} style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #E0E0E0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: 0 }}>{item.title}</p>
                      <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0 0' }}>{item.desc}</p>
                    </div>
                    {item.toggle && (
                      <button onClick={item.toggle} style={{ padding: '6px 12px', backgroundColor: item.enabled ? '#4CAF50' : '#E0E0E0', color: item.enabled ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        {item.enabled ? 'On' : 'Off'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>Notifications</h2>
              {[
                { label: '📧 Email Notifications', enabled: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
                { label: '📱 Push Notifications', enabled: pushNotifications, toggle: () => setPushNotifications(!pushNotifications) }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>{item.label}</span>
                  <button onClick={item.toggle} style={{ padding: '6px 12px', backgroundColor: item.enabled ? '#4CAF50' : '#E0E0E0', color: item.enabled ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    {item.enabled ? 'On' : 'Off'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>Account Settings</h2>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Email: {user?.email}</p>
              <button onClick={handleLogout} style={{ padding: '10px 24px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} onMouseOver={(e) => (e.currentTarget.style.background = '#da190b')} onMouseOut={(e) => (e.currentTarget.style.background = '#F44336')}>
                Logout
              </button>
            </div>
          )}

          {activeTab === 'help' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>Help & Support</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/faq" style={{ padding: '12px 16px', backgroundColor: 'rgba(0,86,210,0.1)', color: '#0056D2', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                  → View FAQ
                </Link>
                <Link href="/contact" style={{ padding: '12px 16px', backgroundColor: 'rgba(0,86,210,0.1)', color: '#0056D2', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                  → Contact Support
                </Link>
                <Link href="/about" style={{ padding: '12px 16px', backgroundColor: 'rgba(0,86,210,0.1)', color: '#0056D2', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                  → About Us
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
        <Link href="/settings" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
