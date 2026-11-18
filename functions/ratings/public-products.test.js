const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildPublicProduct, syncPublicProduct } = require('./public-products');

test('public products contain only display fields and exclude buying requests', () => {
  const post = { productName: ' Bearing ', brand: ' SKF ', timestamp: 123, postType: 'SELL',
    imageUri: 'https://example.com/image.jpg', email: 'private', creatorId: 'private', description: 'private' };
  assert.deepEqual(buildPublicProduct(post), {
    productName: 'Bearing', brand: 'SKF', modelNumber: '', category: '', price: '', location: '',
    imageUri: 'https://example.com/image.jpg', timestamp: 123,
  });
  assert.equal(buildPublicProduct({ ...post, postType: 'BUY' }), null);
  for (const invalid of [undefined, {}, { ...post, timestamp: NaN }, { ...post, timestamp: 0 }, { ...post, productName: ' ' }]) {
    assert.equal(buildPublicProduct(invalid), null);
  }
  assert.equal(buildPublicProduct({ ...post, timestamp: { toMillis: () => 456 }, imageUri: 'javascript:alert(1)' }).timestamp, 456);
  assert.equal(buildPublicProduct({ ...post, imageUri: 'javascript:alert(1)' }).imageUri, '');
  assert.equal(buildPublicProduct({ ...post, imageUri: '', imageUris: ['https://example.com/gallery.png'] }).imageUri, 'https://example.com/gallery.png');
});

test('sync replaces public summaries and removes deleted or BUY products', async () => {
  for (const post of [{ productName: 'Product', timestamp: 123 }, { productName: 'Request', timestamp: 123, postType: 'BUY' }, undefined]) {
    const reads = [];
    let write;
    const db = {
      collection: name => ({ doc: id => `${name}/${id}` }),
      runTransaction: callback => callback({
        get: async ref => {
          reads.push(ref);
          return { exists: post !== undefined, data: () => post };
        },
        set: (ref, data, ...options) => { write = { action: 'set', ref, data, options }; },
        delete: ref => { write = { action: 'delete', ref }; },
      }),
    };
    await syncPublicProduct(db, 'product-id');
    assert.deepEqual(reads, ['publicProducts/product-id', 'posts/product-id']);
    assert.equal(write.ref, 'publicProducts/product-id');
    if (post && post.postType !== 'BUY') {
      assert.equal(write.action, 'set');
      assert.deepEqual(write.data, buildPublicProduct(post));
      assert.deepEqual(write.options, []);
    } else assert.equal(write.action, 'delete');
  }
});
