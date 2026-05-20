'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTenantDocuments, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useMemberData } from '@/lib/hooks/useMemberData';

/**
 * Real-time notification popup — polls every 10 seconds for new unread
 * notifications and shows an animated banner when one arrives.
 */
export default function NotificationPopup() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { memberData, loading: memberLoading } = useMemberData();
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);
  const seenIdsRef = useRef(new Set());
  const firstRunRef = useRef(true);
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const checkNotifications = useCallback(async () => {
    if (!tenantId || !memberData) return;
    try {
      const { data } = await getTenantDocuments(
        tenantId,
        'notifications',
        [{ field: 'memberId', operator: '==', value: memberData.id }],
        { field: 'createdAt', direction: 'desc' },
        20
      );
      const docs = data || [];

      // First run — just record what already exists
      if (firstRunRef.current) {
        firstRunRef.current = false;
        docs.forEach(d => seenIdsRef.current.add(d.id));
        return;
      }

      // Find new unread notification we haven't seen yet
      const newNotif = docs.find(d => !seenIdsRef.current.has(d.id) && !d.read);
      if (newNotif) {
        seenIdsRef.current.add(newNotif.id);
        setPopup(newNotif);
        setVisible(true);
        // Auto-hide after 8 seconds
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setVisible(false), 8000);
      }
      // Track all current IDs
      docs.forEach(d => seenIdsRef.current.add(d.id));
    } catch (err) {
      console.error('NotificationPopup poll error:', err);
    }
  }, [tenantId, memberData]);

  useEffect(() => {
    if (!tenantId || !memberData || memberLoading) return;

    // Initial check
    checkNotifications();

    // Poll every 10 seconds
    timerRef.current = setInterval(checkNotifications, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [tenantId, memberData, memberLoading, checkNotifications]);

  const handleOpen = async () => {
    if (popup) {
      try {
        await updateTenantDocument(tenantId, 'notifications', popup.id, { read: true });
      } catch (e) { /* ignore */ }
    }
    setVisible(false);
    router.push(`/${locale}/client/notifications`);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible || !popup) return null;

  return (
    <>
      <style>{`
        @keyframes notifSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes notifBellRing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(20deg); }
          30% { transform: rotate(-18deg); }
          45% { transform: rotate(14deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(6deg); }
        }
        @keyframes notifPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 0 rgba(245,197,24,0.3); }
          50% { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 8px rgba(245,197,24,0); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: '92%',
          maxWidth: 420,
          animation: 'notifSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          onClick={handleOpen}
          style={{
            background: 'linear-gradient(135deg, #141414 0%, #1e190f 100%)',
            border: '1.5px solid rgba(245,197,24,0.45)',
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(245,197,24,0.12)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            cursor: 'pointer',
            animation: 'notifPulse 2s ease-in-out 1',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(245,197,24,0.15)',
              border: '2px solid rgba(245,197,24,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
              animation: 'notifBellRing 0.8s ease-in-out',
            }}
          >
            {popup.icon || '🔔'}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(245,197,24,0.85)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 5,
              }}
            >
              {isAr ? '📬 رسالة جديدة' : '📬 New Message'}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: '#fff',
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {popup.title || ''}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {popup.body || popup.message || ''}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: '#F5C518',
                fontWeight: 600,
              }}
            >
              {isAr ? '👆 اضغط لفتح الإشعارات' : '👆 Tap to open'}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
