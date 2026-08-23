'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadTenantSpaServices } from '@/lib/firebase/spa-services-store';
import { SPA_SERVICES, toSpaService } from '@/lib/spa-services';

/**
 * The gym's own spa catalogue.
 *
 * Falls back to the built-in list if the gym's services cannot be read, so the
 * booking screen can never end up with an empty service dropdown and block a
 * sale.
 */
export function useSpaServices(tenantId, { includeInactive = false } = {}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    const { services: loaded, error } = await loadTenantSpaServices(tenantId, { includeInactive });
    if (error || !loaded || loaded.length === 0) {
      if (error) console.error('[useSpaServices]', error);
      setServices(SPA_SERVICES.map(s => toSpaService({ ...s, serviceId: s.id })));
    } else {
      setServices(loaded);
    }
    setLoading(false);
  }, [tenantId, includeInactive]);

  useEffect(() => { reload(); }, [reload]);

  return { services, loading, reload };
}
