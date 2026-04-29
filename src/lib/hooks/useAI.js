'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { authenticatedFetch } from '@/lib/authenticated-fetch';

export function useAI() {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [error, setError] = useState(null);

  // Fetch usage data (with auth token)
  const fetchUsage = useCallback(async () => {
    if (!userId || !user) return;
    try {
      const res = await authenticatedFetch('/api/ai/usage', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI usage:', err);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Call AI API with auth token and limit checking
  const callAI = useCallback(async (endpoint, body) => {
    if (!userId || !user) return { success: false, error: 'not_authenticated' };
    setLoading(true);
    setError(null);

    try {
      const res = await authenticatedFetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 429) {
        // Limit reached
        setShowUpgrade(true);
        setError(data.error || 'limit_reached');
        return { success: false, limitReached: true, data };
      }

      if (!res.ok) {
        setError(data.error || 'unknown_error');
        return { success: false, data };
      }

      // Refresh usage after successful call
      await fetchUsage();
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchUsage, userId, user]);

  // Upgrade to premium (with auth token)
  const upgradeToPremium = useCallback(async () => {
    if (!userId || !user) return false;
    try {
      const res = await authenticatedFetch('/api/ai/usage', {
        method: 'POST',
        body: JSON.stringify({ action: 'upgrade' }),
      });
      if (res.ok) {
        setShowUpgrade(false);
        await fetchUsage();
        return true;
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
    }
    return false;
  }, [fetchUsage, userId, user]);

  return {
    usage,
    loading,
    error,
    showUpgrade,
    setShowUpgrade,
    callAI,
    upgradeToPremium,
    fetchUsage,
    isLimitReached: usage?.usagePercent >= 100,
    isNearLimit: usage?.usagePercent >= 80,
    plan: usage?.plan || 'free',
    remaining: usage?.remainingUSD || 0,
  };
}
