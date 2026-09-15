/**
 * Reconcile member.status with the newest subscription's status.
 *
 * Fixes the drift between /admin/subscriptions (counts subscription docs) and
 * /admin/members (counts member docs) — e.g. 425 vs 418 active. The gap happens
 * because:
 *   - A member can end up with two subscription rows both marked "active" (an
 *     old term the renewal flow didn't close, or a race).
 *   - The daily expire cron updates the subscription and then the member — if
 *     the member write throws (permissions, quota), the sub is expired but the
 *     member stays active.
 *   - Admins sometimes flip member.status manually without touching the sub.
 *
 * MATCHING IS BY ID ONLY — this script reads `subscription.memberId` and looks
 * up `members/{memberId}` directly. It NEVER looks at names, phones, or any
 * other field to identify a member, so it cannot conflate two similarly-named
 * people. If a subscription's memberId doesn't resolve to a member document,
 * the subscription is skipped and logged (never guessed).
 *
 * WHAT IT DOES, per member (grouped from the subscriptions collection):
 *   1. Sort that member's subs by createdAt desc → the newest one is authoritative.
 *   2. If the newest sub's status is active|expired|frozen, and member.status
 *      differs, update member.status to match. Nothing else on the member doc
 *      is touched.
 *   3. If more than one sub is currently "active" for the same member, keep
 *      the newest and mark the older ones as "renewed" (with renewedToSubId +
 *      renewedAt), which is what the renewal flow itself writes. This dedupes
 *      the count without losing history.
 *
 * WHAT IT DOES NOT DO:
 *   - Touch archived / deleted members.
 *   - Touch subscriptions whose status is renewed / cancelled.
 *   - Change any field other than status (and the two renewedTo / renewedAt
 *     fields when closing a duplicate active sub).
 *   - Change any member field other than status.
 *   - Delete anything.
 *
 * SAFETY:
 *   - Dry-run by default. Pass --confirm to actually write.
 *   - Per-tenant loop; pass --tenant=<id> to run on one gym only.
 *   - Batched writes, at most 400 ops per batch (Firestore's cap is 500).
 *   - Take a backup first:  node scripts/db-backup.js
 *
 * Usage:
 *   node scripts/reconcile-subscription-status.js                    # dry run, all tenants
 *   node scripts/reconcile-subscription-status.js --tenant=gr7       # dry run, one tenant
 *   node scripts/reconcile-subscription-status.js --confirm          # apply, all tenants
 *   node scripts/reconcile-subscription-status.js --tenant=gr7 --confirm
 */
const path = require('path');
const admin = require('firebase-admin');

const apply = process.argv.includes('--confirm');
const tenantArg = (process.argv.find(a => a.startsWith('--tenant=')) || '').split('=')[1] || null;

const key = require(path.join(__dirname, '..', 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json'));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const BATCH_LIMIT = 400;

function tsMillis(v) {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v instanceof Date) return v.getTime();
  return 0;
}

async function commitBatch(batch, ops) {
  if (ops === 0) return { batch: db.batch(), ops: 0 };
  await batch.commit();
  return { batch: db.batch(), ops: 0 };
}

async function reconcileTenant(tenantRef) {
  const tenantId = tenantRef.id;
  const membersSnap = await tenantRef.collection('members').get();
  const subsSnap = await tenantRef.collection('subscriptions').get();

  // memberId → member doc (source of truth for identity, matched by ID only).
  const members = new Map();
  for (const m of membersSnap.docs) members.set(m.id, m);

  // Group subs by memberId. Never touch archived members.
  const subsByMember = new Map();
  const orphanSubs = [];
  for (const s of subsSnap.docs) {
    const data = s.data();
    const memberId = data.memberId;
    if (!memberId) { orphanSubs.push({ id: s.id, reason: 'no memberId' }); continue; }
    const m = members.get(memberId);
    if (!m) { orphanSubs.push({ id: s.id, reason: `member ${memberId} not found` }); continue; }
    if ((m.data().status || '') === 'archived') continue;
    if (!subsByMember.has(memberId)) subsByMember.set(memberId, []);
    subsByMember.get(memberId).push(s);
  }

  const stats = {
    tenantId,
    membersScanned: members.size,
    subsScanned: subsSnap.size,
    membersFixed: 0,
    dupesClosed: 0,
    skipped: [],
    orphanSubs: orphanSubs.length,
  };

  let batch = db.batch();
  let ops = 0;

  for (const [memberId, subs] of subsByMember.entries()) {
    // Newest first — createdAt is the tie-breaker used everywhere else in the
    // app (scanner, member profile, renewal modal).
    subs.sort((a, b) => tsMillis(b.data().createdAt) - tsMillis(a.data().createdAt));
    const newest = subs[0];
    const newestStatus = newest.data().status;

    // 1) Close duplicate ACTIVE subs — keep the newest, mark the rest as
    // 'renewed' pointing at the newest. Renewal is what the app's own code
    // writes when a sub is superseded, so downstream reports stay coherent.
    const activeSubs = subs.filter(s => s.data().status === 'active');
    if (activeSubs.length > 1) {
      const winner = activeSubs[0]; // newest active
      for (let i = 1; i < activeSubs.length; i++) {
        const loser = activeSubs[i];
        console.log(
          `  ${apply ? 'FIX ' : 'DRY '} ${tenantId}/subscriptions/${loser.id} — status active → renewed (superseded by ${winner.id}, member ${memberId})`
        );
        if (apply) {
          batch.update(loser.ref, {
            status: 'renewed',
            renewedToSubId: winner.id,
            renewedAt: admin.firestore.Timestamp.now(),
            reconciledBy: 'reconcile-subscription-status',
            reconciledAt: admin.firestore.Timestamp.now(),
          });
          ops++;
          if (ops >= BATCH_LIMIT) ({ batch, ops } = await commitBatch(batch, ops));
        }
        stats.dupesClosed++;
      }
    }

    // 2) Align member.status with the newest sub's status. Only map the three
    // states that exist on both sides; anything else is skipped and logged
    // rather than guessed.
    const memberDoc = members.get(memberId);
    const memberStatus = memberDoc.data().status || null;
    const STATUS_MAP = { active: 'active', expired: 'expired', frozen: 'frozen' };
    const target = STATUS_MAP[newestStatus];

    if (!target) {
      // e.g. newest is 'renewed' or 'cancelled' — investigate, don't guess.
      stats.skipped.push({
        memberId,
        reason: `newest sub ${newest.id} has status='${newestStatus}' (not one of active/expired/frozen)`,
      });
      continue;
    }

    if (memberStatus !== target) {
      console.log(
        `  ${apply ? 'FIX ' : 'DRY '} ${tenantId}/members/${memberId} — status '${memberStatus}' → '${target}' (from sub ${newest.id})`
      );
      if (apply) {
        batch.update(memberDoc.ref, {
          status: target,
          reconciledBy: 'reconcile-subscription-status',
          reconciledAt: admin.firestore.Timestamp.now(),
        });
        ops++;
        if (ops >= BATCH_LIMIT) ({ batch, ops } = await commitBatch(batch, ops));
      }
      stats.membersFixed++;
    }
  }

  if (ops > 0 && apply) await batch.commit();

  return stats;
}

(async () => {
  const tenants = tenantArg
    ? [await db.collection('tenants').doc(tenantArg).get()].filter(d => d.exists)
    : (await db.collection('tenants').get()).docs;

  if (tenants.length === 0) {
    console.error(`No tenants matched${tenantArg ? ` --tenant=${tenantArg}` : ''}.`);
    process.exit(1);
  }

  console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`);
  console.log(`Tenants: ${tenants.map(t => t.id).join(', ')}\n`);

  let totalMembersFixed = 0, totalDupesClosed = 0, totalSkipped = 0, totalOrphans = 0;
  for (const t of tenants) {
    console.log(`\n=== Tenant ${t.id} ===`);
    const s = await reconcileTenant(t.ref);
    console.log(
      `  scanned: ${s.membersScanned} members, ${s.subsScanned} subs | ` +
      `${apply ? 'fixed' : 'would fix'} members: ${s.membersFixed} | ` +
      `${apply ? 'closed' : 'would close'} duplicate active subs: ${s.dupesClosed} | ` +
      `skipped: ${s.skipped.length} | orphan subs: ${s.orphanSubs}`
    );
    if (s.skipped.length) {
      console.log('  Skipped (investigate manually):');
      for (const x of s.skipped) console.log(`    - member ${x.memberId}: ${x.reason}`);
    }
    totalMembersFixed += s.membersFixed;
    totalDupesClosed += s.dupesClosed;
    totalSkipped += s.skipped.length;
    totalOrphans += s.orphanSubs;
  }

  console.log('\n---');
  console.log(
    `${apply ? 'Fixed' : 'Would fix'} ${totalMembersFixed} member(s), ` +
    `${apply ? 'closed' : 'would close'} ${totalDupesClosed} duplicate active sub(s), ` +
    `${totalSkipped} skipped, ${totalOrphans} orphan sub(s).`
  );
  if (!apply) console.log('Dry run only. Re-run with --confirm to apply (take a backup first).');
  process.exit(0);
})().catch((e) => { console.error('RECONCILE FAILED:', e); process.exit(1); });
