'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerEarningsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const earnings = {
    thisMonth: 4500,
    lastMonth: 3900,
    pending: 1200,
    totalYear: 38000,
    commissionRate: 15,
    breakdown: [
      { client: 'أحمد محمد سعيد', plan: locale === 'ar' ? 'ذهبي ربع سنوي' : 'Gold Quarterly', planPrice: 2400, commission: 360, date: '2026-03-01' },
      { client: 'عمر حسام الدين', plan: locale === 'ar' ? 'ماسي سنوي' : 'Diamond Annual', planPrice: 12000, commission: 1800, date: '2026-03-15' },
      { client: 'نور أحمد', plan: locale === 'ar' ? 'ذهبي شهري' : 'Gold Monthly', planPrice: 900, commission: 135, date: '2026-03-05' },
      { client: 'سارة علي حسن', plan: locale === 'ar' ? 'ماسي ربع سنوي' : 'Diamond Quarterly', planPrice: 4500, commission: 675, date: '2026-03-10' },
      { client: 'محمد صلاح', plan: locale === 'ar' ? 'حصة خاصة (8 حصص)' : 'Private (8 sessions)', planPrice: 2400, commission: 720, date: '2026-03-20' },
    ],
    monthlyHistory: [
      { month: locale === 'ar' ? 'يناير' : 'Jan', amount: 3200 },
      { month: locale === 'ar' ? 'فبراير' : 'Feb', amount: 3900 },
      { month: locale === 'ar' ? 'مارس' : 'Mar', amount: 4500 },
    ],
  };

  const changePercent = Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💰</span> {t('trainer.earnings')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--pt-gold)' }}>
          <div className="stat-icon gold">💰</div>
          <div className="stat-info">
            <div className="stat-value">{earnings.thisMonth.toLocaleString()}</div>
            <div className="stat-label">{locale === 'ar' ? 'أرباح هذا الشهر' : 'This Month'} ({t('common.egp')})</div>
            <span className={`stat-change ${changePercent > 0 ? 'up' : 'down'}`}>↑ {changePercent}%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📅</div>
          <div className="stat-info">
            <div className="stat-value">{earnings.lastMonth.toLocaleString()}</div>
            <div className="stat-label">{locale === 'ar' ? 'الشهر السابق' : 'Last Month'} ({t('common.egp')})</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{earnings.pending.toLocaleString()}</div>
            <div className="stat-label">{locale === 'ar' ? 'قيد التحصيل' : 'Pending'} ({t('common.egp')})</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📊</div>
          <div className="stat-info">
            <div className="stat-value">{earnings.commissionRate}%</div>
            <div className="stat-label">{locale === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Monthly Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>📈 {locale === 'ar' ? 'الأرباح الشهرية' : 'Monthly Earnings'}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', height: 150 }}>
            {earnings.monthlyHistory.map((m, i) => {
              const max = Math.max(...earnings.monthlyHistory.map(x => x.amount));
              const h = (m.amount / max) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--pt-gold)' }}>{m.amount.toLocaleString()}</span>
                  <div style={{ width: '100%', maxWidth: 60, height: `${h}%`, background: i === earnings.monthlyHistory.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.25)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'height 0.5s' }} />
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year Total */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🏆</div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-gold)', marginBottom: 'var(--space-1)' }}>
            {earnings.totalYear.toLocaleString()} {t('common.egp')}
          </div>
          <div style={{ color: 'var(--pt-gray-400)' }}>{locale === 'ar' ? 'إجمالي أرباح السنة' : "Year's Total Earnings"}</div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-5)' }}>📋 {locale === 'ar' ? 'تفاصيل العمولات' : 'Commission Details'}</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{locale === 'ar' ? 'العميل' : 'Client'}</th>
                <th>{locale === 'ar' ? 'الاشتراك' : 'Subscription'}</th>
                <th>{locale === 'ar' ? 'سعر الاشتراك' : 'Plan Price'}</th>
                <th>{locale === 'ar' ? 'العمولة' : 'Commission'} ({earnings.commissionRate}%)</th>
                <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {earnings.breakdown.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.client}</td>
                  <td>{item.plan}</td>
                  <td>{item.planPrice.toLocaleString()} {t('common.egp')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{item.commission.toLocaleString()} {t('common.egp')}</td>
                  <td style={{ color: 'var(--pt-gray-400)' }}>{item.date}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--glass-border)' }}>
                <td colSpan="4" style={{ fontWeight: 700, textAlign: locale === 'ar' ? 'left' : 'right' }}>{locale === 'ar' ? 'الإجمالي' : 'Total'}</td>
                <td style={{ fontWeight: 900, color: 'var(--pt-gold)', fontSize: 'var(--font-size-lg)' }}>{earnings.breakdown.reduce((s, i) => s + i.commission, 0).toLocaleString()} {t('common.egp')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
