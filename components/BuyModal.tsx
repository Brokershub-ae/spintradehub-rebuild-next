import React, { useState } from 'react';
import { orderService } from '@/lib/firebase-orders';
import { emailService } from '@/lib/email-service';
import { useToast } from '@/lib/toast-context';
import { PaymentModal } from './PaymentModal';

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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

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

      const newOrderId = await orderService.createOrder({
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

      setOrderId(newOrderId);
      setShowPayment(true);

      // Send order confirmation email
      await emailService.sendOrderConfirmation(
        buyer.email,
        buyer.name || 'Customer',
        newOrderId,
        product.productName,
        quantity,
        totalPrice,
        seller.name || 'Seller'
      );

      addToast({
        type: 'success',
        title: 'Order Created',
        message: 'Proceeding to payment...',
      });
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to create order. Please try again.');
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create order',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      // Update order with payment info
      if (orderId) {
        // In production, update order status to CONFIRMED and save transaction ID
        addToast({
          type: 'success',
          title: 'Payment Successful',
          message: `Order ${orderId.substring(0, 8)} confirmed!`,
          duration: 4000,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error finalizing order:', err);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to finalize order',
      });
    }
  };

  return (
    <>
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
              {loading ? '⏳ Creating...' : '💳 Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        orderId={orderId || ''}
        amount={totalPrice}
        customerName={buyer.name || buyer.email || 'Customer'}
        customerEmail={buyer.email || ''}
        onSuccess={handlePaymentSuccess}
        onClose={() => {
          setShowPayment(false);
          setOrderId(null);
        }}
      />
    </>
  );
};


