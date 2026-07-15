/**
 * Email Notification Service
 * Sends email alerts for important events
 * Note: In production, integrate with SendGrid, AWS SES, or similar
 */

export interface EmailNotification {
  to: string;
  subject: string;
  type: 'ORDER_CREATED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'NEW_MESSAGE' | 'WEEKLY_DIGEST' | 'SELLER_ALERT';
  data: Record<string, any>;
}

export const emailService = {
  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    email: string,
    customerName: string,
    orderId: string,
    productName: string,
    quantity: number,
    totalPrice: number,
    sellerName: string
  ) {
    const emailData: EmailNotification = {
      to: email,
      subject: `Order Confirmed #${orderId}`,
      type: 'ORDER_CREATED',
      data: {
        customerName,
        orderId,
        productName,
        quantity,
        totalPrice,
        sellerName,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendEmail(emailData);
  },

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(
    email: string,
    customerName: string,
    orderId: string,
    trackingNumber?: string
  ) {
    const emailData: EmailNotification = {
      to: email,
      subject: `Your order #${orderId} has been shipped!`,
      type: 'ORDER_SHIPPED',
      data: {
        customerName,
        orderId,
        trackingNumber,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendEmail(emailData);
  },

  /**
   * Send order delivered notification
   */
  async sendOrderDelivered(
    email: string,
    customerName: string,
    orderId: string,
    productName: string
  ) {
    const emailData: EmailNotification = {
      to: email,
      subject: `Your order #${orderId} has been delivered!`,
      type: 'ORDER_DELIVERED',
      data: {
        customerName,
        orderId,
        productName,
        reviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/orders`,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendEmail(emailData);
  },

  /**
   * Send new message alert
   */
  async sendNewMessageAlert(
    email: string,
    recipientName: string,
    senderName: string,
    messagePreview: string
  ) {
    const emailData: EmailNotification = {
      to: email,
      subject: `New message from ${senderName}`,
      type: 'NEW_MESSAGE',
      data: {
        recipientName,
        senderName,
        messagePreview,
        messageLink: `${process.env.NEXT_PUBLIC_APP_URL}/messages`,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendEmail(emailData);
  },

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(
    email: string,
    userName: string,
    topProducts: Array<{ name: string; price: string }>,
    totalOrders: number,
    newConnections: number
  ) {
    const emailData: EmailNotification = {
      to: email,
      subject: 'Your SpinTradeHub Weekly Summary',
      type: 'WEEKLY_DIGEST',
      data: {
        userName,
        topProducts,
        totalOrders,
        newConnections,
        digestLink: `${process.env.NEXT_PUBLIC_APP_URL}/analytics`,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendEmail(emailData);
  },

  /**
   * Send seller alert (new order, low inventory, etc.)
   */
  async sendSellerAlert(
    email: string,
    sellerName: string,
    alertType: string,
    message: string,
    actionLink?: string
  ) {
    const emailData: EmailNotification = {
      to: email,
      subject: `Alert: ${alertType}`,
      type: 'SELLER_ALERT',
      data: {
        sellerName,
        alertType,
        message,
        actionLink: actionLink || `${process.env.NEXT_PUBLIC_APP_URL}/seller-dashboard`,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendEmail(emailData);
  },

  /**
   * Generic email send function
   * In production, this would call your backend API
   * which uses SendGrid, AWS SES, or similar
   */
  async sendEmail(emailData: EmailNotification) {
    try {
      // For MVP: Log to console (simulate in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', emailData);
        return { success: true, message: 'Email queued for sending' };
      }

      // In production: Call your backend API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Format email template HTML
   */
  getEmailTemplate(notification: EmailNotification): string {
    const baseStyle = `
      font-family: 'Inter', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    `;

    const templates: Record<string, string> = {
      ORDER_CREATED: `
        <div style="${baseStyle}">
          <h2 style="color: #0056D2;">Order Confirmed</h2>
          <p>Hi ${notification.data.customerName},</p>
          <p>Your order <strong>#${notification.data.orderId}</strong> has been confirmed!</p>
          <div style="background: #F5F5F5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>${notification.data.productName}</strong></p>
            <p>Quantity: ${notification.data.quantity}</p>
            <p>Total: AED ${notification.data.totalPrice}</p>
            <p>Seller: ${notification.data.sellerName}</p>
          </div>
          <p>You'll receive shipping updates soon. Thank you for trading with SpinTradeHub!</p>
        </div>
      `,
      ORDER_SHIPPED: `
        <div style="${baseStyle}">
          <h2 style="color: #0056D2;">Order Shipped</h2>
          <p>Hi ${notification.data.customerName},</p>
          <p>Your order <strong>#${notification.data.orderId}</strong> has been shipped!</p>
          ${notification.data.trackingNumber ? `<p>Tracking: ${notification.data.trackingNumber}</p>` : ''}
          <p>Track your shipment and it will arrive soon.</p>
        </div>
      `,
      ORDER_DELIVERED: `
        <div style="${baseStyle}">
          <h2 style="color: #0056D2;">Order Delivered</h2>
          <p>Hi ${notification.data.customerName},</p>
          <p>Your order <strong>#${notification.data.orderId}</strong> (${notification.data.productName}) has been delivered!</p>
          <p><a href="${notification.data.reviewLink}" style="color: #0056D2; text-decoration: none; font-weight: 600;">Leave a Review</a></p>
        </div>
      `,
      NEW_MESSAGE: `
        <div style="${baseStyle}">
          <h2 style="color: #0056D2;">New Message</h2>
          <p>Hi ${notification.data.recipientName},</p>
          <p>You have a new message from <strong>${notification.data.senderName}</strong>:</p>
          <div style="background: #F5F5F5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #FF8C00;">
            "${notification.data.messagePreview}"
          </div>
          <p><a href="${notification.data.messageLink}" style="color: #0056D2; text-decoration: none; font-weight: 600;">Reply in Messages</a></p>
        </div>
      `,
      WEEKLY_DIGEST: `
        <div style="${baseStyle}">
          <h2 style="color: #0056D2;">Your Weekly Summary</h2>
          <p>Hi ${notification.data.userName},</p>
          <div style="background: #F5F5F5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p>📊 <strong>This Week:</strong></p>
            <p>Orders: ${notification.data.totalOrders}</p>
            <p>New Connections: ${notification.data.newConnections}</p>
          </div>
          <p><a href="${notification.data.digestLink}" style="color: #0056D2; text-decoration: none; font-weight: 600;">View Full Analytics</a></p>
        </div>
      `,
      SELLER_ALERT: `
        <div style="${baseStyle}">
          <h2 style="color: #FF8C00;">⚠️ ${notification.data.alertType}</h2>
          <p>Hi ${notification.data.sellerName},</p>
          <p>${notification.data.message}</p>
          <p><a href="${notification.data.actionLink}" style="color: #0056D2; text-decoration: none; font-weight: 600;">Take Action</a></p>
        </div>
      `,
    };

    return templates[notification.type] || 'Email notification';
  },
};
