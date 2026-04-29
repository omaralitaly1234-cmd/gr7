'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';

export default function AnalyticsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    async function loadData() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data: mems } = await getTenantDocuments(tenantId, 'members');
        const { data: pays } = await getTenantDocuments(tenantId, 'payments', [], { field: 'createdAt', direction: 'desc' }, 500);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const { data: att } = await getTenantDocuments(tenantId, 'attendance',
          [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(monthStart) }]);
        setMembers(mems || []);
        setPayments(pays || []);
        setAttendance(att || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadData();
  }, [tenantId]);

  // Revenue by month (last 6 months)
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const rev = payments.filter(p => {
      const pd = p.createdAt?.toDate ? p.createdAt.toDate() : null;
      return pd && pd >= mStart && pd <= mEnd;
    }).reduce((s, p) => s + (p.netAmount || p.amount || 0), 0);
    revenueByMonth.push({
      label: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short' }),
      value: rev,
    });
  }
  const maxRev = Math.max(...revenueByMonth.map(r => r.value), 1);

  // Members by plan
  const planCounts = {};
  members.forEach(m => {
    const plan = m.currentPlan?.type || m.planName?.includes('ماسي') ? 'diamond' : 'gold';
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  });

  // Members by status
  const statusCounts = { active: 0, expired: 0, frozen: 0 };
  members.forEach(m => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });

  // Gender split
  const genderCounts = { male: 0, female: 0 };
  members.forEach(m => { genderCounts[m.gender] = (genderCounts[m.gender] || 0) + 1; });

  // Attendance by hour
  const hourCounts = {};
  attendance.forEach(a => {
    const d = a.checkIn?.toDate ? a.checkIn.toDate() : null;
    if (d) { const h = d.getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; }
  });
  const maxHour = Math.max(...Object.values(hourCounts), 1);

  // Top sources of revenue
  const revByType = {};
  payments.forEach(p => {
    const type = p.type || 'subscription';
    revByType[type] = (revByType[type] || 0) + (p.netAmount || p.amount || 0);
  });

  const totalRevenue = payments.reduce((s, p) => s + (p.netAmount || p.amount || 0), 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {t('sidebar.analytics')}</h1>
        <select className="form-select" style={{ width: 'auto' }} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="month">{t('common.thisMonth')}</option>
          <option value="all">{t('common.all')}</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-gold)' }}>
              <div className="stat-info">
                <div className="stat-value">{members.length}</div>
                <div className="stat-label">{isAr ? 'إجمالي الأعضاء' : 'Total Members'}</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-success)' }}>
              <div className="stat-info">
                <div className="stat-value">{statusCounts.active}</div>
                <div className="stat-label">{t('common.active')}</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-info)' }}>
              <div className="stat-info">
                <div className="stat-value">{attendance.length}</div>
                <div className="stat-label">{isAr ? 'زيارات (6 أشهر)' : 'Visits (6 months)'}</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-warning)' }}>
              <div className="stat-info">
                <div className="stat-value">{totalRevenue.toLocaleString()}</div>
                <div className="stat-label">{t('finance.totalRevenue')} ({t('common.egp')})</div>
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            {/* Revenue Chart */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>💰 {isAr ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: 180, padding: 'var(--space-2) 0' }}>
                {revenueByMonth.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                    title={`${m.label}: ${m.value.toLocaleString()} ${t('common.egp')}`}>
                    <span style={{ fontSize: '9px', color: 'var(--pt-gray-500)', fontWeight: 600 }}>
                      {m.value > 0 ? `${(m.value / 1000).toFixed(0)}k` : '0'}
                    </span>
                    <div style={{
                      width: '100%', maxWidth: 40, height: Math.max(4, (m.value / maxRev) * 150),
                      background: i === revenueByMonth.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.3)',
                      borderRadius: '6px 6px 0 0', transition: 'height 0.5s',
                    }} />
                    <span style={{ fontSize: '10px', color: i === revenueByMonth.length - 1 ? 'var(--pt-gold)' : 'var(--pt-gray-500)' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Members Distribution */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>👥 {isAr ? 'توزيع الأعضاء' : 'Member Distribution'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {/* By Status */}
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)' }}>{isAr ? 'حسب الحالة' : 'By Status'}</h4>
                  {[
                    { k: 'active', l: t('common.active'), c: 'var(--pt-success)', v: statusCounts.active },
                    { k: 'expired', l: t('common.expired'), c: 'var(--pt-danger)', v: statusCounts.expired },
                    { k: 'frozen', l: t('common.frozen'), c: 'var(--pt-frozen)', v: statusCounts.frozen },
                  ].map(s => (
                    <div key={s.k} style={{ marginBottom: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 2 }}>
                        <span>{s.l}</span>
                        <span style={{ fontWeight: 700, color: s.c }}>{s.v}</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${members.length > 0 ? (s.v / members.length) * 100 : 0}%`, background: s.c, borderRadius: 'var(--radius-full)' }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* By Gender */}
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)' }}>{isAr ? 'حسب النوع' : 'By Gender'}</h4>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '1.5rem' }}>♂️</div>
                      <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: 'var(--pt-info)' }}>{genderCounts.male}</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{t('common.male')}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '1.5rem' }}>♀️</div>
                      <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: '#EC407A' }}>{genderCounts.female}</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{t('common.female')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
            {/* Attendance Heatmap */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'ساعات الذروة' : 'Peak Hours'}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {Array.from({ length: 18 }, (_, i) => i + 5).map(hour => {
                  const count = hourCounts[hour] || 0;
                  const intensity = maxHour > 0 ? count / maxHour : 0;
                  return (
                    <div key={hour} title={`${hour}:00 — ${count} ${isAr ? 'زيارة' : 'visits'}`} style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                      background: intensity > 0.7 ? 'var(--pt-gold)' : intensity > 0.4 ? 'rgba(245,197,24,0.4)' : intensity > 0.1 ? 'rgba(245,197,24,0.15)' : 'var(--pt-darker)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: intensity > 0.5 ? 700 : 400,
                      color: intensity > 0.7 ? '#0D0D0D' : 'var(--pt-gray-500)',
                    }}>
                      {hour}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', fontSize: '10px', color: 'var(--pt-gray-500)' }}>
                <span>{isAr ? 'منخفض' : 'Low'}</span>
                {[0.1, 0.3, 0.5, 0.8].map((v, i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: v > 0.7 ? 'var(--pt-gold)' : v > 0.4 ? 'rgba(245,197,24,0.4)' : 'rgba(245,197,24,0.15)' }} />
                ))}
                <span>{isAr ? 'مرتفع' : 'High'}</span>
              </div>
            </div>

            {/* Revenue Sources */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>💰 {isAr ? 'مصادر الإيرادات' : 'Revenue Sources'}</h3>
              {Object.keys(revByType).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>{t('common.noData')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {Object.entries(revByType).sort((a, b) => b[1] - a[1]).map(([type, amount]) => {
                    const icons = { subscription: '💳', spa: '🧖', personal_training: '💪', product: '🛍️', other: '📦' };
                    const labels = { subscription: isAr ? 'اشتراكات' : 'Subscriptions', spa: isAr ? 'سبا' : 'Spa', personal_training: isAr ? 'تدريب خاص' : 'PT', product: isAr ? 'منتجات' : 'Products', other: isAr ? 'أخرى' : 'Other' };
                    const pct = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-size-sm)' }}>
                          <span>{icons[type] || '📦'} {labels[type] || type}</span>
                          <span style={{ fontWeight: 700 }}>{amount.toLocaleString()} {t('common.egp')} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--pt-gold)', width: `${pct}%`, borderRadius: 'var(--radius-full)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
