// ============================================
// Everything an invoice document shows, computed in one pure place so the
// on-screen invoice and the printed receipt can never disagree — and so the
// money arithmetic is testable without a browser.
//
// The numbers come out of the payment document exactly as recorded. Nothing is
// invented: the total on the page is the cash the member actually handed over.
// ============================================

import { toDate } from './format.js';
import { splitTaxInclusive } from './gym-profile.js';

export const PAYMENT_TYPE_LABELS = {
  subscription: { ar: 'اشتراك', en: 'Subscription' },
  installment: { ar: 'قسط', en: 'Instalment' },
  spa: { ar: 'سبا', en: 'Spa' },
  personal_training: { ar: 'تدريب خاص', en: 'Personal Training' },
  product: { ar: 'منتج', en: 'Product' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const PAYMENT_METHOD_LABELS = {
  cash: { ar: 'كاش', en: 'Cash', icon: '💵' },
  visa: { ar: 'فيزا', en: 'Visa', icon: '💳' },
  bank_transfer: { ar: 'تحويل بنكي', en: 'Bank transfer', icon: '🏦' },
  online: { ar: 'أونلاين', en: 'Online', icon: '🌐' },
};

export function paymentTypeLabel(type, locale = 'ar') {
  return PAYMENT_TYPE_LABELS[type]?.[locale] || PAYMENT_TYPE_LABELS[type]?.ar || type || '—';
}

export function paymentMethodLabel(method, locale = 'ar') {
  const m = PAYMENT_METHOD_LABELS[method];
  return m ? `${m.icon} ${m[locale] || m.ar}` : (method || '—');
}

/**
 * Assemble the invoice.
 *
 * @param {Object} payment  a tenant payment document
 * @param {Object} member   the member it belongs to (may be missing/deleted)
 * @param {Object} profile  from toGymProfile()
 * @param {{ locale?: string }} opts
 */
export function buildInvoiceView(payment, member, profile, { locale = 'ar' } = {}) {
  const p = payment || {};
  const gross = Number(p.amount) || 0;
  const discount = Number(p.discount) || 0;
  // `netAmount` is authoritative — it is what was collected. Fall back to
  // gross-minus-discount only for the older rows that predate the field.
  const net = p.netAmount === undefined || p.netAmount === null
    ? Math.max(0, gross - discount)
    : Number(p.netAmount) || 0;

  const balanceAfter = Number(p.balanceAfter) || 0;
  const totalDue = Number(p.totalDue) || 0;
  const tax = splitTaxInclusive(net, profile?.taxRate);

  return {
    number: p.invoiceNumber || '',
    // An invoice with no serial is still a real record — the page says so
    // rather than pretending, and the list has a button that fixes it.
    hasNumber: Boolean(p.invoiceNumber),
    date: toDate(p.createdAt),
    type: p.type || 'other',
    typeLabel: paymentTypeLabel(p.type, locale),
    methodLabel: paymentMethodLabel(p.method, locale),
    notes: p.notes || '',
    // A partially-paid subscription is not a settled invoice.
    isSettled: balanceAfter <= 0,
    member: {
      id: p.memberId || '',
      name: member?.fullName?.[locale] || member?.fullName?.ar || p.memberName || '',
      code: member?.membershipNumber || '',
      phone: member?.phone || '',
      email: member?.email || '',
      // A deleted member still has a name on the payment row; say so rather
      // than rendering a blank customer.
      missing: !member,
    },
    lines: [{
      description: invoiceLineDescription(p, locale),
      qty: 1,
      unit: gross,
      total: gross,
    }],
    totals: {
      subtotal: gross,
      discount,
      net,
      tax: tax.tax,
      taxRate: tax.rate,
      taxBase: tax.base,
      totalDue,
      balanceAfter,
    },
    currency: profile?.currency || 'EGP',
  };
}

/** What the single line item says. Uses the note the recording screen wrote
 *  (e.g. "اشتراك جديد — دفعة مقدمة") and falls back to the payment type. */
export function invoiceLineDescription(payment, locale = 'ar') {
  const note = (payment?.notes || '').trim();
  if (note) return note;
  return paymentTypeLabel(payment?.type, locale);
}

/** `1,200 ج.م` — the same money string everywhere on the document. */
export function money(amount, currency = 'EGP', locale = 'ar') {
  const n = (Number(amount) || 0).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  const unit = currency === 'EGP' ? (locale === 'ar' ? 'ج.م' : 'EGP') : currency;
  return `${n} ${unit}`;
}
