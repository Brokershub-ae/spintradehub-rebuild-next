const RECIPIENT = 'info@spintradehub.com';
const FIELDS = [
  ['companyName', 'Company'],
  ['brandName', 'Brand'],
  ['products', 'Products'],
  ['category', 'Category / industry'],
  ['website', 'Website / product link'],
  ['country', 'Country'],
  ['contactName', 'Contact person'],
  ['email', 'Business email'],
  ['description', 'Promotion request'],
];

function buildNotification(request, reference, sender) {
  const lines = FIELDS.map(([key, label]) => {
    const value = request[key];
    if (typeof value !== 'string' || (key !== 'website' && !value.trim())) {
      throw new Error(`Invalid promotion request field: ${key}`);
    }
    return `${label}: ${value.trim() || 'Not provided'}`;
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    throw new Error('Invalid promotion request business email');
  }
  return {
    from: sender,
    to: RECIPIENT,
    replyTo: request.email.trim(),
    subject: `New SpinTradeHub promotion request (${reference})`,
    text: [
      'A new brand and product promotion request has been submitted.',
      `Reference: ${reference}`,
      `Account ID: ${request.userId}`,
      'Listing status: Pending review',
      '',
      ...lines,
      '',
      'This is a request for review, not an automatically published listing.',
      'Reply to this email to contact the applicant.',
      'View the saved request in Firebase Console > Firestore > promotionRequests.',
    ].join('\n'),
  };
}

async function notifyPromotionRequest({ snapshot, reference, sender, sendMail, logger }) {
  // Check the current document because a retried event contains the original snapshot.
  const current = await snapshot.ref.get();
  if (!current.exists) {
    logger.warn('Promotion request deleted before notification', { reference });
    return;
  }
  const request = current.data();
  if (request.emailNotification?.status === 'SENT') return;

  let message;
  try {
    message = buildNotification(request, reference, sender);
  } catch (error) {
    logger.error('Invalid promotion request; email not sent', { reference, error: error.message });
    await snapshot.ref.update({
      emailNotification: { status: 'INVALID', error: error.message },
    });
    return;
  }

  try {
    const result = await sendMail(message);
    if (!Array.isArray(result.accepted) ||
        !result.accepted.some((address) => String(address).toLowerCase() === RECIPIENT)) {
      throw new Error('SMTP server did not accept the notification recipient');
    }
    await snapshot.ref.update({
      emailNotification: {
        status: 'SENT',
        recipient: RECIPIENT,
        messageId: result.messageId || '',
        sentAt: Date.now(),
      },
    });
    logger.info('Promotion notification accepted by SMTP', { reference });
  } catch (error) {
    logger.error('Promotion notification failed; event will retry', {
      reference,
      code: typeof error.code === 'string' ? error.code : 'notification-failed',
    });
    // Preserve the request and allow Firebase's event retry to attempt delivery again.
    throw error;
  }
}

module.exports = { buildNotification, notifyPromotionRequest };
