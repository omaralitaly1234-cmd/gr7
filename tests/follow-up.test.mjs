// The follow-up desk decides who gets a call. A wrong "still lapsed" verdict
// means the desk phones someone who renewed yesterday, so pin it down.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStillLapsed, buildLapsedRows, buildAbsentRows, latestFollowUpByMember,
  isRecentlyContacted, whatsappNumber, whatsappHref, followUpMessage, telHref,
  daysAgoStart, daysSince, outcomeLabel,
} from '../src/lib/follow-up.js';

const NOW = new Date(2026, 9, 27, 12).getTime();
const day = (n) => new Date(NOW + n * 86400000);

const expiredSub = (memberId, endOffset, id = `s-${memberId}`) => ({
  id, memberId, status: 'expired', endDate: day(endOffset),
  planSnapshot: { name: { ar: 'ذهبي — شهري', en: 'Gold — Monthly' } },
});

test('an expired member with no newer subscription is still lapsed', () => {
  const m = { id: 'm1', status: 'expired', endDate: day(-5) };
  assert.equal(isStillLapsed(expiredSub('m1', -5), m, NOW), true);
});

test('a member who renewed (active, frozen, or later end date) is not lapsed', () => {
  const sub = expiredSub('m1', -5);
  assert.equal(isStillLapsed(sub, { status: 'active', endDate: day(25) }, NOW), false);
  assert.equal(isStillLapsed(sub, { status: 'frozen', endDate: day(25) }, NOW), false);
  // member.status drifted back to 'expired' but the end date says a newer term ran
  assert.equal(isStillLapsed(sub, { status: 'expired', endDate: day(-1) }, NOW), false);
  // still has days left according to the member doc
  assert.equal(isStillLapsed(sub, { status: 'expired', endDate: day(3) }, NOW), false);
});

test('archived or missing members are never listed', () => {
  assert.equal(isStillLapsed(expiredSub('m1', -5), { status: 'archived' }, NOW), false);
  assert.equal(isStillLapsed(expiredSub('m1', -5), undefined, NOW), false);
});

test('lapsed rows list each member once, under the newest expired sub', () => {
  const members = new Map([
    ['m1', { id: 'm1', status: 'expired', endDate: day(-3) }],
    ['m2', { id: 'm2', status: 'active', endDate: day(20) }],
  ]);
  const seen = new Set();
  const rows = buildLapsedRows(
    [expiredSub('m1', -3, 'a'), expiredSub('m2', -4), expiredSub('m1', -40, 'b')],
    members, { nowMs: NOW, seen });
  assert.deepEqual(rows.map(r => [r.memberId, r.subscriptionId, r.days]), [['m1', 'a', 3]]);
  // the next page must not list m1 again
  assert.equal(buildLapsedRows([expiredSub('m1', -50, 'c')], members, { nowMs: NOW, seen }).length, 0);
});

test('absent rows keep active members, drop ones already past their end date', () => {
  const rows = buildAbsentRows([
    { id: 'a', status: 'active', endDate: day(20), lastVisit: day(-12) },
    { id: 'b', status: 'active', endDate: day(-1), lastVisit: day(-30) },
    { id: 'c', status: 'frozen', endDate: day(20), lastVisit: day(-30) },
    { id: 'd', status: 'active', endDate: day(20), lastVisit: null },
  ], { nowMs: NOW });
  assert.deepEqual(rows.map(r => [r.memberId, r.days]), [['a', 12], ['d', null]]);
});

test('the newest follow-up wins, and only one inside 7 days counts as recent', () => {
  const latest = latestFollowUpByMember([
    { memberId: 'm1', outcome: 'no_answer', createdAt: day(-9) },
    { memberId: 'm1', outcome: 'will_renew', createdAt: day(-2) },
    { memberId: 'm2', outcome: 'no_answer', createdAt: day(-8) },
  ]);
  assert.equal(latest.get('m1').outcome, 'will_renew');
  assert.equal(isRecentlyContacted(latest.get('m1'), NOW), true);
  assert.equal(isRecentlyContacted(latest.get('m2'), NOW), false);
  assert.equal(isRecentlyContacted(undefined, NOW), false);
});

test('Egyptian numbers become wa.me digits', () => {
  assert.equal(whatsappNumber('01012345678'), '201012345678');
  assert.equal(whatsappNumber('+20 101 234 5678'), '201012345678');
  assert.equal(whatsappNumber('00201012345678'), '201012345678');
  assert.equal(whatsappNumber('201012345678'), '201012345678');
  assert.equal(whatsappNumber('1012345678'), '201012345678');
  assert.equal(whatsappNumber(''), '');
  assert.equal(whatsappNumber('123'), '');
  assert.equal(telHref('010 1234 5678'), 'tel:01012345678');
  assert.equal(telHref(''), '');
});

test('the WhatsApp link carries the Arabic renewal message', () => {
  const row = { kind: 'lapsed', member: { phone: '01012345678', fullName: { ar: 'أحمد محمد' } } };
  const href = whatsappHref(row, { gymName: 'باور تايم' });
  assert.ok(href.startsWith('https://wa.me/201012345678?text='));
  const text = decodeURIComponent(href.split('text=')[1]);
  assert.match(text, /أهلاً يا أحمد/);
  assert.match(text, /باور تايم/);
  assert.match(text, /تجدد/);
  assert.match(followUpMessage({ ...row, kind: 'absent' }), /وحشتنا/);
  assert.equal(whatsappHref({ kind: 'lapsed', member: {} }), '');
});

test('date helpers', () => {
  const start = daysAgoStart(7, NOW);
  assert.equal(start.getHours(), 0);
  assert.equal(daysSince(start, NOW), 7);
  assert.equal(daysSince(null, NOW), null);
  assert.equal(outcomeLabel('no_answer'), '📵 مردش');
  assert.equal(outcomeLabel('will_renew', 'en'), '✅ Will renew');
});
