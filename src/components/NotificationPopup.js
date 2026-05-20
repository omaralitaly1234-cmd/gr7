'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToTenantCollection, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useMemberData } from '@/lib/hooks/useMemberData';

/**
 * Real-time notification popup that listens for new unread notifications
 * and shows a popup banner when a new one arrives.
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
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!tenantId || !memberData || memberLoading) return;

    // Subscribe to unread notifications for this member in real-time
    const unsub = subscribeToTenantCollection(
      tenantId,
      'notifications',
      [
        { field: 'memberId', operator: '==', value: memberData.id },
        { field: 'read', operator: '==', value: false },
      ],
      { field: 'createdAt', direction: 'desc' },
      (docs) => {
        // On initial load, mark all existing IDs as seen
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
          docs.forEach(d => seenIdsRef.current.add(d.id));
          return;
        }
        // Find new notifications we haven't seen
        const newNotif = docs.find(d => !seenIdsRef.current.has(d.id));
        if (newNotif) {
          seenIdsRef.current.add(newNotif.id);
          setPopup(newNotif);
          setVisible(true);
          // Auto-hide after 8 seconds
          setTimeout(() => setVisible(false), 8000);
        }
        // Also add all current doc ids to seen
        docs.forEach(d => seenIdsRef.current.add(d.id));
      }
    );

    return () => unsub();
  }, [tenantId, memberData, memberLoading]);

  const handleOpen = async () => {
    if (popup) {
      // Mark as read
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
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: '90%',
        maxWidth: 420,
        animation: 'slideDownPopup 0.4s ease-out',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,25,15,0.98) 100%)',
          border: '1px solid rgba(245,197,24,0.4)',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(245,197,24,0.15)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          cursor: 'pointer',
        }}
        onClick={handleOpen}
      >
        {/* Icon */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'rgba(245,197,24,0.15)',
            border: '2px solid rgba(245,197,24,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0,
            animation: 'bellRing 0.6s ease-in-out',
          }}
        >
          {popup.icon || '🔔'}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(245,197,24,0.8)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 4,
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
              color: 'rgba(255,255,255,0.6)',
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
              color: 'var(--pt-gold)',
              fontWeight: 600,
            }}
          >
            {isAr ? '👆 اضغط لفتح الإشعارات' : '👆 Tap to open notifications'}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <style jsx global>{`
        @keyframes slideDownPopup {
          from { opacity: 0; transform: translateX(-50%) translateY(-30px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(8deg); }
          80% { transform: rotate(-8deg); }
        }
      `}</style>
    </div>
  );
}
