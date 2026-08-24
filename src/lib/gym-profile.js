// ============================================
// The gym's own identity, as typed into admin/settings.
//
// Those fields — name, phone, address, e-mail, tax rate, invoice prefix — were
// write-only: the admin filled them in and nothing ever read them back, while
// the printed receipt hard-coded "Power Time", "المعادي، القاهرة" and
// "01000000000". Every gym on the platform printed the same fake address.
//
// Pure, no Firebase, so the invoice pages and the tests can share it.
// ============================================

export const SETTINGS_COLLECTION = 'config';
export const SETTINGS_DOC_ID = 'settings';

export const DEFAULT_GYM_PROFILE = {
  name: { ar: 'Power Time', en: 'Power Time' },
  phone: '',
  address: { ar: '', en: '' },
  email: '',
  currency: 'EGP',
  taxRate: 0,
  invoicePrefix: 'INV',
};

/** Coerce the stored settings document into a profile the invoice can render. */
export function toGymProfile(doc) {
  const nameAr = doc?.gymName?.ar || doc?.gymName || DEFAULT_GYM_PROFILE.name.ar;
  const addressAr = doc?.gymAddress?.ar || doc?.gymAddress || '';
  return {
    name: {
      ar: typeof nameAr === 'string' ? nameAr : DEFAULT_GYM_PROFILE.name.ar,
      en: doc?.gymName?.en || (typeof nameAr === 'string' ? nameAr : DEFAULT_GYM_PROFILE.name.en),
    },
    phone: doc?.gymPhone || '',
    address: {
      ar: typeof addressAr === 'string' ? addressAr : '',
      en: doc?.gymAddress?.en || (typeof addressAr === 'string' ? addressAr : ''),
    },
    email: doc?.gymEmail || '',
    currency: doc?.currency || DEFAULT_GYM_PROFILE.currency,
    taxRate: clampTaxRate(doc?.taxRate),
    invoicePrefix: normalizeInvoicePrefix(doc?.invoicePrefix),
  };
}

/** A serial prefix has to survive being parsed back out of `PRE-2026-0001`. */
export function normalizeInvoicePrefix(value) {
  const cleaned = String(value ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  return cleaned.slice(0, 6) || DEFAULT_GYM_PROFILE.invoicePrefix;
}

/** 0–100, and never NaN — this multiplies money. */
export function clampTaxRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}

/**
 * Break the tax out of an amount that already INCLUDES it.
 *
 * Egyptian gym prices are quoted tax-inclusive, and — more importantly — the
 * stored `netAmount` is the cash that actually changed hands. Adding tax on top
 * at render time would print a total the member never paid.
 */
export function splitTaxInclusive(net, ratePct) {
  const total = Number(net) || 0;
  const rate = clampTaxRate(ratePct);
  if (rate === 0) return { base: round2(total), tax: 0, rate: 0, total: round2(total) };
  const base = total / (1 + rate / 100);
  return { base: round2(base), tax: round2(total - base), rate, total: round2(total) };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function gymName(profile, locale = 'ar') {
  return profile?.name?.[locale] || profile?.name?.ar || DEFAULT_GYM_PROFILE.name.ar;
}

export function gymAddress(profile, locale = 'ar') {
  return profile?.address?.[locale] || profile?.address?.ar || '';
}
