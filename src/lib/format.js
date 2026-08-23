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

/**
 * Parse an `<input type="date">` value ("YYYY-MM-DD") as LOCAL midnight.
 *
 * `new Date('2026-08-24')` is parsed as UTC midnight, which lands on the
 * PREVIOUS day in any timezone behind UTC — a subscription that silently starts
 * and ends a day early. Returns null for anything that is not a valid date.
 */
export function parseDateInput(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const date = new Date(y, mo - 1, d);
  // Rejects impossible dates that JS would silently roll over (2026-02-31).
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Format a value as the "YYYY-MM-DD" string an `<input type="date">` expects. */
export function toDateInputValue(value) {
  const d = toDate(value);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Locale-aware number formatting for money/counts. */
export function formatNumber(n, locale = 'ar') {
  return (Number(n) || 0).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
}
