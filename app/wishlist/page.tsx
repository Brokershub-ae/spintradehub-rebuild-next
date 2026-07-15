'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { wishlistService, WishlistItem } from '@/lib/firebase-wishlist';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadWishlist();
  }, [user, authLoading, router]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const items = await wishlistService.getUserWishlist(user!.uid);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load wishlist',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (wishlistId: string, productName: string) => {
    try {
      await wishlistService.removeFromWishlist(wishlistId);
      setWishlistItems(wishlistItems.filter((item) => item.id !== wishlistId));
      addToast({
        type: 'success',
        title: 'Removed',
        message: `${productName} removed from wishlist`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove item',
      });
    }
  };

  const handleToggleSelection = (wishlistId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(wishlistId)) {
      newSelected.delete(wishlistId);
    } else {
      newSelected.add(wishlistId);
    }
    setSelectedItems(newSelected);
  };

  const handleBuySelected = () => {
    if (selectedItems.size === 0) {
      addToast({
        type: 'warning',
        title: 'Select Items',
        message: 'Select at least one item to buy',
      });
      return;
    }

    // Navigate to feed with selected items
    router.push('/feed');
    addToast({
      type: 'info',
      title: 'Tip',
      message: 'Selected items are ready. Click "Buy Now" on any product.',
    });
  };

  const handleCompare = () => {
    if (selectedItems.size < 2) {
      addToast({
        type: 'warning',
        title: 'Select Items',
        message: 'Select at least 2 items to compare',
      });
      return;
    }

    addToast({
      type: 'info',
      title: 'Comparison',
      message: 'Comparison feature coming soon!',
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading wishlist...</p>
      </div>
    );
  }

  const totalPrice = Array.from(selectedItems)
    .reduce((sum, id) => {
      const item = wishlistItems.find((w) => w.id === id);
      return sum + (item ? parseFloat(item.productPrice.replace(/[^0-9.]/g, '')) || 0 : 0);
    }, 0);

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#F5F5F5',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <Link href="/profile">
          <span style={{ color: '#0056D2', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>← Back to Profile</span>
        </Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', margin: '0 0 8px 0' }}>
          ❤️ My Wishlist
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontSize: '40px', margin: '0 0 16px 0' }}>❤️</p>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>
            Your wishlist is empty
          </h2>
          <p style={{ fontSize: '14px', color: '#999', margin: '0 0 24px 0' }}>
            Browse products and add them to your wishlist to save for later
          </p>
          <Link href="/feed">
            <span
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#0056D2',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Browse Products
            </span>
          </Link>
        </div>
      ) : (
        <>
          {/* Action Bar */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedItems(new Set(wishlistItems.map((w) => w.id!)))}
              style={{
                padding: '8px 16px',
                background: '#F0F0F0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#333',
              }}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              style={{
                padding: '8px 16px',
                background: '#F0F0F0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#333',
              }}
            >
              Clear Selection
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCompare}
                style={{
                  padding: '8px 16px',
                  background: '#E3F2FD',
                  color: '#0056D2',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                📊 Compare
              </button>
              <button
                onClick={handleBuySelected}
                style={{
                  padding: '8px 16px',
                  background: '#0056D2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🛒 Buy Selected
              </button>
            </div>
          </div>

          {/* Wishlist Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: selectedItems.has(item.id!) ? '2px solid #0056D2' : '1px solid #E0E0E0',
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => handleToggleSelection(item.id!)}
                  style={{
                    padding: '12px',
                    background: selectedItems.has(item.id!) ? '#E3F2FD' : '#F5F5F5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id!)}
                    onChange={() => handleToggleSelection(item.id!)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Select</span>
                </div>

                {/* Image */}
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    backgroundColor: '#E0E0E0',
                    overflow: 'hidden',
                  }}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '12px',
                      }}
                    >
                      No Image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0' }}>
                    {item.productName}
                  </h3>

                  <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0' }}>
                    By {item.sellerName}
                  </p>

                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF8C00', marginBottom: '12px' }}>
                    AED {item.productPrice}
                  </div>

                  <p style={{ fontSize: '11px', color: '#999', margin: '0 0 12px 0' }}>
                    Saved {new Date(item.savedAt).toLocaleDateString()}
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/feed" style={{ flex: 1, textDecoration: 'none' }}>
                      <button
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#0056D2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </Link>
                    <button
                      onClick={() => handleRemoveItem(item.id!, item.productName)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#F0F0F0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {selectedItems.size > 0 && (
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Estimated Total</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF8C00', margin: '4px 0 0 0' }}>
                  AED {totalPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={handleBuySelected}
                style={{
                  padding: '12px 32px',
                  background: '#0056D2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Proceed to Buy
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
