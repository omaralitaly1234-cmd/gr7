'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function TrainerClientsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'assignedTrainer', operator: '==', value: user.uid }],
          { field: 'fullName.ar', direction: 'asc' });
        setClients(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👥</span> {t('trainer.myClients')}</h1>
        <span className="badge badge-gold">{clients.length} {isAr ? 'عميل' : 'clients'}</span>
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>👥</div>
          <h3>{isAr ? 'لا يوجد عملاء مخصصين لك بعد' : 'No clients assigned yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'سيظهر هنا العملاء المخصصين لك من قبل إدارة النادي' : 'Clients assigned to you by admin will appear here'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {clients.map(client => {
            const name = client.fullName?.[locale] || client.fullName?.ar || '';
            const weightDiff = client.weight && client.startWeight ? client.weight - client.startWeight : null;
            return (
              <div key={client.id} className="card" style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
                <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-full)', background: client.gender === 'male' ? 'rgba(0,176,255,0.12)' : 'rgba(224,64,251,0.12)', color: client.gender === 'male' ? '#00B0FF' : '#E040FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0 }}>
                  {name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '4px' }}>{name}</h3>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', flexWrap: 'wrap' }}>
                        {client.phone && <span>📞 <span dir="ltr">{client.phone}</span></span>}
                        {client.fitnessGoal && <span>🎯 {t(`members.goals.${client.fitnessGoal}`)}</span>}
                        <span>{client.gender === 'male' ? '♂' : '♀'}</span>
                      </div>
                    </div>
                    <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{t(`common.${client.status || 'active'}`)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    {client.weight && (
                      <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{client.weight}</div>
                        <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'الوزن (kg)' : 'Weight'}</div>
                      </div>
                    )}
                    {client.height && (
                      <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{client.height}</div>
                        <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'الطول (cm)' : 'Height'}</div>
                      </div>
                    )}
                    {weightDiff !== null && (
                      <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: weightDiff <= 0 ? 'var(--pt-success)' : 'var(--pt-gold)' }}>{weightDiff > 0 ? '+' : ''}{weightDiff}</div>
                        <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'فرق الوزن' : 'Δ Weight'}</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{client.totalVisits || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'زيارات' : 'Visits'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <Link href={`/${locale}/trainer/diet-plans`} className="btn btn-outline btn-sm">🥗 {isAr ? 'الخطة الغذائية' : 'Diet Plan'}</Link>
                    <Link href={`/${locale}/trainer/programs`} className="btn btn-outline btn-sm">🏋️ {isAr ? 'البرنامج' : 'Program'}</Link>
                    {client.phone && (
                      <a href={`https://wa.me/${client.phone.replace(/^0/, '20')}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">💬 WhatsApp</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
