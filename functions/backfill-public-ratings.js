const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');
const { syncPublicRating } = require('./ratings/public-ratings');

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--project' || !/^[a-z][a-z0-9-]+$/.test(args[1])) {
    throw new Error('Usage: node backfill-public-ratings.js --project YOUR_PROJECT_ID');
  }
  initializeApp({ credential: applicationDefault(), projectId: args[1] });
  const db = getFirestore();
  // Include existing summaries to remove deleted or ineligible profiles on reruns.
  const ids = new Set();
  for (const collection of ['users', 'publicUserRatings']) {
    let cursor;
    while (true) {
      let query = db.collection(collection).orderBy(FieldPath.documentId()).limit(200);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      for (const doc of page.docs) ids.add(doc.id);
      if (page.size < 200) break;
      cursor = page.docs[page.docs.length - 1];
    }
  }
  let count = 0;
  for (const id of ids) {
    await syncPublicRating(db, id, console);
    count++;
  }
  console.log(`Updated ${count} public rating summaries in project ${args[1]}`);
}

main().catch((error) => {
  console.error('Public rating backfill failed:', error);
  process.exitCode = 1;
});
