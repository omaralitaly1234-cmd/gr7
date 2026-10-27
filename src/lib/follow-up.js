// ============================================
// Follow-up desk (/admin/follow-up) — pure logic, NO Firebase imports, so it is
// unit-testable on its own. The page runs the bounded queries and hands the
// rows here to decide who is actually worth a call.
//
// Two lists:
//   lapsed → a subscription with status 'expired' (the same source the
//            expired export reads) whose member has not renewed since. A
//            renewal marks the old sub 'renewed', but member.status drifts
//            (see scripts/reconcile-subscription-status.js), so the member doc
//            is checked too before a row is shown.
//   absent → an active member whose lastVisit is older than N days, or who
//            never checked in at all (lastVisit null — every imported member
//            starts that way).
//
// Every call the desk makes is written to tenants/{id}/follow_ups, and a member
// contacted within RECENT_CONTACT_DAYS is flagged so nobody calls them twice.
// ============================================

// Extension included so `node --test` (plain ESM, no bundler) can resolve it.
import { toDate } from './format.js';

const MS_PER_DAY = 86400000;

export const FOLLOW_UPS_COLLECTION = 'follow_ups';

/** A member contacted within this many days is flagged as "already called". */
export const RECENT_CONTACT_DAYS = 7;

export const LAPSED_WINDOWS = [7, 30, 90];
export const DEFAULT_ABSENT_DAYS = 10;

export const FOLLOW_UP_OUTCOMES = [
  { key: 'will_renew', icon: '✅', ar: 'هيجدد', en: 'Will renew' },
  { key: 'call_back', icon: '⏳', ar: 'كلمه تاني', en: 'Call back' },
  { key: 'no_answer', icon: '📵', ar: 'مردش', en: 'No answer' },
  { key: 'not_interested', icon: '🚫', ar: 'مش مهتم', en: 'Not interested' },
  { key: 'wrong_number', icon: '❓', ar: 'الرقم غلط', en: 'Wrong number' },
];

export function outcomeLabel(key, locale = 'ar') {
  const o = FOLLOW_UP_OUTCOMES.find(x => x.key === key);
  if (!o) return key || '';
  return `${o.icon} ${locale === 'en' ? o.en : o.ar}`;
}

/** Whole days from a date to `now`; null when the date is missing. */
export function daysSince(value, nowMs = Date.now()) {
  const d = toDate(value);
  if (!d) return null;
  return Math.max(0, Math.floor((nowMs - d.getTime()) / MS_PER_DAY));
}

/** Start of the day `days` days ago, local time — the lower bound of a window. */
export function daysAgoStart(days, nowMs = Date.now()) {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

const RENEWED_STATUSES = new Set(['active', 'frozen']);

/**
 * Is the member behind this expired subscription still un-renewed?
 *
 * False when the member is gone/archived, is active or frozen again, or carries
 * a later end date than this sub (a newer subscription exists). A day of slack
 * on the end date keeps a same-day edit from hiding a genuinely lapsed member.
 */
export function isStillLapsed(sub, member, nowMs = Date.now()) {
  if (!sub || !member) return false;
  if (member.status === 'archived' || member.deleted) return false;
  if (RENEWED_STATUSES.has(member.status)) return false;
  const subEnd = toDate(sub.endDate);
  const memberEnd = toDate(member.endDate);
  if (memberEnd && memberEnd.getTime() > nowMs) return false;
  if (subEnd && memberEnd && memberEnd.getTime() > subEnd.getTime() + MS_PER_DAY) return false;
  return true;
}

/**
 * Turn one page of expired subscriptions into call-list rows.
 *
 * @param {Array} subs           status == 'expired', newest endDate first
 * @param {Map}   membersById    member id -> member doc
 * @param {Set}   [seen]         member ids already listed on earlier pages;
 *                               updated in place so a member with two expired
 *                               subs is listed once, under the newest.
 */
export function buildLapsedRows(subs, membersById, { nowMs = Date.now(), seen = new Set() } = {}) {
  const rows = [];
  for (const sub of subs || []) {
    if (!sub?.memberId || seen.has(sub.memberId)) continue;
    const member = membersById?.get?.(sub.memberId);
    if (!isStillLapsed(sub, member, nowMs)) continue;
    seen.add(sub.memberId);
    rows.push({
      key: `lapsed-${sub.memberId}`,
      kind: 'lapsed',
      memberId: sub.memberId,
      member,
      subscriptionId: sub.id,
      planName: sub.planSnapshot?.name || member.currentPlan?.planName || member.planName || sub.planId || '',
      date: toDate(sub.endDate),
      days: daysSince(sub.endDate, nowMs),
    });
  }
  return rows;
}

/**
 * Turn one page of active members into "absent" rows. Members whose end date
 * has already passed are dropped — they belong on the lapsed list, and the
 * nightly expiry job will move them there.
 */
export function buildAbsentRows(members, { nowMs = Date.now(), seen = new Set() } = {}) {
  const rows = [];
  for (const member of members || []) {
    if (!member?.id || seen.has(member.id)) continue;
    if (member.status !== 'active') continue;
    const end = toDate(member.endDate);
    if (end && end.getTime() < nowMs) continue;
    seen.add(member.id);
    const last = toDate(member.lastVisit);
    rows.push({
      key: `absent-${member.id}`,
      kind: 'absent',
      memberId: member.id,
      member,
      planName: member.currentPlan?.planName || member.planName || '',
      date: last,
      days: last ? daysSince(last, nowMs) : null,
      endDate: end,
    });
  }
  return rows;
}

/** Newest follow-up per member, from any number of follow_ups docs. */
export function latestFollowUpByMember(followUps) {
  const out = new Map();
  for (const f of followUps || []) {
    if (!f?.memberId) continue;
    const at = toDate(f.createdAt)?.getTime() ?? 0;
    const prev = out.get(f.memberId);
    if (!prev || at > (toDate(prev.createdAt)?.getTime() ?? 0)) out.set(f.memberId, f);
  }
  return out;
}

export function isRecentlyContacted(followUp, nowMs = Date.now(), days = RECENT_CONTACT_DAYS) {
  const at = toDate(followUp?.createdAt);
  return !!at && nowMs - at.getTime() < days * MS_PER_DAY;
}

/**
 * Egyptian mobile → the international digits wa.me wants (no +, no 00).
 * 01012345678 → 201012345678. Returns '' for anything that is not a number.
 */
export function whatsappNumber(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('0')) p = `20${p.slice(1)}`;
  else if (p.length === 10 && p.startsWith('1')) p = `20${p}`;
  return p.length >= 10 ? p : '';
}

/** Digits safe for a tel: link (keeps a leading +). */
export function telHref(phone) {
  const p = String(phone || '').trim().replace(/[^\d+]/g, '');
  return p ? `tel:${p}` : '';
}

const firstName = (member, locale) => {
  const full = member?.fullName?.[locale] || member?.fullName?.ar || '';
  return full.trim().split(/\s+/)[0] || '';
};

/** The prefilled WhatsApp message, in the gym's own Egyptian Arabic. */
export function followUpMessage(row, { gymName = '', locale = 'ar' } = {}) {
  const name = firstName(row?.member, locale);
  const gym = gymName ? ` في ${gymName}` : '';
  if (locale === 'en') {
    const gymEn = gymName ? ` at ${gymName}` : '';
    return row?.kind === 'absent'
      ? `Hi ${name}, we haven't seen you${gymEn} for a while — hope all is well! Your subscription is still running, come back and train with us 💪`
      : `Hi ${name}, your subscription${gymEn} has ended. We'd love to have you back — reply here or drop by and we'll renew it for you 💪`;
  }
  return row?.kind === 'absent'
    ? `أهلاً يا ${name} 👋 وحشتنا${gym}! بقالك فترة مش بتيجي، يارب تكون بخير. اشتراكك لسه شغال، مستنيينك ترجع تتمرن معانا 💪`
    : `أهلاً يا ${name} 👋 اشتراكك${gym} خلص، ووحشتنا. لو حابب تجدد ابعتلنا هنا أو عدّي علينا وإحنا نجددهولك 💪`;
}

export function whatsappHref(row, opts) {
  const num = whatsappNumber(row?.member?.phone);
  if (!num) return '';
  return `https://wa.me/${num}?text=${encodeURIComponent(followUpMessage(row, opts))}`;
}
