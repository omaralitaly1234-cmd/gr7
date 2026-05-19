'use client';

import { useState, useEffect } from 'react';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Hook to fetch the current logged-in member's data from Firestore.
 * Tries 'uid' field first (from member creation), then 'userId' as fallback.
 */
export function useMemberData() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMember() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        let members = [];
        const { data: byUid } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'uid', operator: '==', value: user.uid }]);
        members = byUid || [];
        if (members.length === 0) {
          const { data: byUserId } = await getTenantDocuments(tenantId, 'members',
            [{ field: 'userId', operator: '==', value: user.uid }]);
          members = byUserId || [];
        }
        setMemberData(members[0] || null);
      } catch (err) {
        console.error('Error loading member data:', err);
      }
      setLoading(false);
    }
    loadMember();
  }, [tenantId, user]);

  return { memberData, loading, tenantId };
}
