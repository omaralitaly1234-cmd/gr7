'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, getTenantCollectionCount } from '@/lib/firebase/firestore';
import { nextInvoiceNumber } from '@/lib/firebase/invoices';
import { applyPaymentToMemberBalance } from '@/lib/firebase/balance';
import { logAuditClient } from '@/lib/firebase/audit';
import MemberPicker from '@/components/MemberPicker';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState({ method: 'all', period: 'all' });
  const [stats, setStats] = useState({ today: 0, month: 0, total: 0 });

  // New payment form
  const [payForm, setPayForm] = useState({
    memberId: '', member: null, type: 'subscription', amount: '', discount: 0, method: 'cash', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'payments', [],
        { field: 'createdAt', direction: 'desc' }, 100);
      setPayments(data || []);

      // Members are chosen with a search picker now — loading the whole
      // collection here was ~6 MB per page view at 5k members.

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let todayRev = 0, monthRev = 0, totalRev = 0;
      (data || []).forEach(p => {
        const amount = p.netAmount || p.amount || 0;
        totalRev += amount;
        const date = p.createdAt?.toDate ? p.createdAt.toDate() : null;
        if (date && date >= todayStart) todayRev += amount;
        if (date && date >= monthStart) monthRev += amount;
      });
      setStats({ today: todayRev, month: monthRev, total: totalRev });
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
    setLoading(false);
  };

  const filteredPayments = payments.filter(p => {
    if (filter.method !== 'all' && p.method !== filter.method) return false;
    if (filter.period !== 'all') {
      const date = p.createdAt?.toDate ? p.createdAt.toDate() : null;
      if (!date) return false;
      const now = new Date();
      if (filter.period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (date < start) return false;
      } else if (filter.period === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        if (date < start) return false;
      } else if (filter.period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        if (date < start) return false;
      }
    }
    return true;
  });

  const handleSubmitPayment = async () => {
    if (!tenantId || !payForm.memberId || !payForm.amount) return;
    setSaving(true);

    const member = payForm.member;
    const net = Number(payForm.amount) - Number(payForm.discount);

    try {
      const { id: payId } = await addTenantDocument(tenantId, 'payments', {
        memberId: payForm.memberId,
        memberName: member?.fullName?.[locale] || member?.fullName?.ar || '',
        type: payForm.type,
        amount: Number(payForm.amount),
        discount: Number(payForm.discount),
        netAmount: net,
        method: payForm.method,
        status: 'completed',
        notes: payForm.notes,
        receivedBy: 'admin',
        invoiceNumber: await nextInvoiceNumber(tenantId),
      });

      // If this member owes money, apply the payment to their outstanding
      // balance and tick off any instalments it covers.
      if (payForm.type === 'installment' || (member?.balanceDue || 0) > 0) {
        await applyPaymentToMemberBalance(tenantId, payForm.memberId, net);
      }

      logAuditClient({ action: 'create', entity: 'payment', entityId: payId, tenantId, details: { description: { en: `Recorded ${payForm.type} payment`, ar: `تسجيل دفعة ${payForm.type}` }, after: { amount: net, method: payForm.method } } });
      toast.success(t('finance.paymentRecorded'));
      setShowNewPayment(false);
      setPayForm({ memberId: '', member: null, type: 'subscription', amount: '', discount: 0, method: 'cash', notes: '' });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    }
    setSaving(false);
  };

  const methodIcons = { cash: '💵', visa: '💳', bank_transfer: '🏦', online: '🌐' };
  const typeLabels = {
    subscription: isAr ? 'اشتراك' : 'Subscription',
    installment: isAr ? 'قسط' : 'Instalment',
    spa: isAr ? 'سبا' : 'Spa',
    personal_training: isAr ? 'تدريب خاص' : 'Personal Training',
    product: isAr ? 'منتج' : 'Product',
    other: isAr ? 'أخرى' : 'Other',
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💰</span> {t('sidebar.payments')}</h1>
        <button className="btn btn-primary" onClick={() => setShowNewPayment(true)}>
          + {t('dashboard.recordPayment')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">💰</div>
          <div className="stat-info">
            <div className="stat-value">{stats.today.toLocaleString()}</div>
            <div className="stat-label">{t('finance.todayRevenue')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">📊</div>
          <div className="stat-info">
            <div className="stat-value">{stats.month.toLocaleString()}</div>
            <div className="stat-label">{t('finance.monthlyRevenue')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">🏆</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total.toLocaleString()}</div>
            <div className="stat-label">{t('finance.totalRevenue')}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 'auto' }} value={filter.method}
          onChange={e => setFilter(f => ({ ...f, method: e.target.value }))}>
          <option value="all">{t('common.all')} — {t('finance.paymentMethod')}</option>
          <option value="cash">{t('finance.cash')} 💵</option>
          <option value="visa">{t('finance.visa')} 💳</option>
          <option value="bank_transfer">{t('finance.bankTransfer')} 🏦</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filter.period}
          onChange={e => setFilter(f => ({ ...f, period: e.target.value }))}>
          <option value="all">{t('common.all')} — {isAr ? 'الفترة' : 'Period'}</option>
          <option value="today">{t('common.today')}</option>
          <option value="week">{t('common.thisWeek')}</option>
          <option value="month">{t('common.thisMonth')}</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('members.fullName')}</th>
              <th>{t('finance.paymentType')}</th>
              <th>{t('finance.amount')}</th>
              <th>{t('finance.discount')}</th>
              <th>{t('finance.netAmount')}</th>
              <th>{t('finance.paymentMethod')}</th>
              <th>{t('common.date')}</th>
              <th>{t('finance.invoiceNumber')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filteredPayments.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>
                {t('common.noData')}
              </td></tr>
            ) : (
              filteredPayments.map((pay, idx) => (
                <tr key={pay.id}>
                  <td style={{ color: 'var(--pt-gray-500)' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{pay.memberName || '-'}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '11px' }}>{typeLabels[pay.type] || pay.type}</span></td>
                  <td>{(pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                  <td style={{ color: pay.discount ? 'var(--pt-success)' : 'var(--pt-gray-600)' }}>
                    {pay.discount ? `-${pay.discount.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>
                    {(pay.netAmount || pay.amount || 0).toLocaleString()} {t('common.egp')}
                  </td>
                  <td>{methodIcons[pay.method]} {t(`finance.${pay.method === 'bank_transfer' ? 'bankTransfer' : pay.method}`)}</td>
                  <td>{pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                  <td><code style={{ fontSize: '11px', color: 'var(--pt-gray-400)' }}>{pay.invoiceNumber || '-'}</code></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-4)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
        {isAr ? `عرض ${filteredPayments.length} من ${payments.length} عملية` : `Showing ${filteredPayments.length} of ${payments.length} payments`}
      </div>

      {/* New Payment Modal */}
      {showNewPayment && (
        <div className="modal-overlay" onClick={() => setShowNewPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>💰 {t('dashboard.recordPayment')}</h2>
              <button onClick={() => setShowNewPayment(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('subscriptions.selectMember')} *</label>
                <MemberPicker
                  tenantId={tenantId}
                  value={payForm.memberId}
                  isAr={isAr}
                  onChange={(id, member) => setPayForm(f => ({
                    ...f,
                    memberId: id,
                    member,
                    // Default the amount to what they owe, so settling a
                    // balance is one click.
                    amount: member?.balanceDue > 0 ? String(member.balanceDue) : f.amount,
                    type: member?.balanceDue > 0 ? 'installment' : f.type,
                  }))}
                />
                {payForm.member?.balanceDue > 0 && (
                  <div style={{
                    marginTop: 'var(--space-2)', padding: '8px 12px',
                    background: 'rgba(255,145,0,0.1)', border: '1px solid rgba(255,145,0,0.3)',
                    borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
                    color: 'var(--pt-warning)', fontWeight: 700,
                  }}>
                    ⚠️ {isAr ? 'متبقي على هذا العضو' : 'Outstanding balance'}: {payForm.member.balanceDue.toLocaleString()} {t('common.egp')}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('finance.paymentType')}</label>
                  <select className="form-select" value={payForm.type}
                    onChange={e => setPayForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.keys(typeLabels).map(k => (
                      <option key={k} value={k}>{typeLabels[k]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('finance.paymentMethod')}</label>
                  <select className="form-select" value={payForm.method}
                    onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                    <option value="cash">{t('finance.cash')} 💵</option>
                    <option value="visa">{t('finance.visa')} 💳</option>
                    <option value="bank_transfer">{t('finance.bankTransfer')} 🏦</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('finance.amount')} ({t('common.egp')}) *</label>
                  <input className="form-input" type="number" dir="ltr" value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('finance.discount')} ({t('common.egp')})</label>
                  <input className="form-input" type="number" dir="ltr" value={payForm.discount}
                    onChange={e => setPayForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" />
                </div>
              </div>
              {payForm.amount && (
                <div style={{
                  background: 'var(--pt-gold-glow)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--pt-gold)',
                }}>
                  <span>{t('finance.netAmount')}</span>
                  <span>{(Number(payForm.amount) - Number(payForm.discount)).toLocaleString()} {t('common.egp')}</span>
                </div>
              )}
              <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                <label className="form-label">{t('common.notes')}</label>
                <textarea className="form-input" value={payForm.notes} rows={2}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewPayment(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmitPayment}
                disabled={saving || !payForm.memberId || !payForm.amount}>
                {saving ? '⏳' : '✅'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
