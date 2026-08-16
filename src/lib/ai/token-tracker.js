// ===== AI Token Usage Tracker =====
// Tracks per-user monthly AI usage and enforces plan limits.
//
// SERVER ONLY. This module runs exclusively inside /api/ai/* route handlers, so
// it uses the Admin SDK. It previously imported the CLIENT SDK (`firebase/firestore`
// + lib/firebase/config), which has no authenticated user on the server, so every
// read and write was rejected by the security rules. Because the failures were
// swallowed and `getMonthlyUsage` returned zero usage, `checkLimit` always reported
// "under budget" — the monthly spend cap was never enforced and no usage document
// ever existed in Firestore.

import { AI_PLANS } from './ai-config';
import { getAdminDb } from '@/lib/firebase/admin';

const FieldValue = () => require('firebase-admin').firestore.FieldValue;

// Current month key (YYYY-MM)
function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const userRef = (db, userId) => db.collection('aiUsage').doc(userId);
const monthRef = (db, userId) =>
  db.collection('aiUsage').doc(userId).collection('months').doc(getMonthKey());

/** Ensure the per-user doc exists; returns its data. */
async function ensureUserDoc(db, userId) {
  const ref = userRef(db, userId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ plan: 'free', createdAt: FieldValue().serverTimestamp() });
    return { plan: 'free' };
  }
  return snap.data();
}

/** Ensure the per-month doc exists; returns its data. */
async function ensureMonthDoc(db, userId) {
  const ref = monthRef(db, userId);
  const snap = await ref.get();
  if (!snap.exists) {
    const seed = {
      totalTokens: 0,
      totalCostUSD: 0,
      requestCount: 0,
      recentRequests: [],
      month: getMonthKey(),
      createdAt: FieldValue().serverTimestamp(),
    };
    await ref.set(seed);
    return seed;
  }
  return snap.data();
}

/**
 * Record one AI call.
 *
 * The counter update and the recent-request log are a single atomic update so
 * concurrent calls from the same user cannot lose each other's increments.
 */
export async function trackUsage(userId, { feature, inputTokens, outputTokens, costUSD }) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error('Admin SDK unavailable');

    await ensureUserDoc(db, userId);
    const current = await ensureMonthDoc(db, userId);

    const entry = {
      feature,
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      costUSD: costUSD || 0,
      timestamp: new Date().toISOString(),
    };
    // Keep the last 50 for audit without letting the doc grow unbounded.
    const recentRequests = [...(current.recentRequests || []), entry].slice(-50);

    await monthRef(db, userId).update({
      totalTokens: FieldValue().increment((inputTokens || 0) + (outputTokens || 0)),
      totalCostUSD: FieldValue().increment(costUSD || 0),
      requestCount: FieldValue().increment(1),
      lastRequestAt: FieldValue().serverTimestamp(),
      recentRequests,
    });

    const updated = (await monthRef(db, userId).get()).data() || {};
    return {
      totalCostUSD: updated.totalCostUSD || 0,
      totalTokens: updated.totalTokens || 0,
      requestCount: updated.requestCount || 0,
    };
  } catch (error) {
    console.error('[TokenTracker] Failed to track usage:', error.message);
    return { totalCostUSD: 0, totalTokens: 0, requestCount: 0, error: error.message };
  }
}

/** Monthly usage snapshot for a user. */
export async function getMonthlyUsage(userId) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error('Admin SDK unavailable');

    const userData = await ensureUserDoc(db, userId);
    const monthData = await ensureMonthDoc(db, userId);
    const plan = userData.plan === 'premium' ? AI_PLANS.PREMIUM : AI_PLANS.FREE;
    const totalCost = monthData.totalCostUSD || 0;

    return {
      plan: userData.plan || 'free',
      planNameAr: plan.nameAr,
      planNameEn: plan.nameEn,
      monthlyLimitUSD: plan.monthlyLimitUSD,
      usedUSD: Math.round(totalCost * 1000000) / 1000000,
      remainingUSD: Math.max(0, plan.monthlyLimitUSD - totalCost),
      usagePercent: Math.min(100, Math.round((totalCost / plan.monthlyLimitUSD) * 100)),
      totalTokens: monthData.totalTokens || 0,
      requestCount: monthData.requestCount || 0,
      requests: monthData.recentRequests || [],
      month: getMonthKey(),
      degraded: false,
    };
  } catch (error) {
    console.error('[TokenTracker] Failed to get usage:', error.message);
    const plan = AI_PLANS.FREE;
    // `degraded` tells checkLimit that this figure is NOT a real reading, so it
    // can fail closed instead of waving every request through.
    return {
      plan: 'free',
      planNameAr: plan.nameAr,
      planNameEn: plan.nameEn,
      monthlyLimitUSD: plan.monthlyLimitUSD,
      usedUSD: 0,
      remainingUSD: plan.monthlyLimitUSD,
      usagePercent: 0,
      totalTokens: 0,
      requestCount: 0,
      requests: [],
      month: getMonthKey(),
      degraded: true,
      error: error.message,
    };
  }
}

/**
 * Is the user over their monthly budget?
 *
 * Fails CLOSED: if usage could not be read, the request is blocked rather than
 * allowed. Silently allowing on error is what made the cap meaningless.
 */
export async function checkLimit(userId) {
  const usage = await getMonthlyUsage(userId);
  if (usage.degraded) {
    return {
      isLimitReached: true,
      isNearLimit: true,
      degraded: true,
      reason: 'usage_unavailable',
      usage,
    };
  }
  return {
    isLimitReached: usage.usedUSD >= usage.monthlyLimitUSD,
    isNearLimit: usage.usagePercent >= 80,
    degraded: false,
    usage,
  };
}

/** Remaining budget in USD. */
export async function getRemainingBudget(userId) {
  const usage = await getMonthlyUsage(userId);
  return usage.remainingUSD;
}

/** Move a user onto the premium AI plan. */
export async function upgradeToPremium(userId) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error('Admin SDK unavailable');
    await userRef(db, userId).set(
      { plan: 'premium', upgradedAt: FieldValue().serverTimestamp() },
      { merge: true },
    );
    return { success: true, plan: 'premium' };
  } catch (error) {
    console.error('[TokenTracker] Upgrade failed:', error.message);
    return { success: false, error: error.message };
  }
}

/** Move a user back to the free AI plan. */
export async function downgradeToFree(userId) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error('Admin SDK unavailable');
    await userRef(db, userId).set(
      { plan: 'free', downgradedAt: FieldValue().serverTimestamp() },
      { merge: true },
    );
    return { success: true, plan: 'free' };
  } catch (error) {
    console.error('[TokenTracker] Downgrade failed:', error.message);
    return { success: false, error: error.message };
  }
}

/** Cost split per feature for the current month. */
export async function getUsageByFeature(userId) {
  const usage = await getMonthlyUsage(userId);
  const byFeature = {};
  for (const r of usage.requests || []) {
    if (!byFeature[r.feature]) byFeature[r.feature] = { requests: 0, tokens: 0, costUSD: 0 };
    byFeature[r.feature].requests += 1;
    byFeature[r.feature].tokens += (r.inputTokens || 0) + (r.outputTokens || 0);
    byFeature[r.feature].costUSD += r.costUSD || 0;
  }
  return byFeature;
}
