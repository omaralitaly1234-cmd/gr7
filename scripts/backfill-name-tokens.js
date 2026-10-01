/**
 * Backfill members.nameTokens — the field that lets the admin find a member by
 * ANY word of their name ("النجار" finds "عمر علي النجار"). See
 * src/lib/name-search.js. New and edited members get it from the app; this
 * fills it in for everyone written before that (and the bulk imports).
 *
 * Touches only `nameTokens`, and only on members whose stored tokens differ
 * from what their current name produces — so re-running it is a no-op.
 *
 * SAFE BY DEFAULT: dry-run. Pass --confirm to apply. TAKE A BACKUP FIRST:
 *   node scripts/db-backup.js
 *
 * Usage:
 *   node scripts/backfill-name-tokens.js                      # dry run, all tenants
 *   node scripts/backfill-name-tokens.js --tenant=<id>        # dry run, one gym
 *   node scripts/backfill-name-tokens.js --confirm            # apply
 */
const path = require('path');
const admin = require('firebase-admin');

const apply = process.argv.includes('--confirm');
const tenantArg = (process.argv.find(a => a.startsWith('--tenant=')) || '').split('=')[1] || null;

const key = require(path.join(__dirname, '..', 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json'));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const BATCH_LIMIT = 400;

const sameTokens = (a, b) => Array.isArray(a) && a.length === b.length && a.every((t, i) => t === b[i]);

(async () => {
  // The app's own tokeniser, so the script and the pages can never disagree.
  const { nameSearchTokens, NAME_TOKENS_FIELD } = await import('../src/lib/name-search.js');

  const tenants = tenantArg
    ? [await db.collection('tenants').doc(tenantArg).get()]
    : (await db.collection('tenants').get()).docs;

  let scanned = 0, toUpdate = 0, written = 0;

  for (const tenant of tenants) {
    // Only the two fields needed — not the whole member doc.
    const snap = await tenant.ref.collection('members').select('fullName', NAME_TOKENS_FIELD).get();
    let batch = db.batch();
    let ops = 0;
    let tenantChanges = 0;

    for (const doc of snap.docs) {
      scanned++;
      const data = doc.data();
      const tokens = nameSearchTokens(data.fullName);
      if (sameTokens(data[NAME_TOKENS_FIELD], tokens)) continue;

      toUpdate++;
      tenantChanges++;
      if (tenantChanges <= 3) {
        console.log(`  ${apply ? 'SET' : 'DRY'} ${tenant.id}/${doc.id} "${data.fullName?.ar || ''}" → ${tokens.length} tokens`);
      }
      if (apply) {
        batch.update(doc.ref, { [NAME_TOKENS_FIELD]: tokens });
        if (++ops >= BATCH_LIMIT) {
          await batch.commit();
          written += ops;
          batch = db.batch();
          ops = 0;
        }
      }
    }
    if (apply && ops > 0) {
      await batch.commit();
      written += ops;
    }
    console.log(`tenant ${tenant.id}: ${snap.size} members, ${tenantChanges} ${apply ? 'updated' : 'need tokens'}`);
  }

  console.log('---');
  console.log(`scanned ${scanned} | ${apply ? `written ${written}` : `would write ${toUpdate}`}`);
  if (!apply) console.log('Dry run only. Re-run with --confirm to apply (after a backup).');
  process.exit(0);
})().catch((e) => { console.error('BACKFILL FAILED:', e); process.exit(1); });
