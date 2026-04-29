'use client';

import { useTenant } from '@/context/TenantContext';

/**
 * FeatureGate - Wraps content that requires a specific feature
 * Usage:
 *   <FeatureGate feature="ai_nutrition" fallback={<UpgradePrompt />}>
 *     <AINutritionAssistant />
 *   </FeatureGate>
 */
export default function FeatureGate({ feature, children, fallback = null, showLockIcon = false }) {
  const { hasFeature, isActive } = useTenant();

  // If subscription is not active at all, show fallback or nothing
  if (!isActive && fallback) return fallback;
  if (!isActive && !fallback) return null;

  // If feature is available, show children
  if (hasFeature(feature)) {
    return children;
  }

  // Feature is locked - show fallback or a default lock indicator
  if (fallback) return fallback;

  if (showLockIcon) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        opacity: 0.5,
      }}>
        <span style={{ fontSize: '2rem' }}>🔒</span>
      </div>
    );
  }

  return null;
}
