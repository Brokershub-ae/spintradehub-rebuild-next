const assert = require('node:assert/strict');
const test = require('node:test');
const { buildPublicRating, syncPublicRating, syncReviewChange } = require('./public-ratings');
const logger = { warn() {} };

test('public summaries contain only approved fields and valid review totals', () => {
  const summary = buildPublicRating({
    uid: 'private', name: 'Buyer', username: 'buyer', role: 'buyer', region: 'UAE',
    email: 'private@example.com', phone: 'private-phone', recoveryEmail: 'private',
  }, [
    { rating: 5, text: 'Private review', reviewerId: 'private' },
    { rating: '4' }, { rating: 5 }, { rating: 5 }, { rating: 5 },
    { rating: 0 }, { rating: 6 }, { rating: true }, { rating: 'invalid' },
  ], logger);
  assert.deepEqual(summary, {
    name: 'Buyer', username: 'buyer', role: 'buyer', region: 'UAE',
    avgRating: 4.8, reviewCount: 5,
  });
  assert.equal(buildPublicRating(null, [], logger), null);
  assert.equal(buildPublicRating({ role: 'admin' }, [], logger), null);
  assert.deepEqual(buildPublicRating({ role: 'supplier' }, [], logger), {
    name: '', username: '', region: '', role: 'supplier', avgRating: 0, reviewCount: 0,
  });
});

function mockDatabase(profiles, reviews) {
  const summaries = new Map();
  const reads = [];
  let locked = false;
  const db = {
    collection(collection) {
      return {
        doc: (id) => ({ collection, id }),
        where: (field, operator, id) => {
          assert.equal(field, 'revieweeId');
          assert.equal(operator, '==');
          return { collection, id, query: true };
        },
      };
    },
    async runTransaction(callback) {
      // Model Firestore's lock on the shared summary document.
      while (locked) await new Promise(setImmediate);
      locked = true;
      try {
        return await callback({
          async get(ref) {
            reads.push(ref.collection);
            if (ref.collection === 'users') {
              const profile = profiles.get(ref.id);
              return { exists: !!profile, data: () => profile };
            }
            if (ref.collection === 'reviews') {
              return { docs: reviews.filter((r) => r.revieweeId === ref.id).map((r) => ({ data: () => r })) };
            }
            return {};
          },
          set(ref, data) {
            assert.equal(ref.collection, 'publicUserRatings');
            summaries.set(ref.id, data);
          },
          delete(ref) { summaries.delete(ref.id); },
        });
      } finally {
        locked = false;
      }
    },
  };
  return { db, summaries, reads };
}

test('sync fully replaces summaries, recomputes current data, and removes deleted or ineligible users', async () => {
  const profiles = new Map([['buyer', { name: 'Buyer', role: 'buyer' }]]);
  const reviews = [{ revieweeId: 'buyer', rating: 5 }];
  const { db, summaries, reads } = mockDatabase(profiles, reviews);
  summaries.set('buyer', { email: 'old-private-field', avgRating: 1 });
  await syncPublicRating(db, 'buyer', logger);
  assert.equal(summaries.get('buyer').avgRating, 5);
  assert.equal('email' in summaries.get('buyer'), false);
  assert.deepEqual(reads.slice(0, 3), ['publicUserRatings', 'users', 'reviews']);

  reviews.push({ revieweeId: 'buyer', rating: 3 });
  await Promise.all([
    syncPublicRating(db, 'buyer', logger),
    syncPublicRating(db, 'buyer', logger),
  ]);
  assert.equal(summaries.get('buyer').avgRating, 4);
  assert.equal(summaries.get('buyer').reviewCount, 2);
  reviews.splice(0);
  await syncPublicRating(db, 'buyer', logger);
  assert.equal(summaries.get('buyer').reviewCount, 0);
  profiles.set('buyer', { role: 'admin' });
  await syncPublicRating(db, 'buyer', logger);
  assert.equal(summaries.has('buyer'), false);
  profiles.set('buyer', { role: 'buyer' });
  await syncPublicRating(db, 'buyer', logger);
  profiles.delete('buyer');
  await syncPublicRating(db, 'buyer', logger);
  assert.equal(summaries.has('buyer'), false);
});

const snapshot = (id) => ({
  exists: id !== undefined,
  id: 'review',
  data: () => ({ revieweeId: id }),
});

test('review creation, edits, reassignment and deletion update all affected users', async () => {
  const { db, summaries } = mockDatabase(
    new Map([['old', { role: 'buyer' }], ['new', { role: 'supplier' }]]),
    [{ revieweeId: 'new', rating: 4 }]
  );
  await syncReviewChange(db, { before: snapshot(), after: snapshot('new') }, logger);
  assert.equal(summaries.get('new').avgRating, 4);
  await syncReviewChange(db, { before: snapshot('old'), after: snapshot('new') }, logger);
  assert.equal(summaries.get('old').reviewCount, 0);
  await syncReviewChange(db, { before: snapshot('new'), after: snapshot() }, logger);
  assert.equal(summaries.get('new').avgRating, 4); // Current database state, not stale event contents.
  await syncReviewChange(db, { before: snapshot('new'), after: snapshot('new') }, logger);
  assert.equal(summaries.get('new').reviewCount, 1);
});

test('sync failures propagate for function retries and malformed review IDs are logged', async () => {
  const error = new Error('database unavailable');
  await assert.rejects(syncPublicRating({
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async () => { throw error; },
  }, 'buyer', logger), (cause) => cause === error);
  await assert.rejects(syncReviewChange({}, undefined, logger), /no change snapshots/);
  let warnings = 0;
  await syncReviewChange({}, { before: snapshot('invalid/id'), after: snapshot(null) }, {
    warn() { warnings++; },
  });
  assert.equal(warnings, 2);
});
