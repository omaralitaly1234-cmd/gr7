'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function AdminForecastPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const [membersRes, subsRes, expRes] = await Promise.all([
          getTenantDocuments(tenantId, 'members'),
          getTenantDocuments(tenantId, 'subscriptions'),
          getTenantDocuments(tenantId, 'expenses'),
        ]);
        setMembers(membersRes.data || []);
        setSubscriptions(subsRes.data || []);
        setExpenses(expRes.data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  // Helper to get month key from date
  const getMonthKey = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthNames = {
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  // Calculate monthly revenue from subscriptions
  const now = new Date();
  const monthlyRevenue = {};
  subscriptions.forEach(sub => {
    const key = getMonthKey(sub.createdAt || sub.startDate);
    if (key) {
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (sub.amount || sub.price || 0);
    }
  });

  // Calculate monthly expenses
  const monthlyExpenses = {};
  expenses.forEach(exp => {
    const key = getMonthKey(exp.createdAt || exp.date);
    if (key) {
      monthlyExpenses[key] = (monthlyExpenses[key] || 0) + (exp.amount || 0);
    }
  });

  // Build last 6 months of data
  const forecastMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isPast = i > 0;
    forecastMonths.push({
      month: monthNames[locale][d.getMonth()],
      actual: isPast ? (monthlyRevenue[key] || 0) : null,
      predicted: !isPast ? (monthlyRevenue[key] || 0) : null,
      key,
    });
  }

  // Add 2 future months as predictions (simple linear projection)
  const pastRevenues = forecastMonths.filter(m => m.actual !== null && m.actual > 0).map(m => m.actual);
  const avgGrowth = pastRevenues.length >= 2
    ? (pastRevenues[pastRevenues.length - 1] - pastRevenues[0]) / pastRevenues.length
    : 0;
  const lastActual = pastRevenues.length > 0 ? pastRevenues[pastRevenues.length - 1] : 0;

  // Update current month to show both actual and predicted
  if (forecastMonths.length > 0) {
    const current = forecastMonths[forecastMonths.length - 1];
    current.actual = monthlyRevenue[current.key] || 0;
    current.predicted = Math.round(current.actual + avgGrowth);
  }

  // Add 2 future predicted months
  for (let i = 1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    forecastMonths.push({
      month: monthNames[locale][d.getMonth()],
      actual: null,
      predicted: Math.max(0, Math.round(lastActual + avgGrowth * i)),
    });
  }

  // Growth metrics — calculated from real data
  const currentMonthKey = getMonthKey(now);
  const prevMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentRevenue = monthlyRevenue[currentMonthKey] || 0;
  const prevRevenue = monthlyRevenue[prevMonthKey] || 0;
  const revenueGrowth = prevRevenue > 0 ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(0) : 0;

  // Member growth
  const currentMonthMembers = members.filter(m => getMonthKey(m.createdAt) === currentMonthKey).length;
  const prevMonthMembers = members.filter(m => getMonthKey(m.createdAt) === prevMonthKey).length;

  // Renewal rate
  const activeSubs = subscriptions.filter(s => s.status === 'active').length;
  const totalSubs = subscriptions.length;
  const renewalRate = totalSubs > 0 ? ((activeSubs / totalSubs) * 100).toFixed(0) : 0;

  // Churn rate
  const inactiveMembersCount = members.filter(m => m.status === 'inactive' || m.status === 'expired').length;
  const churnRate = members.length > 0 ? ((inactiveMembersCount / members.length) * 100).toFixed(1) : 0;

  const growthMetrics = [
    { label: isAr ? 'نمو الإيرادات' : 'Revenue Growth', current: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`, trend: Number(revenueGrowth) > 0 ? '↑' : Number(revenueGrowth) < 0 ? '↓' : '→', color: 'var(--pt-success)', forecast: isAr ? `${currentRevenue.toLocaleString()} ج.م هذا الشهر` : `${currentRevenue.toLocaleString()} EGP this month` },
    { label: isAr ? 'نمو الأعضاء' : 'Member Growth', current: `+${currentMonthMembers}`, trend: currentMonthMembers > prevMonthMembers ? '↑' : currentMonthMembers < prevMonthMembers ? '↓' : '→', color: '#4FC3F7', forecast: isAr ? `${members.length} إجمالي` : `${members.length} total` },
    { label: isAr ? 'معدل التجديد' : 'Renewal Rate', current: `${renewalRate}%`, trend: Number(renewalRate) >= 70 ? '↑' : '→', color: 'var(--pt-gold)', forecast: isAr ? `${activeSubs} اشتراك نشط` : `${activeSubs} active subs` },
    { label: isAr ? 'معدل الإلغاء' : 'Churn Rate', current: `${churnRate}%`, trend: Number(churnRate) < 10 ? '↓' : '↑', color: '#FF5252', forecast: isAr ? `${inactiveMembersCount} عضو غير نشط` : `${inactiveMembersCount} inactive` },
  ];

  // Total revenue from subscriptions
  const totalRevenue = subscriptions.reduce((s, sub) => s + (sub.amount || sub.price || 0), 0);
  const totalExpensesAmount = expenses.reduce((s, exp) => s + (exp.amount || 0), 0);

  const maxVal = Math.max(...forecastMonths.map(m => Math.max(m.actual || 0, m.predicted || 0)), 1);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔮</span> {isAr ? 'التوقعات المالية' : 'Financial Forecast'}</h1>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {growthMetrics.map((m, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="stat-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-value" style={{ color: m.color }}>{m.current}</div>
                <span style={{ fontWeight: 800, color: m.trend === '↑' ? 'var(--pt-success)' : m.trend === '↓' ? 'var(--pt-danger)' : 'var(--pt-gold)' }}>{m.trend}</span>
              </div>
              <div className="stat-label">{m.label}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)', marginTop: '2px' }}>📊 {m.forecast}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Revenue Forecast Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📈 {isAr ? 'توقع الإيرادات' : 'Revenue Forecast'}</h3>
          {totalRevenue === 0 && totalExpensesAmount === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📊</div>
              {isAr ? 'لا توجد بيانات مالية لعرض التوقعات' : 'No financial data for forecast'}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: 160 }}>
                {forecastMonths.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 700, color: m.actual ? 'var(--pt-gold)' : '#4FC3F7' }}>
                      {((m.actual || m.predicted) / 1000).toFixed(0)}K
                    </span>
                    <div style={{ width: '100%', display: 'flex', gap: '2px', justifyContent: 'center', height: `${((m.actual || m.predicted) / maxVal) * 130}px` }}>
                      {m.actual !== null && m.actual > 0 && (
                        <div style={{ flex: 1, background: 'var(--pt-gold)', borderRadius: '3px 3px 0 0' }} />
                      )}
                      {m.predicted !== null && m.predicted > 0 && (
                        <div style={{ flex: 1, background: m.actual ? '#4FC3F7' : 'rgba(79,195,247,0.4)', borderRadius: '3px 3px 0 0', borderStyle: m.actual ? 'solid' : 'dashed', borderWidth: m.actual ? 0 : '1px', borderColor: '#4FC3F7' }} />
                      )}
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--pt-gray-600)' }}>{m.month}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', fontSize: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, background: 'var(--pt-gold)', borderRadius: 2, display: 'inline-block' }} />
                  {isAr ? 'فعلي' : 'Actual'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, background: '#4FC3F7', borderRadius: 2, display: 'inline-block' }} />
                  {isAr ? 'متوقع' : 'Predicted'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Financial Summary */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>💰 {isAr ? 'ملخص مالي' : 'Financial Summary'}</h3>
          {[
            { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: totalRevenue, color: 'var(--pt-gold)', icon: '💵' },
            { label: isAr ? 'إجمالي المصروفات' : 'Total Expenses', value: totalExpensesAmount, color: '#FF5252', icon: '📤' },
            { label: isAr ? 'صافي الربح' : 'Net Profit', value: totalRevenue - totalExpensesAmount, color: (totalRevenue - totalExpensesAmount) >= 0 ? 'var(--pt-success)' : 'var(--pt-danger)', icon: '📊' },
            { label: isAr ? 'الاشتراكات' : 'Subscriptions', value: subscriptions.length, color: '#4FC3F7', icon: '📋', isCount: true },
            { label: isAr ? 'الأعضاء' : 'Members', value: members.length, color: '#7C4DFF', icon: '👥', isCount: true },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: `3px solid ${item.color}` }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                {item.icon} {item.label}
              </span>
              <span style={{ fontWeight: 800, color: item.color }}>
                {item.isCount ? item.value : `${item.value.toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
