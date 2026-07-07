'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    region: 'UAE',
    role: 'Buyer',
    companyName: '',
    bio: '',
    website: '',
    avatar: '',
    verified: false,
  });
  const [tempData, setTempData] = useState(profileData);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Load from localStorage
    const saved = localStorage.getItem(`profile_${user.uid}`);
    if (saved) {
      setProfileData(JSON.parse(saved));
      setTempData(JSON.parse(saved));
    } else {
      const newProfile = {
        ...profileData,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        companyName: user.displayName ? user.displayName.split(' ')[0] + ' & Co.' : 'Company',
      };
      setProfileData(newProfile);
      setTempData(newProfile);
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSaveProfile = () => {
    setProfileData(tempData);
    localStorage.setItem(`profile_${user?.uid}`, JSON.stringify(tempData));
    setIsEditing(false);
  };

  if (authLoading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0041A8 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>My Profile</h1>
          <button 
            onClick={handleLogout} 
            style={{ padding: '8px 16px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} 
            onMouseOver={(e) => (e.currentTarget.style.background = '#da190b')} 
            onMouseOut={(e) => (e.currentTarget.style.background = '#F44336')}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '100px', height: '100px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,86,210,0.3)' }}>
                {profileData.avatar ? '📸' : profileData.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {profileData.verified && (
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', backgroundColor: '#4CAF50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', border: '3px solid white' }}>
                  ✓
                </div>
              )}
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#333', margin: 0 }}>{profileData.name}</h1>
                {profileData.verified && <span style={{ fontSize: '12px', backgroundColor: '#4CAF50', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>✓ Verified</span>}
              </div>
              <p style={{ fontSize: '13px', color: '#999', margin: '2px 0' }}>@{profileData.name.toLowerCase().replace(/\s+/g, '.')}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: '#666' }}>🏢 {profileData.companyName}</span>
                <span style={{ color: '#666' }}>📍 {profileData.region}</span>
                <span style={{ color: '#666' }}>👤 {profileData.role}</span>
              </div>
            </div>

            {/* Edit Button */}
            <button 
              onClick={() => { setTempData(profileData); setIsEditing(true); }} 
              style={{ padding: '10px 24px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }} 
              onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} 
              onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}
            >
              ✏️ Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Products', value: '12', icon: '📦' },
              { label: 'Connections', value: '34', icon: '🤝' },
              { label: 'Rating', value: '4.8', icon: '⭐' },
              { label: 'Reviews', value: '28', icon: '⭐' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#F5F5F5', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #E0E0E0', backgroundColor: 'white', borderRadius: '8px 8px 0 0', padding: '0' }}>
          {[
            { id: 'info', label: 'Account Info', icon: 'ℹ️' },
            { id: 'products', label: 'My Products', icon: '📦' },
            { id: 'orders', label: 'My Orders', icon: '🛒' },
            { id: 'connections', label: 'Connections', icon: '🤝' },
            { id: 'reviews', label: 'Reviews', icon: '⭐' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '14px 12px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#0056D2' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => !activeTab.includes(tab.id) && (e.currentTarget.style.backgroundColor = '#F0F0F0')}
              onMouseOut={(e) => !activeTab.includes(tab.id) && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
          {/* Account Info Tab */}
          {activeTab === 'info' && (
            isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>Edit Profile</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Full Name *</label>
                    <input 
                      type="text" 
                      value={tempData.name} 
                      onChange={(e) => setTempData({ ...tempData, name: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Phone</label>
                    <input 
                      type="tel" 
                      value={tempData.phone} 
                      onChange={(e) => setTempData({ ...tempData, phone: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Company Name</label>
                    <input 
                      type="text" 
                      value={tempData.companyName} 
                      onChange={(e) => setTempData({ ...tempData, companyName: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Region</label>
                    <select 
                      value={tempData.region} 
                      onChange={(e) => setTempData({ ...tempData, region: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option>UAE</option>
                      <option>Saudi Arabia</option>
                      <option>Kuwait</option>
                      <option>Qatar</option>
                      <option>Bahrain</option>
                      <option>Oman</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Role</label>
                    <select 
                      value={tempData.role} 
                      onChange={(e) => setTempData({ ...tempData, role: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option>Buyer</option>
                      <option>Seller</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Website</label>
                    <input 
                      type="url" 
                      value={tempData.website} 
                      onChange={(e) => setTempData({ ...tempData, website: e.target.value })} 
                      placeholder="https://..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Bio</label>
                  <textarea 
                    value={tempData.bio} 
                    onChange={(e) => setTempData({ ...tempData, bio: e.target.value })} 
                    placeholder="Tell about your business..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'Arial' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={handleSaveProfile} 
                    style={{ flex: 1, padding: '12px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    ✓ Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    style={{ flex: 1, padding: '12px 16px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Email', value: user.email },
                  { label: 'Phone', value: profileData.phone || 'Not set' },
                  { label: 'Company', value: profileData.companyName },
                  { label: 'Region', value: profileData.region },
                  { label: 'Role', value: profileData.role },
                  { label: 'Website', value: profileData.website || 'Not set' },
                ].map((item, i) => (
                  <div key={i} style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#999', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{item.label}</p>
                    <p style={{ fontSize: '13px', color: '#333', margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* My Products Tab */}
          {activeTab === 'products' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Your Listings (12)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {['Deep Groove Bearings', 'Hydraulic Oil', 'V-Belts', 'Grease 500g', 'Lubricant', 'Machinery Part'].map((product, i) => (
                  <div key={i} style={{ backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
                    <div style={{ backgroundColor: '#0056D2', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px' }}>📦</div>
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product}</p>
                      <p style={{ fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>$45.00</p>
                      <p style={{ fontSize: '10px', color: '#4CAF50', margin: '2px 0 0 0' }}>✓ Active</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/create-post" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', backgroundColor: '#0056D2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                ➕ Add New Product
              </Link>
            </div>
          )}

          {/* My Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Recent Purchases (8)</h3>
              {['Order #001 - 3x Deep Groove Bearings', 'Order #002 - 5L Hydraulic Oil', 'Order #003 - V-Belt Set', 'Order #004 - 2x Grease 500g'].map((order, i) => (
                <div key={i} style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: 0 }}>{order}</p>
                    <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>Delivered 2 days ago</p>
                  </div>
                  <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Delivered</span>
                </div>
              ))}
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Your Network (34)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                {['Supplier A', 'Buyer B', 'Company C', 'Trader D', 'Business E', 'Partner F'].map((conn, i) => (
                  <div key={i} style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', backgroundColor: '#0056D2', borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                      {conn.charAt(0)}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn}</p>
                    <p style={{ fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>Connected</p>
                  </div>
                ))}
              </div>
              <Link href="/network" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', backgroundColor: '#0056D2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                🤝 View All Connections
              </Link>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Seller Reviews (28)</h3>
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>⭐</span>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 }}>4.8/5.0</p>
                    <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>Based on 28 reviews</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>⭐⭐⭐⭐⭐</div>
                  <span style={{ color: '#999' }}>24 reviews</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>⭐⭐⭐⭐</div>
                  <span style={{ color: '#999' }}>3 reviews</span>
                </div>
              </div>

              {['Excellent seller! Fast shipping.', 'Great quality products. Highly recommend!', 'Professional and reliable. Will buy again!'].map((review, i) => (
                <div key={i} style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => <span key={star} style={{ fontSize: '12px' }}>⭐</span>)}
                  </div>
                  <p style={{ fontSize: '12px', color: '#333', margin: 0 }}>{review}</p>
                  <p style={{ fontSize: '10px', color: '#999', margin: '6px 0 0 0' }}>by Buyer {i + 1} • 5 days ago</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px', fontWeight: '500' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px', fontWeight: '500' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/network" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px', fontWeight: '500' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🤝</span>
          <span>Network</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
