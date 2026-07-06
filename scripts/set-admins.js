// Grant super-admin to specific users. UIDs/emails come from environment
// variables so no real identifiers are committed to the repo.
//
// Usage:
//   SUPER_ADMIN_UIDS=uid1,uid2 \
//   SUPER_ADMIN_EMAILS=a@example.com,b@example.com \
//   node scripts/set-admins.js
//
// Requires FIREBASE_ADMIN_* env vars (same as the app) OR a local
// service-account file — adjust the credential block if needed.
const admin = require('firebase-admin');

const uids = (process.env.SUPER_ADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const emails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

if (!uids.length) {
  console.error('Refusing to run: set SUPER_ADMIN_UIDS=uid1,uid2 (and optionally SUPER_ADMIN_EMAILS=...).');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

(async () => {
  for (let i = 0; i < uids.length; i++) {
    await db.collection('users').doc(uids[i]).set({
      uid: uids[i],
      email: emails[i] || '',
      role: 'superadmin',
      superAdmin: true,
      tenantRole: 'superadmin',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('super-admin set:', uids[i], emails[i] ? `(${emails[i]})` : '');
  }
  console.log(`Done — ${uids.length} user(s) granted super-admin.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
