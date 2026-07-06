'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { productService } from '@/lib/firebase-service';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    category: 'Bearings',
    postType: 'SELL',
    quantity: '',
    unit: 'pcs',
    location: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Bearings', 'Grease', 'V-Belts', 'Industrial Oils', 'Lubricants', 'Machinery', 'Accessories', 'Other'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('PDF must be less than 10MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.productName || !formData.description || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let imageUri = '';
      let pdfUri = '';

      // Upload image if selected
      if (imageFile && storage) {
        const imageRef = ref(storage, `products/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUri = await getDownloadURL(imageRef);
      }

      // Upload PDF if selected
      if (pdfFile && storage) {
        const pdfRef = ref(storage, `documents/${user.uid}/${Date.now()}_${pdfFile.name}`);
        await uploadBytes(pdfRef, pdfFile);
        pdfUri = await getDownloadURL(pdfRef);
      }

      // Create product post
      await productService.createPost({
        productName: formData.productName,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        postType: formData.postType as 'SELL' | 'BUY',
        quantity: formData.quantity,
        unit: formData.unit,
        location: formData.location,
        imageUri,
        pdfUri,
        creatorId: user.uid,
        creatorName: user.displayName || 'Unknown',
        timestamp: Date.now(),
        rating: 0,
        reviewCount: 0,
      });

      router.push('/feed');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', fontSize: '20px' }}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Create Post</h1>
            <div style={{ width: '32px' }} />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        {error && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Post Type */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '10px' }}>Post Type *</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['SELL', 'BUY'].map((type) => (
                <button key={type} type="button" onClick={() => setFormData({ ...formData, postType: type })}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `2px solid ${formData.postType === type ? '#0056D2' : '#E0E0E0'}`, backgroundColor: formData.postType === type ? 'rgba(0,86,210,0.08)' : 'white', color: formData.postType === type ? '#0056D2' : '#666', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                  {type === 'SELL' ? '📤 Selling' : '📥 Buying'}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '10px' }}>Product Photo</label>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            {imagePreview ? (
              <div style={{ position: 'relative' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>×</button>
              </div>
            ) : (
              <button type="button" onClick={() => imageInputRef.current?.click()}
                style={{ width: '100%', height: '120px', border: '2px dashed #E0E0E0', borderRadius: '8px', backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#999' }}>
                <span style={{ fontSize: '32px' }}>📷</span>
                <span style={{ fontSize: '13px' }}>Tap to add photo</span>
              </button>
            )}
          </div>

          {/* PDF Upload */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '10px' }}>Product PDF / Catalogue</label>
            <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfChange} style={{ display: 'none' }} />
            {pdfFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#F0F7FF', borderRadius: '8px' }}>
                <span style={{ fontSize: '24px' }}>📄</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: 0 }}>{pdfFile.name}</p>
                  <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => setPdfFile(null)}
                  style={{ backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>×</button>
              </div>
            ) : (
              <button type="button" onClick={() => pdfInputRef.current?.click()}
                style={{ width: '100%', padding: '16px', border: '2px dashed #E0E0E0', borderRadius: '8px', backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#999', fontSize: '13px' }}>
                <span style={{ fontSize: '24px' }}>📄</span> Tap to add PDF catalogue
              </button>
            )}
          </div>

          {/* Product Details */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Product Details</label>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Product Name *</label>
              <input type="text" placeholder="e.g. SKF Deep Groove Ball Bearing 6205" value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Description *</label>
              <textarea placeholder="Describe the product, specifications, condition..." value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Price (USD) *</label>
                <input type="text" placeholder="e.g. 25.00" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })} required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Quantity</label>
                <input type="text" placeholder="e.g. 100" value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: 'white', outline: 'none' }}>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: 'white', outline: 'none' }}>
                  {['pcs', 'kg', 'litre', 'box', 'set', 'meter', 'ton'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Location</label>
              <input type="text" placeholder="e.g. Dubai, UAE" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
            </div>
          </div>

          <button type="submit" disabled={uploading}
            style={{ padding: '16px', backgroundColor: uploading ? '#999' : '#FF8C00', color: 'white', border: 'none', borderRadius: '12px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
            {uploading ? '⏳ Uploading...' : '🚀 Post Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
