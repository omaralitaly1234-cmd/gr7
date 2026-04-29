// ===== AI Token Usage Tracker =====
// Tracks per-user monthly AI usage and enforces plan limits
// Uses Firestore for persistent storage (production-ready)

import { AI_PLANS } from './ai-config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Get current month key (YYYY-MM)
function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get usage document path for a user
function getUsagePath(userId) {
  return `aiUsage/${userId}`;
}

function getMonthPath(userId) {
  return `aiUsage/${userId}/months/${getMonthKey()}`;
}

/**
 * Ensure user document exists with plan info
 */
async function ensureUserDoc(userId) {
  const userRef = doc(db, getUsagePath(userId));
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      plan: 'free',
      createdAt: serverTimestamp(),
    });
  }
  return userSnap.exists() ? userSnap.data() : { plan: 'free' };
}

/**
 * Ensure monthly usage document exists
 */
async function ensureMonthDoc(userId) {
  const monthRef = doc(db, getMonthPath(userId));
  const monthSnap = await getDoc(monthRef);
  if (!monthSnap.exists()) {
    await setDoc(monthRef, {
      totalTokens: 0,
      totalCostUSD: 0,
      requestCount: 0,
      month: getMonthKey(),
      createdAt: serverTimestamp(),
    });
    return { totalTokens: 0, totalCostUSD: 0, requestCount: 0 };
  }
  return monthSnap.data();
}

/**
 * Track a new AI usage
 */
export async function trackUsage(userId, { feature, inputTokens, outputTokens, costUSD }) {
  try {
    await ensureUserDoc(userId);
    await ensureMonthDoc(userId);

    const monthRef = doc(db, getMonthPath(userId));

    // Atomically update usage counters
    await updateDoc(monthRef, {
      totalTokens: increment(inputTokens + outputTokens),
      totalCostUSD: increment(costUSD),
      requestCount: increment(1),
      lastRequestAt: serverTimestamp(),
    });

    // Log the request in a sub-array (keep last 50 for audit)
    // Using a separate recent requests doc to avoid document size limits
    const recentRef = doc(db, `aiUsage/${userId}/months/${getMonthKey()}`);
    const recentSnap = await getDoc(recentRef);
    const currentRequests = recentSnap.data()?.recentRequests || [];
    
    const newRequest = {
      feature,
      inputTokens,
      outputTokens,
      costUSD,
      timestamp: new Date().toISOString(),
    };

    // Keep only last 50 requests to prevent document bloat
    const updatedRequests = [...currentRequests, newRequest].slice(-50);
    await updateDoc(recentRef, { recentRequests: updatedRequests });

    const updatedSnap = await getDoc(monthRef);
    const data = updatedSnap.data();

    return {
      totalCostUSD: data.totalCostUSD || 0,
      totalTokens: data.totalTokens || 0,
      requestCount: data.requestCount || 0,
    };
  } catch (error) {
    console.error('[TokenTracker] Failed to track usage:', error.message);
    // Graceful fallback — don't block the AI response
    return { totalCostUSD: 0, totalTokens: 0, requestCount: 0 };
  }
}

/**
 * Get monthly usage for a user
 */
export async function getMonthlyUsage(userId) {
  try {
    const userData = await ensureUserDoc(userId);
    const monthData = await ensureMonthDoc(userId);
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
    };
  } catch (error) {
    console.error('[TokenTracker] Failed to get usage:', error.message);
    // Return safe defaults
    const plan = AI_PLANS.FREE;
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
    };
  }
}

/**
 * Check if user has exceeded their limit
 */
export async function checkLimit(userId) {
  const usage = await getMonthlyUsage(userId);
  return {
    isLimitReached: usage.usedUSD >= usage.monthlyLimitUSD,
    isNearLimit: usage.usagePercent >= 80,
    usage,
  };
}

/**
 * Get remaining budget in USD
 */
export async function getRemainingBudget(userId) {
  const usage = await getMonthlyUsage(userId);
  return usage.remainingUSD;
}

/**
 * Upgrade user to premium plan
 */
export async function upgradeToPremium(userId) {
  try {
    const userRef = doc(db, getUsagePath(userId));
    await setDoc(userRef, { plan: 'premium', upgradedAt: serverTimestamp() }, { merge: true });
    return { success: true, plan: 'premium' };
  } catch (error) {
    console.error('[TokenTracker] Upgrade failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Downgrade user to free plan
 */
export async function downgradeToFree(userId) {
  try {
    const userRef = doc(db, getUsagePath(userId));
    await setDoc(userRef, { plan: 'free', downgradedAt: serverTimestamp() }, { merge: true });
    return { success: true, plan: 'free' };
  } catch (error) {
    console.error('[TokenTracker] Downgrade failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get usage breakdown by feature
 */
export async function getUsageByFeature(userId) {
  try {
    const monthRef = doc(db, getMonthPath(userId));
    const monthSnap = await getDoc(monthRef);
    const requests = monthSnap.data()?.recentRequests || [];

    const breakdown = {};
    requests.forEach(req => {
      if (!breakdown[req.feature]) {
        breakdown[req.feature] = { count: 0, costUSD: 0, tokens: 0 };
      }
      breakdown[req.feature].count++;
      breakdown[req.feature].costUSD += req.costUSD;
      breakdown[req.feature].tokens += (req.inputTokens + req.outputTokens);
    });

    return breakdown;
  } catch (error) {
    console.error('[TokenTracker] Failed to get breakdown:', error.message);
    return {};
  }
}
