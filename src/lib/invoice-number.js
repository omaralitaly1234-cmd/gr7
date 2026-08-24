// ============================================
// Invoice serial numbers — pure format/parse, NO Firebase, so it is testable
// and usable from both the client pages and the Admin-SDK backfill route.
//
// Every payment the gym records is an invoice line in
// admin/finance/invoices, so they all share ONE sequence: a ledger with two
// interleaved series (INV-… for the desk, SPA-… for the spa) is not a serial
// number, it is two half-serials. The kind of payment is already carried by the
// `type` field, so the prefix does not need to encode it.
// ============================================

export const INVOICE_PREFIX = 'INV';
export const INVOICE_COUNTER_KEY = 'invoices';
const SEQ_PAD = 4;

/** `INV-2026-0042`. The sequence is continuous across years by design — the
 *  year is a readability aid, not part of the key. */
export function formatInvoiceNumber(seq, year = new Date().getFullYear(), prefix = INVOICE_PREFIX) {
  const n = Math.floor(Number(seq));
  if (!Number.isFinite(n) || n < 1) return '';
  return `${prefix}-${year}-${String(n).padStart(SEQ_PAD, '0')}`;
}

/**
 * Read a stored invoice number back apart.
 * Accepts any prefix so the historical `SPA-2026-0007` numbers still parse and
 * are counted when working out where the sequence has already reached.
 *
 * @returns {{ prefix: string, year: number, seq: number } | null}
 */
export function parseInvoiceNumber(value) {
  if (typeof value !== 'string') return null;
  const m = /^([A-Za-z]+)-(\d{4})-(\d+)$/.exec(value.trim());
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), year: Number(m[2]), seq: Number(m[3]) };
}

/** The highest sequence already handed out across a set of payment docs. */
export function highestInvoiceSeq(payments) {
  let max = 0;
  for (const p of payments || []) {
    const parsed = parseInvoiceNumber(p?.invoiceNumber);
    if (parsed && parsed.seq > max) max = parsed.seq;
  }
  return max;
}

/** True when a payment row still needs a number. */
export function needsInvoiceNumber(payment) {
  return !parseInvoiceNumber(payment?.invoiceNumber);
}

/**
 * Decide the numbers to hand to a block of un-numbered payments.
 *
 * The base is the furthest the sequence has demonstrably reached — the counter
 * document OR the highest number already stored on a payment, whichever is
 * larger. Trusting the counter alone would re-issue numbers if it were ever
 * reset; trusting the documents alone would collide with numbers the counter
 * has already handed out but whose payment write failed.
 *
 * @returns {{ base: number, next: number, count: number }} `next` is the first
 *          number to assign; `base + count` is where the counter must end up.
 */
export function planInvoiceBackfill({ counterSeq = 0, highestStoredSeq = 0, missingCount = 0 }) {
  const base = Math.max(Number(counterSeq) || 0, Number(highestStoredSeq) || 0);
  const count = Math.max(0, Math.floor(Number(missingCount) || 0));
  return { base, next: base + 1, count };
}
