'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';

export default function ClientProgressPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId || !memberData) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'measurements',
          [{ field: 'memberId', operator: '==', value: memberData.id }],
          { field: 'createdAt', direction: 'desc' }, 10);
        setMeasurements(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (!memberLoading) load();
  }, [tenantId, memberData, memberLoading]);

  if (loading || memberLoading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  if (measurements.length === 0) return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>📊</span> {t('client.myProgress')}</h1></div>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📊</div>
        <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>{isAr ? 'لا توجد بيانات تقدم بعد' : 'No progress data yet'}</h3>
        <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'ابدأ بتسجيل قياساتك لتتبع تقدمك' : 'Start recording your measurements to track progress'}</p>
      </div>
    </div>
  );

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];
  const weightChange = (latest.weight || 0) - (oldest.weight || 0);
  const fatChange = (latest.bodyFat || 0) - (oldest.bodyFat || 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>📊</span> {t('client.myProgress')}</h1></div>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card"><div className="stat-icon gold">⚖️</div><div className="stat-info"><div className="stat-value">{latest.weight || '-'} kg</div><div className="stat-label">{isAr ? 'الوزن الحالي' : 'Current Weight'}</div>{measurements.length > 1 && <span style={{ fontSize: 'var(--font-size-xs)', color: weightChange <= 0 ? 'var(--pt-success)' : 'var(--pt-danger)' }}>{weightChange > 0 ? '+' : ''}{weightChange} kg</span>}</div></div>
        <div className="stat-card"><div className="stat-icon info">🔥</div><div className="stat-info"><div className="stat-value">{latest.bodyFat || '-'}%</div><div className="stat-label">{isAr ? 'نسبة الدهون' : 'Body Fat'}</div>{measurements.length > 1 && <span style={{ fontSize: 'var(--font-size-xs)', color: fatChange <= 0 ? 'var(--pt-success)' : 'var(--pt-danger)' }}>{fatChange > 0 ? '+' : ''}{fatChange}%</span>}</div></div>
        <div className="stat-card"><div className="stat-icon success">📏</div><div className="stat-info"><div className="stat-value">{measurements.length}</div><div className="stat-label">{isAr ? 'عدد القياسات' : 'Total Records'}</div></div></div>
      </div>
      {measurements.length > 1 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>⚖️ {isAr ? 'رحلة الوزن' : 'Weight Journey'}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 180, padding: 'var(--space-3) 0' }}>
            {measurements.slice().reverse().map((m, i) => {
              const minW = Math.min(...measurements.map(x => x.weight || 0));
              const maxW = Math.max(...measurements.map(x => x.weight || 0));
              const range = maxW - minW || 1;
              const h = (((m.weight || 0) - minW) / range) * 80 + 20;
              const isLast = i === measurements.length - 1;
              const toDate = (ts) => { if (!ts) return '-'; if (ts.toDate) return ts.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }); return '-'; };
              return (<div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}><span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: isLast ? 'var(--pt-gold)' : 'white' }}>{m.weight}</span><div style={{ width: '100%', maxWidth: 48, height: `${h}%`, background: isLast ? 'var(--pt-gold)' : 'rgba(245,197,24,0.25)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'height 0.5s' }} /><span style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{toDate(m.createdAt)}</span></div>);
            })}
          </div>
        </div>
      )}
    </div>
  );
}
