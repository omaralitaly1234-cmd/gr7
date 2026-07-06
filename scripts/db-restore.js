/**
 * Firestore restore (ROLLBACK) from a backup created by scripts/db-backup.js.
 * Rewrites every document in the dump back to Firestore, reconstructing
 * Timestamp / GeoPoint / DocumentReference / Bytes from __type markers.
 *
 * DESTRUCTIVE: overwrites current documents with backed-up versions.
 * It does NOT delete documents created after the backup (safe-by-default);
 * pass --prune to also delete docs that exist in Firestore but not in the dump.
 *
 * Usage:
 *   node scripts/db-restore.js <path-to-firestore-full.json> --confirm [--prune]
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const dumpPath = process.argv[2];
const confirmed = process.argv.includes('--confirm');
const prune = process.argv.includes('--prune');

if (!dumpPath || !confirmed) {
  console.error('Usage: node scripts/db-restore.js <path-to-firestore-full.json> --confirm [--prune]');
  console.error('Refusing to run without an explicit --confirm flag.');
  process.exit(1);
}

const key = require(path.join(__dirname, '..', 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json'));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function deserialize(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(deserialize);
  if (typeof value === 'object') {
    if (value.__type === 'timestamp') return admin.firestore.Timestamp.fromDate(new Date(value.value));
    if (value.__type === 'geopoint') return new admin.firestore.GeoPoint(value.latitude, value.longitude);
    if (value.__type === 'reference') return db.doc(value.path);
    if (value.__type === 'bytes') return Buffer.from(value.base64, 'base64');
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deserialize(v);
    return out;
  }
  return value;
}

let restored = 0;
let pruned = 0;

async function restoreCollection(collRef, docs) {
  const dumpIds = new Set(Object.keys(docs));
  if (prune) {
    const liveSnap = await collRef.get();
    for (const liveDoc of liveSnap.docs) {
      if (!dumpIds.has(liveDoc.id)) {
        await liveDoc.ref.delete();
        pruned++;
        console.log('pruned:', liveDoc.ref.path);
      }
    }
  }
  for (const [id, entry] of Object.entries(docs)) {
    const docRef = collRef.doc(id);
    await docRef.set(deserialize(entry.fields));
    restored++;
    if (entry.subcollections) {
      for (const [subId, subDocs] of Object.entries(entry.subcollections)) {
        await restoreCollection(docRef.collection(subId), subDocs);
      }
    }
  }
}

(async () => {
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
  console.log('Restoring backup of project', dump.__meta.project, 'exported at', dump.__meta.exportedAt);
  for (const [rootId, docs] of Object.entries(dump.collections)) {
    console.log('Restoring root collection:', rootId, '...');
    await restoreCollection(db.collection(rootId), docs);
  }
  console.log('---');
  console.log('Restore complete. Documents written:', restored, prune ? '| pruned: ' + pruned : '');
  process.exit(0);
})().catch((e) => {
  console.error('RESTORE FAILED:', e);
  process.exit(1);
});
