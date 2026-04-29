'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function FinancialReportsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    async function loadData() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'payments', [],
          { field: 'createdAt', direction: 'desc' }, 500);
        setPayments(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadData();
  }, [tenantId]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const getDate = (p) => p.createdAt?.toDate ? p.createdAt.toDate() : null;
  const getAmount = (p) => p.netAmount || p.amount || 0;

  const todayRev = payments.filter(p => { const d = getDate(p); return d && d >= todayStart; }).reduce((s, p) => s + getAmount(p), 0);
  const weekRev = payments.filter(p => { const d = getDate(p); return d && d >= weekStart; }).reduce((s, p) => s + getAmount(p), 0);
  const monthRev = payments.filter(p => { const d = getDate(p); return d && d >= monthStart; }).reduce((s, p) => s + getAmount(p), 0);
  const lastMonthRev = payments.filter(p => { const d = getDate(p); return d && d >= lastMonthStart && d <= lastMonthEnd; }).reduce((s, p) => s + getAmount(p), 0);
  const totalRev = payments.reduce((s, p) => s + getAmount(p), 0);

  const monthGrowth = lastMonthRev > 0 ? (((monthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : 0;

  // Revenue by category
  const byCategory = {};
  payments.filter(p => {
    const d = getDate(p);
    return period === 'today' ? (d && d >= todayStart) :
      period === 'week' ? (d && d >= weekStart) :
      period === 'month' ? (d && d >= monthStart) : true;
  }).forEach(p => {
    const cat = p.type || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + getAmount(p);
  });

  // Revenue by payment method
  const byMethod = {};
  payments.filter(p => {
    const d = getDate(p);
    return period === 'today' ? (d && d >= todayStart) :
      period === 'week' ? (d && d >= weekStart) :
      period === 'month' ? (d && d >= monthStart) : true;
  }).forEach(p => {
    const method = p.method || 'cash';
    byMethod[method] = (byMethod[method] || 0) + getAmount(p);
  });

  // Daily breakdown for current month
  const dailyData = {};
  payments.filter(p => { const d = getDate(p); return d && d >= monthStart; }).forEach(p => {
    const d = getDate(p);
    const key = d.getDate();
    dailyData[key] = (dailyData[key] || 0) + getAmount(p);
  });
  const maxDaily = Math.max(...Object.values(dailyData), 1);

  const categoryLabels = {
    subscription: { ar: 'اشتراكات', en: 'Subscriptions', icon: '💳', color: 'var(--pt-gold)' },
    spa: { ar: 'سبا', en: 'Spa', icon: '🧖', color: 'var(--pt-info)' },
    personal_training: { ar: 'تدريب خاص', en: 'Personal Training', icon: '💪', color: 'var(--pt-success)' },
    product: { ar: 'منتجات', en: 'Products', icon: '🛍️', color: 'var(--pt-warning)' },
    other: { ar: 'أخرى', en: 'Other', icon: '📦', color: 'var(--pt-gray-400)' },
  };

  const methodLabels = {
    cash: { ar: 'كاش', en: 'Cash', icon: '💵', color: 'var(--pt-success)' },
    visa: { ar: 'فيزا', en: 'Visa', icon: '💳', color: 'var(--pt-info)' },
    bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer', icon: '🏦', color: 'var(--pt-warning)' },
  };

  const periodTotal = Object.values(byCategory).reduce((s, v) => s + v, 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📈</span> {t('sidebar.reports')}</h1>
        <select className="form-select" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 'auto' }}>
          <option value="today">{t('common.today')}</option>
          <option value="week">{t('common.thisWeek')}</option>
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
          {/* Revenue Overview */}
          <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-gold)' }}>
              <div className="stat-info">
                <div className="stat-value">{todayRev.toLocaleString()}</div>
                <div className="stat-label">{t('finance.todayRevenue')}</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-info)' }}>
              <div className="stat-info">
                <div className="stat-value">{weekRev.toLocaleString()}</div>
                <div className="stat-label">{isAr ? 'إيرادات الأسبوع' : 'Weekly Revenue'}</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-success)' }}>
              <div className="stat-info">
                <div className="stat-value">{monthRev.toLocaleString()}</div>
                <div className="stat-label">{t('finance.monthlyRevenue')}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: Number(monthGrowth) >= 0 ? 'var(--pt-success)' : 'var(--pt-danger)', marginTop: 2 }}>
                  {Number(monthGrowth) >= 0 ? '↑' : '↓'} {monthGrowth}% {isAr ? 'عن الشهر السابق' : 'vs last month'}
                </div>
              </div>
            </div>
            <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-warning)' }}>
              <div className="stat-info">
                <div className="stat-value">{totalRev.toLocaleString()}</div>
                <div className="stat-label">{t('finance.totalRevenue')}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            {/* Revenue by Category */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>📊 {t('finance.revenueByCategory')}</h3>
              {Object.keys(byCategory).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>{t('common.noData')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                    const info = categoryLabels[cat] || categoryLabels.other;
                    const pct = periodTotal > 0 ? ((amount / periodTotal) * 100).toFixed(1) : 0;
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-size-sm)' }}>
                          <span>{info.icon} {info[locale]}</span>
                          <span style={{ fontWeight: 700 }}>{amount.toLocaleString()} {t('common.egp')} <span style={{ color: 'var(--pt-gray-500)', fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 8, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: info.color, width: `${pct}%`, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revenue by Payment Method */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>💳 {t('finance.revenueByMethod')}</h3>
              {Object.keys(byMethod).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>{t('common.noData')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                    const info = methodLabels[method] || { ar: method, en: method, icon: '💰', color: 'var(--pt-gray-400)' };
                    const pct = periodTotal > 0 ? ((amount / periodTotal) * 100).toFixed(1) : 0;
                    return (
                      <div key={method} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                        padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{info[locale]}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{pct}%</div>
                        </div>
                        <div style={{ fontWeight: 800, color: info.color }}>{amount.toLocaleString()} {t('common.egp')}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily Revenue Chart */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>
              📊 {isAr ? 'الإيرادات اليومية — هذا الشهر' : 'Daily Revenue — This Month'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, padding: 'var(--space-2) 0' }}>
              {Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, i) => {
                const day = i + 1;
                const val = dailyData[day] || 0;
                const h = maxDaily > 0 ? (val / maxDaily) * 140 : 0;
                const isToday = day === now.getDate();
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                    title={`${isAr ? 'يوم' : 'Day'} ${day}: ${val.toLocaleString()} ${t('common.egp')}`}>
                    <div style={{
                      width: '100%', maxWidth: 20, height: Math.max(2, h),
                      background: isToday ? 'var(--pt-gold)' : val > 0 ? 'rgba(245,197,24,0.4)' : 'var(--glass-border)',
                      borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
                    }} />
                    <span style={{ fontSize: '8px', color: isToday ? 'var(--pt-gold)' : 'var(--pt-gray-600)' }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
