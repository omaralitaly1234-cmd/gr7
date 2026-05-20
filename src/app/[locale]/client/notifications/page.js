'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';

export default function ClientNotifications() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId || !memberData) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'notifications',
          [{ field: 'memberId', operator: '==', value: memberData.id }],
          { field: 'createdAt', direction: 'desc' }, 20);
        setNotifications(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (!memberLoading) load();
  }, [tenantId, memberData, memberLoading]);

  const toDate = (ts) => { if (!ts) return '-'; if (ts.toDate) return ts.toDate().toLocaleString(isAr ? 'ar-EG' : 'en-US'); if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString(isAr ? 'ar-EG' : 'en-US'); return ts; };

  if (loading || memberLoading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>🔔</span> {isAr ? 'الإشعارات' : 'Notifications'}</h1></div>
      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔕</div>
          <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-lg)' }}>{isAr ? 'لا توجد إشعارات' : 'No notifications yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map((notif, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4)', borderInlineStart: !notif.read ? '3px solid var(--pt-gold)' : 'none', opacity: notif.read ? 0.7 : 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{notif.icon || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: notif.read ? 400 : 600, marginBottom: '4px' }}>{notif.title || ''}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: '4px' }}>{notif.body || notif.message || ''}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>{toDate(notif.createdAt)}</div>
              </div>
              {!notif.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pt-gold)', flexShrink: 0, marginTop: '8px' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
