'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { productService, userService } from '@/lib/firebase-service';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import ProductPhotosPicker from '@/components/ProductPhotosPicker';
import { emptySpecifications, validateSpecifications } from '@/lib/product-details';

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const submitInFlight = useRef(false);

  const [formData, setFormData] = useState({
    productName: '',
    ...emptySpecifications,
    description: '',
    category: 'Bearings',
    postType: 'SELL',
    location: '',
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Bearings', 'Grease', 'V-Belts', 'Industrial Oils', 'Lubricants', 'Machinery', 'Accessories', 'Other'];

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
    if (submitInFlight.current) return;
    if (!user) return;
    if (!formData.productName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    if ((imageFiles.length || pdfFile) && !storage) {
      setError('Photo/PDF upload is unavailable because Firebase Storage is not configured. Add the Firebase web config in Vercel and redeploy.');
      return;
    }

    try {
      validateSpecifications(formData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check the product details.');
      return;
    }
    submitInFlight.current = true;
    setUploading(true);
    setError('');

    let pdfUri = '';

    try {
      const imageUris = imageFiles.length ? await productService.uploadProductPhotos(user.uid, imageFiles) : [];

      if (pdfFile && storage) {
        const pdfRef = ref(storage, `documents/${user.uid}/${Date.now()}_${pdfFile.name}`);
        await uploadBytes(pdfRef, pdfFile);
        pdfUri = await getDownloadURL(pdfRef);
      }

      const currentProfile = await userService.getUserProfile(user.uid).catch(() => null);
      const creatorName = currentProfile?.name || currentProfile?.username || user.displayName || (user.email ? user.email.split('@')[0] : '') || 'User';

      await productService.createPost({
        productName: formData.productName,
        brand: formData.brand.trim(),
        modelNumber: formData.modelNumber.trim(),
        condition: formData.condition,
        minimumOrderQuantity: formData.minimumOrderQuantity.trim(),
        minimumOrderUnit: formData.minimumOrderUnit.trim(),
        description: formData.description,
        price: '',
        category: formData.category,
        postType: formData.postType as 'SELL' | 'BUY',
        location: formData.location,
        imageUri: imageUris[0] || '',
        imageUris,
        pdfUri,
        creatorId: user.uid,
        userId: user.uid,
        creatorName,
        timestamp: Date.now(),
        rating: 0,
        reviewCount: 0,
      });

      router.push('/feed');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(`Failed to create post. ${err?.message || 'Please try again.'}`);
    } finally {
      submitInFlight.current = false;
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
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', fontSize: '20px' }}>←</Link>
            <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img src="/logo.png" alt="SpinTradeHub logo" style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover' }} />
              <span style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>SpinTradeHub</span>
            </Link>
            <div style={{ width: '32px' }} />
          </div>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {error && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <fieldset disabled={uploading} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

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
            <ProductPhotosPicker files={imageFiles} onChange={setImageFiles} disabled={uploading} />
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
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Tip: Write each point on a new line starting with • for a cleaner, professional look.</div>
              <textarea placeholder="• Product type\n• Brand\n• Condition\n• Specifications" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: 'white', outline: 'none' }}>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
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
          </fieldset>
        </form>
      </div>
    </div>
  );
}
