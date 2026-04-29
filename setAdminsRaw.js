const admin = require('firebase-admin');

const uids = [
  'TrIHlt5Cp3RdHHD7ttjnEOD5xQh2',
  'eiHI7wuaLfMpyFPRwPk7agk3bpf2',
  't1mAqBBoZqd9Sfnj0QP85Wj25jF3'
];
const emails = [
  'Omaralitaliy@Gmail.com',
  'gr7.fit@gmail.com',
  'senatorever@gmail.com'
];

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function setAdmins() {
  for (let i = 0; i < uids.length; i++) {
    const uid = uids[i];
    await db.collection('users').doc(uid).set({
      uid: uid,
      email: emails[i],
      role: 'superadmin',
      superAdmin: true,
      tenantRole: 'superadmin',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('Updated user:', emails[i]);
  }
}

setAdmins().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
