'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService, productService, connectionService } from '@/lib/firebase-service';
import { listenToUserConnections } from '@/lib/realtime-sync';
import Link from 'next/link';
import ProductPhotosPicker from '@/components/ProductPhotosPicker';
import { getProductImages } from '@/lib/product-details';

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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPostData, setEditingPostData] = useState({
    productName: '',
    description: '',
    category: 'Bearings',
    postType: 'SELL',
    location: '',
  });
  const [editingExistingImages, setEditingExistingImages] = useState<string[]>([]);
  const [editingPhotoFiles, setEditingPhotoFiles] = useState<File[]>([]);
  const [savingPost, setSavingPost] = useState(false);
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

  const getPostImageUrl = (post: any) => {
    return post?.imageUri || post?.imageUrl || post?.photo || post?.thumbnail || post?.photoUrl || post?.img || '';
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

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setPhotoUploading(true);
      const imageUrl = await userService.uploadProfileImage(user.uid, file);
      const updatedProfile = { ...profileData, profileImageUri: imageUrl };
      setProfileData(updatedProfile);
      setTempData(updatedProfile);
      await userService.updateProfile(user.uid, { profileImageUri: imageUrl });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert('Failed to upload profile photo');
    } finally {
      setPhotoUploading(false);
      event.target.value = '';
    }
  };

  const openEditPost = (product: any) => {
    setEditingPostId(product.id);
    setEditingPostData({
      productName: product.productName || '',
      description: product.description || product.fullDescription || '',
      category: product.category || 'Bearings',
      postType: product.postType || 'SELL',
      location: product.location || '',
    });
    setEditingExistingImages(getProductImages(product));
    setEditingPhotoFiles([]);
  };

  const handleSaveEditedPost = async () => {
    if (!editingPostId) return;

    const trimmedProductName = editingPostData.productName.trim();
    const trimmedDescription = editingPostData.description.trim();

    if (!trimmedProductName || !trimmedDescription) {
      alert('Please complete the product name and description before saving.');
      return;
    }

    try {
      setSavingPost(true);
      const imageUris = [...editingExistingImages];
      if (editingPhotoFiles.length > 0) {
        if (!user) throw new Error('Not signed in');
        const newUrls = await productService.uploadProductPhotos(user.uid, editingPhotoFiles, editingExistingImages.length);
        imageUris.push(...newUrls);
      }
      const updatedPost: Partial<any> = {
        productName: trimmedProductName,
        description: trimmedDescription,
        category: editingPostData.category,
        postType: editingPostData.postType as 'SELL' | 'BUY',
        location: editingPostData.location,
        imageUris,
        imageUri: imageUris[0] || '',
      };

      await productService.updatePost(editingPostId, updatedPost);
      setUserProducts((prev) =>
        prev.map((product) =>
          product.id === editingPostId ? { ...product, ...updatedPost } : product
        )
      );
      setEditingPostId(null);
      setEditingPhotoFiles([]);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await productService.deletePost(postId);
      setUserProducts((prev) => prev.filter((product) => product.id !== postId));
      if (editingPostId === postId) {
        setEditingPostId(null);
      }
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete post. Please try again.');
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
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo_latest.png" alt="SpinTradeHub logo" style={{ height: '62px', objectFit: 'contain', display: 'block' }} />
          </div>
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

      <div style={{ padding: '16px' }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              {profileData.profileImageUri ? (
                <img
                  src={profileData.profileImageUri}
                  alt="Profile"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: '0 4px 12px rgba(0,86,210,0.3)',
                    border: '3px solid #0056D2',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ width: '100px', height: '100px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,86,210,0.3)' }}>
                  {profileData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <label htmlFor="profile-photo-upload" style={{ position: 'absolute', right: '-6px', bottom: '-2px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', color: 'white', fontSize: '16px', fontWeight: 'bold' }} title="Change photo">
                <input id="profile-photo-upload" type="file" accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} />
                {photoUploading ? '...' : '✎'}
              </label>
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
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label htmlFor="profile-photo-upload-inline" style={{ padding: '10px 16px', backgroundColor: '#EAF2FF', color: '#0056D2', border: '1px solid #CFE0FF', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                <input id="profile-photo-upload-inline" type="file" accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} />
                {photoUploading ? 'Uploading...' : '✎ Change'}
              </label>
              <button 
                onClick={() => { setTempData(profileData); setIsEditing(true); }} 
                style={{ padding: '10px 24px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }} 
                onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} 
                onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}
              >
                ✎ Edit Profile
              </button>
            </div>
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
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <QuickActionButton href="/feed" icon="📦" label="My Post(Products)" />
            <QuickActionButton href="/network" icon="🤝" label="Connections" />
            <QuickActionButton href="/messages" icon="💬" label="Messages" />
            <QuickActionButton href="/documents" icon="📄" label="Documents" />
            <QuickActionButton href="/wishlist" icon="🔖" label="Wishlist" />
            <QuickActionButton href="/orders" icon="🛒" label="My orders" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #E0E0E0', backgroundColor: 'white', borderRadius: '8px 8px 0 0', padding: '0' }}>
          {[
            { id: 'info', label: 'Account Info', icon: 'ℹ️' },
            { id: 'products', label: 'My Posts', icon: '📦' },
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
        {showDeleteModal && postToDelete && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#333', margin: '0 0 12px 0' }}>Delete this post?</h3>
              <p style={{ fontSize: '14px', color: '#666', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                This action will permanently remove the listing from your profile and from the feed. You won’t be able to undo it.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  style={{ flex: 1, padding: '12px 16px', backgroundColor: '#E0E0E0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePost(postToDelete)}
                  style={{ flex: 1, padding: '12px 16px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
          {/* Account Info Tab */}
          {activeTab === 'info' && (
            isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>Edit Profile</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '12px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0056D2', backgroundColor: '#EAF2FF' }}>
                    {tempData.profileImageUri ? (
                      <img src={tempData.profileImageUri} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0056D2', fontWeight: '800', fontSize: '28px' }}>
                        {tempData.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <label htmlFor="edit-profile-photo" style={{ padding: '10px 14px', backgroundColor: '#EAF2FF', color: '#0056D2', border: '1px solid #CFE0FF', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                    <input id="edit-profile-photo" type="file" accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} />
                    {photoUploading ? 'Uploading...' : 'Upload new photo'}
                  </label>
                </div>

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {userProducts.map((product) => {
                    const isEditing = editingPostId === product.id;

                    return (
                      <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E0E0E0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <Link href={`/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ width: '100%', height: '120px', backgroundColor: '#F5F5F5', overflow: 'hidden' }}>
                            {getPostImageUrl(product) ? (
                              <img src={getPostImageUrl(product)} alt={product.productName || 'Post'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                                <span style={{ fontSize: '28px' }}>📦</span>
                                <span>{product.category || 'Product'}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.productName || 'Untitled post'}</p>
                              <span style={{ fontSize: '10px', color: '#0056D2', fontWeight: '700', padding: '4px 8px', borderRadius: '999px', backgroundColor: 'rgba(0,86,210,0.08)' }}>{product.postType || 'SELL'}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description || 'No description provided.'}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#999' }}>
                              <span>{product.category || 'General'}</span>
                              <span>{product.price ? `USD ${product.price}` : 'Price not listed'}</span>
                            </div>
                          </div>
                        </Link>

                        {isEditing ? (
                          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E0E0E0' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>Product Name</label>
                            <input
                              value={editingPostData.productName}
                              onChange={(e) => setEditingPostData({ ...editingPostData, productName: e.target.value })}
                              placeholder="Product name"
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E0E0E0', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }}
                            />

                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>Description</label>
                            <textarea
                              value={editingPostData.description}
                              onChange={(e) => setEditingPostData({ ...editingPostData, description: e.target.value })}
                              placeholder="Description"
                              rows={3}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E0E0E0', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px', resize: 'vertical' }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>Category</label>
                                <select
                                  value={editingPostData.category}
                                  onChange={(e) => setEditingPostData({ ...editingPostData, category: e.target.value })}
                                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E0E0E0', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }}
                                >
                                  <option>Bearings</option>
                                  <option>Grease</option>
                                  <option>V-Belts</option>
                                  <option>Industrial Oils</option>
                                  <option>Lubricants</option>
                                  <option>Machinery</option>
                                  <option>Accessories</option>
                                  <option>Other</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>Type</label>
                                <select
                                  value={editingPostData.postType}
                                  onChange={(e) => setEditingPostData({ ...editingPostData, postType: e.target.value })}
                                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E0E0E0', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }}
                                >
                                  <option value="SELL">SELL</option>
                                  <option value="BUY">BUY</option>
                                </select>
                              </div>
                            </div>

                            <ProductPhotosPicker
                              files={editingPhotoFiles}
                              onChange={setEditingPhotoFiles}
                              existing={editingExistingImages}
                              onRemoveExisting={(index) => setEditingExistingImages((prev) => prev.filter((_, i) => i !== index))}
                              disabled={savingPost}
                            />

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={handleSaveEditedPost}
                                disabled={savingPost}
                                style={{ flex: 1, padding: '8px 10px', backgroundColor: savingPost ? '#9CCC9E' : '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: savingPost ? 'default' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                              >
                                {savingPost ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPostId(null)}
                                style={{ flex: 1, padding: '8px 10px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #E0E0E0' }}>
                            <button
                              type="button"
                              onClick={() => openEditPost(product)}
                              style={{ flex: 1, padding: '8px 10px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPostToDelete(product.id);
                                setShowDeleteModal(true);
                              }}
                              style={{ flex: 1, padding: '8px 10px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  <Link href="/network" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', backgroundColor: '#0056D2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                    🤝 Find Users to Connect
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {connections.map((conn) => {
                      const connectedUser = conn.senderId === user?.uid ? conn.receiverId : conn.senderId;
                      const connectedName = conn.senderId === user?.uid ? conn.receiverName : conn.senderName;
                      return (
                        <div key={conn.id} style={{ backgroundColor: '#F5F5F5', padding: '16px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                          <div style={{ width: '60px', height: '60px', backgroundColor: '#0056D2', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                            {connectedName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{connectedName || 'Connected User'}</p>
                          <p style={{ fontSize: '12px', color: '#999', margin: '0 0 12px 0' }}>✓ Connected</p>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link 
                              href={`/profile/${connectedUser}`}
                              style={{
                                display: 'inline-block',
                                padding: '8px 12px', 
                                backgroundColor: 'white', 
                                color: '#0056D2', 
                                border: '1px solid #0056D2',
                                borderRadius: '6px', 
                                textDecoration: 'none',
                                fontSize: '12px', 
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              👤 View Profile
                            </Link>
                            <Link 
                              href={`/messages?user=${connectedUser}`}
                              style={{ 
                                display: 'inline-block',
                                padding: '8px 12px', 
                                backgroundColor: '#FF8C00', 
                                color: 'white', 
                                borderRadius: '6px', 
                                textDecoration: 'none',
                                fontSize: '12px', 
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FF7700';
                                (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.05)';
                              }}
                              onMouseOut={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FF8C00';
                                (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
                              }}
                            >
                              💬 Message
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/network" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#0056D2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                    🤝 Add More Connections
                  </Link>
                </>
              )}
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
        <Link href="/messages" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px', fontWeight: '500' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>💬</span>
          <span>Messages</span>
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
