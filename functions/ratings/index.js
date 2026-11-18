const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { onDocumentWritten, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { getAuth } = require('firebase-admin/auth');
const logger = require('firebase-functions/logger');
const { syncPublicRating, syncReviewChange } = require('./public-ratings');
const { syncPublicProduct } = require('./public-products');
const { notifySavedSearches, countSearchActivity, syncBuyer, syncSupplier, syncPostSuppliers } = require('./homepage-discovery');

initializeApp();

exports.syncBuyerProfile = onDocumentWritten({ document: 'users/{userId}', retry: true },
  async event => syncBuyer(getFirestore(), getAuth(), event.params.userId));

exports.syncBuyerRatings = onDocumentWritten({ document: 'publicUserRatings/{userId}', retry: true },
  async event => syncBuyer(getFirestore(), getAuth(), event.params.userId));

exports.notifySavedSearches = onDocumentCreated({ document: 'posts/{postId}', retry: true },
  async event => notifySavedSearches(getFirestore(), event.params.postId));

exports.countHomepageSearch = onDocumentCreated({ document: 'searchActivity/{eventId}', retry: true },
  async event => countSearchActivity(getFirestore(), event.params.eventId, event.data.data()));

exports.syncSupplierProfile = onDocumentWritten({ document: 'users/{userId}', retry: true },
  async event => syncSupplier(getFirestore(), getAuth(), event.params.userId));

exports.syncSupplierRatings = onDocumentWritten({ document: 'publicUserRatings/{userId}', retry: true },
  async event => syncSupplier(getFirestore(), getAuth(), event.params.userId));

exports.syncSupplierProducts = onDocumentWritten({ document: 'posts/{postId}', retry: true },
  async event => syncPostSuppliers(getFirestore(), getAuth(), event.data));

exports.syncPublicProduct = onDocumentWritten({
  document: 'posts/{postId}',
  retry: true,
}, async (event) => {
  await syncPublicProduct(getFirestore(), event.params.postId);
});

exports.syncPublicUserRating = onDocumentWritten({
  document: 'users/{userId}',
  retry: true,
}, async (event) => {
  await syncPublicRating(getFirestore(), event.params.userId, logger);
});

exports.syncPublicReviewRating = onDocumentWritten({
  document: 'reviews/{reviewId}',
  retry: true,
}, async (event) => {
  await syncReviewChange(getFirestore(), event.data, logger);
});
