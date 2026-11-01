// Unit tests for the scanner's offline check-in (roster, verdict, queue, storage).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickActiveSub, toRosterEntry, rosterEntryToMember, findInRoster, searchRoster,
  offlineVerdict, rosterAfterVisit, makeQueueEntry, visitsTodayFor, visitsAfter,
  loadRoster, saveRoster, loadQueue, saveQueue, isNetworkError, withTimeout, attendanceDateStr,
} from '../src/lib/offline-checkin.js';

const DAY = 86400000;
const now = Date.UTC(2026, 10, 1, 10);

const ts = (ms) => ({ toMillis: () => ms, toDate: () => new Date(ms) });

test('pickActiveSub: the end date decides, and the latest-ending live sub wins', () => {
  const subs = [
    { id: 'old', status: 'expired', endDate: ts(now + 5 * DAY) },   // stale status, still valid
    { id: 'long', status: 'active', endDate: ts(now + 20 * DAY) },
    { id: 'past', status: 'active', endDate: ts(now - DAY) },
  ];
  assert.equal(pickActiveSub(subs, now).id, 'long');
});

test('pickActiveSub: cancelled and renewed terms never let anyone in', () => {
  const subs = [
    { id: 'c', status: 'cancelled', endDate: ts(now + 9 * DAY) },
    { id: 'r', status: 'renewed', endDate: ts(now + 9 * DAY) },
    { id: 'r2', status: 'active', renewedToSubId: 'x', endDate: ts(now + 9 * DAY) },
  ];
  assert.equal(pickActiveSub(subs, now), null);
});

test('pickActiveSub judges at the time given, so a replay uses the visit time', () => {
  const subs = [{ id: 's', status: 'active', endDate: ts(now + DAY) }];
  assert.equal(pickActiveSub(subs, now + 2 * DAY), null);
  assert.equal(pickActiveSub(subs, now).id, 's');
});

const member = {
  id: 'm1', fullName: { ar: 'عمر علي النجار' }, membershipNumber: 'PT-2026-0001', qrCode: 'PT-2026-0001',
  phone: '0100', gender: 'male', planName: 'ذهبي', currentPlan: { type: 'gold' },
  accountPassword: 'secret', nationalId: '2990101', totalVisits: 4,
};
const sub = { id: 's1', status: 'active', endDate: ts(now + 10 * DAY), totalSessions: 12, remainingSessions: 3 };

test('roster entry keeps what the door needs and drops credentials', () => {
  const e = toRosterEntry(member, sub);
  assert.equal(e.sub.endMs, now + 10 * DAY);
  assert.equal(e.sub.remainingSessions, 3);
  assert.equal(JSON.stringify(e).includes('secret'), false);
  assert.equal(JSON.stringify(e).includes('2990101'), false);
});

test('findInRoster matches the code as typed and normalised', () => {
  const roster = { members: { m1: toRosterEntry(member, sub) } };
  assert.equal(findInRoster(roster, 'PT-2026-0001').id, 'm1');
  assert.equal(findInRoster(roster, ' pt-2026-0001 ').id, 'm1');
  assert.equal(findInRoster(roster, 'PT-2026-0002'), null);
  assert.equal(findInRoster(roster, ''), null);
});

test('searchRoster finds by any word of the name', () => {
  const roster = { members: { m1: toRosterEntry(member, sub) } };
  assert.equal(searchRoster(roster, 'النجار').length, 1);
  assert.equal(searchRoster(roster, 'محمد').length, 0);
});

test('offlineVerdict mirrors the door: expired, frozen, out of classes, third visit', () => {
  const e = toRosterEntry(member, sub);
  assert.deepEqual(offlineVerdict(e, now, 0), { ok: true });
  assert.equal(offlineVerdict(e, now + 11 * DAY, 0).reason, 'expired');
  assert.equal(offlineVerdict({ ...e, sub: { ...e.sub, status: 'frozen' } }, now, 0).reason, 'frozen');
  assert.equal(offlineVerdict({ ...e, sub: { ...e.sub, remainingSessions: 0 } }, now, 0).reason, 'no_sessions');
  assert.equal(offlineVerdict(e, now, 2).reason, 'twice');
  assert.equal(offlineVerdict({ ...e, sub: null }, now, 0).reason, 'expired');
});

test('diamond and month plans are not limited by classes', () => {
  const e = toRosterEntry(member, sub);
  assert.deepEqual(offlineVerdict({ ...e, planType: 'diamond', sub: { ...e.sub, remainingSessions: 0 } }, now, 0), { ok: true });
  assert.deepEqual(offlineVerdict({ ...e, sub: { ...e.sub, totalSessions: null, remainingSessions: null } }, now, 0), { ok: true });
});

test('rosterAfterVisit takes one class off a class plan only', () => {
  const roster = { builtAt: 1, members: { m1: toRosterEntry(member, sub) } };
  const after = rosterAfterVisit(roster, 'm1');
  assert.equal(after.members.m1.sub.remainingSessions, 2);
  assert.equal(after.members.m1.totalVisits, 5);
  assert.equal(roster.members.m1.sub.remainingSessions, 3, 'input not mutated');
  const monthly = { members: { m1: toRosterEntry(member, { ...sub, totalSessions: null, remainingSessions: null }) } };
  assert.equal(rosterAfterVisit(monthly, 'm1').members.m1.sub.remainingSessions, null);
  assert.equal(rosterAfterVisit(roster, 'nobody'), roster);
});

test('rosterEntryToMember reads as expired once the end date has passed', () => {
  const e = toRosterEntry(member, { ...sub, endDate: ts(Date.now() - DAY) });
  assert.equal(rosterEntryToMember(e).status, 'expired');
  const live = toRosterEntry(member, { ...sub, endDate: ts(Date.now() + DAY) });
  assert.equal(rosterEntryToMember(live).status, 'active');
});

test('visit counts reset on a new day', () => {
  let v = visitsAfter(null, 'm1', now);
  v = visitsAfter(v, 'm1', now + 1000);
  assert.equal(visitsTodayFor(v, 'm1', now), 2);
  assert.equal(visitsTodayFor(v, 'm1', now + DAY), 0);
  assert.equal(visitsAfter(v, 'm1', now + DAY).counts.m1, 1);
});

test('queue entries get unique ids', () => {
  const ids = new Set(Array.from({ length: 200 }, () => makeQueueEntry({ code: 'X', atMs: now }).id));
  assert.equal(ids.size, 200);
});

test('attendanceDateStr matches the online scan (UTC date)', () => {
  assert.equal(attendanceDateStr(Date.UTC(2026, 10, 1, 23, 30)), '2026-11-01');
});

test('storage round-trips and survives a broken storage', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  saveQueue(storage, 't', [{ id: 'a' }]);
  assert.deepEqual(loadQueue(storage, 't'), [{ id: 'a' }]);
  assert.deepEqual(loadQueue(storage, 'other'), []);
  const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
  assert.deepEqual(loadRoster(broken, 't'), { builtAt: 0, members: {} });
  assert.equal(saveRoster(broken, 't', {}), false);
  mem.set('pt-offline-queue:bad', '{not json');
  assert.deepEqual(loadQueue(storage, 'bad'), []);
});

test('isNetworkError tells an outage from a real failure', () => {
  assert.equal(isNetworkError({ code: 'unavailable' }), true);
  assert.equal(isNetworkError(new Error('Failed to get document because the client is offline.')), true);
  assert.equal(isNetworkError(new Error('no_sessions')), false);
  assert.equal(isNetworkError({ code: 'permission-denied', message: 'Missing permissions' }), false);
});

test('withTimeout rejects slow promises with a network-looking error', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 10), (e) => isNetworkError(e));
  assert.equal(await withTimeout(Promise.resolve(7), 50), 7);
});
