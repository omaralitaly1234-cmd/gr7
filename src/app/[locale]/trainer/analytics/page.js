'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function TrainerAnalyticsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalSessions: 0, completionRate: 0, avgRating: 0, totalClients: 0, revenue: 0 });
  const [clients, setClients] = useState([]);

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        const { data: members } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'assignedTrainer', operator: '==', value: user.uid }]);
        setClients(members || []);

        const { data: sessions } = await getTenantDocuments(tenantId, 'trainer_sessions',
          [{ field: 'trainerId', operator: '==', value: user.uid }]);
        const allSessions = sessions || [];
        const completed = allSessions.filter(s => s.status === 'completed').length;

        const { data: trainers } = await getTenantDocuments(tenantId, 'trainers',
          [{ field: 'uid', operator: '==', value: user.uid }]);
        const trainer = trainers?.[0];

        setKpis({
          totalSessions: allSessions.length,
          completionRate: allSessions.length > 0 ? Math.round((completed / allSessions.length) * 100) : 0,
          avgRating: trainer?.rating || userData?.rating || 0,
          totalClients: members?.length || 0,
          revenue: trainer?.monthlyEarnings || 0,
        });
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
        <h1><span>📈</span> {isAr ? 'تحليلات أدائي' : 'My Performance Analytics'}</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: kpis.totalSessions, l: isAr ? 'إجمالي الحصص' : 'Total Sessions', icon: '📋', color: 'var(--pt-gold)', sub: `${kpis.completionRate}% ${isAr ? 'إتمام' : 'completion'}` },
          { v: `${kpis.avgRating.toFixed(1)}⭐`, l: isAr ? 'متوسط التقييم' : 'Avg Rating', icon: '⭐', color: '#FFD740', sub: isAr ? 'من 5.0' : 'out of 5.0' },
          { v: kpis.totalClients, l: isAr ? 'عملائي' : 'My Clients', icon: '👥', color: '#4FC3F7', sub: isAr ? 'عميل مخصص' : 'assigned' },
          { v: `${kpis.completionRate}%`, l: isAr ? 'نسبة الإتمام' : 'Completion Rate', icon: '✅', color: 'var(--pt-success)', sub: isAr ? 'حصص مكتملة' : 'completed sessions' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.v}</div>
              <div className="stat-label">{s.l}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)', fontWeight: 600 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>👥 {isAr ? 'عملائي' : 'My Clients'}</h3>
        {clients.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>📭 {t('common.noData')}</p>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>{isAr ? 'العميل' : 'Client'}</th>
              <th style={{ textAlign: 'center' }}>📊 {isAr ? 'زيارات' : 'Visits'}</th>
              <th style={{ textAlign: 'center' }}>{isAr ? 'الهدف' : 'Goal'}</th>
              <th style={{ textAlign: 'center' }}>{isAr ? 'الحالة' : 'Status'}</th>
            </tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.fullName?.[locale] || c.fullName?.ar || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{c.totalVisits || 0}</td>
                  <td style={{ textAlign: 'center' }}>{c.fitnessGoal ? t(`members.goals.${c.fitnessGoal}`) : '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{t(`common.${c.status || 'active'}`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
