'use client';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ==================== Plan Definitions ====================

export const PLAN_DEFINITIONS = {
  trial: {
    id: 'trial',
    type: 'trial',
    name: { ar: 'تجريبية مجانية', en: 'Free Trial' },
    durationDays: 90,
    price: 0,
    currency: 'EGP',
    maxMembers: 100,
    maxTrainers: 3,
    features: {
      ai_nutrition: false,
      ai_workout: false,
      ai_churn: false,
      ai_sentiment: false,
      ai_pricing: false,
      ai_chatbot: false,
      ai_body_analysis: false,
      ai_social: false,
      advanced_analytics: true,
      spa_module: true,
      inventory_module: true,
      hr_module: true,
      sms_notifications: true,
    },
    order: 0,
  },
  monthly: {
    id: 'monthly',
    type: 'monthly',
    name: { ar: 'الخطة الشهرية', en: 'Monthly Plan' },
    durationDays: 30,
    price: 500,
    currency: 'EGP',
    maxMembers: 300,
    maxTrainers: 5,
    features: {
      ai_nutrition: true,
      ai_workout: true,
      ai_churn: true,
      ai_sentiment: true,
      ai_pricing: true,
      ai_chatbot: true,
      ai_body_analysis: true,
      ai_social: true,
      advanced_analytics: true,
      spa_module: true,
      inventory_module: true,
      hr_module: true,
      sms_notifications: true,
    },
    order: 1,
  },
  quarterly: {
    id: 'quarterly',
    type: 'quarterly',
    name: { ar: 'ربع سنوية', en: 'Quarterly Plan' },
    durationDays: 90,
    price: 1200,
    currency: 'EGP',
    discount: 20,
    maxMembers: 500,
    maxTrainers: 10,
    features: {
      ai_nutrition: true,
      ai_workout: true,
      ai_churn: true,
      ai_sentiment: true,
      ai_pricing: true,
      ai_chatbot: true,
      ai_body_analysis: true,
      ai_social: true,
      advanced_analytics: true,
      spa_module: true,
      inventory_module: true,
      hr_module: true,
      sms_notifications: true,
    },
    order: 2,
  },
  semi_annual: {
    id: 'semi_annual',
    type: 'semi_annual',
    name: { ar: 'نصف سنوية', en: 'Semi-Annual Plan' },
    durationDays: 180,
    price: 2100,
    currency: 'EGP',
    discount: 30,
    maxMembers: 1000,
    maxTrainers: 20,
    features: {
      ai_nutrition: true,
      ai_workout: true,
      ai_churn: true,
      ai_sentiment: true,
      ai_pricing: true,
      ai_chatbot: true,
      ai_body_analysis: true,
      ai_social: true,
      advanced_analytics: true,
      spa_module: true,
      inventory_module: true,
      hr_module: true,
      sms_notifications: true,
    },
    order: 3,
  },
  annual: {
    id: 'annual',
    type: 'annual',
    name: { ar: 'سنوية', en: 'Annual Plan' },
    durationDays: 365,
    price: 3600,
    currency: 'EGP',
    discount: 40,
    maxMembers: -1, // Unlimited
    maxTrainers: -1,
    features: {
      ai_nutrition: true,
      ai_workout: true,
      ai_churn: true,
      ai_sentiment: true,
      ai_pricing: true,
      ai_chatbot: true,
      ai_body_analysis: true,
      ai_social: true,
      advanced_analytics: true,
      spa_module: true,
      inventory_module: true,
      hr_module: true,
      sms_notifications: true,
    },
    order: 4,
  },
};

// ==================== AI Feature Keys ====================
export const AI_FEATURES = [
  'ai_nutrition',
  'ai_workout',
  'ai_churn',
  'ai_sentiment',
  'ai_pricing',
  'ai_chatbot',
  'ai_body_analysis',
  'ai_social',
];

export const AI_FEATURE_LABELS = {
  ai_nutrition: { ar: 'مساعد التغذية الذكية', en: 'AI Nutrition Assistant', icon: '🥗' },
  ai_workout: { ar: 'مولّد برامج التمارين', en: 'AI Workout Generator', icon: '🏋️' },
  ai_churn: { ar: 'التنبؤ بمغادرة الأعضاء', en: 'Churn Prediction', icon: '📊' },
  ai_sentiment: { ar: 'تحليل المشاعر', en: 'Sentiment Analysis', icon: '💬' },
  ai_pricing: { ar: 'التسعير الذكي', en: 'Smart Pricing', icon: '💰' },
  ai_chatbot: { ar: 'المساعد الذكي', en: 'AI Chatbot', icon: '🤖' },
  ai_body_analysis: { ar: 'تحليل صور الجسم', en: 'Body Analysis', icon: '📸' },
  ai_social: { ar: 'التوصيات الاجتماعية', en: 'Social Recommendations', icon: '👥' },
};

// ==================== Tenant Management ====================

// Create a new tenant with trial subscription
export async function createTenant(ownerData) {
  try {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 90); // 3 months trial

    const tenantData = {
      name: ownerData.gymName || '',
      nameAr: ownerData.gymNameAr || ownerData.gymName || '',
      nameEn: ownerData.gymNameEn || ownerData.gymName || '',
      ownerEmail: ownerData.email,
      ownerUid: ownerData.uid,
      phone: ownerData.phone || '',
      address: { ar: ownerData.addressAr || '', en: ownerData.addressEn || '' },
      logo: '',
      status: 'trial',
      createdAt: serverTimestamp(),

      subscription: {
        plan: 'trial',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(trialEnd),
        trialStartDate: Timestamp.fromDate(now),
        trialEndDate: Timestamp.fromDate(trialEnd),
        autoRenew: false,
        lastPaymentDate: null,
        nextPaymentDate: null,
      },

      features: { ...PLAN_DEFINITIONS.trial.features },
      limits: {
        maxMembers: PLAN_DEFINITIONS.trial.maxMembers,
        maxTrainers: PLAN_DEFINITIONS.trial.maxTrainers,
      },
    };

    const docRef = await addDoc(collection(db, 'tenants'), tenantData);
    return { tenantId: docRef.id, error: null };
  } catch (error) {
    return { tenantId: null, error: error.message };
  }
}

// Get tenant data
export async function getTenant(tenantId) {
  try {
    const docSnap = await getDoc(doc(db, 'tenants', tenantId));
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    return { data: null, error: 'Tenant not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Get tenant subscription status
export async function getTenantSubscription(tenantId) {
  try {
    const { data, error } = await getTenant(tenantId);
    if (error) return { subscription: null, error };
    return { subscription: data.subscription, status: data.status, features: data.features, error: null };
  } catch (error) {
    return { subscription: null, error: error.message };
  }
}

// Activate a paid subscription
export async function activateSubscription(tenantId, planType) {
  try {
    const plan = PLAN_DEFINITIONS[planType];
    if (!plan) return { error: 'Invalid plan type' };

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await updateDoc(doc(db, 'tenants', tenantId), {
      status: 'active',
      'subscription.plan': planType,
      'subscription.startDate': Timestamp.fromDate(now),
      'subscription.endDate': Timestamp.fromDate(endDate),
      'subscription.lastPaymentDate': Timestamp.fromDate(now),
      'subscription.nextPaymentDate': Timestamp.fromDate(endDate),
      'subscription.autoRenew': true,
      features: { ...plan.features },
      'limits.maxMembers': plan.maxMembers,
      'limits.maxTrainers': plan.maxTrainers,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Suspend tenant
export async function suspendTenant(tenantId, reason = '') {
  try {
    await updateDoc(doc(db, 'tenants', tenantId), {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspendReason: reason,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Reactivate tenant
export async function reactivateTenant(tenantId) {
  try {
    await updateDoc(doc(db, 'tenants', tenantId), {
      status: 'active',
      suspendedAt: null,
      suspendReason: '',
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Expire tenant
export async function expireTenant(tenantId) {
  try {
    await updateDoc(doc(db, 'tenants', tenantId), {
      status: 'expired',
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Check trial status for a tenant
export function checkTrialStatus(tenantData) {
  if (!tenantData || !tenantData.subscription) return { isTrialActive: false, daysRemaining: 0 };

  const sub = tenantData.subscription;
  if (sub.plan !== 'trial') return { isTrialActive: false, daysRemaining: 0 };

  const now = new Date();
  const trialEnd = sub.trialEndDate?.toDate ? sub.trialEndDate.toDate() : new Date(sub.trialEndDate);
  const diffMs = trialEnd - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isTrialActive: daysRemaining > 0,
    daysRemaining,
    trialEndDate: trialEnd,
    isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
    isLastDay: daysRemaining === 1,
  };
}

// Check if subscription is active
export function isSubscriptionActive(tenantData) {
  if (!tenantData) return false;
  const { status, subscription } = tenantData;

  if (status === 'suspended' || status === 'expired') return false;

  if (status === 'trial') {
    const { isTrialActive } = checkTrialStatus(tenantData);
    return isTrialActive;
  }

  if (status === 'active' && subscription?.endDate) {
    const endDate = subscription.endDate?.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
    return endDate > new Date();
  }

  return false;
}

// Check if a feature is enabled for a tenant
export function hasFeature(tenantData, featureKey) {
  if (!tenantData || !tenantData.features) return false;
  return tenantData.features[featureKey] === true;
}

// ==================== Payment Management ====================

// Record a payment
export async function recordPayment(paymentData) {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      status: paymentData.status || 'pending',
      createdAt: serverTimestamp(),
    });
    return { paymentId: docRef.id, error: null };
  } catch (error) {
    return { paymentId: null, error: error.message };
  }
}

// Confirm payment (by Super Admin)
export async function confirmPayment(paymentId, confirmedByUid) {
  try {
    const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
    if (!paymentDoc.exists()) return { error: 'Payment not found' };

    const payment = paymentDoc.data();

    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'confirmed',
      confirmedBy: confirmedByUid,
      confirmedAt: serverTimestamp(),
    });

    // Auto-activate subscription
    if (payment.planId && payment.tenantId) {
      await activateSubscription(payment.tenantId, payment.planId);
    }

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Get all payments (for Super Admin)
export async function getAllPayments(statusFilter = null) {
  try {
    let constraints = [orderBy('createdAt', 'desc')];
    if (statusFilter) {
      constraints = [where('status', '==', statusFilter), ...constraints];
    }
    const q = query(collection(db, 'payments'), ...constraints);
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data: payments, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// Get payments for a tenant
export async function getTenantPayments(tenantId) {
  try {
    const q = query(
      collection(db, 'payments'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data: payments, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// ==================== Tenant Listing (Super Admin) ====================

// Get all tenants
export async function getAllTenants(statusFilter = null) {
  try {
    let constraints = [orderBy('createdAt', 'desc')];
    if (statusFilter) {
      constraints = [where('status', '==', statusFilter), ...constraints];
    }
    const q = query(collection(db, 'tenants'), ...constraints);
    const snapshot = await getDocs(q);
    const tenants = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data: tenants, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// Update tenant features
export async function updateTenantFeatures(tenantId, features) {
  try {
    await updateDoc(doc(db, 'tenants', tenantId), {
      features,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Upgrade tenant plan
export async function upgradePlan(tenantId, newPlanType) {
  return activateSubscription(tenantId, newPlanType);
}

// ==================== Plans Management ====================

// Initialize default plans in Firestore
export async function initializePlans() {
  try {
    for (const [planId, planData] of Object.entries(PLAN_DEFINITIONS)) {
      await setDoc(doc(db, 'plans', planId), {
        ...planData,
        isActive: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Get all plans
export async function getPlans() {
  try {
    const q = query(collection(db, 'plans'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (plans.length === 0) {
      // Return defaults if not in Firestore yet
      return { data: Object.values(PLAN_DEFINITIONS), error: null };
    }
    return { data: plans, error: null };
  } catch (error) {
    return { data: Object.values(PLAN_DEFINITIONS), error: error.message };
  }
}

// Update a plan price
export async function updatePlanPrice(planId, newPrice) {
  try {
    await updateDoc(doc(db, 'plans', planId), {
      price: newPrice,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}
