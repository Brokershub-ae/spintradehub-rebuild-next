const PUBLIC_COLLECTION = 'publicUserRatings';

function buildPublicRating(profile, reviews, logger) {
  if (!profile || !['buyer', 'supplier'].includes(profile.role)) return null;
  let sum = 0;
  let reviewCount = 0;
  for (const review of reviews) {
    const rating = Number(review.rating);
    if ((typeof review.rating !== 'number' && typeof review.rating !== 'string') ||
        !Number.isFinite(rating) || rating < 1 || rating > 5) {
      logger.warn('Skipping invalid rating while updating public summary');
      continue;
    }
    sum += rating;
    reviewCount += 1;
  }
  return {
    name: typeof profile.name === 'string' ? profile.name : '',
    username: typeof profile.username === 'string' ? profile.username : '',
    region: typeof profile.region === 'string' ? profile.region : '',
    role: profile.role,
    avgRating: reviewCount ? sum / reviewCount : 0,
    reviewCount,
  };
}

async function syncPublicRating(db, userId, logger) {
  const summaryRef = db.collection(PUBLIC_COLLECTION).doc(userId);
  await db.runTransaction(async (transaction) => {
    // Serialize recomputations so concurrent or out-of-order events cannot leave stale totals.
    await transaction.get(summaryRef);
    const profile = await transaction.get(db.collection('users').doc(userId));
    const reviews = await transaction.get(
      db.collection('reviews').where('revieweeId', '==', userId)
    );
    const summary = buildPublicRating(
      profile.exists ? profile.data() : null,
      reviews.docs.map((review) => review.data()),
      logger
    );
    if (summary) transaction.set(summaryRef, summary);
    else transaction.delete(summaryRef);
  });
}

async function syncReviewChange(db, change, logger) {
  if (!change) throw new Error('Review event has no change snapshots');
  const ids = new Set();
  for (const snapshot of [change.before, change.after]) {
    if (!snapshot.exists) continue;
    const id = snapshot.data().revieweeId;
    if (typeof id === 'string' && id && !id.includes('/')) ids.add(id);
    else logger.warn('Review has no valid revieweeId', { reviewId: snapshot.id });
  }
  for (const id of ids) await syncPublicRating(db, id, logger);
}

module.exports = { PUBLIC_COLLECTION, buildPublicRating, syncPublicRating, syncReviewChange };
