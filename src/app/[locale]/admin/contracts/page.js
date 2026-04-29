'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminContractsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [filter, setFilter] = useState('all');

  const stats = [
    { v: 186, l: locale === 'ar' ? 'عقود نشطة' : 'Active Contracts', icon: '📄', color: 'var(--pt-success)' },
    { v: 12, l: locale === 'ar' ? 'تنتهي هذا الشهر' : 'Expiring This Month', icon: '⏰', color: '#FF9100' },
    { v: 5, l: locale === 'ar' ? 'بحاجة تجديد' : 'Pending Renewal', icon: '🔄', color: '#4FC3F7' },
    { v: '98%', l: locale === 'ar' ? 'نسبة التوقيع الرقمي' : 'Digital Sign Rate', icon: '✍️', color: 'var(--pt-gold)' },
  ];

  const contracts = [
    { member: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', avatar: 'أ', type: locale === 'ar' ? 'اشتراك سنوي VIP' : 'Annual VIP', startDate: '2025-11-01', endDate: '2026-10-31', status: 'active', value: '12,000', signed: true, autoRenew: true },
    { member: locale === 'ar' ? 'سارة علي' : 'Sara A.', avatar: 'س', type: locale === 'ar' ? 'اشتراك 6 شهور + PT' : '6-Month + PT', startDate: '2026-01-15', endDate: '2026-07-14', status: 'active', value: '8,500', signed: true, autoRenew: false },
    { member: locale === 'ar' ? 'خالد أحمد' : 'Khaled A.', avatar: 'خ', type: locale === 'ar' ? 'اشتراك شهري' : 'Monthly', startDate: '2026-03-01', endDate: '2026-03-31', status: 'expiring', value: '800', signed: true, autoRenew: true },
    { member: locale === 'ar' ? 'نور أحمد' : 'Nour A.', avatar: 'ن', type: locale === 'ar' ? 'اشتراك 3 شهور' : '3-Month', startDate: '2026-01-01', endDate: '2026-03-31', status: 'expiring', value: '2,100', signed: false, autoRenew: false },
    { member: locale === 'ar' ? 'عمر حسام' : 'Omar H.', avatar: 'ع', type: locale === 'ar' ? 'اشتراك سنوي' : 'Annual', startDate: '2025-06-01', endDate: '2026-05-31', status: 'active', value: '9,600', signed: true, autoRenew: true },
    { member: locale === 'ar' ? 'مريم حسن' : 'Maryam H.', avatar: 'م', type: locale === 'ar' ? 'اشتراك 3 شهور نسائي' : '3-Month Women', startDate: '2025-12-01', endDate: '2026-02-28', status: 'expired', value: '2,400', signed: true, autoRenew: false },
  ];

  const statusConfig = {
    active: { color: '#00C853', label: locale === 'ar' ? '✅ نشط' : '✅ Active' },
    expiring: { color: '#FF9100', label: locale === 'ar' ? '⏰ ينتهي قريباً' : '⏰ Expiring' },
    expired: { color: '#FF5252', label: locale === 'ar' ? '❌ منتهي' : '❌ Expired' },
  };

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {locale === 'ar' ? 'العقود والاتفاقيات' : 'Contracts & Agreements'}</h1>
        <button className="btn btn-primary">+ {locale === 'ar' ? 'عقد جديد' : 'New Contract'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
          { id: 'active', label: locale === 'ar' ? 'نشط' : 'Active' },
          { id: 'expiring', label: locale === 'ar' ? 'ينتهي' : 'Expiring' },
          { id: 'expired', label: locale === 'ar' ? 'منتهي' : 'Expired' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`btn ${filter === f.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{f.label}</button>
        ))}
      </div>

      {/* Contracts Table */}
      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
              <th style={{ padding: 'var(--space-2)', textAlign: locale === 'ar' ? 'right' : 'left', fontWeight: 700 }}>{locale === 'ar' ? 'العضو' : 'Member'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'نوع العقد' : 'Plan'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{locale === 'ar' ? 'من' : 'Start'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{locale === 'ar' ? 'إلى' : 'End'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{locale === 'ar' ? 'القيمة' : 'Value'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{locale === 'ar' ? 'توقيع' : 'Signed'}</th>
              <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{locale === 'ar' ? 'تجديد تلقائي' : 'Auto'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', opacity: c.status === 'expired' ? 0.6 : 1 }}>
                <td style={{ padding: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>{c.avatar}</div>
                  <span style={{ fontWeight: 600 }}>{c.member}</span>
                </td>
                <td style={{ padding: 'var(--space-2)' }}>{c.type}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>{c.startDate}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>{c.endDate}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontWeight: 700, color: 'var(--pt-gold)' }}>{c.value} {locale === 'ar' ? 'ج.م' : 'EGP'}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${statusConfig[c.status].color}15`, color: statusConfig[c.status].color, fontWeight: 700, fontSize: '10px' }}>{statusConfig[c.status].label}</span>
                </td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontSize: '1rem' }}>{c.signed ? '✅' : '⏳'}</td>
                <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontSize: '1rem' }}>{c.autoRenew ? '🔄' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
