'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { productService, userService } from '@/lib/firebase-service';
import { wishlistService } from '@/lib/firebase-wishlist';
import { listenToAllPosts } from '@/lib/realtime-sync';
import { BuyModal } from '@/components/BuyModal';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [minResponseTime, setMinResponseTime] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const router = useRouter();

  const categories = ['All', 'Bearings', 'Grease', 'V-Belts', 'Industrial Oils', 'Lubricants', 'Machinery', 'Accessories'];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    // Real-time listener for all posts
    const unsubscribePosts = listenToAllPosts((posts) => {
      setProducts(posts);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribePosts?.();
    };
  }, [user, authLoading, router]);

  // Load wishlist on mount
  useEffect(() => {
    if (user) {
      wishlistService.getUserWishlist(user.uid).then((items) => {
        const wishlistIds = new Set(items.map((item: any) => item.productId || item.id).filter(Boolean) as string[]);
        setWishlisted(wishlistIds);
      }).catch((error) => {
        console.error('Failed to load wishlist:', error);
        // Continue without wishlist if it fails
        setWishlisted(new Set());
      });
    }
  }, [user]);

  const handleWishlistToggle = async (productId: string, productName: string, price: any, sellerName: string, sellerId: string, imageUri?: string) => {
    if (!user) {
      addToast({ type: 'warning', title: 'Login Required', message: 'Please login to save items' });
      return;
    }

    try {
      if (wishlisted.has(productId)) {
        const item = await wishlistService.getUserWishlist(user.uid).catch(() => []);
        const wishItem = item.find((w: any) => w.productId === productId);
        if (wishItem?.id) {
          await wishlistService.removeFromWishlist(wishItem.id);
          setWishlisted(prev => {
            const updated = new Set(prev);
            updated.delete(productId);
            return updated;
          });
          addToast({ type: 'success', title: 'Removed', message: `${productName} removed from wishlist` });
        }
      } else {
        if (!sellerId || !sellerName) {
          addToast({ type: 'warning', title: 'Error', message: 'Unable to save this item' });
          return;
        }
        await wishlistService.addToWishlist(user.uid, productId, productName, String(price), sellerName, sellerId, imageUri);
        setWishlisted(prev => new Set([...prev, productId]));
        addToast({ type: 'success', title: 'Saved', message: `${productName} added to wishlist` });
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to update wishlist' });
    }
  };

  useEffect(() => {
    let filtered = products.filter((p) => {
      const matchesSearch =
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const productPrice = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
      const matchesPrice = productPrice <= maxPrice;
      const matchesRating = (p.rating || 0) >= minRating;
      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });

    if (sortBy === 'newest') {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
        return priceB - priceA;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleBuyClick = async (product: any) => {
    // Get seller info
    const seller = await userService.getUserProfile(product.creatorId);
    setSelectedProduct(product);
    setSelectedSeller(seller);
    setShowBuyModal(true);
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>Product Feed</h1>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Browse products from suppliers</p>
            </div>
            <Link href="/profile" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>Profile</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
        </div>

        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', backgroundColor: selectedCategory === cat ? '#0056D2' : '#E0E0E0', color: selectedCategory === cat ? 'white' : '#333', transition: 'all 200ms' }} onMouseOver={(e) => !selectedCategory.includes(cat) && (e.currentTarget.style.backgroundColor = '#D0D0D0')} onMouseOut={(e) => !selectedCategory.includes(cat) && (e.currentTarget.style.backgroundColor = '#E0E0E0')}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer' }}>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ padding: '10px 16px', backgroundColor: showAdvancedFilters ? '#0056D2' : '#E0E0E0', color: showAdvancedFilters ? 'white' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            🔍 Filters {showAdvancedFilters ? '✕' : '+'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>Advanced Filters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Min Rating: {minRating}★</label>
                <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Max Price: AED {maxPrice}</label>
                <input type="range" min="0" max="100000" step="1000" value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Response Time (hrs): {minResponseTime}</label>
                <input type="range" min="0" max="48" step="1" value={minResponseTime} onChange={(e) => setMinResponseTime(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <button onClick={() => { setMinRating(0); setMaxPrice(100000); setMinResponseTime(0); }} style={{ flex: 1, padding: '8px 12px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Clear Filters</button>
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: '#999', fontSize: '14px' }}>No products found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseOver={(e) => (
                  (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'),
                  (e.currentTarget.style.transform = 'translateY(-2px)')
                )}
                onMouseOut={(e) => (
                  (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'),
                  (e.currentTarget.style.transform = 'translateY(0)')
                )}
              >
                <Link href={`/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: '100%', height: '150px', backgroundColor: '#E0E0E0', overflow: 'hidden' }}>
                    {product.imageUri ? (
                      <img src={product.imageUri} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>No Image</div>
                    )}
                  </div>
                  <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#0056D2', backgroundColor: 'rgba(0,86,210,0.1)', borderRadius: '8px', padding: '4px 8px', alignSelf: 'flex-start', marginBottom: '8px' }}>{product.postType}</span>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.productName}</h3>
                    <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF8C00' }}>AED {product.price}</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>{product.category}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>By {product.creatorName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#FF8C00', fontSize: '12px' }}>
                      {'⭐'.repeat(Math.round(product.rating || 0))}
                      <span style={{ color: '#999', marginLeft: '4px' }}>({product.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                </Link>
                
                {/* Wishlist & Buy Buttons */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const sellerId = product.creatorId || product.userId || product.seller || '';
                      const sellerName = product.creatorName || product.userName || 'Unknown Seller';
                      if (sellerId) {
                        handleWishlistToggle(product.id, product.productName, product.price, sellerName, sellerId, product.imageUri);
                      }
                    }}
                    style={{
                      width: '44px',
                      height: '44px',
                      background: wishlisted.has(product.id) ? '#FF6B6B' : '#F0F0F0',
                      color: wishlisted.has(product.id) ? 'white' : '#999',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '18px',
                      transition: 'all 200ms',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={wishlisted.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {wishlisted.has(product.id) ? '❤️' : '🤍'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleBuyClick(product);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#0056D2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                    }}
                  >
                    🛒 Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Post Button */}
      <Link href="/create-post" style={{ position: 'fixed', bottom: '160px', right: '20px', width: '56px', height: '56px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(255,140,0,0.4)', zIndex: 15, textDecoration: 'none', fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
        +
      </Link>

      {/* Floating Chatbot Button */}
      <Link href="/chatbot" style={{ position: 'fixed', bottom: '90px', right: '20px', width: '56px', height: '56px', backgroundColor: '#0056D2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,86,210,0.4)', zIndex: 15, textDecoration: 'none', fontSize: '26px' }}>
        🤖
      </Link>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/messages" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>💬</span>
          <span>Messages</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Buy Modal */}
      {showBuyModal && selectedProduct && (
        <BuyModal
          product={selectedProduct}
          buyer={{ uid: user!.uid, name: user!.displayName, email: user!.email }}
          seller={selectedSeller}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            // Reload products or update state as needed
          }}
        />
      )}
    </div>
  );
}
