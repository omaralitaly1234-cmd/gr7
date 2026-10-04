/**
 * One-off data fix: imported "12 كلاس 3 شهور" subscriptions were given 12
 * sessions instead of 36.
 *
 * The gym's plan "ذهبي_ 12 كلاس 3شهور" is 12 classes a month for 3 months —
 * 36 sessions over 90 days (membership_plans, 1800 EGP), and that is what every
 * subscription sold through the app carries. The bulk import scripts
 * (import-members / resume-import / apply-delta) mapped the same plan to
 * planId `gold-12sessions-3m` with `sessions: 12`, so imported members ran out
 * after a month and the scanner refused them with "no sessions left".
 *
 * Fixes ACTIVE and FROZEN `gold-12sessions-3m` subscriptions only (expired
 * ones are done with): totalSessions → 36 and remainingSessions → 36 − used.
 * Sessions already used are kept as they are. Subscriptions already at 36 are
 * skipped, so re-running is a no-op.
 *
 * The previous values are written to _db-backups/ before anything changes.
 *
 * Usage:
 *   node scripts/fix-12class-3m-sessions.js            # dry run
 *   node scripts/fix-12class-3m-sessions.js --confirm  # apply
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const apply = process.argv.includes('--confirm');
const key = require(path.join(__dirname, '..', 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json'));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const PLAN_ID = 'gold-12sessions-3m';
const CORRECT_TOTAL = 36;

(async () => {
  const tenants = (await db.collection('tenants').get()).docs;
  const changes = [];

  for (const tenant of tenants) {
    const snap = await tenant.ref.collection('subscriptions')
      .where('planId', '==', PLAN_ID)
      .where('status', 'in', ['active', 'frozen'])
      .get();

    for (const doc of snap.docs) {
      const s = doc.data();
      if (s.totalSessions === CORRECT_TOTAL) continue;
      const used = Number(s.usedSessions) || 0;
      const member = s.memberId ? (await tenant.ref.collection('members').doc(s.memberId).get()).data() : null;
      changes.push({
        ref: doc.ref,
        path: doc.ref.path,
        member: member?.fullName?.ar || s.memberId,
        before: { totalSessions: s.totalSessions, usedSessions: s.usedSessions, remainingSessions: s.remainingSessions },
        after: { totalSessions: CORRECT_TOTAL, remainingSessions: Math.max(0, CORRECT_TOTAL - used) },
      });
    }
  }

  for (const c of changes) {
    console.log(`  ${apply ? 'FIX' : 'DRY'} ${c.member} — used ${c.before.usedSessions}, ` +
      `total ${c.before.totalSessions}→${c.after.totalSessions}, remaining ${c.before.remainingSessions}→${c.after.remainingSessions}`);
  }

  if (apply && changes.length) {
    const dir = path.join(__dirname, '..', '_db-backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `fix-12class-3m-sessions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(file, JSON.stringify(changes.map(({ ref, ...rest }) => rest), null, 2));
    console.log(`previous values saved to ${file}`);

    const batch = db.batch();
    changes.forEach(c => batch.update(c.ref, c.after));
    await batch.commit();
  }

  console.log('---');
  console.log(`${apply ? 'fixed' : 'would fix'} ${changes.length} subscription(s)`);
  if (!apply) console.log('Dry run only. Re-run with --confirm to apply.');
  process.exit(0);
})().catch((e) => { console.error('FIX FAILED:', e); process.exit(1); });
