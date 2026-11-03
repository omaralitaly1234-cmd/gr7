'use client';

// ============================================
// The scanner's check-in against Firestore: one transaction shared by a live
// scan and by replaying the offline queue, plus the reads that build the
// offline roster. The decisions themselves live in src/lib/offline-checkin.js
// (pure, tested).
//
// The scanner reads from the SERVER here, never the client cache: with no
// connection a cached getDocs quietly returns an empty result, which read as
// "no such member" or "expired" and turned paying members away. A server read
// throws instead, and that error is what switches the desk to offline mode.
// ============================================

import {
  collection, query, where, orderBy, limit, doc,
  getDocsFromServer, getDocFromServer, runTransaction, Timestamp, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from './config';
import { getTenantPath, getTenantDocumentsByIds } from './firestore';
import { normalizeCode } from '@/lib/member-code';
import {
  pickActiveSub, toRosterEntry, attendanceDateStr, isNetworkError, withTimeout,
} from '@/lib/offline-checkin';
import { startOfGymDayMs } from '@/lib/subscription-end';

// How long a live scan waits on the server before treating the desk as offline.
export const SERVER_TIMEOUT_MS = 5000;

/** Member by check-in code, from the server. Throws when offline. */
export async function findMemberByCodeFromServer(tenantId, rawCode) {
  const attempts = [...new Set([String(rawCode || '').trim(), normalizeCode(rawCode)])].filter(Boolean);
  const path = getTenantPath(tenantId, 'members');
  for (const candidate of attempts) {
    for (const field of ['membershipNumber', 'qrCode']) {
      const snap = await getDocsFromServer(query(collection(db, path), where(field, '==', candidate), limit(1)));
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  }
  return null;
}

/** Member by id, from the server. Throws when offline. */
export async function getMemberFromServer(tenantId, memberId) {
  const snap = await getDocFromServer(doc(db, `${getTenantPath(tenantId, 'members')}/${memberId}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * The member's newest few subscriptions, from the server. Uses the deployed
 * (memberId ASC, createdAt DESC) index. Throws when offline.
 */
export async function recentSubsFromServer(tenantId, memberId) {
  const snap = await getDocsFromServer(query(
    collection(db, getTenantPath(tenantId, 'subscriptions')),
    where('memberId', '==', memberId), orderBy('createdAt', 'desc'), limit(5),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Record one visit. Up to TWO per day (morning + evening): slot 1 is the legacy
 * id `{memberId}_{date}`, slot 2 is `{memberId}_{date}_2`. Reading both by id
 * keeps this in a transaction, so a rapid double-scan still can't create three
 * rows or double-deduct a class.
 *
 * `clientId` goes on the attendance doc. A check-in that timed out may still
 * have committed; when the offline queue replays it, finding its own id on a
 * slot means it is already there, and nothing is written twice.
 *
 * Throws Error('already_checked_in_twice'), or Error('no_sessions') unless
 * `allowNoSessions` (a replay: the member already trained, so the visit is
 * recorded without a class and the caller flags it).
 */
export async function writeCheckIn({
  tenantId, member, activeSub, subscriptionStatus = 'active', atMs = Date.now(),
  clientId, locale = 'ar', offline = false, allowNoSessions = false, setLastVisit = true,
}) {
  // Diamond (unlimited) members skip the subscription write entirely.
  const activeSubId = member.currentPlan?.type !== 'diamond' ? (activeSub?.id || null) : null;
  const dateStr = attendanceDateStr(atMs);
  const slot1Ref = doc(db, `tenants/${tenantId}/attendance/${member.id}_${dateStr}`);
  const slot2Ref = doc(db, `tenants/${tenantId}/attendance/${member.id}_${dateStr}_2`);
  const memberRef = doc(db, `tenants/${tenantId}/members/${member.id}`);
  const subRef = activeSubId ? doc(db, `tenants/${tenantId}/subscriptions/${activeSubId}`) : null;
  const at = Timestamp.fromMillis(atMs);

  const result = {
    duplicate: false, visitSlot: 1, attendanceId: `${member.id}_${dateStr}`,
    sessionDeducted: false, noSessions: false, subTotalSessions: null, subRemainingAfter: null,
  };

  await runTransaction(db, async (tx) => {
    const [slot1Snap, slot2Snap] = await Promise.all([tx.get(slot1Ref), tx.get(slot2Ref)]);
    if (clientId && [slot1Snap, slot2Snap].some(s => s.exists() && s.data().clientCheckInId === clientId)) {
      result.duplicate = true;
      return;
    }
    if (slot1Snap.exists() && slot2Snap.exists()) throw new Error('already_checked_in_twice');
    const attendanceRef = slot1Snap.exists() ? slot2Ref : slot1Ref;
    result.visitSlot = slot1Snap.exists() ? 2 : 1;
    result.attendanceId = attendanceRef.id;

    if (subRef) {
      const subSnap = await tx.get(subRef);
      const sub = subSnap.exists() ? subSnap.data() : null;
      if (sub && sub.totalSessions !== null) {
        if ((sub.remainingSessions || 0) <= 0) {
          if (!allowNoSessions) throw new Error('no_sessions');
          result.noSessions = true;
        } else {
          tx.update(subRef, {
            usedSessions: (sub.usedSessions || 0) + 1,
            remainingSessions: (sub.remainingSessions || 1) - 1,
          });
          result.sessionDeducted = true;
          result.subTotalSessions = sub.totalSessions;
          result.subRemainingAfter = (sub.remainingSessions || 1) - 1;
        }
      }
    }

    tx.set(attendanceRef, {
      memberId: member.id,
      memberName: member.fullName?.[locale] || member.fullName?.ar,
      gender: member.gender,
      checkIn: at,
      method: 'qr_scan',
      subscriptionId: activeSubId || member.currentPlan?.planId || '',
      subscriptionStatus,
      sessionDeducted: result.sessionDeducted,
      visitSlot: result.visitSlot,
      clientCheckInId: clientId || null,
      ...(offline ? { offline: true, syncedAt: serverTimestamp() } : {}),
      createdAt: at,
      updatedAt: at,
    });
    tx.update(memberRef, {
      ...(setLastVisit ? { lastVisit: at } : {}),
      totalVisits: increment(1),
    });
  });

  return result;
}

/**
 * Everyone who can currently get in: subscriptions ending today or later (~430
 * at the live gym, a bounded range read — a sub ending earlier today still has
 * the rest of its last day), the winning one per member, and those members'
 * docs by id. Returns the roster object the scanner stores.
 */
export async function buildRoster(tenantId) {
  const nowMs = Date.now();
  const snap = await withTimeout(getDocsFromServer(query(
    collection(db, getTenantPath(tenantId, 'subscriptions')),
    where('endDate', '>=', Timestamp.fromMillis(startOfGymDayMs(nowMs))),
  )), 30000);

  const byMember = new Map();
  for (const d of snap.docs) {
    const s = { id: d.id, ...d.data() };
    if (!s.memberId) continue;
    if (!byMember.has(s.memberId)) byMember.set(s.memberId, []);
    byMember.get(s.memberId).push(s);
  }

  const members = await getTenantDocumentsByIds(tenantId, 'members', [...byMember.keys()]);
  const out = {};
  for (const [memberId, subs] of byMember) {
    const member = members.get(memberId);
    const sub = pickActiveSub(subs, nowMs);
    if (member && sub && member.status !== 'archived') out[memberId] = toRosterEntry(member, sub);
  }
  return { builtAt: nowMs, members: out };
}

/**
 * Replay queued offline check-ins, oldest first, each through `writeCheckIn`
 * at its original time. Stops at the first network error and leaves the rest
 * queued. Anything that would not have passed at the door is still recorded —
 * the member did come in — and reported as an issue.
 *
 * @returns {{ done: string[], issues: object[], offline: boolean }}
 */
export async function replayQueue(tenantId, queue, { locale = 'ar' } = {}) {
  const done = [];
  const issues = [];
  const issue = (entry, reason, member) => issues.push({
    id: entry.id, at: entry.at, code: entry.code, reason,
    memberId: member?.id || entry.memberId || null,
    memberName: member?.fullName?.[locale] || member?.fullName?.ar || entry.memberName || '',
    membershipNumber: member?.membershipNumber || entry.code || '',
  });

  for (const entry of queue) {
    let member = null;
    try {
      member = entry.memberId
        ? await getMemberFromServer(tenantId, entry.memberId)
        : await findMemberByCodeFromServer(tenantId, entry.code);
      if (!member) {
        issue(entry, 'not_found', null);
        done.push(entry.id);
        continue;
      }
      const subs = await recentSubsFromServer(tenantId, member.id);
      const activeSub = pickActiveSub(subs, entry.at);
      const status = !activeSub ? 'expired' : activeSub.status === 'frozen' ? 'frozen' : 'active';
      const lastMs = member.lastVisit?.toMillis ? member.lastVisit.toMillis() : 0;

      const res = await writeCheckIn({
        tenantId, member, activeSub: status === 'active' ? activeSub : null, subscriptionStatus: status,
        atMs: entry.at, clientId: entry.id, locale, offline: true, allowNoSessions: true,
        setLastVisit: entry.at > lastMs,
      });
      if (!res.duplicate) {
        if (status !== 'active') issue(entry, status, member);
        else if (res.noSessions) issue(entry, 'no_sessions', member);
      }
      done.push(entry.id);
    } catch (err) {
      if (isNetworkError(err)) return { done, issues, offline: true };
      issue(entry, err.message === 'already_checked_in_twice' ? 'third_visit' : 'error', member);
      done.push(entry.id);
    }
  }
  return { done, issues, offline: false };
}
