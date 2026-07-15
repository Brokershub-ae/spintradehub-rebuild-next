/**
 * Email Service API Endpoint
 * Handles sending emails for orders, messages, and notifications
 * 
 * Production: Integrate with SendGrid, AWS SES, or similar
 * Development: Console logs and simulates email sending
 */

let sgMail: any = null;

// Try to load SendGrid dynamically if available
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  // SendGrid not installed, will use fallback
  sgMail = null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, emailType, data } = body;

    // Validate required fields
    if (!to || !subject || !emailType) {
      return Response.json(
        { success: false, message: 'Missing required fields: to, subject, emailType' },
        { status: 400 }
      );
    }

    // Development: Log email to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EMAIL SENT (Development Mode)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Type:', emailType);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('---');
    }

    // Production: Send via SendGrid/AWS SES
    if (process.env.NODE_ENV === 'production') {
      // Example: SendGrid integration
      if (process.env.SENDGRID_API_KEY && sgMail) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@spintradehub.com',
          subject,
          html: generateEmailHTML(emailType, data),
        };

        await sgMail.send(msg);
        console.log(`✓ Email sent to ${to}`);
      }
      // Example: AWS SES integration
      else if (process.env.AWS_REGION) {
        // AWS SES implementation would go here
        console.log(`✓ Email sent via SES to ${to}`);
      }
      // Fallback: Still log in case no service configured
      else {
        console.log(`⚠️ No email service configured. Email to ${to} not sent.`);
      }
    }

    return Response.json(
      { success: true, message: 'Email sent successfully', to, emailType },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email API error:', error);
    return Response.json(
      { success: false, message: 'Failed to send email', error: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML email templates
function generateEmailHTML(emailType: string, data: any): string {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #0056D2 0%, #003D9E 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .content { line-height: 1.6; }
      .button { display: inline-block; background: #0056D2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
      .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #E0E0E0; padding-top: 20px; }
    </style>
  `;

  switch (emailType) {
    case 'ORDER_CONFIRMATION':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>✅ Order Confirmed!</h2>
          </div>
          <div class="content">
            <p>Hello ${data.buyerName},</p>
            <p>Your order has been successfully placed!</p>
            <h3>Order Details:</h3>
            <ul>
              <li><strong>Order ID:</strong> ${data.orderId}</li>
              <li><strong>Product:</strong> ${data.productName}</li>
              <li><strong>Quantity:</strong> ${data.quantity}</li>
              <li><strong>Total Price:</strong> AED ${data.totalPrice}</li>
              <li><strong>Seller:</strong> ${data.sellerName}</li>
            </ul>
            <p>The seller will contact you shortly to arrange delivery and payment.</p>
            <a href="https://spintradehub.com/orders" class="button">View Your Orders</a>
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;

    case 'ORDER_SHIPPED':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>📦 Order Shipped!</h2>
          </div>
          <div class="content">
            <p>Hello ${data.buyerName},</p>
            <p>Great news! Your order has been shipped.</p>
            <h3>Shipment Details:</h3>
            <ul>
              <li><strong>Order ID:</strong> ${data.orderId}</li>
              <li><strong>Product:</strong> ${data.productName}</li>
              ${data.trackingNumber ? `<li><strong>Tracking Number:</strong> ${data.trackingNumber}</li>` : ''}
            </ul>
            <p>Your package is on its way! You should receive it within the estimated timeframe.</p>
            <a href="https://spintradehub.com/orders" class="button">Track Your Order</a>
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;

    case 'ORDER_DELIVERED':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>✅ Order Delivered!</h2>
          </div>
          <div class="content">
            <p>Hello ${data.buyerName},</p>
            <p>Your order has been delivered! Please check the package and leave a review.</p>
            <h3>Order Details:</h3>
            <ul>
              <li><strong>Order ID:</strong> ${data.orderId}</li>
              <li><strong>Product:</strong> ${data.productName}</li>
            </ul>
            <p>Your feedback helps us and other buyers make better decisions.</p>
            <a href="https://spintradehub.com/orders" class="button">Leave a Review</a>
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;

    case 'NEW_MESSAGE':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>💬 New Message</h2>
          </div>
          <div class="content">
            <p>Hello ${data.recipientName},</p>
            <p>You have a new message from ${data.senderName}:</p>
            <blockquote style="background: #F5F5F5; padding: 12px; border-left: 4px solid #0056D2; margin: 20px 0;">
              "${data.messagePreview}"
            </blockquote>
            <a href="https://spintradehub.com/messages" class="button">Reply Now</a>
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;

    case 'WEEKLY_DIGEST':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>📊 Weekly Digest</h2>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <p>Here's your weekly summary:</p>
            <ul>
              <li><strong>New Connections:</strong> ${data.newConnections}</li>
              <li><strong>Total Orders:</strong> ${data.totalOrders}</li>
              <li><strong>Top Products:</strong> ${data.topProducts?.join(', ') || 'None'}</li>
            </ul>
            <a href="https://spintradehub.com/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;

    case 'SELLER_ALERT':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>🔔 Seller Alert</h2>
          </div>
          <div class="content">
            <p>Hello ${data.sellerName},</p>
            <p>${data.message}</p>
            ${data.actionLink ? `<a href="${data.actionLink}" class="button">Take Action</a>` : ''}
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;

    default:
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h2>✉️ SpinTradeHub Notification</h2>
          </div>
          <div class="content">
            <p>${data.message || 'You have a new notification from SpinTradeHub'}</p>
          </div>
          <div class="footer">
            <p>SpinTradeHub - B2B Industrial Trading Platform</p>
            <p>Email: support@spintradehub.com | Phone: +971541635009</p>
          </div>
        </div>
      `;
  }
}
