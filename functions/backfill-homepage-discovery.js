const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');
const { syncBuyer, syncSupplier } = require('./ratings/homepage-discovery');

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--project' || !/^[a-z][a-z0-9-]+$/.test(args[1])) {
    throw new Error('Usage: node backfill-homepage-discovery.js --project YOUR_PROJECT_ID');
  }
  initializeApp({ credential: applicationDefault(), projectId: args[1] });
  const db = getFirestore();
  const ids = new Set();
  for (const name of ['users', 'publicSuppliers', 'publicBuyers']) {
    let cursor;
    while (true) {
      let query = db.collection(name).orderBy(FieldPath.documentId()).limit(200);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      for (const doc of page.docs) ids.add(doc.id);
      if (page.size < 200) break;
      cursor = page.docs[page.docs.length - 1];
    }
  }
  for (const id of ids) {
    await syncSupplier(db, getAuth(), id);
    await syncBuyer(db, getAuth(), id);
  }
  console.log(`Updated ${ids.size} supplier/buyer candidates in ${args[1]}`);
}
main().catch(error => { console.error('Homepage discovery backfill failed:', error); process.exitCode = 1; });
