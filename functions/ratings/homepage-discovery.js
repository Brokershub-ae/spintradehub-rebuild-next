const { createHash } = require('node:crypto');
const { FieldPath } = require('firebase-admin/firestore');
const { buildPublicProduct } = require('./public-products');

const normalize = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
const hash = value => createHash('sha256').update(value).digest('hex');

function matchesSavedSearch(post, search) {
  if (!post || post.postType === 'BUY') return false;
  const brand = normalize(search.brand);
  const model = normalize(search.modelNumber);
  return Boolean(brand || model) &&
    (!brand || normalize(post.brand) === brand) &&
    (!model || normalize(post.modelNumber) === model);
}

async function notifySavedSearches(db, postId) {
  const postRef = db.collection('posts').doc(postId);
  const initial = await postRef.get();
  if (!initial.exists || initial.data().postType === 'BUY') return;
  let cursor;
  while (true) {
    let query = db.collection('savedSearches').orderBy(FieldPath.documentId()).limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const saved of page.docs) {
      if (!matchesSavedSearch(initial.data(), saved.data())) continue;
      const notification = db.collection('notifications').doc(`search_${hash(`${saved.id}:${postId}`)}`);
      await db.runTransaction(async transaction => {
        const [marker, currentPost, currentSearch] = await Promise.all([
          transaction.get(notification), transaction.get(postRef), transaction.get(saved.ref),
        ]);
        if (marker.exists || !currentPost.exists || !currentSearch.exists) return;
        const post = currentPost.data();
        const search = currentSearch.data();
        if (!matchesSavedSearch(post, search) || !normalize(post.productName) || typeof search.userId !== 'string' || !search.userId ||
            search.userId === (post.creatorId || post.userId) ||
            currentSearch.createTime.toMillis() > initial.createTime.toMillis()) return;
        transaction.set(notification, {
          userId: search.userId, type: 'SYSTEM', title: 'Saved search match',
          message: `A new listing matches ${[search.brand, search.modelNumber].filter(Boolean).join(' / ')}: ${String(post.productName || 'Product').slice(0, 200)}`,
          read: false, timestamp: Date.now(), link: `/${encodeURIComponent(postId)}`,
        });
      });
    }
    if (page.size < 200) break;
    cursor = page.docs[page.docs.length - 1];
  }
}

async function countSearchActivity(db, eventId, event) {
  if (!event || !event.userId || !event.productId || !event.term) throw new Error('Invalid search activity');
  const product = await db.collection('publicProducts').doc(event.productId).get();
  if (!product.exists) return;
  const data = product.data();
  const term = normalize(event.term);
  const label = [data.brand, data.modelNumber, data.productName].find(value => normalize(value) === term);
  if (!label) return;
  const stats = db.collection('publicSearchStats').doc(hash(term));
  const marker = db.collection('searchActivityReceipts').doc(eventId);
  await db.runTransaction(async transaction => {
    const [receipt, previous] = await Promise.all([transaction.get(marker), transaction.get(stats)]);
    if (receipt.exists) return;
    transaction.set(stats, { term: String(label).trim(), count: (previous.data()?.count || 0) + 1 });
    transaction.set(marker, { countedAt: Date.now() });
  });
}

async function getJoinedAt(auth, userId) {
  let joinedAt = 0;
  try {
    const account = await auth.getUser(userId);
    joinedAt = Date.parse(account.metadata.creationTime) || 0;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }
  return joinedAt;
}

async function syncBuyer(db, auth, userId) {
  const joinedAt = await getJoinedAt(auth, userId);
  const target = db.collection('publicBuyers').doc(userId);
  await db.runTransaction(async transaction => {
    await transaction.get(target);
    const [profile, rating] = await Promise.all([
      transaction.get(db.collection('users').doc(userId)),
      transaction.get(db.collection('publicUserRatings').doc(userId)),
    ]);
    if (!profile.exists || profile.data().role !== 'buyer') {
      transaction.delete(target);
      return;
    }
    const data = profile.data();
    const totals = rating.exists ? rating.data() : {};
    transaction.set(target, {
      name: typeof data.name === 'string' ? data.name : '',
      username: typeof data.username === 'string' ? data.username : '',
      region: typeof data.region === 'string' ? data.region : '',
      joinedAt,
      avgRating: Number(totals.avgRating) || 0, reviewCount: Number(totals.reviewCount) || 0,
    });
  });
}

async function syncSupplier(db, auth, userId) {
  const joinedAt = await getJoinedAt(auth, userId);
  const target = db.collection('publicSuppliers').doc(userId);
  await db.runTransaction(async transaction => {
    await transaction.get(target);
    const [profile, rating, primary, legacy] = await Promise.all([
      transaction.get(db.collection('users').doc(userId)),
      transaction.get(db.collection('publicUserRatings').doc(userId)),
      transaction.get(db.collection('posts').where('creatorId', '==', userId)),
      transaction.get(db.collection('posts').where('userId', '==', userId)),
    ]);
    if (!profile.exists || profile.data().role !== 'supplier') {
      transaction.delete(target);
      return;
    }
    const posts = new Map([...primary.docs, ...legacy.docs].map(post => [post.id, post.data()]));
    const count = [...posts.values()].filter(post =>
      (post.creatorId || post.userId) === userId && buildPublicProduct(post)
    ).length;
    const data = profile.data();
    const totals = rating.exists ? rating.data() : {};
    transaction.set(target, {
      name: typeof data.name === 'string' ? data.name : '',
      username: typeof data.username === 'string' ? data.username : '',
      region: typeof data.region === 'string' ? data.region : '',
      joinedAt, productCount: count,
      avgRating: Number(totals.avgRating) || 0, reviewCount: Number(totals.reviewCount) || 0,
    });
  });
}

async function syncPostSuppliers(db, auth, change) {
  const ids = new Set();
  for (const snapshot of [change.before, change.after]) {
    if (!snapshot.exists) continue;
    const post = snapshot.data();
    for (const id of [post.creatorId, post.userId]) {
      if (typeof id === 'string' && id && !id.includes('/')) ids.add(id);
    }
  }
  for (const id of ids) await syncSupplier(db, auth, id);
}

module.exports = { normalize, matchesSavedSearch, notifySavedSearches, countSearchActivity, syncBuyer, syncSupplier, syncPostSuppliers };
