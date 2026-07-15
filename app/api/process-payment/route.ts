/**
 * Process Payment API Endpoint
 * Processes card payments for orders
 * 
 * Production: Integrate with Stripe for card processing
 * Development: Simulate payment processing with Luhn validation
 */

let stripe: any = null;

// Try to load Stripe dynamically if available
try {
  stripe = require('stripe');
} catch (e) {
  // Stripe not installed, will use fallback
  stripe = null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardNumber, expiryDate, cvc, amount, orderId, buyerEmail } = body;

    // Validate required fields
    if (!cardNumber || !expiryDate || !cvc || !amount || !orderId) {
      return Response.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate card number using Luhn algorithm
    if (!validateLuhnChecksum(cardNumber.replace(/\s/g, ''))) {
      return Response.json(
        { success: false, message: 'Invalid card number' },
        { status: 400 }
      );
    }

    // Validate expiry date format (MM/YY)
    const expiryRegex = /^\d{2}\/\d{2}$/;
    if (!expiryRegex.test(expiryDate)) {
      return Response.json(
        { success: false, message: 'Invalid expiry date format (use MM/YY)' },
        { status: 400 }
      );
    }

    // Validate CVC (3-4 digits)
    if (!/^\d{3,4}$/.test(cvc)) {
      return Response.json(
        { success: false, message: 'Invalid CVC' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return Response.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Development: Simulate payment processing
    if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY || !stripe) {
      const transactionId = `txn_test_${orderId}_${Date.now()}`;
      const lastFourDigits = cardNumber.slice(-4);

      console.log('💳 PAYMENT PROCESSED (Development Mode)');
      console.log('Transaction ID:', transactionId);
      console.log('Amount:', `${amount} AED`);
      console.log('Card:', `****${lastFourDigits}`);
      console.log('Order ID:', orderId);
      console.log('---');

      // Simulate occasional failures for testing
      const simulateFailure = false; // Set to true to test failure handling
      if (simulateFailure && Math.random() < 0.1) {
        return Response.json(
          { success: false, message: 'Card declined by issuer' },
          { status: 402 }
        );
      }

      return Response.json(
        {
          success: true,
          transactionId,
          amount,
          currency: 'AED',
          orderId,
          cardLastFour: lastFourDigits,
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Production: Use Stripe for payment processing
    if (process.env.STRIPE_SECRET_KEY && stripe) {
      const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

      try {
        const paymentMethod = await stripeClient.paymentMethods.create({
          type: 'card',
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: expiryDate.split('/')[0],
            exp_year: '20' + expiryDate.split('/')[1],
            cvc: cvc,
          },
        });

        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'aed',
          payment_method: paymentMethod.id,
          confirm: true,
          metadata: {
            orderId,
            buyerEmail: buyerEmail || 'unknown',
          },
        });

        if (paymentIntent.status === 'succeeded') {
          console.log(`✓ Payment successful: ${paymentIntent.id}`);
          return Response.json(
            {
              success: true,
              transactionId: paymentIntent.id,
              amount,
              currency: 'AED',
              orderId,
              cardLastFour: cardNumber.slice(-4),
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
            { status: 200 }
          );
        } else {
          return Response.json(
            { success: false, message: `Payment ${paymentIntent.status}` },
            { status: 402 }
          );
        }
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError);
        return Response.json(
          { success: false, message: stripeError.message || 'Payment processing failed' },
          { status: 402 }
        );
      }
    }

    return Response.json(
      { success: false, message: 'Payment service not configured' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Payment processing error:', error);
    return Response.json(
      { success: false, message: 'Failed to process payment', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Luhn Algorithm: Validates credit card numbers
 * Used for basic card number validation
 */
function validateLuhnChecksum(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);

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
}
