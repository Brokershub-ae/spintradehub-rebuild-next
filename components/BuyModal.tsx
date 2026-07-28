import React, { useState } from 'react';
import { orderService } from '@/lib/firebase-orders';
import { useToast } from '@/lib/toast-context';

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
  const { addToast } = useToast();
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
      setError('Location/Contact details is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const inquiryId = await orderService.createOrder({
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

      addToast({
        type: 'success',
        title: 'Inquiry Sent',
        message: `Your inquiry has been sent. ID: ${inquiryId.substring(0, 8)}`,
        duration: 4000,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error sending inquiry:', err);
      setError('Failed to send inquiry. Please try again.');
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send inquiry',
      });
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
        zIndex: 999,
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
          Send Inquiry
        </h2>

        {error && (
          <div
            style={{
              background: '#FFE5E5',
              border: '1px solid #FF6B6B',
              color: '#C92A2A',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            Product: {product.productName}
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            Quantity
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
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            Location / Contact Details *
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your location and contact information"
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

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
            Inquiry Message (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details about your inquiry"
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
            }}
          >
            <span>Total:</span>
            <span>AED {totalPrice.toLocaleString()}</span>
          </div>
        </div>

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
            {loading ? 'Sending...' : 'Send Inquiry'}
          </button>
        </div>
      </div>
    </div>
  );
};
