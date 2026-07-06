/**
 * One-off migration: normalize members.endDate from a lossy locale STRING to a
 * proper Firestore Timestamp, sourced from the member's active subscription
 * (the source of truth) — NOT by parsing the old string, which is locale-garbled
 * and unreliable.
 *
 * SAFE BY DEFAULT: dry-run. Prints what it would change and writes nothing.
 * Pass --confirm to apply. TAKE A BACKUP FIRST:  node scripts/db-backup.js
 *
 * Usage:
 *   node scripts/migrate-normalize-member-enddate.js            # dry run
 *   node scripts/migrate-normalize-member-enddate.js --confirm  # apply
 */
const path = require('path');
const admin = require('firebase-admin');

const apply = process.argv.includes('--confirm');
const key = require(path.join(__dirname, '..', 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json'));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

function isTimestamp(v) {
  return v && typeof v === 'object' && typeof v.toDate === 'function';
}

(async () => {
  const tenants = await db.collection('tenants').get();
  let scanned = 0, wouldChange = 0, changed = 0, skipped = 0;

  for (const tenant of tenants.docs) {
    const membersSnap = await tenant.ref.collection('members').get();
    for (const member of membersSnap.docs) {
      scanned++;
      const data = member.data();
      // Already a proper Timestamp → nothing to do.
      if (isTimestamp(data.endDate)) { continue; }

      // Prefer the active subscription's endDate; fall back to currentPlan.endDate.
      let newEnd = null;
      const subs = await tenant.ref.collection('subscriptions')
        .where('memberId', '==', member.id)
        .where('status', '==', 'active')
        .limit(1).get();
      if (!subs.empty && isTimestamp(subs.docs[0].data().endDate)) {
        newEnd = subs.docs[0].data().endDate;
      } else if (isTimestamp(data.currentPlan && data.currentPlan.endDate)) {
        newEnd = data.currentPlan.endDate;
      }

      if (!newEnd) {
        skipped++;
        console.log(`  SKIP  ${tenant.id}/${member.id} — no source Timestamp (old endDate: ${JSON.stringify(data.endDate)})`);
        continue;
      }

      wouldChange++;
      console.log(`  ${apply ? 'FIX ' : 'DRY '} ${tenant.id}/${member.id} — endDate ${JSON.stringify(data.endDate)} -> ${newEnd.toDate().toISOString()}`);
      if (apply) {
        await member.ref.update({ endDate: newEnd });
        changed++;
      }
    }
  }

  console.log('---');
  console.log(`scanned ${scanned} members | ${apply ? 'changed' : 'would change'}: ${apply ? changed : wouldChange} | skipped (no source): ${skipped}`);
  if (!apply) console.log('Dry run only. Re-run with --confirm to apply (after a backup).');
  process.exit(0);
})().catch((e) => { console.error('MIGRATION FAILED:', e); process.exit(1); });
