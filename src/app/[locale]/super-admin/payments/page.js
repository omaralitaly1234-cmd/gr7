'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const [filter, setFilter] = useState('all');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await getDocuments('payments', [], { field: 'createdAt', direction: 'desc' });
      if (error) console.error('[Payments] Load error:', error);
      setPayments(data || []);
    } catch (err) {
      console.error('[Payments] Error:', err);
    }
    setLoading(false);
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const formatDate = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts?.seconds ? ts.seconds * 1000 : ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  const planLabel = (plan) => {
    const p = PLAN_DEFINITIONS[plan];
    return p ? (p.name?.[locale] || p.name?.ar || plan) : plan || '—';
  };

  const statusBadge = (status) => {
    const map = {
      pending: { cls: 'badge-warning', text: isAr ? 'معلّق' : 'Pending' },
      confirmed: { cls: 'badge-success', text: isAr ? 'مؤكّد' : 'Confirmed' },
      failed: { cls: 'badge-danger', text: isAr ? 'فشل' : 'Failed' },
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
    return map[method]?.[locale] || method || '—';
  };

  const handleConfirm = async (paymentId) => {
    try {
      const { error } = await updateDocument('payments', paymentId, { status: 'confirmed', confirmedBy: 'Super Admin' });
      if (error) throw new Error(error);
      toast.success(isAr ? 'تم تأكيد الدفع' : 'Payment confirmed');
      loadPayments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (paymentId) => {
    try {
      const { error } = await updateDocument('payments', paymentId, { status: 'failed' });
      if (error) throw new Error(error);
      toast.success(isAr ? 'تم رفض الدفع' : 'Payment rejected');
      loadPayments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💰</span> {isAr ? 'إدارة المدفوعات' : 'Manage Payments'}</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {[
          { key: 'all', label: isAr ? 'الكل' : 'All' },
          { key: 'pending', label: isAr ? 'معلّق' : 'Pending' },
          { key: 'confirmed', label: isAr ? 'مؤكّد' : 'Confirmed' },
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>💰</div>
          <h3>{isAr ? 'لا توجد مدفوعات بعد' : 'No payments yet'}</h3>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'العميل' : 'Client'}</th>
                  <th>{isAr ? 'الخطة' : 'Plan'}</th>
                  <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th>{isAr ? 'طريقة الدفع' : 'Method'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                  <th>{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.tenantName || p.tenantId || '—'}</td>
                    <td><span className="badge badge-gold">{planLabel(p.planId)}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>
                      {p.amount?.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>{methodLabel(p.method)}</td>
                    <td>{statusBadge(p.status)}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>{formatDate(p.createdAt)}</td>
                    <td>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(p.id)}>
                            ✓ {isAr ? 'تأكيد' : 'Confirm'}
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-danger)' }} onClick={() => handleReject(p.id)}>
                            ✕
                          </button>
                        </div>
                      )}
                      {p.status === 'confirmed' && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                          ✓ {p.confirmedBy || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
