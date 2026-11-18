const assert = require('node:assert/strict');
const { test } = require('node:test');
const { matchesSavedSearch, notifySavedSearches, countSearchActivity, syncBuyer, syncSupplier, syncPostSuppliers } = require('./homepage-discovery');

function database(entries = {}) {
  const values = new Map(Object.entries(entries));
  const dates = new Map([...values.keys()].map(key => [key, key.startsWith('posts/') ? 200 : 100]));
  const snapshot = key => ({
    id: key.split('/')[1], ref: ref(key), exists: values.has(key),
    createTime: { toMillis: () => dates.get(key) },
    data: () => values.get(key),
  });
  const ref = key => ({ key, get: async () => snapshot(key) });
  const collection = (name, filters = [], maximum = Infinity, after = '') => ({
    doc: id => ref(`${name}/${id}`),
    where: (field, op, value) => collection(name, [...filters, [field, value]], maximum, after),
    orderBy: () => collection(name, filters, maximum, after),
    limit: n => collection(name, filters, n, after),
    startAfter: doc => collection(name, filters, maximum, doc.id),
    get: async () => {
      const docs = [...values.keys()].filter(key => key.startsWith(`${name}/`) && key.split('/')[1] > after &&
        filters.every(([field, value]) => values.get(key)[field] === value)).sort().slice(0, maximum).map(snapshot);
      return { docs, size: docs.length };
    },
  });
  return {
    values, dates, collection,
    async runTransaction(callback) {
      return callback({
        get: reference => reference.get(),
        set: (reference, data) => { values.set(reference.key, data); },
        delete: reference => { values.delete(reference.key); },
      });
    },
  };
}
const search = { userId: 'buyer', brand: ' SKF ', modelNumber: '6205' };
const post = { creatorId: 'supplier', productName: 'Bearing', brand: 'skf', modelNumber: '6205', timestamp: 200 };
const auth = { getUser: async () => ({ metadata: { creationTime: '2025-01-01T00:00:00Z' } }) };

test('buyer summaries use Auth dates and current ratings without publishing private profile fields', async () => {
  const db = database({
    'users/buyer': { name: 'Buyer', username: 'buyer', role: 'buyer', region: 'India', email: 'private', phone: 'private' },
    'publicUserRatings/buyer': { avgRating: 4.8, reviewCount: 5 },
    'publicBuyers/buyer': { email: 'stale private data' },
  });
  await syncBuyer(db, auth, 'buyer');
  assert.deepEqual(db.values.get('publicBuyers/buyer'), {
    name: 'Buyer', username: 'buyer', region: 'India', joinedAt: Date.parse('2025-01-01T00:00:00Z'), avgRating: 4.8, reviewCount: 5,
  });
  db.values.set('publicUserRatings/buyer', { avgRating: 3, reviewCount: 1 });
  await syncBuyer(db, auth, 'buyer');
  assert.equal(db.values.get('publicBuyers/buyer').avgRating, 3);
  db.values.get('users/buyer').role = 'supplier';
  await syncBuyer(db, auth, 'buyer');
  assert.equal(db.values.has('publicBuyers/buyer'), false);
  db.values.set('publicBuyers/buyer', { name: 'Deleted' });
  db.values.delete('users/buyer');
  await syncBuyer(db, auth, 'buyer');
  assert.equal(db.values.has('publicBuyers/buyer'), false);
});

test('buyers without Auth dates are not assigned invented dates and sync failures propagate', async () => {
  const db = database({ 'users/buyer': { role: 'buyer' } });
  await syncBuyer(db, { getUser: async () => { throw { code: 'auth/user-not-found' }; } }, 'buyer');
  assert.equal(db.values.get('publicBuyers/buyer').joinedAt, 0);
  await assert.rejects(syncBuyer(db, { getUser: async () => { throw new Error('Auth offline'); } }, 'buyer'), /Auth offline/);
  const broken = { ...db, runTransaction: async () => { throw new Error('Firestore offline'); } };
  await assert.rejects(syncBuyer(broken, auth, 'buyer'), /Firestore offline/);
});

test('saved searches use exact normalized structured criteria, both criteria AND, never BUY', () => {
  assert.equal(matchesSavedSearch(post, search), true);
  assert.equal(matchesSavedSearch({ ...post, modelNumber: '6205-2RS' }, search), false);
  assert.equal(matchesSavedSearch({ ...post, brand: 'SKF aftermarket' }, search), false);
  assert.equal(matchesSavedSearch(post, { brand: 'SkF' }), true);
  assert.equal(matchesSavedSearch(post, { modelNumber: '6205' }), true);
  assert.equal(matchesSavedSearch(post, {}), false);
  assert.equal(matchesSavedSearch({ ...post, postType: 'BUY' }, search), false);
});

test('new matching listings notify once on retries with the existing Notifications shape', async () => {
  const db = database({ 'posts/p': post, 'savedSearches/s': search });
  await notifySavedSearches(db, 'p');
  await notifySavedSearches(db, 'p');
  const notices = [...db.values].filter(([key]) => key.startsWith('notifications/'));
  assert.equal(notices.length, 1);
  assert.match(notices[0][0], /^notifications\/search_[a-f0-9]{64}$/);
  assert.deepEqual({ ...notices[0][1], timestamp: 0 }, {
    userId: 'buyer', type: 'SYSTEM', title: 'Saved search match',
    message: 'A new listing matches  SKF  / 6205: Bearing',
    read: false, timestamp: 0, link: '/p',
  });
});

test('alerts exclude own listings, searches created later, deleted sources, BUY and unrelated matches', async () => {
  for (const [listing, saved, later] of [
    [post, { ...search, userId: 'supplier' }],
    [post, search, true],
    [undefined, search],
    [{ ...post, postType: 'BUY' }, search],
    [{ ...post, brand: 'Other' }, search],
    [post, { ...search, userId: '' }],
  ]) {
    const db = database({ ...(listing ? { 'posts/p': listing } : {}), 'savedSearches/s': saved });
    if (later) db.dates.set('savedSearches/s', 300);
    await notifySavedSearches(db, 'p');
    assert.equal([...db.values.keys()].some(key => key.startsWith('notifications/')), false);
  }
});

test('transactions recheck deleted/changed searches and posts, and page through all saved searches', async () => {
  for (const key of ['posts/p', 'savedSearches/s']) {
    const db = database({ 'posts/p': post, 'savedSearches/s': search });
    const run = db.runTransaction;
    db.runTransaction = callback => { db.values.delete(key); return run(callback); };
    await notifySavedSearches(db, 'p');
    assert.equal([...db.values.keys()].some(key => key.startsWith('notifications/')), false);
  }
  const entries = { 'posts/p': post };
  for (let i = 0; i < 201; i++) entries[`savedSearches/s${String(i).padStart(3, '0')}`] = { ...search, userId: `buyer${i}` };
  const db = database(entries);
  await notifySavedSearches(db, 'p');
  assert.equal([...db.values.keys()].filter(key => key.startsWith('notifications/')).length, 201);
});

test('popular searches count only current catalogue labels, with retry receipts and no private data', async () => {
  const db = database({ 'publicProducts/p': post });
  const event = { userId: 'buyer', productId: 'p', term: ' SKF ' };
  await countSearchActivity(db, 'buyer_day1', event);
  await countSearchActivity(db, 'buyer_day1', event);
  await countSearchActivity(db, 'buyer_day2', event);
  await countSearchActivity(db, 'not-counted', { ...event, term: 'private arbitrary text' });
  await countSearchActivity(db, 'gone', { ...event, productId: 'deleted' });
  const stats = [...db.values].filter(([key]) => key.startsWith('publicSearchStats/'));
  assert.equal(stats.length, 1);
  assert.deepEqual(stats[0][1], { term: 'skf', count: 2 });
  await assert.rejects(countSearchActivity(db, 'invalid', {}), /Invalid search activity/);
});

test('supplier summaries allowlist public fields, use Auth join date and count canonical non-BUY listings once', async () => {
  const db = database({
    'users/supplier': { name: 'Supplier', username: 'supplier', region: 'UAE', role: 'supplier', email: 'private' },
    'publicUserRatings/supplier': { avgRating: 4.8, reviewCount: 5, phone: 'private' },
    'posts/one': { ...post, userId: 'supplier' },
    'posts/legacy': { ...post, creatorId: undefined, userId: 'supplier' },
    'posts/request': { ...post, postType: 'BUY' },
    'posts/blank': { ...post, productName: '' },
    'posts/missing-date': { ...post, timestamp: undefined },
    'posts/stale': { ...post, creatorId: 'different', userId: 'supplier' },
  });
  await syncSupplier(db, auth, 'supplier');
  assert.deepEqual(db.values.get('publicSuppliers/supplier'), {
    name: 'Supplier', username: 'supplier', region: 'UAE', joinedAt: Date.parse('2025-01-01T00:00:00Z'),
    productCount: 2, avgRating: 4.8, reviewCount: 5,
  });
  db.values.get('users/supplier').role = 'buyer';
  await syncSupplier(db, auth, 'supplier');
  assert.equal(db.values.has('publicSuppliers/supplier'), false);
});

test('supplier sync removes deleted profiles, distinguishes unavailable join date from Auth failure and recomputes both owners', async () => {
  const db = database({ 'users/supplier': { role: 'supplier' }, 'publicSuppliers/deleted': { name: 'Old' } });
  await syncSupplier(db, auth, 'deleted');
  assert.equal(db.values.has('publicSuppliers/deleted'), false);
  await syncSupplier(db, { getUser: async () => { throw { code: 'auth/user-not-found' }; } }, 'supplier');
  assert.equal(db.values.get('publicSuppliers/supplier').joinedAt, 0);
  await assert.rejects(syncSupplier(db, { getUser: async () => { throw new Error('Auth unavailable'); } }, 'supplier'), /Auth unavailable/);
  const ids = [];
  const trackingAuth = { getUser: async id => { ids.push(id); return auth.getUser(id); } };
  await syncPostSuppliers(db, trackingAuth, {
    before: { exists: true, data: () => ({ creatorId: 'old', userId: 'old' }) },
    after: { exists: true, data: () => ({ creatorId: 'supplier', userId: 'bad/id' }) },
  });
  assert.deepEqual(ids, ['old', 'supplier']);
});
