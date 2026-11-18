function buildPublicProduct(post) {
  if (!post || post.postType === 'BUY' || typeof post.productName !== 'string' ||
      !post.productName.trim()) return null;
  const text = (key) => typeof post[key] === 'string' ? post[key].trim() : '';
  const timestamp = typeof post.timestamp === 'number' ? post.timestamp :
    typeof post.timestamp?.toMillis === 'function' ? post.timestamp.toMillis() : NaN;
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  const image = text('imageUri') || (Array.isArray(post.imageUris) && post.imageUris.find(url => typeof url === 'string' && /^https:\/\//i.test(url))) || text('imageUrl') || text('photo');
  return {
    productName: text('productName'),
    brand: text('brand'),
    modelNumber: text('modelNumber'),
    category: text('category'),
    price: text('price'),
    location: text('location'),
    imageUri: /^https:\/\//i.test(image) ? image : '',
    timestamp,
  };
}

async function syncPublicProduct(db, postId) {
  const target = db.collection('publicProducts').doc(postId);
  await db.runTransaction(async (transaction) => {
    await transaction.get(target);
    const source = await transaction.get(db.collection('posts').doc(postId));
    const summary = buildPublicProduct(source.exists ? source.data() : null);
    if (summary) transaction.set(target, summary);
    else transaction.delete(target);
  });
}

module.exports = { buildPublicProduct, syncPublicProduct };
