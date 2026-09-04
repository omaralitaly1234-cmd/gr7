'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, updateTenantDocument, getTenantDocumentsByIds, getTenantCollectionCount } from '@/lib/firebase/firestore';
import { logAuditClient } from '@/lib/firebase/audit';
import { computeFreeze } from '@/lib/subscription-math';
import {
  buildExpiredRows, EXPIRED_EXPORT_WIDTHS, expiredExportFileName,
} from '@/lib/expired-export';
import { downloadXlsx } from '@/lib/xlsx-download';
import { useTenant } from '@/context/TenantContext';
import RenewSubscriptionModal from '@/components/RenewSubscriptionModal';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

// yyyy-mm-dd ⇄ Date — the <input type="date"> uses the ISO form.
const toDateInput = (d) => {
  if (!d) return '';
  const dt = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d));
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const fromDateInput = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

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
  const [statusCounts, setStatusCounts] = useState({ total: 0, active: 0, expired: 0, frozen: 0 });
  const [showFreezeModal, setShowFreezeModal] = useState(null);
  const [freezeReason, setFreezeReason] = useState('travel');
  const [freezeDays, setFreezeDays] = useState(7);
  const [renewSub, setRenewSub] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Manual date editor: after a subscription is written, the desk sometimes
  // needs to correct the recorded start (typo, wrong day) — the end date
  // shifts by the same delta by default, and can be overridden too.
  const [editDatesSub, setEditDatesSub] = useState(null);
  const [editStartInput, setEditStartInput] = useState('');
  const [editEndInput, setEditEndInput] = useState('');
  const [savingDates, setSavingDates] = useState(false);

  const PAGE_SIZE = 50;
  // The table shows one page; the export covers every expired subscription.
  // The cap is a guard against a runaway read on a gym with years of history —
  // if it ever bites, the admin is told rather than silently handed a short file.
  const EXPORT_LIMIT = 5000;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, filterStatus]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Only the newest page of subscriptions, and only the members those rows
      // reference — this used to pull both collections in full (~10 MB at 5k
      // members) to render one screen.
      const filters = filterStatus !== 'all'
        ? [{ field: 'status', operator: '==', value: filterStatus }]
        : [];
      const { data: subs } = await getTenantDocuments(tenantId, 'subscriptions', filters,
        { field: 'createdAt', direction: 'desc' }, PAGE_SIZE);
      const rows = subs || [];
      setSubscriptions(rows);

      const memberMap = await getTenantDocumentsByIds(tenantId, 'members', rows.map(s => s.memberId));
      setMembers([...memberMap.values()]);

      const [total, active, expired, frozen] = await Promise.all([
        getTenantCollectionCount(tenantId, 'subscriptions'),
        getTenantCollectionCount(tenantId, 'subscriptions', [{ field: 'status', operator: '==', value: 'active' }]),
        getTenantCollectionCount(tenantId, 'subscriptions', [{ field: 'status', operator: '==', value: 'expired' }]),
        getTenantCollectionCount(tenantId, 'subscriptions', [{ field: 'status', operator: '==', value: 'frozen' }]),
      ]);
      setStatusCounts({
        total: total.count || 0,
        active: active.count || 0,
        expired: expired.count || 0,
        frozen: frozen.count || 0,
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  /**
   * Download every expired subscription as a real .xlsx file.
   *
   * Deliberately re-queries instead of exporting what is on screen: the table
   * only ever holds one page, and the point of the file is the whole backlog to
   * chase for renewals.
   */
  const exportExpired = async () => {
    if (!tenantId || exporting) return;
    setExporting(true);
    const toastId = toast.loading(isAr ? 'جاري تجهيز الملف…' : 'Preparing the file…');
    try {
      const filters = [{ field: 'status', operator: '==', value: 'expired' }];

      // Newest expiries first — those are the ones still worth calling. Falls
      // back to the ascending index (which is the one deployed today) if the
      // descending composite index has not been created yet.
      let { data: subs, error } = await getTenantDocuments(
        tenantId, 'subscriptions', filters, { field: 'endDate', direction: 'desc' }, EXPORT_LIMIT);
      if (error) {
        console.warn('[Subscriptions] endDate desc export failed, retrying ascending:', error);
        const asc = await getTenantDocuments(
          tenantId, 'subscriptions', filters, { field: 'endDate', direction: 'asc' }, EXPORT_LIMIT);
        if (asc.error) throw new Error(asc.error);
        subs = (asc.data || []).slice().reverse();
      }

      const rowsData = subs || [];
      if (rowsData.length === 0) {
        toast.error(isAr ? 'مفيش اشتراكات منتهية' : 'No expired subscriptions', { id: toastId });
        setExporting(false);
        return;
      }

      const memberMap = await getTenantDocumentsByIds(
        tenantId, 'members', rowsData.map(s => s.memberId));

      await downloadXlsx(
        buildExpiredRows(rowsData, memberMap, { locale }),
        expiredExportFileName(new Date(), locale),
        {
          sheetName: isAr ? 'الاشتراكات المنتهية' : 'Expired subscriptions',
          widths: EXPIRED_EXPORT_WIDTHS,
          rtl: isAr,
        },
      );

      const truncated = rowsData.length >= EXPORT_LIMIT;
      toast.success(
        truncated
          ? (isAr
            ? `تم تنزيل أول ${EXPORT_LIMIT} اشتراك (الأحدث انتهاءً)`
            : `Downloaded the ${EXPORT_LIMIT} most recently expired`)
          : (isAr ? `تم تنزيل ${rowsData.length} اشتراك ✅` : `Downloaded ${rowsData.length} subscriptions ✅`),
        { id: toastId },
      );
    } catch (err) {
      console.error('[Subscriptions] export failed:', err);
      toast.error(isAr ? 'تعذّر تجهيز الملف' : 'Could not build the file', { id: toastId });
    }
    setExporting(false);
  };

  // O(1) member lookups (was members.find per row → O(n²) across the table)
  const membersById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  const getMemberName = (memberId) => {
    const m = membersById.get(memberId);
    return m?.fullName?.[locale] || m?.fullName?.ar || '—';
  };

  const getMemberPhone = (memberId) => membersById.get(memberId)?.phone || '';

  const getRemainingDays = (sub) => {
    if (!sub.endDate) return 0;
    const end = sub.endDate?.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
    return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
  };

  // Status is filtered server-side; plan type is a cheap in-page refinement.
  const filtered = subscriptions.filter(s => {
    if (filterPlan !== 'all' && s.planSnapshot?.type !== filterPlan) return false;
    return true;
  });

  // Freeze extends the end date UP-FRONT by N days (consistent with the member
  // and member-detail freeze paths). Unfreeze only clears the frozen status.
  const handleFreeze = async () => {
    if (!showFreezeModal || !tenantId) return;
    const currentEnd = showFreezeModal.endDate?.toDate ? showFreezeModal.endDate.toDate() : new Date(showFreezeModal.endDate);
    const r = computeFreeze(
      { endDateMs: currentEnd.getTime(), freezeDaysUsed: showFreezeModal.freezeDaysUsed, maxFreezeDays: showFreezeModal.maxFreezeDays || 14 },
      freezeDays,
    );
    if (!r.ok) {
      toast.error(r.error === 'cap_exceeded'
        ? (isAr ? `تجاوز حد التجميد — متبقٍ ${r.remaining} يوم` : `Exceeds freeze limit — ${r.remaining} days left`)
        : (isAr ? 'عدد أيام غير صالح' : 'Invalid number of days'));
      return;
    }
    try {
      await updateTenantDocument(tenantId, 'subscriptions', showFreezeModal.id, {
        status: 'frozen',
        currentFreezeStart: Timestamp.fromDate(new Date()),
        freezeReason,
        freezeDaysUsed: r.newFreezeDaysUsed,
        endDate: Timestamp.fromDate(new Date(r.newEndDateMs)),
      });
      if (showFreezeModal.memberId) {
        await updateTenantDocument(tenantId, 'members', showFreezeModal.memberId, { status: 'frozen' });
      }
      toast.success(isAr ? `تم تجميد ${r.newFreezeDaysUsed - (showFreezeModal.freezeDaysUsed || 0)} يوم` : `Frozen ${r.newFreezeDaysUsed - (showFreezeModal.freezeDaysUsed || 0)} days`);
      setShowFreezeModal(null);
      loadData();
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const openEditDates = (sub) => {
    setEditDatesSub(sub);
    setEditStartInput(toDateInput(sub.startDate));
    setEditEndInput(toDateInput(sub.endDate));
  };

  // When the admin changes the start date, shift the end date by the same
  // number of days by default — that's what a "started on the wrong day" fix
  // should mean. The admin can still edit the end date directly afterwards.
  const handleStartInputChange = (value) => {
    const oldStart = fromDateInput(editStartInput);
    const newStart = fromDateInput(value);
    const oldEnd = fromDateInput(editEndInput);
    setEditStartInput(value);
    if (oldStart && newStart && oldEnd) {
      const deltaMs = newStart.getTime() - oldStart.getTime();
      const shifted = new Date(oldEnd.getTime() + deltaMs);
      setEditEndInput(toDateInput(shifted));
    }
  };

  const handleSaveDates = async () => {
    if (!editDatesSub || !tenantId || savingDates) return;
    const start = fromDateInput(editStartInput);
    const end = fromDateInput(editEndInput);
    if (!start || !end) {
      toast.error(isAr ? 'التواريخ ناقصة' : 'Both dates are required');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      toast.error(isAr ? 'تاريخ النهاية لازم يكون بعد البداية' : 'End date must be after start date');
      return;
    }

    setSavingDates(true);
    try {
      const startTs = Timestamp.fromDate(start);
      const endTs = Timestamp.fromDate(end);
      const { error } = await updateTenantDocument(tenantId, 'subscriptions', editDatesSub.id, {
        startDate: startTs,
        endDate: endTs,
        // Keep originalEndDate in sync unless it was already different (meaning
        // freeze days moved the end forward — preserve that history).
        ...(editDatesSub.originalEndDate && editDatesSub.endDate
          && editDatesSub.originalEndDate?.toMillis?.() === editDatesSub.endDate?.toMillis?.()
          ? { originalEndDate: endTs }
          : {}),
        datesEditedAt: Timestamp.fromDate(new Date()),
        datesEditedBy: 'admin',
      });
      if (error) throw new Error(error);

      // Also refresh the denormalised end date on the member doc — the members
      // list, scanner card and dashboard all read member.endDate directly.
      if (editDatesSub.memberId) {
        await updateTenantDocument(tenantId, 'members', editDatesSub.memberId, {
          endDate: endTs,
          ...(editDatesSub.memberId && editDatesSub.status === 'active'
            ? { 'currentPlan.endDate': endTs }
            : {}),
        });
      }

      logAuditClient({
        action: 'update',
        entity: 'subscription',
        entityId: editDatesSub.id,
        tenantId,
        details: {
          description: {
            en: `Edited subscription dates for ${getMemberName(editDatesSub.memberId)}: ${toDateInput(editDatesSub.startDate)} → ${editStartInput}, ends ${toDateInput(editDatesSub.endDate)} → ${editEndInput}`,
            ar: `تعديل تواريخ اشتراك ${getMemberName(editDatesSub.memberId)}: ${toDateInput(editDatesSub.startDate)} → ${editStartInput}، ينتهي ${toDateInput(editDatesSub.endDate)} → ${editEndInput}`,
          },
        },
      });

      toast.success(isAr ? 'تم تحديث التواريخ ✅' : 'Dates updated ✅');
      setEditDatesSub(null);
      loadData();
    } catch (err) {
      console.error('handleSaveDates:', err);
      toast.error(isAr ? 'تعذّر حفظ التواريخ' : 'Could not save dates');
    }
    setSavingDates(false);
  };

  const handleUnfreeze = async (sub) => {
    if (!tenantId) return;
    try {
      await updateTenantDocument(tenantId, 'subscriptions', sub.id, {
        status: 'active',
        currentFreezeStart: null,
      });
      if (sub.memberId) {
        await updateTenantDocument(tenantId, 'members', sub.memberId, { status: 'active' });
      }
      toast.success(isAr ? 'تم إلغاء التجميد' : 'Unfrozen');
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
        <button className="btn btn-secondary btn-sm" onClick={exportExpired} disabled={exporting}
          title={isAr ? 'ملف إكسيل بكل الاشتراكات المنتهية' : 'Excel file with every expired subscription'}>
          {exporting ? '⏳' : '⬇️'} {isAr ? 'تنزيل المنتهية (Excel)' : 'Export expired (Excel)'}
        </button>
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
                        {(sub.status === 'expired' || sub.status === 'active') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setRenewSub(sub)} title={t('subscriptions.renew')} style={{ color: 'var(--pt-gold)' }}>🔄</button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEditDates(sub)}
                          title={isAr ? 'تعديل تاريخ البداية والنهاية' : 'Edit start and end date'}
                        >📅</button>
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
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label">{isAr ? 'عدد أيام التجميد' : 'Freeze days'}</label>
                <input className="form-input" type="number" min="1"
                  max={(showFreezeModal.maxFreezeDays || 14) - (showFreezeModal.freezeDaysUsed || 0)} dir="ltr"
                  value={freezeDays}
                  onChange={e => setFreezeDays(Math.min(Number(e.target.value), (showFreezeModal.maxFreezeDays || 14) - (showFreezeModal.freezeDaysUsed || 0)))} />
              </div>
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

      {/* Edit dates modal */}
      {editDatesSub && (() => {
        const parsedStart = fromDateInput(editStartInput);
        const parsedEnd = fromDateInput(editEndInput);
        const durationDays = (parsedStart && parsedEnd)
          ? Math.max(0, Math.round((parsedEnd.getTime() - parsedStart.getTime()) / 86400000))
          : null;
        const canSave = !!parsedStart && !!parsedEnd && parsedEnd.getTime() > parsedStart.getTime();
        return (
          <div className="modal-overlay" onClick={() => !savingDates && setEditDatesSub(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="modal-header">
                <h2>📅 {isAr ? 'تعديل تواريخ الاشتراك' : 'Edit subscription dates'}</h2>
                <button onClick={() => !savingDates && setEditDatesSub(null)} style={{ fontSize: '1.2rem' }} disabled={savingDates}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: 'var(--space-4)', color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                  <strong>{getMemberName(editDatesSub.memberId)}</strong>
                  {editDatesSub.planSnapshot?.name?.[locale] ? ` — ${editDatesSub.planSnapshot.name[locale]}` : ''}
                </p>

                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label">{isAr ? 'تاريخ البداية' : 'Start date'} *</label>
                  <input
                    className="form-input"
                    type="date"
                    dir="ltr"
                    value={editStartInput}
                    onChange={e => handleStartInputChange(e.target.value)}
                  />
                  <small style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                    {isAr
                      ? 'تغيير البداية بينقّل النهاية بنفس عدد الأيام تلقائياً — تقدر تعدل النهاية تحت لو مش عايز كده.'
                      : 'Changing the start shifts the end by the same number of days — override it below if you don\'t want that.'}
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label">{isAr ? 'تاريخ النهاية' : 'End date'} *</label>
                  <input
                    className="form-input"
                    type="date"
                    dir="ltr"
                    value={editEndInput}
                    onChange={e => setEditEndInput(e.target.value)}
                  />
                </div>

                {durationDays !== null && (
                  <div style={{
                    padding: 'var(--space-3)', background: 'var(--pt-darker)',
                    borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'المدة الجديدة' : 'New duration'}</span>
                      <strong dir="ltr">{durationDays} {isAr ? 'يوم' : 'days'}</strong>
                    </div>
                  </div>
                )}

                {parsedEnd && parsedEnd.getTime() < Date.now() && (
                  <p style={{ color: 'var(--pt-warning)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-3)' }}>
                    ⚠️ {isAr
                      ? 'تاريخ النهاية ده في الماضي — الاشتراك هيبقى منتهي.'
                      : 'The new end date is in the past — the subscription will be expired.'}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditDatesSub(null)} disabled={savingDates}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn-primary" onClick={handleSaveDates} disabled={savingDates || !canSave}>
                  {savingDates ? '⏳' : '💾'} {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Renew Modal */}
      {renewSub && (
        <RenewSubscriptionModal
          tenantId={tenantId}
          locale={locale}
          member={membersById.get(renewSub.memberId) || { id: renewSub.memberId }}
          currentSub={renewSub}
          onClose={() => setRenewSub(null)}
          onRenewed={loadData}
        />
      )}
    </div>
  );
}
