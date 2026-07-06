// ============================================
// Shared date / currency formatting — framework-neutral.
// Robust coercion for the mix of value shapes in this codebase: Firestore
// Timestamp, { seconds }, ISO string, millis, and Date. Replaces ~20 slightly
// different inline `toDate` reimplementations (some of which mishandled one or
// more of these shapes).
// ============================================

/** Coerce any supported value to a JS Date, or null. */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') {
    try { return value.toDate(); } catch { return null; }
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const d = new Date(value); // ISO string or millis
  return isNaN(d.getTime()) ? null : d;
}

/** Locale-aware date string, or '-' when the value is missing/invalid. */
export function formatDate(value, locale = 'ar', opts) {
  const d = toDate(value);
  if (!d) return '-';
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', opts);
}

/** Locale-aware number formatting for money/counts. */
export function formatNumber(n, locale = 'ar') {
  return (Number(n) || 0).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
}
