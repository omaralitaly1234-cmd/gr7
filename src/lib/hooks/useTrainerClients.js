'use client';

import { useState, useEffect } from 'react';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Hook to load clients assigned to the current trainer.
 * Returns { clients, loading } where clients is an array of member docs.
 */
export function useTrainerClients() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'members');
        const myClients = (data || []).filter(
          m => m.assignedTrainer === user.uid || m.assignedTrainerDocId === user.uid
        );
        myClients.sort((a, b) => (a.fullName?.ar || '').localeCompare(b.fullName?.ar || ''));
        setClients(myClients);
      } catch (err) { console.error('[useTrainerClients]', err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

  return { clients, loading };
}
