'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

const DEMO_PAYMENTS = [
  { id: 'pay-001', tenantName: 'FitZone - مدينة نصر', planId: 'quarterly', amount: 1200, currency: 'EGP', status: 'confirmed', method: 'instapay', confirmedBy: 'Super Admin', createdAt: { toDate: () => new Date('2026-04-01') } },
  { id: 'pay-002', tenantName: 'Iron Gym - التجمع', planId: 'annual', amount: 3600, currency: 'EGP', status: 'confirmed', method: 'bank_transfer', confirmedBy: 'Super Admin', createdAt: { toDate: () => new Date('2025-11-01') } },
  { id: 'pay-003', tenantName: 'GR 7 - المعادي', planId: 'monthly', amount: 500, currency: 'EGP', status: 'pending', method: 'vodafone_cash', createdAt: { toDate: () => new Date('2026-04-04') } },
  { id: 'pay-004', tenantName: 'Flex Fitness', planId: 'semi_annual', amount: 2100, currency: 'EGP', status: 'pending', method: 'instapay', createdAt: { toDate: () => new Date('2026-04-03') } },
];

export default function PaymentsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [filter, setFilter] = useState('all');
  const [payments, setPayments] = useState(DEMO_PAYMENTS);

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const formatDate = (ts) => {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const planLabel = (plan) => {
    const p = PLAN_DEFINITIONS[plan];
    return p ? (p.name[locale] || p.name.ar) : plan;
  };

  const statusBadge = (status) => {
    const map = {
      pending: { cls: 'badge-warning', text: locale === 'ar' ? 'معلّق' : 'Pending' },
      confirmed: { cls: 'badge-success', text: locale === 'ar' ? 'مؤكّد' : 'Confirmed' },
      failed: { cls: 'badge-danger', text: locale === 'ar' ? 'فشل' : 'Failed' },
    };
    const s = map[status] || map.pending;
    return <span className={`badge ${s.cls}`}>{s.text}</span>;
  };

  const methodLabel = (method) => {
    const map = {
      cash: { ar: 'كاش', en: 'Cash' },
      bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
      vodafone_cash: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
      instapay: { ar: 'إنستاباي', en: 'InstaPay' },
    };
    return map[method]?.[locale] || method;
  };

  const handleConfirm = (paymentId) => {
    setPayments(prev => prev.map(p =>
      p.id === paymentId ? { ...p, status: 'confirmed', confirmedBy: 'Super Admin' } : p
    ));
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💰</span> {locale === 'ar' ? 'إدارة المدفوعات' : 'Manage Payments'}</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {[
          { key: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
          { key: 'pending', label: locale === 'ar' ? 'معلّق' : 'Pending' },
          { key: 'confirmed', label: locale === 'ar' ? 'مؤكّد' : 'Confirmed' },
        ].map(f => (
          <button
            key={f.key}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'العميل' : 'Client'}</th>
                <th>{locale === 'ar' ? 'الخطة' : 'Plan'}</th>
                <th>{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th>{locale === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.tenantName}</td>
                  <td><span className="badge badge-gold">{planLabel(p.planId)}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>
                    {p.amount?.toLocaleString()} {locale === 'ar' ? 'ج.م' : 'EGP'}
                  </td>
                  <td style={{ fontSize: 'var(--font-size-sm)' }}>{methodLabel(p.method)}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>{formatDate(p.createdAt)}</td>
                  <td>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(p.id)}>
                          ✓ {locale === 'ar' ? 'تأكيد' : 'Confirm'}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-danger)' }}>
                          ✕
                        </button>
                      </div>
                    )}
                    {p.status === 'confirmed' && (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                        ✓ {p.confirmedBy}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
