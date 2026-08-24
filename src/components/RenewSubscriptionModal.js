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

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { nextInvoiceNumber } from '@/lib/firebase/invoices';
import { logAuditClient } from '@/lib/firebase/audit';
import { useMembershipPlans } from '@/lib/hooks/useMembershipPlans';
import { buildInstallmentSchedule, splitPayment } from '@/lib/installments';
import { computeRenewal } from '@/lib/subscription-math';
import { parseDateInput } from '@/lib/format';
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

  const [planId, setPlanId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payFull, setPayFull] = useState(true);
  const [paidNow, setPaidNow] = useState('');
  const [scheduleInstallments, setScheduleInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [firstDueDate, setFirstDueDate] = useState('');
  // Blank = the automatic start (when the current term runs out, or today).
  const [startOverride, setStartOverride] = useState('');
  const [saving, setSaving] = useState(false);

  const { plans: membershipPlans } = useMembershipPlans(tenantId);
  const plan = membershipPlans.find(p => p.id === planId);

  // Preselect whatever the member is currently on. Subscriptions store the
  // STABLE planId, while the dropdown is keyed by document id, so match either.
  useEffect(() => {
    if (planId || !membershipPlans.length || !currentSub?.planId) return;
    const match = membershipPlans.find(
      p => p.planId === currentSub.planId || p.id === currentSub.planId
    );
    if (match) setPlanId(match.id);
  }, [membershipPlans, currentSub, planId]);

  const total = plan ? plan.price - (plan.price * discount) / 100 : 0;
  const money = splitPayment(total, payFull ? total : paidNow);

  // Preview the dates the renewal will produce, so the admin sees up-front that
  // renewing early does not burn the days still left on the current term.
  const dates = useMemo(() => {
    if (!plan) return null;
    const end = currentSub?.endDate?.toDate
      ? currentSub.endDate.toDate()
      : (currentSub?.endDate ? new Date(currentSub.endDate) : null);
    const override = parseDateInput(startOverride);
    const r = computeRenewal({
      currentEndDateMs: end ? end.getTime() : null,
      durationDays: plan.duration,
      startOverrideMs: override ? override.getTime() : null,
    });
    return r.ok ? r : null;
  }, [plan, currentSub, startOverride]);

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
            parseDateInput(firstDueDate)?.getTime() ?? Date.now(),
          )
        : [];

      // 1. New subscription — same shape the signup wizard writes.
      const { id: newSubId, error: subError } = await addTenantDocument(tenantId, 'subscriptions', {
        memberId: member.id,
        planId: plan.planId || plan.id,
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
        // Provenance for a hand-picked start: finance can tell a normal renewal
        // from one the desk moved, and by how much.
        startDateOverridden: dates.startOverridden,
        forfeitedDays: dates.forfeitedDays,
        gapDays: dates.gapDays,
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
          referenceId: plan.planId || plan.id,
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
          invoiceNumber: await nextInvoiceNumber(tenantId),
        });
        if (error) throw new Error(error);
      }

      // 4. Denormalised member fields the members table, scanner and profile read.
      const { error: memberError } = await updateTenantDocument(tenantId, 'members', member.id, {
        status: 'active',
        currentPlan: {
          planId: plan.planId || plan.id,
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
            en: `Renewed ${memberName} on ${plan.name.en}: ${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}${dates.startOverridden ? ' (manual start)' : ''}`,
            ar: `تجديد اشتراك ${memberName} — ${plan.name.ar}: ${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}${dates.startOverridden ? ' (بداية يدوية)' : ''}`,
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
              {membershipPlans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name[locale] || p.name.ar} — {p.price} {t('common.egp')} ({p.duration} {isAr ? 'يوم' : 'days'})
                </option>
              ))}
            </select>
          </div>

          {/* Manual start date. Blank keeps the automatic behaviour, which is
              what the desk wants almost every time. */}
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">{isAr ? 'تاريخ بداية الاشتراك' : 'Subscription start date'}</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input className="form-input" type="date" dir="ltr" style={{ flex: 1 }}
                value={startOverride} onChange={e => setStartOverride(e.target.value)} />
              {startOverride && (
                <button className="btn btn-secondary btn-sm" onClick={() => setStartOverride('')}>
                  ↺ {isAr ? 'تلقائي' : 'Auto'}
                </button>
              )}
            </div>
            <small style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
              {isAr
                ? 'سيبها فاضية = يبدأ لما الاشتراك الحالي يخلص (أو النهاردة لو منتهي).'
                : 'Leave blank = starts when the current term runs out (or today if it has expired).'}
            </small>
          </div>

          {dates && (
            <div style={{
              padding: 'var(--space-3)', marginBottom: 'var(--space-3)',
              background: 'var(--pt-gold-glow)', border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
            }}>
              <div>📅 {isAr ? 'يبدأ' : 'Starts'}: <strong>{fmt(dates.startMs)}</strong>
                {dates.startOverridden && (
                  <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                    {' '}({isAr ? 'يدوي' : 'manual'})
                  </span>
                )}
              </div>
              <div>🏁 {isAr ? 'ينتهي' : 'Ends'}: <strong style={{ color: 'var(--pt-gold)' }}>{fmt(dates.endMs)}</strong></div>
              {dates.carriedOverDays > 0 && (
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--pt-success)' }}>
                  ✅ {isAr
                    ? `تم ترحيل ${dates.carriedOverDays} يوم متبقية من الاشتراك الحالي`
                    : `${dates.carriedOverDays} remaining days carried over from the current term`}
                </div>
              )}
              {/* Starting before the current term ends overlaps it — say so
                  plainly instead of quietly eating the member's days. */}
              {dates.forfeitedDays > 0 && (
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--pt-danger)' }}>
                  ⚠️ {isAr
                    ? `التاريخ ده قبل نهاية الاشتراك الحالي — العضو هيخسر ${dates.forfeitedDays} يوم.`
                    : `That date is before the current term ends — the member loses ${dates.forfeitedDays} days.`}
                </div>
              )}
              {dates.gapDays > 0 && (
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--pt-warning)' }}>
                  ⏳ {isAr
                    ? `فيه ${dates.gapDays} يوم قبل ما الاشتراك الجديد يبدأ العضو مش هيبقى مغطى فيهم.`
                    : `${dates.gapDays} days before the new term starts are not covered.`}
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
