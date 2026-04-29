'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientSubscriptionPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const sub = {
    plan: locale === 'ar' ? 'ذهبي - ربع سنوي' : 'Gold - Quarterly',
    planType: 'gold',
    price: 2400,
    startDate: '2026-02-01',
    endDate: '2026-05-01',
    remaining: 39,
    totalDays: 90,
    status: 'active',
    paymentMethod: locale === 'ar' ? 'كاش' : 'Cash',
    memberId: 'PT-2026-0001',
    freeze: { used: 0, max: 7, history: [] },
    guests: { used: 0, max: 1 },
    features: [
      locale === 'ar' ? 'صالة الجيم (جميع الأجهزة)' : 'Full Gym Access',
      locale === 'ar' ? 'دش + لوكر' : 'Shower + Locker',
      locale === 'ar' ? 'مدرب خاص' : 'Personal Trainer',
      locale === 'ar' ? 'خطة غذائية' : 'Diet Plan',
      locale === 'ar' ? 'برنامج تدريب شخصي' : 'Custom Training Program',
    ],
    history: [
      { plan: locale === 'ar' ? 'ذهبي - شهري' : 'Gold - Monthly', start: '2025-12-01', end: '2026-01-01', price: 900, status: 'completed' },
      { plan: locale === 'ar' ? 'ذهبي - شهري' : 'Gold - Monthly', start: '2026-01-01', end: '2026-02-01', price: 900, status: 'completed' },
      { plan: locale === 'ar' ? 'ذهبي - ربع سنوي' : 'Gold - Quarterly', start: '2026-02-01', end: '2026-05-01', price: 2400, status: 'active' },
    ],
  };

  const progress = Math.round(((sub.totalDays - sub.remaining) / sub.totalDays) * 100);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💳</span> {t('client.mySubscription')}</h1>
      </div>

      {/* Active Plan */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, insetInlineEnd: 16 }}>
          <span className="badge badge-success" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-3)' }}>✓ {t('common.active')}</span>
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>#{sub.memberId}</div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--pt-gold)' }}>💛 {sub.plan}</h2>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginTop: 'var(--space-1)' }}>{sub.price.toLocaleString()} {t('common.egp')}</div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: sub.remaining <= 7 ? 'var(--pt-danger)' : 'var(--pt-gold)' }}>{sub.remaining}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'يوم متبقي' : 'Days Left'}</div>
          </div>
          <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>{sub.totalDays}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'إجمالي الأيام' : 'Total Days'}</div>
          </div>
          <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>❄️ {sub.freeze.used}/{sub.freeze.max}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'تجميد' : 'Freeze'}</div>
          </div>
          <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>👥 {sub.guests.used}/{sub.guests.max}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'ضيوف' : 'Guests'}</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>
            <span>{sub.startDate}</span>
            <span>{progress}%</span>
            <span>{sub.endDate}</span>
          </div>
          <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: progress > 80 ? 'var(--pt-danger)' : 'var(--pt-gold)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">🔄 {locale === 'ar' ? 'تجديد الاشتراك' : 'Renew'}</button>
          <button className="btn btn-outline">❄️ {locale === 'ar' ? 'تجميد' : 'Freeze'}</button>
          <button className="btn btn-outline">👥 {locale === 'ar' ? 'دعوة ضيف' : 'Invite Guest'}</button>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Features */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>✨ {locale === 'ar' ? 'مميزات اشتراكك' : 'Your Features'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {sub.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--pt-success)' }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 {locale === 'ar' ? 'سجل الاشتراكات' : 'History'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {sub.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: `3px solid ${h.status === 'active' ? 'var(--pt-gold)' : 'var(--pt-gray-700)'}` }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{h.plan}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{h.start} → {h.end}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{h.price.toLocaleString()} {t('common.egp')}</div>
                  <span className={`badge ${h.status === 'active' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                    {h.status === 'active' ? (locale === 'ar' ? 'حالي' : 'Current') : (locale === 'ar' ? 'مكتمل' : 'Completed')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
