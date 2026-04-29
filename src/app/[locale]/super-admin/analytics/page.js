'use client';

import { useParams } from 'next/navigation';

export default function SuperAdminAnalytics() {
  const params = useParams();
  const locale = params?.locale || 'ar';

  const monthlyData = [
    { month: locale === 'ar' ? 'يناير' : 'Jan', tenants: 1, revenue: 0 },
    { month: locale === 'ar' ? 'فبراير' : 'Feb', tenants: 2, revenue: 500 },
    { month: locale === 'ar' ? 'مارس' : 'Mar', tenants: 4, revenue: 1700 },
    { month: locale === 'ar' ? 'أبريل' : 'Apr', tenants: 5, revenue: 4800 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const maxTenants = Math.max(...monthlyData.map(d => d.tenants), 1);

  const metrics = [
    { label: locale === 'ar' ? 'معدل التحويل من تجريبي' : 'Trial Conversion Rate', value: '40%', icon: '🔄', color: 'var(--pt-success)' },
    { label: locale === 'ar' ? 'معدل البقاء' : 'Retention Rate', value: '85%', icon: '📊', color: 'var(--pt-info)' },
    { label: locale === 'ar' ? 'متوسط قيمة العميل' : 'Avg Customer Value', value: '2,400 EGP', icon: '💎', color: 'var(--pt-gold)' },
    { label: locale === 'ar' ? 'وقت التفعيل' : 'Time to Activation', value: '2.5 days', icon: '⚡', color: 'var(--pt-warning)' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📈</span> {locale === 'ar' ? 'تحليلات المنصة' : 'Platform Analytics'}</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {metrics.map((m, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${m.color}15` }}>{m.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: m.color }}>{m.value}</div>
              <div className="stat-label">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Revenue Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
            💰 {locale === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 200, paddingBottom: 'var(--space-4)' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)', fontWeight: 600 }}>
                  {d.revenue > 0 ? d.revenue.toLocaleString() : ''}
                </span>
                <div style={{
                  width: '100%',
                  maxWidth: 50,
                  height: `${Math.max((d.revenue / maxRevenue) * 150, 4)}px`,
                  background: 'linear-gradient(180deg, var(--pt-gold), var(--pt-gold-dim))',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 0.5s ease',
                }} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
            📊 {locale === 'ar' ? 'نمو العملاء' : 'Client Growth'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 200, paddingBottom: 'var(--space-4)' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-info)', fontWeight: 600 }}>
                  {d.tenants}
                </span>
                <div style={{
                  width: '100%',
                  maxWidth: 50,
                  height: `${Math.max((d.tenants / maxTenants) * 150, 4)}px`,
                  background: 'linear-gradient(180deg, var(--pt-info), #0077B6)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 0.5s ease',
                }} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
          📋 {locale === 'ar' ? 'توزيع الخطط' : 'Plan Distribution'}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[
            { label: locale === 'ar' ? 'تجريبية' : 'Trial', count: 2, pct: 40, color: 'var(--pt-info)' },
            { label: locale === 'ar' ? 'ربع سنوية' : 'Quarterly', count: 1, pct: 20, color: 'var(--pt-gold)' },
            { label: locale === 'ar' ? 'سنوية' : 'Annual', count: 1, pct: 20, color: 'var(--pt-success)' },
            { label: locale === 'ar' ? 'منتهية' : 'Expired', count: 1, pct: 20, color: 'var(--pt-danger)' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, minWidth: 150 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>{item.count} ({item.pct}%)</span>
              </div>
              <div style={{ height: 8, background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
