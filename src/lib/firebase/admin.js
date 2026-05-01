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
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    // Handle all possible private key formats from env/secrets
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
    // Remove surrounding quotes if present
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.error('[Admin SDK] Missing environment variables');
      return null;
    }

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
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
