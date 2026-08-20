'use client';

// ============================================
// Subscription renewal — the one place a renewal is actually performed.
//
// Both renew entry points (the member profile and the subscriptions table)
// used to be plain links: the profile pointed at the subscriptions list and the
// list pointed at the "add member" wizard. Neither read the member/renew query
// param, so clicking renew navigated the admin away from what they were doing
// and nothing was ever renewed. This modal replaces both links.
//
// It writes the same subscription/payment shapes as admin/members/new so the
// finance pages, the scanner and the expiry Cloud Function see no difference
// between a signup and a renewal.
// ============================================

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { logAuditClient } from '@/lib/firebase/audit';
import { MEMBERSHIP_PLANS } from '@/lib/membership-plans';
import { buildInstallmentSchedule, splitPayment } from '@/lib/installments';
import { computeRenewal } from '@/lib/subscription-math';
import { Timestamp, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function RenewSubscriptionModal({
  tenantId,
  locale = 'ar',
  member,          // { id, fullName, membershipNumber, balanceDue, ... }
  currentSub,      // the subscription being renewed, or null
  onClose,
  onRenewed,       // (result) => void — called after a successful renewal
}) {
  const t = useTranslations();
  const isAr = locale === 'ar';

  const [planId, setPlanId] = useState(currentSub?.planId || '');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payFull, setPayFull] = useState(true);
  const [paidNow, setPaidNow] = useState('');
  const [scheduleInstallments, setScheduleInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const plan = MEMBERSHIP_PLANS.find(p => p.id === planId);

  const total = plan ? plan.price - (plan.price * discount) / 100 : 0;
  const money = splitPayment(total, payFull ? total : paidNow);

  // Preview the dates the renewal will produce, so the admin sees up-front that
  // renewing early does not burn the days still left on the current term.
  const dates = useMemo(() => {
    if (!plan) return null;
    const end = currentSub?.endDate?.toDate
      ? currentSub.endDate.toDate()
      : (currentSub?.endDate ? new Date(currentSub.endDate) : null);
    const r = computeRenewal({
      currentEndDateMs: end ? end.getTime() : null,
      durationDays: plan.duration,
    });
    return r.ok ? r : null;
  }, [plan, currentSub]);

  const fmt = (ms) => new Date(ms).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const memberName = member?.fullName?.[locale] || member?.fullName?.ar || '';

  const handleRenew = async () => {
    if (saving) return;
    if (!tenantId || !member?.id) {
      toast.error(isAr ? 'بيانات العضو غير مكتملة' : 'Member data incomplete');
      return;
    }
    if (!plan || !dates) {
      toast.error(isAr ? 'اختر الباقة أولاً' : 'Select a plan first');
      return;
    }
    if (!payFull && money.paid <= 0 && !scheduleInstallments) {
      toast.error(isAr ? 'أدخل المبلغ المدفوع أو فعّل الأقساط' : 'Enter the amount paid or enable instalments');
      return;
    }

    setSaving(true);
    try {
      const startDate = new Date(dates.startMs);
      const endDate = new Date(dates.endMs);

      const schedule = (!money.isFullyPaid && scheduleInstallments)
        ? buildInstallmentSchedule(
            money.remaining,
            installmentCount,
            firstDueDate ? new Date(firstDueDate).getTime() : Date.now(),
          )
        : [];

      // 1. New subscription — same shape the signup wizard writes.
      const { id: newSubId, error: subError } = await addTenantDocument(tenantId, 'subscriptions', {
        memberId: member.id,
        planId: plan.id,
        planSnapshot: plan,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        originalEndDate: Timestamp.fromDate(endDate),
        status: 'active',
        totalSessions: plan.sessions,
        usedSessions: 0,
        remainingSessions: plan.sessions,
        freezeDaysUsed: 0,
        maxFreezeDays: 14,
        currentFreezeStart: null,
        totalAmount: money.total,
        amountPaid: money.paid,
        balanceDue: money.remaining,
        paymentStatus: money.isFullyPaid ? 'paid' : 'partial',
        installments: schedule.map(i => ({ ...i, dueDate: Timestamp.fromMillis(i.dueDate) })),
        discountApplied: { percentage: discount, amount: (plan.price * discount) / 100 },
        paymentMethod,
        invitationsUsed: 0,
        maxInvitations: 2,
        autoRenew: false,
        renewalReminded: false,
        createdBy: 'admin',
        // Renewal provenance — lets finance separate renewals from signups.
        isRenewal: true,
        renewedFromSubId: currentSub?.id || null,
        carriedOverDays: dates.carriedOverDays,
      });
      if (subError) throw new Error(subError);

      // 2. Close the old term so the member never has two active subscriptions.
      if (currentSub?.id) {
        const { error } = await updateTenantDocument(tenantId, 'subscriptions', currentSub.id, {
          status: 'renewed',
          renewedAt: Timestamp.fromDate(new Date()),
          renewedToSubId: newSubId,
          currentFreezeStart: null,
        });
        if (error) throw new Error(error);
      }

      // 3. Money actually collected. No payment row for a zero-payment renewal,
      //    so revenue reports stay honest.
      if (money.paid > 0) {
        const { error } = await addTenantDocument(tenantId, 'payments', {
          memberId: member.id,
          memberName,
          type: 'subscription',
          referenceId: plan.id,
          amount: plan.price,
          discount: (plan.price * discount) / 100,
          netAmount: money.paid,
          totalDue: money.total,
          balanceAfter: money.remaining,
          method: paymentMethod,
          status: 'completed',
          notes: money.isFullyPaid
            ? (isAr ? 'تجديد اشتراك' : 'Subscription renewal')
            : (isAr ? 'تجديد اشتراك — دفعة مقدمة' : 'Subscription renewal — down payment'),
          receivedBy: 'admin',
        });
        if (error) throw new Error(error);
      }

      // 4. Denormalised member fields the members table, scanner and profile read.
      const { error: memberError } = await updateTenantDocument(tenantId, 'members', member.id, {
        status: 'active',
        currentPlan: {
          planId: plan.id,
          planName: plan.name[locale] || plan.name.ar,
          type: plan.type,
          endDate: Timestamp.fromDate(endDate),
        },
        planName: plan.name[locale] || plan.name.ar,
        endDate: Timestamp.fromDate(endDate),
        totalSpent: increment(money.paid),
        balanceDue: increment(money.remaining),
      });
      if (memberError) throw new Error(memberError);

      logAuditClient({
        action: 'update',
        entity: 'subscription',
        entityId: newSubId,
        tenantId,
        details: {
          description: {
            en: `Renewed ${memberName} on ${plan.name.en} until ${endDate.toISOString().slice(0, 10)}`,
            ar: `تجديد اشتراك ${memberName} — ${plan.name.ar} حتى ${endDate.toISOString().slice(0, 10)}`,
          },
        },
      });

      toast.success(isAr
        ? `تم التجديد حتى ${fmt(dates.endMs)} ✅`
        : `Renewed until ${fmt(dates.endMs)} ✅`);
      onRenewed?.({ subscriptionId: newSubId, endDate, plan, money });
      onClose?.();
    } catch (err) {
      console.error('[RenewSubscription]', err);
      toast.error(isAr ? 'تعذّر إتمام التجديد' : 'Renewal failed');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => { if (!saving) onClose?.(); }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>💳 {t('subscriptions.renew')}</h2>
          <button onClick={() => { if (!saving) onClose?.(); }} style={{ fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
            {memberName} {member?.membershipNumber ? `— ${member.membershipNumber}` : ''}
          </p>

          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">{isAr ? 'الباقة' : 'Plan'}</label>
            <select className="form-select" value={planId} onChange={e => setPlanId(e.target.value)}>
              <option value="">{isAr ? '— اختر الباقة —' : '— Select a plan —'}</option>
              {MEMBERSHIP_PLANS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name[locale] || p.name.ar} — {p.price} {t('common.egp')} ({p.duration} {isAr ? 'يوم' : 'days'})
                </option>
              ))}
            </select>
          </div>

          {dates && (
            <div style={{
              padding: 'var(--space-3)', marginBottom: 'var(--space-3)',
              background: 'var(--pt-gold-glow)', border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
            }}>
              <div>📅 {isAr ? 'يبدأ' : 'Starts'}: <strong>{fmt(dates.startMs)}</strong></div>
              <div>🏁 {isAr ? 'ينتهي' : 'Ends'}: <strong style={{ color: 'var(--pt-gold)' }}>{fmt(dates.endMs)}</strong></div>
              {dates.carriedOverDays > 0 && (
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--pt-success)' }}>
                  ✅ {isAr
                    ? `تم ترحيل ${dates.carriedOverDays} يوم متبقية من الاشتراك الحالي`
                    : `${dates.carriedOverDays} remaining days carried over from the current term`}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{isAr ? 'الخصم %' : 'Discount %'}</label>
              <input className="form-input" type="number" min="0" max="100" dir="ltr"
                value={discount}
                onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
              <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">{isAr ? 'نقدي' : 'Cash'}</option>
                <option value="card">{isAr ? 'بطاقة' : 'Card'}</option>
                <option value="transfer">{isAr ? 'تحويل' : 'Transfer'}</option>
                <option value="wallet">{isAr ? 'محفظة إلكترونية' : 'E-wallet'}</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', cursor: 'pointer' }}>
            <input type="checkbox" checked={payFull} onChange={e => setPayFull(e.target.checked)} />
            <span>{isAr ? 'دفع المبلغ كاملاً' : 'Paid in full'}</span>
          </label>

          {!payFull && (
            <>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label">{isAr ? 'المبلغ المدفوع الآن' : 'Amount paid now'}</label>
                <input className="form-input" type="number" min="0" max={total} dir="ltr"
                  value={paidNow} onChange={e => setPaidNow(e.target.value)} placeholder="0" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={scheduleInstallments} onChange={e => setScheduleInstallments(e.target.checked)} />
                <span>{isAr ? 'جدولة الباقي كأقساط' : 'Schedule the rest as instalments'}</span>
              </label>
              {scheduleInstallments && (
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">{isAr ? 'عدد الأقساط' : 'Instalments'}</label>
                    <input className="form-input" type="number" min="2" max="12" dir="ltr"
                      value={installmentCount}
                      onChange={e => setInstallmentCount(Math.max(2, Number(e.target.value) || 2))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">{isAr ? 'أول موعد استحقاق' : 'First due date'}</label>
                    <input className="form-input" type="date" dir="ltr"
                      value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} />
                  </div>
                </div>
              )}
            </>
          )}

          {plan && (
            <div style={{
              padding: 'var(--space-3)', background: 'var(--pt-darker)',
              borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                <strong dir="ltr">{money.total} {t('common.egp')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pt-success)' }}>
                <span>{isAr ? 'المدفوع' : 'Paid'}</span>
                <strong dir="ltr">{money.paid} {t('common.egp')}</strong>
              </div>
              {money.remaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pt-danger)' }}>
                  <span>{isAr ? 'المتبقي' : 'Remaining'}</span>
                  <strong dir="ltr">{money.remaining} {t('common.egp')}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => onClose?.()} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" onClick={handleRenew} disabled={saving || !plan}>
            {saving ? '⏳' : '💳'} {t('subscriptions.renew')}
          </button>
        </div>
      </div>
    </div>
  );
}
