// ============================================
// When a subscription actually stops letting the member in.
//
// The desk reads an end date as a calendar day ("ends on the 1st"), and the
// member keeps the whole of that day: they count as expired from the start of
// the NEXT day in Cairo, whatever hour the end date happens to be stored at —
// 23:59 on imported members, the hour of sale on in-app sales and renewals,
// midnight on hand-edited dates. Without this, a plan sold at 6pm turned the
// member away at 6pm on its last day, and a hand-edited one for the whole day.
//
// Pure, no Firebase, so the scanner, the offline roster and the tests share it.
// The nightly expiry job (functions/index.js) mirrors startOfGymDayMs.
// ============================================

export const GYM_TZ = 'Africa/Cairo';
const DAY = 86400000;
const HOUR = 3600000;

const wallFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: GYM_TZ, hourCycle: 'h23',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
});

function toMs(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const d = new Date(v).getTime();
  return Number.isNaN(d) ? null : d;
}

/** Cairo's offset from UTC at `ms` (2h in winter, 3h in summer). */
function cairoOffsetMs(ms) {
  const p = {};
  for (const { type, value } of wallFmt.formatToParts(ms)) p[type] = Number(value);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - (ms - (((ms % 1000) + 1000) % 1000));
}

/** Midnight in Cairo at the start of the day `ms` falls on. */
export function startOfGymDayMs(ms) {
  const wallMidnight = Math.floor((ms + cairoOffsetMs(ms)) / DAY) * DAY;
  // Once more with the offset at the answer, in case a clock change lies between.
  return wallMidnight - cairoOffsetMs(wallMidnight - cairoOffsetMs(ms));
}

/**
 * The first moment the member counts as expired: midnight in Cairo at the
 * start of the day after the end date. Null when there is no end date.
 */
export function accessEndMs(endValue) {
  const end = toMs(endValue);
  if (end === null || end <= 0) return null;
  // +27h from that day's midnight always lands inside the next day, clock change or not.
  return startOfGymDayMs(startOfGymDayMs(end) + DAY + 3 * HOUR);
}

/** Does a subscription ending at `endValue` still let the member in at `atMs`? */
export function isWithinTerm(endValue, atMs = Date.now()) {
  const until = accessEndMs(endValue);
  return until !== null && until > atMs;
}

/**
 * Days the member still has, counting today: 1 on the end date itself, 2 the
 * day before, 0 once it has passed or when there is no end date.
 */
export function daysLeftInTerm(endValue, nowMs = Date.now()) {
  const until = accessEndMs(endValue);
  if (until === null) return 0;
  return Math.max(0, Math.ceil((until - nowMs) / DAY));
}
