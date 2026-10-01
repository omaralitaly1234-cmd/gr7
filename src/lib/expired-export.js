// ============================================
// Subscription exports (expired + active) — pure row building, NO Firebase and
// NO xlsx imports, so it is unit-testable on its own. The page fetches the rows
// and hands them here; lib/xlsx-download.js turns the result into a workbook.
//
// The column set mirrors the sheets the gym already works from
// ("الاشتراكات المنتهية و غير مجددة" / "الاشتراكات النشطة حاليآ"), so the
// exported files drop straight into their existing follow-up process. The two
// exports share every column except the day count: days since expiry for the
// expired sheet, days left for the active one.
// ============================================

// Extension included so `node --test` (plain ESM, no bundler) can resolve it.
import { toDate } from './format.js';

const MS_PER_DAY = 86400000;

export const EXPIRED_EXPORT_HEADERS = {
  ar: {
    index: 'م',
    code: 'كود العضو',
    name: 'اسم العضو',
    phone: 'رقم الهاتف',
    plan: 'الباقة',
    type: 'النوع',
    start: 'بداية الاشتراك',
    end: 'نهاية الاشتراك',
    daysSince: 'أيام من الانتهاء',
    paid: 'المدفوع',
    due: 'المتبقي',
    trainer: 'المدرب',
  },
  en: {
    index: '#',
    code: 'Member code',
    name: 'Member name',
    phone: 'Phone',
    plan: 'Plan',
    type: 'Type',
    start: 'Start date',
    end: 'End date',
    daysSince: 'Days since expiry',
    paid: 'Paid',
    due: 'Balance due',
    trainer: 'Trainer',
  },
};

// Same columns, same order as the expired sheet — only the day-count column
// changes. Built by swapping that one key in place, so column order (and with
// it EXPIRED_EXPORT_WIDTHS) can never drift between the two files.
const withDaysLeft = (headers, label) => Object.fromEntries(
  Object.entries(headers).map(([k, v]) => (k === 'daysSince' ? ['daysLeft', label] : [k, v])));

export const ACTIVE_EXPORT_HEADERS = {
  ar: withDaysLeft(EXPIRED_EXPORT_HEADERS.ar, 'الأيام المتبقية'),
  en: withDaysLeft(EXPIRED_EXPORT_HEADERS.en, 'Days left'),
};

/** Whole days between an end date and `now`; 0 when the date is missing. */
export function daysSinceExpiry(endValue, nowMs = Date.now()) {
  const end = toDate(endValue);
  if (!end) return 0;
  return Math.max(0, Math.floor((nowMs - end.getTime()) / MS_PER_DAY));
}

/**
 * Whole days left until an end date, rounded up the way the subscriptions
 * table shows it (ends later today → 1); 0 when past or missing.
 */
export function daysUntilExpiry(endValue, nowMs = Date.now()) {
  const end = toDate(endValue);
  if (!end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - nowMs) / MS_PER_DAY));
}

/**
 * Build the sheet rows for a set of expired subscriptions.
 *
 * @param {Array} subscriptions  expired subscription docs
 * @param {Map}   membersById    member doc id -> member doc
 * @param {{ locale?: string, nowMs?: number }} opts
 * @returns {Array<Object>} one plain object per row, keyed by the localised
 *                          header text — exactly what json_to_sheet wants.
 */
export function buildExpiredRows(subscriptions, membersById, opts = {}) {
  return buildRows(subscriptions, membersById, opts, EXPIRED_EXPORT_HEADERS, 'daysSince', daysSinceExpiry);
}

/** Same as buildExpiredRows, for active subscriptions: "days left" instead of "days since expiry". */
export function buildActiveRows(subscriptions, membersById, opts = {}) {
  return buildRows(subscriptions, membersById, opts, ACTIVE_EXPORT_HEADERS, 'daysLeft', daysUntilExpiry);
}

function buildRows(subscriptions, membersById, { locale = 'ar', nowMs = Date.now() } = {}, headers, daysKey, daysFn) {
  const h = headers[locale === 'en' ? 'en' : 'ar'];
  const isAr = locale !== 'en';
  const lookup = membersById instanceof Map ? membersById : new Map();

  return (subscriptions || []).map((sub, i) => {
    const member = lookup.get(sub.memberId) || {};
    const planName = sub.planSnapshot?.name?.[locale]
      || sub.planSnapshot?.name?.ar
      || sub.planId
      || '';
    const type = sub.planSnapshot?.type === 'diamond'
      ? (isAr ? 'ماسي' : 'Diamond')
      : (isAr ? 'ذهبي' : 'Gold');
    const trainer = member.assignedTrainerName;

    return {
      [h.index]: i + 1,
      [h.code]: member.membershipNumber || '',
      [h.name]: member.fullName?.[locale] || member.fullName?.ar || '',
      // Kept as text: Excel strips the leading zero off Egyptian mobile
      // numbers the moment it decides a column is numeric.
      [h.phone]: member.phone ? String(member.phone) : '',
      [h.plan]: planName,
      [h.type]: type,
      [h.start]: toDate(sub.startDate) || '',
      [h.end]: toDate(sub.endDate) || '',
      [h[daysKey]]: daysFn(sub.endDate, nowMs),
      [h.paid]: Number(sub.amountPaid) || 0,
      [h.due]: Number(sub.balanceDue) || 0,
      [h.trainer]: (typeof trainer === 'object' ? (trainer?.[locale] || trainer?.ar) : trainer) || '',
    };
  });
}

/** Column widths, in the order both builders emit them. */
export const EXPIRED_EXPORT_WIDTHS = [5, 12, 26, 14, 20, 10, 14, 14, 10, 10, 10, 18];

/** `الاشتراكات-المنتهية-2026-08-24.xlsx` — safe on every filesystem. */
export function expiredExportFileName(date = new Date(), locale = 'ar') {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return locale === 'en'
    ? `expired-subscriptions-${stamp}.xlsx`
    : `الاشتراكات-المنتهية-${stamp}.xlsx`;
}

/** `الاشتراكات-النشطة-2026-10-01.xlsx` */
export function activeExportFileName(date = new Date(), locale = 'ar') {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return locale === 'en'
    ? `active-subscriptions-${stamp}.xlsx`
    : `الاشتراكات-النشطة-${stamp}.xlsx`;
}
