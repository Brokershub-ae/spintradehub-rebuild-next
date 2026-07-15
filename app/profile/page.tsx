'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService, productService, connectionService } from '@/lib/firebase-service';
import { listenToUserConnections } from '@/lib/realtime-sync';
import Link from 'next/link';

// Quick Action Button Component
function QuickActionButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href}>
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          borderRadius: '8px',
          backgroundColor: '#F5F5F5',
          cursor: 'pointer',
          transition: 'all 200ms',
          border: '1px solid #E0E0E0',
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#E3F2FD';
          (e.currentTarget as HTMLElement).style.borderColor = '#0056D2';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F5';
          (e.currentTarget as HTMLElement).style.borderColor = '#E0E0E0';
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>{label}</div>
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    region: 'UAE',
    role: 'supplier',
    email: '',
    username: '',
  } as any);
  const [tempData, setTempData] = useState(profileData);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadProfileData();

    // Real-time listener for connections
    const unsubscribeConnections = listenToUserConnections(user.uid, (connections) => {
      setConnections(connections);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribeConnections?.();
    };
  }, [user, authLoading, router]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile from Firestore
      const profile = await userService.getUserProfile(user!.uid);
      if (profile) {
        setProfileData(profile);
        setTempData(profile);
      } else {
        // Create new profile if doesn't exist
        const newProfile = {
          uid: user!.uid,
          name: user!.displayName || user!.email?.split('@')[0] || 'User',
          email: user!.email || '',
          username: (user!.email?.split('@')[0] || 'user').toLowerCase(),
          phone: '',
          region: 'UAE',
          role: 'supplier' as const,
        };
        await userService.updateProfile(user!.uid, newProfile);
        setProfileData(newProfile);
        setTempData(newProfile);
      }

      // Fetch user's products from Firestore
      const products = await productService.getPostsByCreator(user!.uid);
      setUserProducts(products);

      // Note: connections are now handled by real-time listener above
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    try {
      await userService.updateProfile(user!.uid, tempData);
      setProfileData(tempData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const userRating = userProducts.length > 0 ? 4.8 : 0;
  const totalConnections = connections.length;

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
              <div style={{ position: 'relative' }}>
              <div style={{ width: '100px', height: '100px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,86,210,0.3)' }}>
                {profileData.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#333', margin: 0 }}>{profileData.name}</h1>
              </div>
              <p style={{ fontSize: '13px', color: '#999', margin: '2px 0' }}>@{profileData.username || profileData.email?.split('@')[0]}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: '#666' }}>📍 {profileData.region}</span>
                <span style={{ color: '#666' }}>👤 {profileData.role === 'supplier' ? 'Seller' : 'Buyer'}</span>
                {profileData.phone && <span style={{ color: '#666' }}>📱 {profileData.phone}</span>}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Products', value: userProducts.length.toString(), icon: '📦' },
              { label: 'Connections', value: totalConnections.toString(), icon: '🤝' },
              { label: 'Rating', value: userRating.toFixed(1), icon: '⭐' },
              { label: 'Reviews', value: '0', icon: '📝' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#F5F5F5', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <QuickActionButton href="/analytics" icon="📊" label="Analytics" />
            <QuickActionButton href="/orders" icon="📋" label="Orders" />
            <QuickActionButton href="/messages" icon="💬" label="Messages" />
            <QuickActionButton href="/reviews" icon="⭐" label="Reviews" />
            <QuickActionButton href="/network" icon="🤝" label="Network" />
            <QuickActionButton href="/feed" icon="📦" label="Browse Feed" />
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
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Role</label>
                    <select 
                      value={tempData.role} 
                      onChange={(e) => setTempData({ ...tempData, role: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="supplier">Seller</option>
                      <option value="buyer">Buyer</option>
                    </select>
                  </div>
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
                  { label: 'Email', value: profileData.email || 'Not set' },
                  { label: 'Phone', value: profileData.phone || 'Not set' },
                  { label: 'Region', value: profileData.region },
                  { label: 'Role', value: profileData.role === 'supplier' ? 'Seller' : 'Buyer' },
                  { label: 'Username', value: profileData.username || profileData.email?.split('@')[0] || 'N/A' },
                  { label: 'UID', value: user.uid.substring(0, 12) + '...' },
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
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Your Listings ({userProducts.length})</h3>
              {userProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📭</p>
                  <p style={{ fontSize: '14px', margin: 0 }}>No products listed yet</p>
                  <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#CCC' }}>Create your first listing to get started</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                  {userProducts.map((product) => (
                    <Link key={product.id} href={`/${product.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
                        <div style={{ backgroundColor: '#0056D2', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px' }}>📦</div>
                        <div style={{ padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.productName}</p>
                          <p style={{ fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>${product.price}</p>
                          <p style={{ fontSize: '10px', color: '#4CAF50', margin: '2px 0 0 0' }}>✓ Active</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/create-post" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', backgroundColor: '#0056D2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                ➕ Add New Product
              </Link>
            </div>
          )}

          {/* My Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>📦 Your Orders</h3>
              <Link href="/orders" style={{ display: 'inline-block', padding: '12px 20px', backgroundColor: '#0056D2', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
                View All Orders →
              </Link>
              <p style={{ color: '#999', fontSize: '13px' }}>Track your purchases and sales in the full Orders page.</p>
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Your Network ({totalConnections})</h3>
              {totalConnections === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🤝</p>
                  <p style={{ fontSize: '14px', margin: 0 }}>No connections yet</p>
                  <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#CCC' }}>Connect with other users to grow your network</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {connections.map((conn) => (
                    <div key={conn.id} style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ width: '50px', height: '50px', backgroundColor: '#0056D2', borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                        {conn.senderName?.charAt(0) || '?'}
                      </div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.senderName}</p>
                      <p style={{ fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>Connected</p>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/network" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', backgroundColor: '#0056D2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                🤝 Discover More Users
              </Link>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Reviews & Ratings</h3>
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>⭐</span>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 }}>{userRating.toFixed(1)}/5.0</p>
                    <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>Based on {userProducts.length} products</p>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📝</p>
                <p style={{ fontSize: '14px', margin: 0 }}>No reviews yet</p>
                <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#CCC' }}>Reviews will appear when customers purchase from you</p>
              </div>
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
