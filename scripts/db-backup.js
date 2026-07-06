/**
 * Full recursive Firestore backup (read-only).
 * Walks every collection/subcollection and dumps all documents to a single
 * timestamped JSON file, preserving Firestore types (Timestamp, GeoPoint,
 * DocumentReference, Bytes) with __type markers so a restore script can
 * reconstruct them.
 *
 * Usage: node scripts/db-backup.js [outputDir]
 * Default output: _db-backups/<ISO date>/firestore-full.json
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const key = require(path.join(__dirname, '..', 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json'));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof admin.firestore.Timestamp) {
    return { __type: 'timestamp', value: value.toDate().toISOString() };
  }
  if (value instanceof admin.firestore.GeoPoint) {
    return { __type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof admin.firestore.DocumentReference) {
    return { __type: 'reference', path: value.path };
  }
  if (Buffer.isBuffer(value)) {
    return { __type: 'bytes', base64: value.toString('base64') };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

let docCount = 0;
let collCount = 0;

async function dumpCollection(collRef) {
  collCount++;
  const snap = await collRef.get();
  const docs = {};
  for (const doc of snap.docs) {
    docCount++;
    const subcollections = {};
    const subs = await doc.ref.listCollections();
    for (const sub of subs) {
      subcollections[sub.id] = await dumpCollection(sub);
    }
    docs[doc.id] = {
      fields: serialize(doc.data()),
      ...(Object.keys(subcollections).length ? { subcollections } : {}),
    };
  }
  return docs;
}

(async () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = process.argv[2] || path.join(__dirname, '..', '_db-backups', stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const roots = await db.listCollections();
  const dump = {
    __meta: {
      project: key.project_id,
      exportedAt: new Date().toISOString(),
      rootCollections: roots.map((r) => r.id),
    },
    collections: {},
  };
  for (const root of roots) {
    console.log('Dumping root collection:', root.id, '...');
    dump.collections[root.id] = await dumpCollection(root);
  }

  const outFile = path.join(outDir, 'firestore-full.json');
  fs.writeFileSync(outFile, JSON.stringify(dump, null, 2));
  console.log('---');
  console.log('Backup complete:', outFile);
  console.log('Collections walked:', collCount, '| Documents exported:', docCount);
  process.exit(0);
})().catch((e) => {
  console.error('BACKUP FAILED:', e);
  process.exit(1);
});
