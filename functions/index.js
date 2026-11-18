const { initializeApp } = require('firebase-admin/app');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const nodemailer = require('nodemailer');
const { notifyPromotionRequest } = require('./notification');

initializeApp();

const smtpUser = defineSecret('PROMOTION_SMTP_USER');
const smtpPassword = defineSecret('PROMOTION_SMTP_PASSWORD');

exports.emailPromotionRequest = onDocumentCreated({
  document: 'promotionRequests/{requestId}',
  secrets: [smtpUser, smtpPassword],
  retry: true,
}, async (event) => {
  if (!event.data) throw new Error('Promotion request event has no document snapshot');
  const sender = smtpUser.value();
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: sender, pass: smtpPassword.value() },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  await notifyPromotionRequest({
    snapshot: event.data,
    reference: event.params.requestId,
    sender,
    sendMail: (message) => transport.sendMail(message),
    logger,
  });
});
