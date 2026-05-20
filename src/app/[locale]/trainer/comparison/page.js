'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';

export default function TrainerComparisonPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { clients, loading } = useTrainerClients();
  const [selectedClients, setSelectedClients] = useState([0, 1]);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  if (clients.length < 2) return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>📊</span> {isAr ? 'مقارنة العملاء' : 'Client Comparison'}</h1></div>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📊</div>
        <h3>{isAr ? 'تحتاج عميلين على الأقل للمقارنة' : 'Need at least 2 clients to compare'}</h3>
        <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? `لديك حالياً ${clients.length} عميل مخصص` : `You currently have ${clients.length} assigned client(s)`}</p>
      </div>
    </div>
  );

  const c1 = clients[selectedClients[0]] || clients[0];
  const c2 = clients[selectedClients[1]] || clients[1];
  const getName = (c) => c?.fullName?.[locale] || c?.fullName?.ar || '';

  const compareMetrics = (label, v1, v2, unit = '', lowerBetter = false) => {
    if (v1 == null && v2 == null) return null;
    const better1 = lowerBetter ? (v1 || 0) < (v2 || 0) : (v1 || 0) > (v2 || 0);
    const better2 = lowerBetter ? (v2 || 0) < (v1 || 0) : (v2 || 0) > (v1 || 0);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ textAlign: 'center', fontWeight: 700, color: better1 ? 'var(--pt-success)' : 'var(--pt-gray-400)' }}>
          {v1 ?? '-'}{unit} {better1 && '✓'}
        </div>
        <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', minWidth: 100 }}>{label}</div>
        <div style={{ textAlign: 'center', fontWeight: 700, color: better2 ? 'var(--pt-success)' : 'var(--pt-gray-400)' }}>
          {v2 ?? '-'}{unit} {better2 && '✓'}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {isAr ? 'مقارنة العملاء' : 'Client Comparison'}</h1>
      </div>

      {/* Client Selectors */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)', gap: 'var(--space-4)' }}>
        {[0, 1].map(idx => (
          <div key={idx} className="card" style={{ borderTop: `3px solid ${idx === 0 ? 'var(--pt-gold)' : '#4FC3F7'}` }}>
            <select className="form-select" value={selectedClients[idx]} onChange={e => {
              const newSel = [...selectedClients];
              newSel[idx] = parseInt(e.target.value);
              setSelectedClients(newSel);
            }} style={{ marginBottom: 'var(--space-3)' }}>
              {clients.map((c, i) => <option key={c.id} value={i}>{getName(c)} — {c.fitnessGoal ? t(`members.goals.${c.fitnessGoal}`) : '-'}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: idx === 0 ? 'rgba(245,197,24,0.15)' : 'rgba(79,195,247,0.15)', color: idx === 0 ? 'var(--pt-gold)' : '#4FC3F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem', flexShrink: 0 }}>
                {getName(clients[selectedClients[idx]]).charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{getName(clients[selectedClients[idx]])}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                  📞 {clients[selectedClients[idx]]?.phone || '-'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Body Comparison */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', textAlign: 'center' }}>
          📏 {isAr ? 'مقارنة البيانات الجسمية' : 'Body Data Comparison'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ textAlign: 'center', fontWeight: 800, color: 'var(--pt-gold)' }}>{getName(c1).split(' ')[0]}</div>
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>⚔️</div>
          <div style={{ textAlign: 'center', fontWeight: 800, color: '#4FC3F7' }}>{getName(c2).split(' ')[0]}</div>
        </div>
        {compareMetrics(isAr ? 'الوزن (kg)' : 'Weight', c1?.weight, c2?.weight, ' kg', true)}
        {compareMetrics(isAr ? 'الطول (cm)' : 'Height', c1?.height, c2?.height, ' cm')}
        {compareMetrics(isAr ? 'الزيارات' : 'Total Visits', c1?.totalVisits, c2?.totalVisits)}
        {compareMetrics(isAr ? 'الحالة' : 'Status', c1?.status === 'active' ? 1 : 0, c2?.status === 'active' ? 1 : 0)}
      </div>

      {/* Summary Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📋 {isAr ? 'ملخص المقارنة' : 'Comparison Summary'}</h3>
        <table className="data-table">
          <thead><tr>
            <th>{isAr ? 'البيان' : 'Field'}</th>
            <th style={{ textAlign: 'center', color: 'var(--pt-gold)' }}>{getName(c1).split(' ')[0]}</th>
            <th style={{ textAlign: 'center', color: '#4FC3F7' }}>{getName(c2).split(' ')[0]}</th>
          </tr></thead>
          <tbody>
            {[
              { l: isAr ? 'الهدف' : 'Goal', v1: c1?.fitnessGoal ? t(`members.goals.${c1.fitnessGoal}`) : '-', v2: c2?.fitnessGoal ? t(`members.goals.${c2.fitnessGoal}`) : '-' },
              { l: isAr ? 'الحالة' : 'Status', v1: c1?.status || '-', v2: c2?.status || '-' },
              { l: isAr ? 'الوزن' : 'Weight', v1: c1?.weight ? `${c1.weight} kg` : '-', v2: c2?.weight ? `${c2.weight} kg` : '-' },
              { l: isAr ? 'الطول' : 'Height', v1: c1?.height ? `${c1.height} cm` : '-', v2: c2?.height ? `${c2.height} cm` : '-' },
              { l: isAr ? 'الزيارات' : 'Visits', v1: c1?.totalVisits ?? 0, v2: c2?.totalVisits ?? 0 },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.l}</td>
                <td style={{ textAlign: 'center' }}>{row.v1}</td>
                <td style={{ textAlign: 'center' }}>{row.v2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
