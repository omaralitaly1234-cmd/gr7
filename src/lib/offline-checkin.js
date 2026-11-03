// ============================================
// Offline check-in at the scanner — the pure half (no Firebase imports, so it
// is unit-testable on its own).
//
// When the gym's internet drops, the front desk still has to let members in.
// The scanner keeps a small local copy of everyone who currently has a
// subscription (the "roster" — ~430 members, not the 5000-member collection),
// decides from it whether a code may enter, and queues the check-in on the
// device. When the connection comes back the queue is replayed through the same
// transaction an online scan uses; anything that would not have passed at the
// door (expired, out of classes, unknown code) lands in an issues list for the
// desk to follow up.
//
// Only what the desk needs at the door goes into browser storage: name, code,
// phone, plan and the subscription's dates/classes. Never the login password
// or national ID that the member document also holds.
// ============================================

import { normalizeCode } from './member-code.js';
import { memberMatchesName } from './name-search.js';
import { isWithinTerm } from './subscription-end.js';

/** Rebuild the roster when it is older than this (while online). */
export const ROSTER_MAX_AGE_MS = 2 * 60 * 60 * 1000;

const ROSTER_KEY = (tenantId) => `pt-offline-roster:${tenantId}`;
const QUEUE_KEY = (tenantId) => `pt-offline-queue:${tenantId}`;
const ISSUES_KEY = (tenantId) => `pt-offline-issues:${tenantId}`;
const VISITS_KEY = (tenantId) => `pt-offline-visits:${tenantId}`;

function toMs(v) {
  if (!v) return null;
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const d = new Date(v).getTime();
  return Number.isNaN(d) ? null : d;
}

/**
 * The subscription that lets this member in at `atMs`, or null.
 *
 * The member doc's status is denormalised and can be stale, and so can a sub's
 * own status, so the end date decides — on the newest few subs, and the member
 * keeps the whole of its last day (isWithinTerm). A cancelled sub is a real
 * cancellation, and a renewed one was replaced by its renewal. Of the survivors
 * the one ending last wins.
 */
export function pickActiveSub(subs, atMs) {
  return (subs || [])
    .filter(s => isWithinTerm(toMs(s.endDate), atMs) && s.status !== 'cancelled'
      && s.status !== 'renewed' && !s.renewedToSubId)
    .sort((a, b) => (toMs(b.endDate) || 0) - (toMs(a.endDate) || 0))[0] || null;
}

/** The attendance doc id's date part — same derivation as an online scan. */
export function attendanceDateStr(atMs) {
  return new Date(atMs).toISOString().split('T')[0];
}

/** Minimal, storable copy of a member and their active subscription. */
export function toRosterEntry(member, sub) {
  return {
    id: member.id,
    fullName: member.fullName || null,
    membershipNumber: member.membershipNumber || '',
    qrCode: member.qrCode || '',
    phone: member.phone || '',
    gender: member.gender || null,
    planName: member.planName || sub?.planSnapshot?.name?.ar || null,
    planType: member.currentPlan?.type || sub?.planSnapshot?.type || null,
    balanceDue: member.balanceDue || 0,
    totalVisits: member.totalVisits || 0,
    sub: sub ? {
      id: sub.id,
      status: sub.status || 'active',
      endMs: toMs(sub.endDate),
      totalSessions: sub.totalSessions ?? null,
      remainingSessions: sub.remainingSessions ?? null,
    } : null,
  };
}

/** A roster entry shaped like a member doc, for the scanner's member card. */
export function rosterEntryToMember(entry) {
  const active = entry.sub && isWithinTerm(entry.sub.endMs, Date.now());
  return {
    id: entry.id,
    fullName: entry.fullName,
    membershipNumber: entry.membershipNumber,
    qrCode: entry.qrCode,
    phone: entry.phone,
    gender: entry.gender,
    planName: entry.planName,
    currentPlan: { type: entry.planType },
    balanceDue: entry.balanceDue,
    totalVisits: entry.totalVisits,
    endDate: entry.sub?.endMs || null,
    status: !active ? 'expired' : entry.sub.status === 'frozen' ? 'frozen' : 'active',
  };
}

/** Find a scanned/typed code in the roster: as given, then normalised. */
export function findInRoster(roster, rawCode) {
  const raw = String(rawCode || '').trim();
  const norm = normalizeCode(rawCode);
  if (!raw && !norm) return null;
  for (const entry of Object.values(roster?.members || {})) {
    for (const code of [entry.membershipNumber, entry.qrCode]) {
      if (!code) continue;
      if (code === raw || normalizeCode(code) === norm) return entry;
    }
  }
  return null;
}

/** Members whose name matches every word typed, for check-in by name offline. */
export function searchRoster(roster, queryText, limit = 8) {
  const out = [];
  for (const entry of Object.values(roster?.members || {})) {
    if (memberMatchesName(entry, queryText)) out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * May this roster entry come in right now, without asking the server?
 * Mirrors the online scan: frozen and expired are turned away, a class plan
 * with no classes left is turned away (diamond is unlimited), and nobody gets
 * a third visit in one day.
 *
 * @returns {{ ok: true } | { ok: false, reason: 'expired'|'frozen'|'no_sessions'|'twice' }}
 */
export function offlineVerdict(entry, atMs, visitsToday = 0) {
  const sub = entry?.sub;
  if (!sub || !isWithinTerm(sub.endMs, atMs)) return { ok: false, reason: 'expired' };
  if (sub.status === 'frozen') return { ok: false, reason: 'frozen' };
  if (visitsToday >= 2) return { ok: false, reason: 'twice' };
  const counted = entry.planType !== 'diamond' && sub.totalSessions !== null && sub.totalSessions !== undefined;
  if (counted && (sub.remainingSessions || 0) <= 0) return { ok: false, reason: 'no_sessions' };
  return { ok: true };
}

/** The roster after this device let `memberId` in offline: one class fewer. */
export function rosterAfterVisit(roster, memberId) {
  const entry = roster?.members?.[memberId];
  if (!entry) return roster;
  const sub = entry.sub;
  const counted = sub && entry.planType !== 'diamond' && sub.totalSessions !== null && sub.totalSessions !== undefined;
  return {
    ...roster,
    members: {
      ...roster.members,
      [memberId]: {
        ...entry,
        totalVisits: (entry.totalVisits || 0) + 1,
        sub: counted ? { ...sub, remainingSessions: Math.max(0, (sub.remainingSessions || 0) - 1) } : sub,
      },
    },
  };
}

let seq = 0;
/** A queued offline check-in. `id` is written onto the attendance doc so a replay is idempotent. */
export function makeQueueEntry({ code = '', memberId = null, memberName = '', verified = true, atMs = Date.now() }) {
  seq = (seq + 1) % 1e6;
  return {
    id: `off_${atMs.toString(36)}_${seq.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    code: String(code || ''),
    memberId,
    memberName,
    verified,
    at: atMs,
  };
}

/** Visits this device recorded today, per member — the offline "twice a day" check. */
export function visitsTodayFor(visits, memberId, atMs) {
  const today = attendanceDateStr(atMs);
  if (!visits || visits.date !== today) return 0;
  return visits.counts?.[memberId] || 0;
}

export function visitsAfter(visits, memberId, atMs) {
  const today = attendanceDateStr(atMs);
  const counts = visits && visits.date === today ? { ...visits.counts } : {};
  counts[memberId] = (counts[memberId] || 0) + 1;
  return { date: today, counts };
}

// ---- browser storage ------------------------------------------------------
// Every read/write is guarded: a private window or a full disk must never
// break the scanner — it just means no offline copy.

function read(storage, key, fallback) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadRoster = (s, t) => read(s, ROSTER_KEY(t), { builtAt: 0, members: {} });
export const saveRoster = (s, t, v) => write(s, ROSTER_KEY(t), v);
export const loadQueue = (s, t) => read(s, QUEUE_KEY(t), []);
export const saveQueue = (s, t, v) => write(s, QUEUE_KEY(t), v);
export const loadIssues = (s, t) => read(s, ISSUES_KEY(t), []);
export const saveIssues = (s, t, v) => write(s, ISSUES_KEY(t), v);
export const loadVisits = (s, t) => read(s, VISITS_KEY(t), { date: '', counts: {} });
export const saveVisits = (s, t, v) => write(s, VISITS_KEY(t), v);

/** True for the errors Firestore raises when it cannot reach the server. */
export function isNetworkError(err) {
  if (!err) return false;
  if (err.code === 'unavailable' || err.code === 'deadline-exceeded') return true;
  return /offline|network|timed? ?out|failed to get document/i.test(err.message || '');
}

/** Reject with a network-looking error if `promise` takes longer than `ms`. */
export function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const e = new Error('timeout');
        e.code = 'deadline-exceeded';
        reject(e);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
