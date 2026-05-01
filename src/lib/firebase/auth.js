import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Sign in with email and password
export async function signIn(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Update last login (fire-and-forget — don't block login if this fails)
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        lastLogin: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('[Auth] lastLogin update failed:', e.message);
    }
    return { user: result.user, error: null };
  } catch (error) {
    console.error('[Auth] signIn error:', error.code, error.message);
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

// Register new user (member registration — NEVER allows elevated roles)
export async function registerUser(email, password, userData) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(result.user, {
      displayName: userData.displayName || userData.fullName?.ar || '',
    });

    // SECURITY: Hard-code security-critical fields — never accept from client input
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email,
      phone: userData.phone || '',
      displayName: userData.displayName || userData.fullName?.ar || '',
      role: 'member',              // LOCKED — only Admin SDK can change
      lang: userData.lang || 'ar',
      avatar: '',
      isActive: true,
      // Multi-tenancy fields — LOCKED
      tenantId: null,              // Set separately after tenant creation
      superAdmin: false,           // LOCKED — only Admin SDK can change
      tenantRole: 'member',        // LOCKED — only Admin SDK/owner flow can change
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      fcmTokens: [],
    });

    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

// Register gym owner (onboarding flow — sets tenantRole: 'owner')
// This is a separate, secure function specifically for the gym registration flow
export async function registerGymOwner(email, password, ownerData) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(result.user, {
      displayName: ownerData.displayName || '',
    });

    // Owner gets admin + owner role, but NEVER superAdmin
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email,
      phone: ownerData.phone || '',
      displayName: ownerData.displayName || '',
      role: 'admin',               // Gym admin
      lang: ownerData.lang || 'ar',
      avatar: '',
      isActive: true,
      tenantId: null,              // Set after tenant creation
      superAdmin: false,           // LOCKED — never true from client
      tenantRole: 'owner',         // This is the only function that can set 'owner'
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      fcmTokens: [],
    });

    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

// Sign out
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Send password reset email
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: getAuthErrorMessage(error.code) };
  }
}

// Get user role from Firestore
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Get user data from Firestore
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null };
    }
    return { data: null, error: 'User not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Subscribe to auth changes
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Auth error messages (Arabic/English)
function getAuthErrorMessage(code) {
  const errors = {
    'auth/email-already-in-use': {
      ar: 'البريد الإلكتروني مستخدم بالفعل',
      en: 'Email is already in use',
    },
    'auth/invalid-email': {
      ar: 'البريد الإلكتروني غير صالح',
      en: 'Invalid email address',
    },
    'auth/user-disabled': {
      ar: 'تم تعطيل هذا الحساب',
      en: 'This account has been disabled',
    },
    'auth/user-not-found': {
      ar: 'لا يوجد حساب بهذا البريد الإلكتروني',
      en: 'No account found with this email',
    },
    'auth/wrong-password': {
      ar: 'كلمة المرور غير صحيحة',
      en: 'Incorrect password',
    },
    'auth/weak-password': {
      ar: 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)',
      en: 'Password is too weak (minimum 6 characters)',
    },
    'auth/invalid-credential': {
      ar: 'بيانات الدخول غير صحيحة',
      en: 'Invalid credentials',
    },
    'auth/too-many-requests': {
      ar: 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً',
      en: 'Too many attempts. Please try again later',
    },
  };
  return errors[code] || { ar: 'حدث خطأ غير متوقع', en: 'An unexpected error occurred' };
}
