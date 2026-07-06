'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { productService } from '@/lib/firebase-service';
import Link from 'next/link';

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // For demo, fetch sample product
    const sampleProduct = {
      id: productId,
      creatorId: '1',
      creatorName: 'Alice Smith',
      productName: 'Industrial Bearing Set (Premium Grade)',
      description: 'High-quality industrial bearings suitable for heavy machinery and marine applications. Engineered with precision and tested for durability.',
      price: '15,000',
      category: 'Bearings',
      imageUri: '/api/placeholder/400/300',
      rating: 4.5,
      reviewCount: 23,
      isFavorite: false,
      postType: 'SELL',
      timestamp: Date.now(),
      fullDescription: `
        High-Quality Industrial Bearing Set

        Specifications:
        - Type: Ball Bearings
        - Material: Chrome Steel (SUJ2)
        - Bore Diameter: 50mm
        - Outer Diameter: 110mm
        - Width: 27mm
        - Dynamic Load Rating: 95.9 kN
        - Static Load Rating: 85.8 kN
        - Speed: 4000 rpm (grease), 8000 rpm (oil)

        Features:
        ✓ Premium quality chrome steel construction
        ✓ Precise engineering for reduced friction
        ✓ Long service life
        ✓ Suitable for industrial machinery
        ✓ Marine application ready
        ✓ ISO certified manufacturing

        Quantity Available: 500 units
        Minimum Order: 10 units
        Lead Time: 5-7 business days
        Shipping: Worldwide
      `,
      supplier: {
        name: 'Alice Smith',
        rating: 4.8,
        reviews: 156,
        responseTime: '< 2 hours',
        verified: true,
      }
    };

    setProduct(sampleProduct);
    setLoading(false);
  }, [authLoading, user, router, productId]);

  const handleAddToFavorites = () => {
    setIsFavorite(!isFavorite);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    // Send inquiry logic here
    alert('Inquiry sent to ' + product.creatorName);
    setShowInquiryForm(false);
    setInquiryMessage('');
  };

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!product) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Product not found</div>;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px' }}>
            <span>←</span> Back to Feed
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ height: '300px', backgroundColor: '#E0E0E0', backgroundImage: `url(${product.imageUri})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            <button onClick={handleAddToFavorites} style={{ position: 'absolute', top: '12px', right: '12px', width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontSize: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'inline-block', backgroundColor: '#E3F2FD', color: '#0056D2', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>
                  {product.category}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>{product.productName}</h1>
                <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Posted {new Date(product.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E0E0E0' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                {product.creatorName.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: 0 }}>{product.creatorName}</p>
                <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>⭐ {product.rating} ({product.reviewCount} reviews)</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Price</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF8C00', margin: '4px 0 0 0' }}>AED {product.price}</p>
            </div>

            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>{product.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {!showInquiryForm && (
                <>
                  <button onClick={() => setShowInquiryForm(true)} style={{ padding: '12px 16px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}>
                    Send Inquiry
                  </button>
                  <button onClick={() => router.push('/messages')} style={{ padding: '12px 16px', backgroundColor: 'white', color: '#0056D2', border: '2px solid #0056D2', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Message
                  </button>
                </>
              )}
            </div>

            {showInquiryForm && (
              <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <textarea placeholder="Your inquiry message" value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', minHeight: '80px', boxSizing: 'border-box' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button type="button" onClick={() => setShowInquiryForm(false)} style={{ padding: '10px 16px', backgroundColor: '#E0E0E0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Send Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/network" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🤝</span>
          <span>Network</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-12">Product not found</div>
        <Link href="/feed" className="text-blue-600 hover:underline text-center block">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/feed" className="text-blue-600 hover:underline text-sm">
            ← Back to Feed
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              {product.imageUri ? (
                <img
                  src={product.imageUri}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <p className="text-lg">No Image Available</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.productName}</h1>

            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-blue-600">${product.price}</span>
                  <p className="text-gray-600 text-sm">Minimum order: 10 units</p>
                </div>
                <span className={`px-4 py-2 rounded font-semibold ${
                  product.postType === 'SELL'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {product.postType}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-3">Overview</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{product.fullDescription}</p>
            </div>

            {/* Rating */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="font-semibold mb-2">Rating & Reviews</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold">{product.rating}</span>
                <span className="text-gray-600">({product.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Supplier Info and Actions */}
        <div>
          {/* Supplier Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Seller Information</h2>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {product.supplier.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{product.supplier.name}</p>
                {product.supplier.verified && (
                  <p className="text-xs text-green-600">✓ Verified Seller</p>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rating</span>
                <span className="font-semibold">⭐ {product.supplier.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reviews</span>
                <span className="font-semibold">{product.supplier.reviews}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="font-semibold text-green-600">{product.supplier.responseTime}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!showInquiryForm ? (
                <>
                  <button
                    onClick={() => setShowInquiryForm(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
                  >
                    Send Inquiry
                  </button>
                  <button
                    onClick={handleAddToFavorites}
                    className={`w-full px-4 py-3 font-semibold rounded transition ${
                      isFavorite
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                  </button>
                  <Link
                    href={`/messages`}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300 transition text-center block"
                  >
                    Message Seller
                  </Link>
                </>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Write your inquiry or quote request..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
                    >
                      Send
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInquiryForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-semibold">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Availability</span>
                <span className="font-semibold text-green-600">In Stock</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">Worldwide</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lead Time</span>
                <span className="font-semibold">5-7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
