/**
 * Create Payment Intent API Endpoint
 * Creates a payment intent for Stripe
 * 
 * Production: Use Stripe API to create payment intents
 * Development: Simulate payment intent creation
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
    const { amount, currency = 'AED', orderId, buyerEmail, description } = body;

    // Validate required fields
    if (!amount || !orderId) {
      return Response.json(
        { success: false, message: 'Missing required fields: amount, orderId' },
        { status: 400 }
      );
    }

    // Validate amount (must be positive)
    if (amount <= 0) {
      return Response.json(
        { success: false, message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Development mode: Simulate payment intent
    if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY || !stripe) {
      const mockIntentId = `pi_test_${orderId}_${Date.now()}`;
      console.log('💳 PAYMENT INTENT CREATED (Development Mode)');
      console.log('Intent ID:', mockIntentId);
      console.log('Amount:', `${amount} ${currency}`);
      console.log('Order ID:', orderId);
      console.log('---');

      return Response.json(
        {
          success: true,
          clientSecret: `${mockIntentId}_secret_test`,
          paymentIntentId: mockIntentId,
          amount,
          currency,
          orderId,
          status: 'requires_payment_method',
        },
        { status: 200 }
      );
    }

    // Production: Use Stripe API
    if (process.env.STRIPE_SECRET_KEY && stripe) {
      const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: description || `Order ${orderId} - SpinTradeHub`,
        metadata: {
          orderId,
          buyerEmail: buyerEmail || 'unknown',
          platform: 'spintradehub',
        },
      });

      console.log(`✓ Payment intent created: ${paymentIntent.id}`);

      return Response.json(
        {
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          orderId,
          status: paymentIntent.status,
        },
        { status: 200 }
      );
    }

    return Response.json(
      { success: false, message: 'Payment service not configured' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json(
      { success: false, message: 'Failed to create payment intent', error: String(error) },
      { status: 500 }
    );
  }
}
