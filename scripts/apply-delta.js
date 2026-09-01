/**
 * Apply the Sept-2026 delta to Firestore:
 *   - Create 154 new members (auth + member + subscription)
 *   - Add renewal subscription docs for existing members
 *   - Update each affected member's currentPlan/endDate/planName/status
 *     to reflect their newest subscription
 *
 * Idempotent: uses playerCode + subCode to dedupe. Safe to re-run.
 */

const admin = require('firebase-admin');
const XLSX  = require('xlsx');
const path  = require('path');
const fs    = require('fs');

const TENANT_ID = 'XFpPXmCqzgOeLOgjGhSR';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SA_PATH = path.join(PROJECT_ROOT, 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json');

const ACTIVE_FILE  = 'C:/Users/Elnagar0/Downloads/الاشتراكات النشطة حاليآ حتى تاريخ 1-9-2026 .xlsx';
const EXPIRED_FILE = 'C:/Users/Elnagar0/Downloads/الاشتراكات المنتهية و غير مجددة حتى تاريخ 1-9-2026.xlsx';

const sa = require(SA_PATH);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db   = admin.firestore();
const auth = admin.auth();
const { FieldValue, Timestamp } = admin.firestore;

// ─── Helpers copied/adapted from import-members.js ─────────────────────────

function sectionToGender(section) {
  if (!section) return 'male';
  return section.toString().includes('سيدات') ? 'female' : 'male';
}

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

function mapPlan(name) {
  if (!name) return { planId: 'unknown', type: 'gold', duration: 30, sessions: null };
  const p = name.toString().trim();
  if (p.includes('١٢ كلاس') || p.match(/12\s*كلاس(?!\s*3)/))
    return { planId: 'gold-12sessions', type: 'gold', duration: 30, sessions: 12 };
  if (p.includes('12 كلاس 3') || p.includes('12 كلاس 3شهور'))
    return { planId: 'gold-12sessions-3m', type: 'gold', duration: 90, sessions: 12 };
  if (p.includes('16 كلاس'))
    return { planId: 'gold-16sessions', type: 'gold', duration: 30, sessions: 16 };
  if (p.includes('8كلاس') || p.includes('8 كلاس'))
    return { planId: 'gold-8sessions', type: 'gold', duration: 30, sessions: 8 };
  if (p.includes('السنوي الذهبي') || p.includes('سنوي ذهبي'))
    return { planId: 'gold-annual', type: 'gold', duration: 365, sessions: null };
  if (p.includes('السنوي الفضي'))
    return { planId: 'silver-annual', type: 'gold', duration: 365, sessions: null };
  if (p.includes('السنوي vip') || p.includes('السنوي VIP'))
    return { planId: 'vip-annual', type: 'diamond', duration: 365, sessions: null };
  if (p.includes('النصف سنوي الذهبي') || p.includes('نصف سنوي ذهبي'))
    return { planId: 'gold-semi', type: 'gold', duration: 180, sessions: null };
  if (p.includes('النصف سنوي فضي') || p.includes('النصف سنوي الفضي'))
    return { planId: 'silver-semi', type: 'gold', duration: 180, sessions: null };
  if (p.includes('8 شهور'))
    return { planId: 'gold-8months', type: 'gold', duration: 240, sessions: null };
  if (p.includes('الربع سنوي الذهبي') || p.includes('ربع سنوي ذهبي'))
    return { planId: 'gold-quarterly', type: 'gold', duration: 90, sessions: null };
  if (p.includes('جيم ربع سنوي فضى') || p.includes('ربع سنوي فض'))
    return { planId: 'silver-quarterly', type: 'gold', duration: 90, sessions: null };
  if (p.includes('ربع سنوي VIP'))
    return { planId: 'vip-quarterly', type: 'diamond', duration: 90, sessions: null };
  if (p.includes('4 شهور'))
    return { planId: 'gold-4months', type: 'gold', duration: 120, sessions: null };
  if (p.includes('شهري ذهبي') || p.includes('شهر ذهبي'))
    return { planId: 'gold-monthly', type: 'gold', duration: 30, sessions: null };
  if (p.includes('شهري فضي') || p.includes('نصف شهر فضي'))
    return { planId: 'silver-monthly', type: 'gold', duration: 30, sessions: null };
  if (p.includes('شرقي'))
    return { planId: 'oriental', type: 'gold', duration: 30, sessions: null };
  if (p.includes('ايروبكس'))
    return { planId: 'aerobics', type: 'gold', duration: 30, sessions: null };
  if (p.includes('كارديو'))
    return { planId: 'cardio', type: 'gold', duration: 30, sessions: null };
  if (p.includes('كيك بوكس'))
    return { planId: 'kickboxing', type: 'gold', duration: 30, sessions: null };
  return { planId: 'gold-monthly', type: 'gold', duration: 30, sessions: null };
}

function cleanPhone(val) {
  if (!val) return '';
  let p = val.toString().trim();
  if (p.startsWith('002')) p = p.substring(2);
  if (p === '2' || p === '002' || p === '0' || p.length < 5) return '';
  return p;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 8; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

function generateEmail(code, salt) {
  const c = code.toString().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `member${c || salt}@powertime.gym`;
}

const ymd = (d) => d ? d.toISOString().slice(0, 10) : '';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Read both files and normalize ─────────────────────────────────────────

function readSourceRows() {
  const records = new Map(); // key: `${playerCode}|${subCode}` → row
  const perPlayer = new Map(); // playerCode → { latestEndDate, isActive, name, phone, section }

  function upsert(row, fileStatus) {
    const vals = Object.values(row);
    let playerCode, playerName, subCode, planType, section, phone, startRaw, endRaw, notes;
    if (fileStatus === 'active') {
      [playerCode, playerName, section, planType, startRaw, endRaw, phone, , notes, subCode] = vals;
    } else {
      [playerCode, playerName, subCode, planType, section, phone, startRaw, endRaw, notes] = vals;
    }
    playerCode = (playerCode || '').toString().trim();
    playerName = (playerName || '').toString().trim();
    subCode = (subCode || '').toString().trim();
    if (!playerCode || !playerName) return;

    const startDate = parseDate(startRaw);
    const endDate   = parseDate(endRaw);

    records.set(`${playerCode}|${subCode}`, {
      playerCode, playerName, subCode,
      planType: (planType || '').toString().trim(),
      section: (section || '').toString().trim(),
      phone: (phone || '').toString().trim(),
      notes: (notes || '').toString().trim(),
      startDate, endDate, fileStatus,
    });

    const cur = perPlayer.get(playerCode);
    const better = !cur || (endDate && (!cur.latestEndDate || endDate > cur.latestEndDate));
    if (better) {
      perPlayer.set(playerCode, {
        latestEndDate: endDate,
        latestStartDate: startDate,
        latestPlanType: (planType || '').toString().trim(),
        isActive: fileStatus === 'active',
        name: playerName,
        phone: (phone || '').toString().trim(),
        section: (section || '').toString().trim(),
      });
    }
  }

  const wbA = XLSX.readFile(ACTIVE_FILE,  { cellDates: true });
  const wbE = XLSX.readFile(EXPIRED_FILE, { cellDates: true });
  XLSX.utils.sheet_to_json(wbA.Sheets[wbA.SheetNames[0]], { defval: '' }).forEach(r => upsert(r, 'active'));
  XLSX.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { defval: '' }).forEach(r => upsert(r, 'expired'));
  return { records, perPlayer };
}

async function loadDbState() {
  const membersSnap = await db.collection(`tenants/${TENANT_ID}/members`).get();
  const byCode = new Map();
  membersSnap.forEach(doc => {
    const d = doc.data();
    const code = (d.originalPlayerCode || d.membershipNumber || '').toString().trim();
    if (code) byCode.set(code, { id: doc.id, ref: doc.ref, data: d });
  });

  const subsSnap = await db.collection(`tenants/${TENANT_ID}/subscriptions`).get();
  const subsByMember = new Map();
  subsSnap.forEach(doc => {
    const d = doc.data();
    if (!d.memberId) return;
    if (!subsByMember.has(d.memberId)) subsByMember.set(d.memberId, []);
    subsByMember.get(d.memberId).push({
      id: doc.id,
      startDate: d.startDate?.toDate?.() || null,
      endDate:   d.endDate?.toDate?.()   || null,
      status: d.status,
    });
  });

  return { byCode, subsByMember };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('▶ Reading Excel files...');
  const { records, perPlayer } = readSourceRows();
  console.log(`   ${records.size} unique subscription rows, ${perPlayer.size} unique players`);

  console.log('▶ Loading DB state...');
  const { byCode, subsByMember } = await loadDbState();
  console.log(`   ${byCode.size} members, ${[...subsByMember.values()].reduce((n,a)=>n+a.length,0)} subscriptions`);

  const newMemberRows = [];
  const renewalRows   = [];
  for (const rec of records.values()) {
    const mem = byCode.get(rec.playerCode);
    if (!mem) { newMemberRows.push(rec); continue; }
    const subs = subsByMember.get(mem.id) || [];
    const startY = ymd(rec.startDate), endY = ymd(rec.endDate);
    const match = subs.find(s => ymd(s.startDate) === startY && ymd(s.endDate) === endY);
    if (!match) renewalRows.push({ ...rec, memberId: mem.id, memberRef: mem.ref });
  }

  console.log(`\n Plan: create ${newMemberRows.length} new members, ${renewalRows.length} renewal subs`);
  console.log(' Then refresh status/currentPlan for every player in the source files.');
  console.log(' ─────────────────────────');

  const createdCreds = [];
  const errors = [];

  // ─── Phase 1: create new members ────────────────────────────────────────
  console.log(`\n▶ Phase 1 — creating ${newMemberRows.length} new members...`);
  for (let i = 0; i < newMemberRows.length; i++) {
    const rec = newMemberRows[i];
    try {
      const gender = sectionToGender(rec.section);
      const phone  = cleanPhone(rec.phone);
      const plan   = mapPlan(rec.planType);
      const email  = generateEmail(rec.playerCode, 20000 + i);
      const password = generatePassword();
      const isActive = rec.fileStatus === 'active';

      let uid;
      try {
        const u = await auth.createUser({ email, password, displayName: rec.playerName, disabled: !isActive });
        uid = u.uid;
      } catch (e) {
        if (e.code === 'auth/email-already-exists') {
          uid = (await auth.getUserByEmail(email)).uid;
        } else throw e;
      }

      await db.collection('users').doc(uid).set({
        uid, email, phone: phone || '', displayName: rec.playerName,
        role: 'member', lang: 'ar', avatar: '', isActive,
        tenantId: TENANT_ID, superAdmin: false, tenantRole: 'member',
        fcmTokens: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      const memberData = {
        fullName: { ar: rec.playerName, en: rec.playerName },
        phone: phone || '', whatsapp: phone || '', email,
        gender, dateOfBirth: null, nationalId: '', address: '', photo: '',
        emergencyContact: { name: '', phone: '', relation: '' },
        membershipNumber: rec.playerCode, qrCode: rec.playerCode,
        joinDate: rec.startDate ? Timestamp.fromDate(rec.startDate) : FieldValue.serverTimestamp(),
        status: isActive ? 'active' : 'expired',
        currentPlan: {
          planId: plan.planId, planName: rec.planType, type: plan.type,
          startDate: rec.startDate ? Timestamp.fromDate(rec.startDate) : null,
          endDate:   rec.endDate   ? Timestamp.fromDate(rec.endDate)   : null,
        },
        planName: rec.planType,
        endDate: rec.endDate ? Timestamp.fromDate(rec.endDate) : null,
        assignedTrainer: null, assignedTrainerName: null, assignedTrainerDocId: null,
        height: null, weight: null, bloodType: '', medicalNotes: '',
        fitnessGoal: 'fitness', totalVisits: 0, lastVisit: null, totalSpent: 0,
        tags: [], notes: rec.notes || '', uid,
        accountEmail: email, accountPassword: password,
        section: rec.section,
        originalPlayerCode: rec.playerCode, originalSubCode: rec.subCode,
        importedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const memberRef = await db.collection(`tenants/${TENANT_ID}/members`).add(memberData);

      await db.collection(`tenants/${TENANT_ID}/subscriptions`).add({
        memberId: memberRef.id,
        planId: plan.planId,
        planSnapshot: {
          id: plan.planId, name: { ar: rec.planType, en: rec.planType },
          type: plan.type, duration: plan.duration, sessions: plan.sessions,
        },
        startDate: rec.startDate ? Timestamp.fromDate(rec.startDate) : FieldValue.serverTimestamp(),
        endDate:   rec.endDate   ? Timestamp.fromDate(rec.endDate)   : null,
        originalEndDate: rec.endDate ? Timestamp.fromDate(rec.endDate) : null,
        status: isActive ? 'active' : 'expired',
        totalSessions: plan.sessions,
        usedSessions: isActive ? 0 : (plan.sessions || 0),
        remainingSessions: isActive ? plan.sessions : 0,
        freezeDaysUsed: 0, maxFreezeDays: 14, currentFreezeStart: null,
        amountPaid: 0, discountApplied: { percentage: 0, amount: 0 },
        paymentMethod: 'cash',
        invitationsUsed: 0, maxInvitations: 2,
        autoRenew: false, renewalReminded: false,
        createdBy: 'import-2026-09-01',
        originalSubCode: rec.subCode,
        importedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      byCode.set(rec.playerCode, { id: memberRef.id, ref: memberRef, data: memberData });
      createdCreds.push({
        name: rec.playerName, playerCode: rec.playerCode, email, password,
        phone: phone || '', section: rec.section, membershipType: rec.planType,
        status: isActive ? 'active' : 'expired',
        startDate: ymd(rec.startDate), endDate: ymd(rec.endDate),
        uid,
      });

      if ((i + 1) % 25 === 0) console.log(`   ${i+1}/${newMemberRows.length} new members created`);
      if ((i + 1) % 10 === 0) await sleep(1100); // Auth rate limit
    } catch (e) {
      errors.push({ phase: 'new-member', playerCode: rec.playerCode, name: rec.playerName, error: e.message });
      console.error(`   ❌ [${i+1}] ${rec.playerName} (${rec.playerCode}): ${e.message}`);
    }
  }
  console.log(`   ✔ Phase 1 done: ${newMemberRows.length - errors.filter(e=>e.phase==='new-member').length} created, ${errors.filter(e=>e.phase==='new-member').length} errors`);

  // ─── Phase 2: renewal subscription docs ─────────────────────────────────
  console.log(`\n▶ Phase 2 — adding ${renewalRows.length} renewal subscriptions...`);
  let renewCount = 0;
  // batch in 400s
  const chunkSize = 400;
  for (let base = 0; base < renewalRows.length; base += chunkSize) {
    const chunk = renewalRows.slice(base, base + chunkSize);
    const batch = db.batch();
    for (const rec of chunk) {
      try {
        const plan = mapPlan(rec.planType);
        const isActive = rec.fileStatus === 'active';
        const subRef = db.collection(`tenants/${TENANT_ID}/subscriptions`).doc();
        batch.set(subRef, {
          memberId: rec.memberId,
          planId: plan.planId,
          planSnapshot: {
            id: plan.planId, name: { ar: rec.planType, en: rec.planType },
            type: plan.type, duration: plan.duration, sessions: plan.sessions,
          },
          startDate: rec.startDate ? Timestamp.fromDate(rec.startDate) : FieldValue.serverTimestamp(),
          endDate:   rec.endDate   ? Timestamp.fromDate(rec.endDate)   : null,
          originalEndDate: rec.endDate ? Timestamp.fromDate(rec.endDate) : null,
          status: isActive ? 'active' : 'expired',
          totalSessions: plan.sessions,
          usedSessions: isActive ? 0 : (plan.sessions || 0),
          remainingSessions: isActive ? plan.sessions : 0,
          freezeDaysUsed: 0, maxFreezeDays: 14, currentFreezeStart: null,
          amountPaid: 0, discountApplied: { percentage: 0, amount: 0 },
          paymentMethod: 'cash',
          invitationsUsed: 0, maxInvitations: 2,
          autoRenew: false, renewalReminded: false,
          createdBy: 'import-2026-09-01',
          originalSubCode: rec.subCode,
          importedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        renewCount++;
      } catch (e) {
        errors.push({ phase: 'renewal', playerCode: rec.playerCode, name: rec.playerName, error: e.message });
      }
    }
    await batch.commit();
    console.log(`   batch of ${chunk.length} committed (${renewCount}/${renewalRows.length} total)`);
  }
  console.log(`   ✔ Phase 2 done: ${renewCount} renewal subs added`);

  // ─── Phase 3: refresh each affected member's currentPlan/endDate/status ─
  console.log(`\n▶ Phase 3 — refreshing member docs for ${perPlayer.size} players...`);
  let updatedMembers = 0;
  const affectedCodes = [...perPlayer.keys()];
  for (let base = 0; base < affectedCodes.length; base += chunkSize) {
    const chunk = affectedCodes.slice(base, base + chunkSize);
    const batch = db.batch();
    let ops = 0;
    for (const code of chunk) {
      const info = perPlayer.get(code);
      const mem  = byCode.get(code);
      if (!mem) continue; // Phase 1 covers these but if it errored, skip
      const plan = mapPlan(info.latestPlanType);
      const desiredStatus = info.isActive ? 'active' : 'expired';
      const phone = cleanPhone(info.phone);
      const updates = {
        status: desiredStatus,
        planName: info.latestPlanType,
        endDate: info.latestEndDate ? Timestamp.fromDate(info.latestEndDate) : null,
        currentPlan: {
          planId: plan.planId, planName: info.latestPlanType, type: plan.type,
          startDate: info.latestStartDate ? Timestamp.fromDate(info.latestStartDate) : null,
          endDate:   info.latestEndDate   ? Timestamp.fromDate(info.latestEndDate)   : null,
        },
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (phone && !mem.data.phone) { updates.phone = phone; updates.whatsapp = phone; }
      batch.update(mem.ref, updates);
      ops++;
    }
    await batch.commit();
    updatedMembers += ops;
    console.log(`   member refresh batch: ${ops} updates (${updatedMembers}/${affectedCodes.length})`);
  }
  console.log(`   ✔ Phase 3 done: ${updatedMembers} member docs refreshed`);

  // ─── Save credentials for newly created members ─────────────────────────
  if (createdCreds.length) {
    const jsonPath = path.join(PROJECT_ROOT, 'member-credentials-2026-09-01.json');
    const csvPath  = path.join(PROJECT_ROOT, 'member-credentials-2026-09-01.csv');
    fs.writeFileSync(jsonPath, JSON.stringify(createdCreds, null, 2), 'utf8');
    const header = 'الاسم,كود اللاعب,البريد,كلمة المرور,الهاتف,القسم,نوع العضوية,الحالة,بداية,نهاية,UID';
    const rows = createdCreds.map(c =>
      `"${c.name}","${c.playerCode}","${c.email}","${c.password}","${c.phone}","${c.section}","${c.membershipType}","${c.status}","${c.startDate}","${c.endDate}","${c.uid}"`
    );
    fs.writeFileSync(csvPath, '\uFEFF' + header + '\n' + rows.join('\n'), 'utf8');
    console.log(`\n📝 New member credentials → ${jsonPath}`);
    console.log(`                              → ${csvPath}`);
  }

  if (errors.length) {
    const errPath = path.join(PROJECT_ROOT, 'apply-delta-errors-2026-09-01.json');
    fs.writeFileSync(errPath, JSON.stringify(errors, null, 2), 'utf8');
    console.log(`\n⚠ ${errors.length} errors written to ${errPath}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('             DONE');
  console.log('═══════════════════════════════════════');
  console.log(`  New members created  : ${createdCreds.length}`);
  console.log(`  Renewal subs added   : ${renewCount}`);
  console.log(`  Members refreshed    : ${updatedMembers}`);
  console.log(`  Errors               : ${errors.length}`);
  console.log('═══════════════════════════════════════');
}

main().then(() => process.exit(0)).catch(e => { console.error('💥', e); process.exit(1); });
