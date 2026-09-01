/**
 * Analyze delta between the new Sept-2026 files and the current Firestore DB.
 * Read-only: writes nothing, only prints what would change.
 */

const admin = require('firebase-admin');
const XLSX  = require('xlsx');
const path  = require('path');

const TENANT_ID = 'XFpPXmCqzgOeLOgjGhSR';
const PROJECT_ROOT = 'D:/سيستم الجيم ( باك اب للشغل )/power time mangment system';
const SA_PATH = path.join(PROJECT_ROOT, 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json');

const ACTIVE_FILE  = 'C:/Users/Elnagar0/Downloads/الاشتراكات النشطة حاليآ حتى تاريخ 1-9-2026 .xlsx';
const EXPIRED_FILE = 'C:/Users/Elnagar0/Downloads/الاشتراكات المنتهية و غير مجددة حتى تاريخ 1-9-2026.xlsx';

const sa = require(SA_PATH);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (val.getFullYear() >= 2000 && val.getFullYear() <= 2100) return val;
    return null;
  }
  if (typeof val === 'number') {
    const d = new Date(new Date(1899, 11, 30).getTime() + val * 86400000);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) return d;
    return null;
  }
  const d = new Date(val.toString().trim());
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100) return d;
  return null;
}

const ymd = (d) => d ? d.toISOString().slice(0, 10) : '';

async function main() {
  console.log('▶ Reading new active file...');
  const wbA = XLSX.readFile(ACTIVE_FILE, { cellDates: true });
  const activeRows = XLSX.utils.sheet_to_json(wbA.Sheets[wbA.SheetNames[0]], { defval: '' });

  console.log('▶ Reading new expired file...');
  const wbE = XLSX.readFile(EXPIRED_FILE, { cellDates: true });
  const expiredRows = XLSX.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { defval: '' });

  // Normalize rows into a common shape indexed by (playerCode, subCode)
  const newRecords = new Map(); // key = `${playerCode}|${subCode}`, value = row info
  const playersInNew = new Map(); // playerCode → { latestEndDate, isActive, name }

  function upsert(row, fileStatus) {
    const vals = Object.values(row);
    let playerCode, playerName, subCode, planType, section, phone, startRaw, endRaw;

    if (fileStatus === 'active') {
      [playerCode, playerName, section, planType, startRaw, endRaw, phone, , , subCode] = vals;
    } else {
      [playerCode, playerName, subCode, planType, section, phone, startRaw, endRaw] = vals;
    }

    playerCode = (playerCode || '').toString().trim();
    playerName = (playerName || '').toString().trim();
    subCode = (subCode || '').toString().trim();
    if (!playerCode || !playerName) return;

    const startDate = parseDate(startRaw);
    const endDate   = parseDate(endRaw);

    const key = `${playerCode}|${subCode}`;
    newRecords.set(key, {
      playerCode, playerName, subCode, planType: (planType||'').toString().trim(),
      section: (section||'').toString().trim(), phone: (phone||'').toString().trim(),
      startDate, endDate, fileStatus,
    });

    const cur = playersInNew.get(playerCode);
    if (!cur || (endDate && cur.latestEndDate && endDate > cur.latestEndDate)) {
      playersInNew.set(playerCode, {
        latestEndDate: endDate,
        isActive: fileStatus === 'active',
        name: playerName,
      });
    } else if (!cur) {
      playersInNew.set(playerCode, {
        latestEndDate: endDate,
        isActive: fileStatus === 'active',
        name: playerName,
      });
    }
  }

  activeRows.forEach(r => upsert(r, 'active'));
  expiredRows.forEach(r => upsert(r, 'expired'));

  console.log(`   Unique (playerCode, subCode) records in new files: ${newRecords.size}`);
  console.log(`   Unique player codes in new files: ${playersInNew.size}`);

  // Load current DB state
  console.log('\n▶ Loading current members from Firestore...');
  const membersSnap = await db.collection(`tenants/${TENANT_ID}/members`).get();
  console.log(`   ${membersSnap.size} members currently in DB`);

  const dbMembersByCode = new Map(); // playerCode → doc
  membersSnap.forEach(doc => {
    const d = doc.data();
    const code = (d.originalPlayerCode || d.membershipNumber || '').toString().trim();
    if (code) dbMembersByCode.set(code, { id: doc.id, ...d });
  });

  console.log(`   ${dbMembersByCode.size} members indexed by playerCode`);

  console.log('\n▶ Loading current subscriptions from Firestore...');
  const subsSnap = await db.collection(`tenants/${TENANT_ID}/subscriptions`).get();
  console.log(`   ${subsSnap.size} subscription docs in DB`);

  // Index subs by memberId → array of { id, startDate, endDate, status, originalSubCode }
  const subsByMember = new Map();
  subsSnap.forEach(doc => {
    const d = doc.data();
    const mid = d.memberId;
    if (!mid) return;
    if (!subsByMember.has(mid)) subsByMember.set(mid, []);
    subsByMember.get(mid).push({
      id: doc.id,
      startDate: d.startDate?.toDate ? d.startDate.toDate() : null,
      endDate: d.endDate?.toDate ? d.endDate.toDate() : null,
      status: d.status,
      originalSubCode: d.originalSubCode || null,
    });
  });

  // Categorize
  const newMembers = [];       // in new file, no member in DB
  const newRenewals = [];      // player exists in DB but this (start,end) sub doesn't
  const alreadyPresent = [];   // (playerCode, subCode) already in DB (start+end match)
  const memberStatusChanges = []; // member status differs from newest computed status

  for (const [key, rec] of newRecords) {
    const dbMember = dbMembersByCode.get(rec.playerCode);
    if (!dbMember) {
      newMembers.push(rec);
      continue;
    }
    const existingSubs = subsByMember.get(dbMember.id) || [];
    const startY = rec.startDate ? ymd(rec.startDate) : '';
    const endY   = rec.endDate ? ymd(rec.endDate) : '';
    const matched = existingSubs.find(s =>
      ymd(s.startDate) === startY && ymd(s.endDate) === endY
    );
    if (matched) {
      alreadyPresent.push({ ...rec, dbSubId: matched.id, dbSubStatus: matched.status });
    } else {
      newRenewals.push({ ...rec, memberId: dbMember.id });
    }
  }

  // For every player in new file, decide correct status
  for (const [code, info] of playersInNew) {
    const dbMember = dbMembersByCode.get(code);
    if (!dbMember) continue;
    const desiredStatus = info.isActive ? 'active' : 'expired';
    if (dbMember.status !== desiredStatus) {
      memberStatusChanges.push({
        playerCode: code, name: info.name,
        oldStatus: dbMember.status, newStatus: desiredStatus,
      });
    }
  }

  // Players in DB not in new files (impossible drop? report anyway)
  const droppedFromNew = [];
  for (const [code, m] of dbMembersByCode) {
    if (!playersInNew.has(code)) {
      droppedFromNew.push({ playerCode: code, name: m.fullName?.ar || '', status: m.status });
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('           DELTA SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`  Active rows in new file  : ${activeRows.length}`);
  console.log(`  Expired rows in new file : ${expiredRows.length}`);
  console.log(`  Members currently in DB  : ${dbMembersByCode.size}`);
  console.log('  ─────────────────────────');
  console.log(`  🆕 New members to create : ${newMembers.length}`);
  console.log(`  🔄 New subscriptions (renewals) for existing members: ${newRenewals.length}`);
  console.log(`  ✅ Already-present sub records (no change needed)   : ${alreadyPresent.length}`);
  console.log(`  🔀 Member status changes (active↔expired)           : ${memberStatusChanges.length}`);
  console.log(`  📦 DB members NOT appearing in new files            : ${droppedFromNew.length}`);
  console.log('═══════════════════════════════════════');

  console.log('\nSample new members (first 10):');
  newMembers.slice(0, 10).forEach(r => {
    console.log(`  • ${r.playerCode} — ${r.playerName} — ${r.planType} — ${ymd(r.startDate)}→${ymd(r.endDate)} [${r.fileStatus}]`);
  });

  console.log('\nSample renewals (first 10):');
  newRenewals.slice(0, 10).forEach(r => {
    console.log(`  • ${r.playerCode} — ${r.playerName} — sub ${r.subCode} — ${r.planType} — ${ymd(r.startDate)}→${ymd(r.endDate)} [${r.fileStatus}]`);
  });

  console.log('\nSample status changes (first 10):');
  memberStatusChanges.slice(0, 10).forEach(r => {
    console.log(`  • ${r.playerCode} — ${r.name}: ${r.oldStatus} → ${r.newStatus}`);
  });

  console.log('\nSample dropped-from-new (first 5, likely never in old files either):');
  droppedFromNew.slice(0, 5).forEach(r => {
    console.log(`  • ${r.playerCode} — ${r.name} — status=${r.status}`);
  });

  // Write the delta to a JSON file for the mutation step
  const fs = require('fs');
  fs.writeFileSync(
    path.join(__dirname, 'delta.json'),
    JSON.stringify({
      newMembers, newRenewals, alreadyPresent, memberStatusChanges, droppedFromNew,
      counts: {
        activeRows: activeRows.length, expiredRows: expiredRows.length,
        dbMembers: dbMembersByCode.size,
        newMembers: newMembers.length, newRenewals: newRenewals.length,
        alreadyPresent: alreadyPresent.length, memberStatusChanges: memberStatusChanges.length,
        droppedFromNew: droppedFromNew.length,
      }
    }, null, 2),
    'utf8'
  );
  console.log('\n📝 Delta written to scratchpad/delta.json');
}

main().catch(e => { console.error(e); process.exit(1); }).then(() => process.exit(0));
