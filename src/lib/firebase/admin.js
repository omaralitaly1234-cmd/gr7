// ============================================
// Firebase Admin SDK — Server-Side Only
// Used in API Routes (src/app/api/*)
// ============================================

let admin;
let adminAuth;
let adminDb;
let adminMessaging;

function getAdmin() {
  if (admin) return admin;

  // Dynamic import to avoid client-side bundling
  const firebaseAdmin = require('firebase-admin');

  if (!firebaseAdmin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Strategy: Use Application Default Credentials (ADC) on Google Cloud
    // Fall back to service account cert only for local development
    const hasExplicitKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const isGoogleCloud = process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;

    if (!hasExplicitKey || isGoogleCloud) {
      // Production on Firebase App Hosting / Google Cloud — use ADC
      console.log('[Admin SDK] Initializing with Application Default Credentials (ADC)');
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
        projectId,
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    } else {
      // Local development — use service account cert
      console.log('[Admin SDK] Initializing with service account cert (local dev)');
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      let rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';

      // Parse key: handle JSON strings, quoted values, escaped newlines
      if (rawKey.startsWith('"')) {
        try { rawKey = JSON.parse(rawKey); } catch (e) {
          rawKey = rawKey.replace(/^"|"$/g, '');
        }
      }
      const privateKey = rawKey.replace(/\\n/g, '\n');

      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({ projectId, clientEmail, privateKey }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    }
  }

  admin = firebaseAdmin;
  adminAuth = firebaseAdmin.auth();
  adminDb = firebaseAdmin.firestore();
  adminMessaging = firebaseAdmin.messaging();

  return firebaseAdmin;
}

// Get Admin Auth
export function getAdminAuth() {
  getAdmin();
  return adminAuth;
}

// Get Admin Firestore
export function getAdminDb() {
  getAdmin();
  return adminDb;
}

// Get Admin Messaging (FCM)
export function getAdminMessaging() {
  getAdmin();
  return adminMessaging;
}

// === Auth Helpers ===

// Verify ID Token (for API route authentication)
export async function verifyIdToken(idToken) {
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email, error: null };
  } catch (error) {
    return { uid: null, email: null, error: error.message };
  }
}

// Create user from server-side
export async function createUserServerSide(email, password, displayName) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });
    return { uid: userRecord.uid, error: null };
  } catch (error) {
    return { uid: null, error: error.message };
  }
}

// Set custom claims (e.g., superAdmin, role)
export async function setCustomClaims(uid, claims) {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, claims);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// === FCM Helpers ===

// Send push notification to specific tokens
export async function sendPushNotification(tokens, title, body, data = {}) {
  try {
    const messaging = getAdminMessaging();
    if (!messaging) return { successCount: 0, error: 'Messaging not initialized' };

    const validTokens = Array.isArray(tokens) ? tokens.filter(Boolean) : [tokens].filter(Boolean);
    if (validTokens.length === 0) return { successCount: 0, error: 'No valid tokens' };

    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens: validTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      error: null,
    };
  } catch (error) {
    return { successCount: 0, failureCount: 0, error: error.message };
  }
}

// Send notification to a topic
export async function sendTopicNotification(topic, title, body, data = {}) {
  try {
    const messaging = getAdminMessaging();
    await messaging.send({
      topic,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

export default getAdmin;
