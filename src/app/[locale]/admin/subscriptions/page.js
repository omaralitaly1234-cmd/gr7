'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [subscriptions, setSubscriptions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFreezeModal, setShowFreezeModal] = useState(null);
  const [freezeReason, setFreezeReason] = useState('travel');

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data: subs } = await getTenantDocuments(tenantId, 'subscriptions', [],
        { field: 'createdAt', direction: 'desc' });
      const { data: mems } = await getTenantDocuments(tenantId, 'members');
      setSubscriptions(subs || []);
      setMembers(mems || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getMemberName = (memberId) => {
    const m = members.find(m => m.id === memberId);
    return m?.fullName?.[locale] || m?.fullName?.ar || '—';
  };

  const getMemberPhone = (memberId) => {
    const m = members.find(m => m.id === memberId);
    return m?.phone || '';
  };

  const getRemainingDays = (sub) => {
    if (!sub.endDate) return 0;
    const end = sub.endDate?.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
    return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const filtered = subscriptions.filter(s => {
    if (filterPlan !== 'all' && s.planSnapshot?.type !== filterPlan) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const statusCounts = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    frozen: subscriptions.filter(s => s.status === 'frozen').length,
  };

  const handleFreeze = async () => {
    if (!showFreezeModal || !tenantId) return;
    try {
      await updateTenantDocument(tenantId, 'subscriptions', showFreezeModal.id, {
        status: 'frozen',
        currentFreezeStart: Timestamp.fromDate(new Date()),
        freezeReason,
      });
      // Update member status
      if (showFreezeModal.memberId) {
        await updateTenantDocument(tenantId, 'members', showFreezeModal.memberId, { status: 'frozen' });
      }
      toast.success(isAr ? 'تم تجميد الاشتراك' : 'Subscription frozen');
      setShowFreezeModal(null);
      loadData();
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleUnfreeze = async (sub) => {
    if (!tenantId) return;
    try {
      const freezeStart = sub.currentFreezeStart?.toDate ? sub.currentFreezeStart.toDate() : new Date();
      const daysFrozen = Math.max(1, Math.ceil((new Date() - freezeStart) / (1000 * 60 * 60 * 24)));
      const oldEnd = sub.endDate?.toDate ? sub.endDate.toDate() : new Date();
      const newEnd = new Date(oldEnd);
      newEnd.setDate(newEnd.getDate() + daysFrozen);

      await updateTenantDocument(tenantId, 'subscriptions', sub.id, {
        status: 'active',
        currentFreezeStart: null,
        endDate: Timestamp.fromDate(newEnd),
        freezeDaysUsed: (sub.freezeDaysUsed || 0) + daysFrozen,
      });
      if (sub.memberId) {
        await updateTenantDocument(tenantId, 'members', sub.memberId, { status: 'active' });
      }
      toast.success(isAr ? `تم إلغاء التجميد — أُضيف ${daysFrozen} يوم` : `Unfrozen — ${daysFrozen} days added`);
      loadData();
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💳</span> {t('subscriptions.title')}</h1>
        <Link href={`/${locale}/admin/members/new`} className="btn btn-primary">+ {t('subscriptions.newSubscription')}</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">💳</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.total}</div>
            <div className="stat-label">{isAr ? 'إجمالي الاشتراكات' : 'Total'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.active}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.expired}</div>
            <div className="stat-label">{t('common.expired')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">❄️</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.frozen}</div>
            <div className="stat-label">{t('common.frozen')}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <select className="form-select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">{t('common.all')} — {isAr ? 'النوع' : 'Type'}</option>
          <option value="gold">🥇 {t('subscriptions.gold')}</option>
          <option value="diamond">💎 {t('subscriptions.diamond')}</option>
        </select>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">{t('common.all')} — {isAr ? 'الحالة' : 'Status'}</option>
          <option value="active">{t('common.active')}</option>
          <option value="expired">{t('common.expired')}</option>
          <option value="frozen">{t('common.frozen')}</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 {t('common.refresh')}</button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isAr ? 'العضو' : 'Member'}</th>
              <th>{t('subscriptions.plan')}</th>
              <th>{t('subscriptions.startDate')}</th>
              <th>{t('subscriptions.endDate')}</th>
              <th>{t('subscriptions.remainingDays')}</th>
              <th>{t('common.status')}</th>
              <th>{t('subscriptions.freezeDays')}</th>
              <th>{t('finance.amount')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>{t('common.noData')}
              </td></tr>
            ) : (
              filtered.map((sub, i) => {
                const remaining = getRemainingDays(sub);
                const planName = sub.planSnapshot?.name?.[locale] || sub.planId || '—';
                const planType = sub.planSnapshot?.type || 'gold';
                return (
                  <tr key={sub.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{getMemberName(sub.memberId)}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">{getMemberPhone(sub.memberId)}</div>
                    </td>
                    <td><span className={`badge ${planType === 'diamond' ? 'badge-diamond' : 'badge-gold'}`}>{planType === 'diamond' ? '💎' : '🥇'} {planName}</span></td>
                    <td>{sub.startDate?.toDate ? sub.startDate.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                    <td>{sub.endDate?.toDate ? sub.endDate.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: sub.status === 'frozen' ? 'var(--pt-frozen)' : remaining <= 7 ? 'var(--pt-danger)' : remaining <= 14 ? 'var(--pt-warning)' : 'var(--pt-success)',
                      }}>
                        {sub.status === 'frozen' ? (isAr ? 'مجمد' : 'Frozen') : `${remaining} ${isAr ? 'يوم' : 'days'}`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${sub.status === 'active' ? 'badge-success' : sub.status === 'frozen' ? 'badge-frozen' : 'badge-danger'}`}>
                        ● {t(`common.${sub.status}`)}
                      </span>
                    </td>
                    <td>
                      {sub.maxFreezeDays > 0 ? (
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>{sub.freezeDaysUsed || 0}/{sub.maxFreezeDays}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>
                      {(sub.amountPaid || 0).toLocaleString()} <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{t('common.egp')}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {sub.status === 'active' && sub.maxFreezeDays > 0 && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setShowFreezeModal(sub)} title={t('subscriptions.freeze')}>❄️</button>
                        )}
                        {sub.status === 'frozen' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleUnfreeze(sub)} title={t('subscriptions.unfreeze')} style={{ color: 'var(--pt-success)' }}>🔓</button>
                        )}
                        {sub.status === 'expired' && (
                          <Link href={`/${locale}/admin/members/new?renew=${sub.memberId}`} className="btn btn-ghost btn-sm" title={t('subscriptions.renew')} style={{ color: 'var(--pt-gold)' }}>🔄</Link>
                        )}
                        <Link href={`/${locale}/admin/members/${sub.memberId}`} className="btn btn-ghost btn-sm" title={t('common.details')}>👁️</Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-4)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
        {isAr ? `عرض ${filtered.length} من ${subscriptions.length} اشتراك` : `Showing ${filtered.length} of ${subscriptions.length} subscriptions`}
      </div>

      {/* Freeze Modal */}
      {showFreezeModal && (
        <div className="modal-overlay" onClick={() => setShowFreezeModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>❄️ {t('subscriptions.freeze')}</h2>
              <button onClick={() => setShowFreezeModal(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-3)' }}>
                <strong>{getMemberName(showFreezeModal.memberId)}</strong> — {showFreezeModal.planSnapshot?.name?.[locale]}
              </p>
              <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                {isAr ? `المتاح: ${(showFreezeModal.maxFreezeDays || 14) - (showFreezeModal.freezeDaysUsed || 0)} يوم` : `Available: ${(showFreezeModal.maxFreezeDays || 14) - (showFreezeModal.freezeDaysUsed || 0)} days`}
              </p>
              <div className="form-group">
                <label className="form-label">{t('subscriptions.freezeReason')}</label>
                <select className="form-select" value={freezeReason} onChange={e => setFreezeReason(e.target.value)}>
                  <option value="travel">{isAr ? 'سفر' : 'Travel'}</option>
                  <option value="illness">{isAr ? 'مرض' : 'Illness'}</option>
                  <option value="personal">{isAr ? 'ظروف شخصية' : 'Personal Reasons'}</option>
                  <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFreezeModal(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleFreeze}>❄️ {t('subscriptions.freeze')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
