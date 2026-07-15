'use client';

import { useState } from 'react';
import { stripeService } from '@/lib/stripe-service';
import { useToast } from '@/lib/toast-context';

interface PaymentModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  onSuccess: (transactionId: string) => void;
  onClose: () => void;
}

export function PaymentModal({
  isOpen,
  orderId,
  amount,
  customerName,
  customerEmail,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const { addToast } = useToast();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiryDate(value);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvc(e.target.value.replace(/\D/g, '').substring(0, 4));
  };

  const handleSubmitPayment = async () => {
    if (!cardNumber.trim()) {
      addToast({
        type: 'warning',
        title: 'Missing Info',
        message: 'Please enter card number',
      });
      return;
    }

    if (!stripeService.validateCardNumber(cardNumber.replace(/\s/g, ''))) {
      addToast({
        type: 'error',
        title: 'Invalid Card',
        message: 'Please enter a valid card number',
      });
      return;
    }

    if (!expiryDate.includes('/') || expiryDate.length < 5) {
      addToast({
        type: 'warning',
        title: 'Invalid Expiry',
        message: 'Please enter expiry as MM/YY',
      });
      return;
    }

    if (cvc.length < 3) {
      addToast({
        type: 'warning',
        title: 'Invalid CVC',
        message: 'Please enter a valid CVC (3-4 digits)',
      });
      return;
    }

    if (!agreedToTerms) {
      addToast({
        type: 'warning',
        title: 'Terms Required',
        message: 'Please agree to terms and conditions',
      });
      return;
    }

    try {
      setProcessing(true);

      const result = await stripeService.processPayment({
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvc,
        amount,
        orderId,
      });

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Payment Successful',
          message: `Transaction ID: ${result.transactionId}`,
          duration: 4000,
        });
        onSuccess(result.transactionId!);
        onClose();
      } else {
        addToast({
          type: 'error',
          title: 'Payment Failed',
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Payment processing failed',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056D2', margin: '0 0 8px 0' }}>
          💳 Payment Details
        </h2>
        <p style={{ fontSize: '12px', color: '#999', margin: '0 0 24px 0' }}>
          Order #{orderId.substring(0, 8)}
        </p>

        {/* Order Summary */}
        <div
          style={{
            background: '#F5F5F5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Customer:</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{customerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Email:</span>
            <span style={{ fontSize: '13px', color: '#333' }}>{customerEmail}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #E0E0E0',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Total Amount:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF8C00' }}>
              AED {amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card Details */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              fontSize: '13px',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
          <p style={{ fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>
            Test: 4532 0151 2328 5426
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
              Expiry
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={handleExpiryChange}
              placeholder="MM/YY"
              maxLength={5}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #E0E0E0',
                borderRadius: '6px',
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={handleCvcChange}
              placeholder="123"
              maxLength={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #E0E0E0',
                borderRadius: '6px',
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* Checkbox */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: '4px', cursor: 'pointer' }}
          />
          <label style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>
            I agree to the payment terms and conditions
          </label>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={processing}
            style={{
              flex: 1,
              padding: '12px',
              background: '#F0F0F0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              opacity: processing ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitPayment}
            disabled={processing}
            style={{
              flex: 1,
              padding: '12px',
              background: '#0056D2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              opacity: processing ? 0.6 : 1,
            }}
          >
            {processing ? '🔄 Processing...' : 'Pay AED ' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </button>
        </div>

        <p
          style={{
            fontSize: '10px',
            color: '#999',
            margin: '16px 0 0 0',
            textAlign: 'center',
          }}
        >
          💳 This is a demo payment gateway. No real charges will be made.
        </p>
      </div>
    </div>
  );
}
