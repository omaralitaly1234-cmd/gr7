'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadTenantPlans } from '@/lib/firebase/membership-plans-store';
import { MEMBERSHIP_PLANS } from '@/lib/membership-plans';

/**
 * The gym's own subscription catalogue.
 *
 * Falls back to the built-in list if the gym's plans cannot be read, so the
 * "add member" and "renew" screens can never end up with an empty plan
 * dropdown and block a sale.
 */
export function useMembershipPlans(tenantId, { includeInactive = false } = {}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    const { plans: loaded, error } = await loadTenantPlans(tenantId, { includeInactive });
    if (error || !loaded || loaded.length === 0) {
      if (error) console.error('[useMembershipPlans]', error);
      setPlans(MEMBERSHIP_PLANS.map(p => ({ ...p, planId: p.id, active: true })));
    } else {
      setPlans(loaded);
    }
    setLoading(false);
  }, [tenantId, includeInactive]);

  useEffect(() => { reload(); }, [reload]);

  return { plans, loading, reload };
}
