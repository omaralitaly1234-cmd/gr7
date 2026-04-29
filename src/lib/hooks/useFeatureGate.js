'use client';

import { useTenant } from '@/context/TenantContext';
import { AI_FEATURES, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';

/**
 * Hook for checking feature access and subscription status
 * Usage: const { hasFeature, isTrialActive, daysRemaining } = useFeatureGate();
 */
export function useFeatureGate() {
  const {
    hasFeature,
    currentPlan,
    planInfo,
    isActive,
    isTrial,
    isExpired,
    isSuspended,
    trialStatus,
    daysRemaining,
    isExpiringSoon,
    features,
    limits,
  } = useTenant();

  // Check if feature is an AI feature
  const isAIFeature = (featureKey) => AI_FEATURES.includes(featureKey);

  // Get feature label
  const getFeatureLabel = (featureKey, locale = 'ar') => {
    const labels = AI_FEATURE_LABELS[featureKey];
    if (labels) return labels[locale] || labels.ar;
    return featureKey;
  };

  // Get feature icon
  const getFeatureIcon = (featureKey) => {
    return AI_FEATURE_LABELS[featureKey]?.icon || '🔒';
  };

  // Get all locked AI features (for upgrade prompt)
  const lockedAIFeatures = AI_FEATURES.filter(f => !hasFeature(f));

  // Get all available AI features
  const availableAIFeatures = AI_FEATURES.filter(f => hasFeature(f));

  // Check if any AI feature is available
  const hasAnyAI = availableAIFeatures.length > 0;

  // Should show upgrade prompt
  const shouldShowUpgrade = isTrial || isExpired;

  return {
    // Feature checks
    hasFeature,
    isAIFeature,
    getFeatureLabel,
    getFeatureIcon,
    lockedAIFeatures,
    availableAIFeatures,
    hasAnyAI,

    // Subscription state
    currentPlan,
    planInfo,
    isActive,
    isTrial,
    isExpired,
    isSuspended,
    shouldShowUpgrade,

    // Trial info
    trialStatus,
    daysRemaining,
    isExpiringSoon,
    isTrialActive: trialStatus.isTrialActive,

    // Limits
    features,
    limits,

    // AI feature details
    AI_FEATURES,
    AI_FEATURE_LABELS,
  };
}

export default useFeatureGate;
