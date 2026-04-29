// ============================================
// Firebase Cloud Messaging — Client-Side
// Push Notifications (FCM)
// ============================================

import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './config';

const isDev = process.env.NODE_ENV === 'development';

let messaging = null;

// Get messaging instance (lazy, client-only)
async function getMessagingInstance() {
  if (typeof window === 'undefined') return null;
  if (messaging) return messaging;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const app = (await import('./config')).default;
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Not supported in this browser');
      return null;
    }
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.warn('[FCM] Failed to initialize:', error.message);
    return null;
  }
}

/**
 * Request notification permission and register FCM token
 * @param {string} userId - Firebase Auth UID
 * @returns {string|null} FCM token or null
 */
export async function requestNotificationPermission(userId) {
  if (typeof window === 'undefined') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (isDev) console.log('[FCM] Permission denied');
      return null;
    }

    const msg = await getMessagingInstance();
    if (!msg) return null;

    const { getToken } = await import('firebase/messaging');
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(msg, { vapidKey });

    if (token && userId) {
      // Save token to user document
      await updateDoc(doc(db, 'users', userId), {
        fcmTokens: arrayUnion(token),
      });
      if (isDev) console.log('[FCM] Token saved for user:', userId);
    }

    return token;
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

/**
 * Remove FCM token (on logout)
 */
export async function removeNotificationToken(userId, token) {
  if (!userId || !token) return;
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmTokens: arrayRemove(token),
    });
  } catch (error) {
    console.error('[FCM] Error removing token:', error);
  }
}

/**
 * Listen for foreground messages
 * @param {function} callback - Called with message payload
 * @returns {function} unsubscribe function
 */
export async function onForegroundMessage(callback) {
  const msg = await getMessagingInstance();
  if (!msg) return () => {};

  const { onMessage } = await import('firebase/messaging');
  return onMessage(msg, (payload) => {
    if (isDev) console.log('[FCM] Foreground message:', payload);
    callback(payload);
  });
}

/**
 * Show a toast notification from FCM payload
 */
export function showNotificationToast(payload) {
  const { title, body } = payload.notification || {};
  if (title && typeof window !== 'undefined') {
    // Use react-hot-toast if available
    try {
      const toast = require('react-hot-toast').default;
      toast(body || title, {
        icon: '🔔',
        duration: 5000,
        style: {
          background: '#1a1a1a',
          color: '#f5c518',
          border: '1px solid rgba(245,197,24,0.2)',
        },
      });
    } catch {
      // Fallback to native notification
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    }
  }
}
