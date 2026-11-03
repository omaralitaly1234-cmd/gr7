// ============================================
// Power Time — Scheduled subscription-lifecycle jobs (Cloud Functions v2)
// The app's data model has autoRenew / renewalReminded / endDate fields that
// nothing acted on (expiry was only computed client-side on page load). These
// scheduled jobs are the missing server-side lifecycle enforcement.
//
// Deploy:  firebase deploy --only functions
// Requires the Blaze plan (already enabled) and a functions runtime.
// ============================================

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const { Timestamp } = admin.firestore;

const TZ = 'Africa/Cairo';
const DAY_MS = 86400000;

// Midnight in Cairo at the start of the day `ms` falls on. A copy of
// startOfGymDayMs in src/lib/subscription-end.js (this package cannot import
// the app's ES modules) — keep the two in step.
const wallFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
});
function cairoOffsetMs(ms) {
  const p = {};
  for (const { type, value } of wallFmt.formatToParts(ms)) p[type] = Number(value);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - (ms - (((ms % 1000) + 1000) % 1000));
}
function startOfGymDayMs(ms) {
  const wallMidnight = Math.floor((ms + cairoOffsetMs(ms)) / DAY_MS) * DAY_MS;
  return wallMidnight - cairoOffsetMs(wallMidnight - cairoOffsetMs(ms));
}

/**
 * Daily: expire member subscriptions (and their member docs) and tenant SaaS
 * subscriptions whose end date has passed. A member keeps the whole of the
 * day their subscription ends on, so only end dates before today (Cairo) are
 * expired — one ending on the 1st, at any hour, is expired on the 2nd.
 * Requires the collection-group index subscriptions(status ASC, endDate ASC),
 * which is present in firestore.indexes.json.
 */
exports.expireSubscriptions = onSchedule({ schedule: 'every day 02:00', timeZone: TZ }, async () => {
  const now = Timestamp.now();
  const startOfToday = Timestamp.fromMillis(startOfGymDayMs(now.toMillis()));

  // 1) Member subscriptions whose last day was yesterday or earlier.
  const subs = await db
    .collectionGroup('subscriptions')
    .where('status', '==', 'active')
    .where('endDate', '<', startOfToday)
    .get();

  let expiredSubs = 0;
  for (const doc of subs.docs) {
    const tenantRef = doc.ref.parent.parent; // tenants/{tenantId}
    const memberId = doc.data().memberId;
    await doc.ref.update({ status: 'expired', updatedAt: now });
    if (tenantRef && memberId) {
      await tenantRef.collection('members').doc(memberId)
        .update({ status: 'expired' })
        .catch((e) => logger.warn(`member ${memberId} expire skipped: ${e.message}`));
    }
    expiredSubs++;
  }

  // 2) Tenant (gym) SaaS subscriptions past their end date.
  const tenants = await db.collection('tenants').where('status', 'in', ['active', 'trial']).get();
  let expiredTenants = 0;
  for (const t of tenants.docs) {
    const end = t.data().subscription && t.data().subscription.endDate;
    if (end && typeof end.toMillis === 'function' && end.toMillis() < Date.now()) {
      await t.ref.update({ status: 'expired', updatedAt: now });
      expiredTenants++;
    }
  }

  logger.info(`expireSubscriptions: expired ${expiredSubs} member subs, ${expiredTenants} tenants`);
});

/**
 * Daily: send a renewal reminder to members whose active subscription expires
 * within the next 7 days, once (guarded by renewalReminded).
 */
exports.sendRenewalReminders = onSchedule({ schedule: 'every day 09:00', timeZone: TZ }, async () => {
  const nowMs = Date.now();
  const nowTs = Timestamp.fromMillis(nowMs);
  const in7Ts = Timestamp.fromMillis(nowMs + 7 * 86400000);

  const subs = await db
    .collectionGroup('subscriptions')
    .where('status', '==', 'active')
    .where('endDate', '>=', nowTs)
    .where('endDate', '<=', in7Ts)
    .get();

  let reminded = 0;
  for (const doc of subs.docs) {
    const sub = doc.data();
    if (sub.renewalReminded) continue;
    const tenantRef = doc.ref.parent.parent;
    if (!tenantRef || !sub.memberId) continue;

    // Notification title/body are plain strings elsewhere in the app (default
    // locale is Arabic) — keep the same shape to avoid client render issues.
    await tenantRef.collection('notifications').add({
      memberId: sub.memberId,
      type: 'renewal-reminder',
      title: 'تذكير بتجديد الاشتراك',
      body: 'اشتراكك على وشك الانتهاء خلال أيام. جدّد الآن لتجنّب انقطاع الخدمة.',
      icon: '⏰',
      read: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await doc.ref.update({ renewalReminded: true });
    reminded++;
  }

  logger.info(`sendRenewalReminders: sent ${reminded} reminders`);
});
