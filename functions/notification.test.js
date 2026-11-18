const assert = require('node:assert/strict');
const test = require('node:test');
const { buildNotification, notifyPromotionRequest } = require('./notification');

const request = {
  companyName: 'Example Trading', brandName: 'Example Brand', products: 'Bearings',
  category: 'Industrial', website: '', country: 'UAE', contactName: 'Applicant',
  email: 'applicant@example.com', description: 'Please promote our range.', userId: 'account-id',
};
const logger = { info() {}, warn() {}, error() {} };

function snapshotFor(data, exists = true) {
  const updates = [];
  return {
    snapshot: {
      ref: {
        get: async () => ({ exists, data: () => data }),
        update: async (value) => { updates.push(value); },
      },
    },
    updates,
  };
}

test('email goes only to the fixed inbox and contains every field and reference', () => {
  const message = buildNotification(request, 'request-id', 'info@spintradehub.com');
  assert.equal(message.to, 'info@spintradehub.com');
  assert.equal(message.from, 'info@spintradehub.com');
  assert.equal(message.replyTo, 'applicant@example.com');
  assert.ok(message.text.includes('Reference: request-id'));
  for (const key of Object.keys(request)) {
    if (request[key]) assert.ok(message.text.includes(request[key]), key);
  }
  assert.ok(message.text.includes('Website / product link: Not provided'));
  assert.equal(message.html, undefined);
});

test('accepted SMTP notification is marked sent without changing the saved request', async () => {
  const { snapshot, updates } = snapshotFor(request);
  let sends = 0;
  await notifyPromotionRequest({
    snapshot, reference: 'request-id', sender: 'info@spintradehub.com', logger,
    sendMail: async () => {
      sends += 1;
      return { accepted: ['info@spintradehub.com'], messageId: 'smtp-id' };
    },
  });
  assert.equal(sends, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].emailNotification.status, 'SENT');
  assert.equal(updates[0].emailNotification.messageId, 'smtp-id');
  assert.equal(updates[0].status, undefined);
});

test('already-sent and deleted requests do not send email again', async () => {
  for (const fixture of [
    snapshotFor({ ...request, emailNotification: { status: 'SENT' } }),
    snapshotFor(request, false),
  ]) {
    await notifyPromotionRequest({
      snapshot: fixture.snapshot, reference: 'request-id', sender: 'info@spintradehub.com', logger,
      sendMail: async () => assert.fail('Should not send'),
    });
    assert.equal(fixture.updates.length, 0);
  }
});

test('SMTP failures and rejected recipients propagate for event retries', async () => {
  for (const sendMail of [
    async () => { throw new Error('SMTP unavailable'); },
    async () => ({ accepted: [], rejected: ['info@spintradehub.com'] }),
  ]) {
    const { snapshot, updates } = snapshotFor(request);
    await assert.rejects(notifyPromotionRequest({
      snapshot, reference: 'request-id', sender: 'info@spintradehub.com', logger, sendMail,
    }));
    assert.equal(updates.length, 0);
  }
});

test('invalid email data is marked invalid rather than generating endless retries', async () => {
  const { snapshot, updates } = snapshotFor({ ...request, email: 'bad\r\nBcc: other@example.com' });
  await notifyPromotionRequest({
    snapshot, reference: 'request-id', sender: 'info@spintradehub.com', logger,
    sendMail: async () => assert.fail('Should not send'),
  });
  assert.equal(updates[0].emailNotification.status, 'INVALID');
});
