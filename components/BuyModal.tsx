import React, { useState } from 'react';
import { orderService } from '@/lib/firebase-orders';

interface BuyModalProps {
  product: any;
  buyer: any;
  seller: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  product,
  buyer,
  seller,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = quantity * (product.price || 0);

  const handleSubmit = async () => {
    if (!quantity || quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Delivery address is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await orderService.createOrder({
        buyerId: buyer.uid,
        buyerName: buyer.name || buyer.email,
        buyerEmail: buyer.email,
        sellerId: seller.uid || product.creatorId,
        sellerName: seller.name || 'Seller',
        sellerEmail: seller.email || '',
        productId: product.id,
        productName: product.productName,
        quantity,
        pricePerUnit: product.price || 0,
        totalPrice,
        deliveryAddress,
        notes,
      });

      alert('✅ Order placed successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#0056D2', marginTop: 0, marginBottom: '20px' }}>
          🛒 Order: {product.productName}
        </h2>

        {error && (
          <div
            style={{
              background: '#FFEBEE',
              color: '#C62828',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            ❌ {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            📦 Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #DDD',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
            Price per unit: AED {product.price || 0}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            📍 Delivery Address *
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your delivery address"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #DDD',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '80px',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            📝 Special Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or notes?"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #DDD',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '60px',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Summary */}
        <div
          style={{
            background: '#F5F5F5',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Subtotal:</span>
            <span>AED {totalPrice.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Shipping:</span>
            <span>Negotiable</span>
          </div>
          <div
            style={{
              borderTop: '1px solid #DDD',
              paddingTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 600,
              fontSize: '16px',
              color: '#FF8C00',
            }}
          >
            <span>Total:</span>
            <span>AED {totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              background: '#F0F0F0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#333',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px',
              background: loading ? '#CCC' : '#0056D2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Creating...' : '✅ Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
