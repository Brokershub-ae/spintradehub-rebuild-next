/**
 * Stripe Payment Service
 * Handles payment processing for orders (no subscriptions)
 */

// Note: In production, use environment variables for Stripe keys
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should be set in .env.local

export interface PaymentIntent {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  description: string;
}

export const stripeService = {
  /**
   * Create a payment intent for an order
   * In production, this would call your backend API
   * which securely creates the intent using the secret key
   */
  async createPaymentIntent(paymentData: PaymentIntent) {
    try {
      // For now, simulate payment processing
      // In production: POST to your backend API
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Process payment (simulated for MVP)
   * In production, use Stripe.js library
   */
  async processPayment(paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvc: string;
    amount: number;
    orderId: string;
  }) {
    try {
      // Simulate payment processing
      // In production: Use Stripe.js confirmCardPayment()
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      const data = await response.json();
      return {
        success: true,
        transactionId: data.transactionId,
        message: 'Payment processed successfully',
      };
    } catch (error) {
      console.error('Payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  },

  /**
   * Validate card number (basic Luhn algorithm)
   */
  validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * Format card number (add spaces)
   */
  formatCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  },

  /**
   * Generate mock transaction ID
   */
  generateTransactionId(): string {
    return 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  },
};
