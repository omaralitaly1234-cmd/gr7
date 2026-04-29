'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getTenant, checkTrialStatus, isSubscriptionActive, hasFeature as checkFeature, PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

const TenantContext = createContext(null);

export function TenantProvider({ children, tenantId: propTenantId }) {
  const { tenantId: authTenantId } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tenantId = propTenantId || authTenantId || null;

  // Load tenant data from Firestore
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    async function loadTenant() {
      setLoading(true);
      const { data, error: fetchError } = await getTenant(tenantId);
      if (fetchError) {
        setError(fetchError);
      } else {
        setTenantData(data);
      }
      setLoading(false);
    }

    loadTenant();
  }, [tenantId]);

  // Check if a specific feature is available
  const hasFeatureAccess = useCallback((featureKey) => {
    if (!tenantData) return false;
    return checkFeature(tenantData, featureKey);
  }, [tenantData]);

  // Get trial status
  const trialStatus = tenantData ? checkTrialStatus(tenantData) : { isTrialActive: false, daysRemaining: 0 };

  // Is subscription active
  const isActive = tenantData ? isSubscriptionActive(tenantData) : false;

  // Get current plan info
  const currentPlan = tenantData?.subscription?.plan || 'trial';
  const planInfo = PLAN_DEFINITIONS[currentPlan] || PLAN_DEFINITIONS.trial;

  // Is on trial
  const isTrial = currentPlan === 'trial' && trialStatus.isTrialActive;

  // Is expired
  const isExpired = tenantData?.status === 'expired' || (!trialStatus.isTrialActive && currentPlan === 'trial');

  // Is suspended
  const isSuspended = tenantData?.status === 'suspended';

  // Refresh tenant data
  const refreshTenant = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await getTenant(tenantId);
    if (data) setTenantData(data);
  }, [tenantId]);

  const value = {
    tenantId,
    tenantData,
    loading,
    error,
    // Subscription State
    currentPlan,
    planInfo,
    isActive,
    isTrial,
    isExpired,
    isSuspended,
    // Trial Info
    trialStatus,
    daysRemaining: trialStatus.daysRemaining,
    isExpiringSoon: trialStatus.isExpiringSoon,
    // Feature Access
    hasFeature: hasFeatureAccess,
    features: tenantData?.features || {},
    limits: tenantData?.limits || {},
    // Actions
    refreshTenant,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    // Safe defaults outside provider
    return {
      tenantId: null,
      tenantData: null,
      loading: false,
      error: null,
      currentPlan: 'trial',
      planInfo: PLAN_DEFINITIONS.trial,
      isActive: false,
      isTrial: false,
      isExpired: true,
      isSuspended: false,
      trialStatus: { isTrialActive: false, daysRemaining: 0 },
      daysRemaining: 0,
      isExpiringSoon: false,
      hasFeature: () => false,
      features: {},
      limits: {},
      refreshTenant: async () => {},
    };
  }
  return context;
}

export default TenantContext;
