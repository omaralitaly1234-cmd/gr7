/**
 * Power Time — Resume Member Import Script
 * ==========================================
 * Resumes importing expired members that were not completed in the previous run.
 * Checks existing members by originalPlayerCode to avoid duplicates.
 * Also generates the credentials file for ALL members (existing + new).
 *
 * Usage:  node scripts/resume-import.js
 */

const admin = require('firebase-admin');
const XLSX  = require('xlsx');
const path  = require('path');
const fs    = require('fs');

// ── Config ──────────────────────────────────────────────────────────────────
const TENANT_ID = 'XFpPXmCqzgOeLOgjGhSR';
const PROJECT_ROOT = path.resolve(__dirname, '..');

const EXPIRED_FILE = path.join(PROJECT_ROOT, 'الاشتراكات المنتهية و غير مجددة حتى تاريخ 28-7-2026.xlsx');

const SA_PATH = path.join(PROJECT_ROOT, 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json');

// ── Initialize Firebase Admin ───────────────────────────────────────────────
const sa = require(SA_PATH);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db   = admin.firestore();
const auth = admin.auth();
const { FieldValue, Timestamp } = admin.firestore;

// ── Helpers (same as import-members.js) ─────────────────────────────────────

function sectionToGender(section) {
  if (!section) return 'male';
  const s = section.toString().trim();
  if (s.includes('سيدات')) return 'female';
  return 'male';
}

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (val.getFullYear() >= 2000 && val.getFullYear() <= 2100) return val;
    return null;
  }
  if (typeof val === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) return d;
    return null;
  }
  const s = val.toString().trim();
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100) return d;
  return null;
}

function mapPlan(arabicPlanName) {
  if (!arabicPlanName) return { planId: 'unknown', type: 'gold', duration: 30, sessions: null };
  const p = arabicPlanName.toString().trim();

  if (p.includes('١٢ كلاس') || p.match(/12\s*كلاس(?!\s*3)/)) {
    return { planId: 'gold-12sessions', type: 'gold', duration: 30, sessions: 12 };
  }
  if (p.includes('12 كلاس 3') || p.includes('12 كلاس 3شهور')) {
    return { planId: 'gold-12sessions-3m', type: 'gold', duration: 90, sessions: 12 };
  }
  if (p.includes('16 كلاس')) {
    return { planId: 'gold-16sessions', type: 'gold', duration: 30, sessions: 16 };
  }
  if (p.includes('8كلاس') || p.includes('8 كلاس')) {
    return { planId: 'gold-8sessions', type: 'gold', duration: 30, sessions: 8 };
  }
  if (p.includes('السنوي الذهبي') || p.includes('سنوي ذهبي')) {
    return { planId: 'gold-annual', type: 'gold', duration: 365, sessions: null };
  }
  if (p.includes('السنوي الفضي')) {
    return { planId: 'silver-annual', type: 'gold', duration: 365, sessions: null };
  }
  if (p.includes('السنوي vip') || p.includes('السنوي VIP')) {
    return { planId: 'vip-annual', type: 'diamond', duration: 365, sessions: null };
  }
  if (p.includes('النصف سنوي الذهبي') || p.includes('نصف سنوي ذهبي')) {
    return { planId: 'gold-semi', type: 'gold', duration: 180, sessions: null };
  }
  if (p.includes('النصف سنوي فضي') || p.includes('النصف سنوي الفضي')) {
    return { planId: 'silver-semi', type: 'gold', duration: 180, sessions: null };
  }
  if (p.includes('8 شهور')) {
    return { planId: 'gold-8months', type: 'gold', duration: 240, sessions: null };
  }
  if (p.includes('الربع سنوي الذهبي') || p.includes('ربع سنوي ذهبي')) {
    return { planId: 'gold-quarterly', type: 'gold', duration: 90, sessions: null };
  }
  if (p.includes('جيم ربع سنوي فضى') || p.includes('ربع سنوي فض')) {
    return { planId: 'silver-quarterly', type: 'gold', duration: 90, sessions: null };
  }
  if (p.includes('ربع سنوي VIP')) {
    return { planId: 'vip-quarterly', type: 'diamond', duration: 90, sessions: null };
  }
  if (p.includes('4 شهور')) {
    return { planId: 'gold-4months', type: 'gold', duration: 120, sessions: null };
  }
  if (p.includes('شهري ذهبي') || p.includes('شهر ذهبي')) {
    return { planId: 'gold-monthly', type: 'gold', duration: 30, sessions: null };
  }
  if (p.includes('شهري فضي') || p.includes('نصف شهر فضي')) {
    return { planId: 'silver-monthly', type: 'gold', duration: 30, sessions: null };
  }
  if (p.includes('شرقي')) {
    return { planId: 'oriental', type: 'gold', duration: 30, sessions: null };
  }
  if (p.includes('ايروبكس') || p.includes('ايروبكس')) {
    return { planId: 'aerobics', type: 'gold', duration: 30, sessions: null };
  }
  if (p.includes('كارديو')) {
    return { planId: 'cardio', type: 'gold', duration: 30, sessions: null };
  }
  if (p.includes('كيك بوكس')) {
    return { planId: 'kickboxing', type: 'gold', duration: 30, sessions: null };
  }
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

function generateEmail(playerCode, index) {
  const code = playerCode.toString().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `member${code || index}@powertime.gym`;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main Resume Logic ───────────────────────────────────────────────────────

async function resumeImport() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Power Time — RESUME Import (Remaining Expired Members)');
  console.log('  Tenant:', TENANT_ID);
  console.log('═══════════════════════════════════════════════════════\n');

  // ── Step 1: Get all already-imported player codes ──
  console.log('📊 Loading existing members from Firestore...');
  const existingMembers = await db.collection(`tenants/${TENANT_ID}/members`).get();
  const importedCodes = new Set();
  const existingCredentials = [];

  existingMembers.docs.forEach(doc => {
    const data = doc.data();
    const code = (data.originalPlayerCode || data.membershipNumber || '').toString().trim();
    if (code) importedCodes.add(code);

    // Collect existing credentials
    if (data.accountEmail) {
      existingCredentials.push({
        name: data.fullName?.ar || data.fullName?.en || '',
        playerCode: code,
        email: data.accountEmail,
        password: data.accountPassword || '',
        phone: data.phone || '',
        section: data.section || '',
        membershipType: data.planName || data.currentPlan?.planName || '',
        status: data.status || 'expired',
        startDate: data.currentPlan?.startDate ? data.currentPlan.startDate.toDate().toISOString().split('T')[0] : '',
        endDate: data.currentPlan?.endDate ? data.currentPlan.endDate.toDate().toISOString().split('T')[0] : '',
        daysLeft: data.status === 'active' && data.endDate ? Math.max(0, Math.ceil((data.endDate.toDate() - new Date()) / (1000 * 60 * 60 * 24))) : 0,
        uid: data.uid || '',
      });
    }
  });

  console.log(`   Already imported: ${importedCodes.size} members`);
  console.log(`   Collected ${existingCredentials.length} existing credentials\n`);

  // ── Step 2: Read expired file and filter remaining ──
  console.log('📂 Reading expired subscriptions file...');
  const wbExpired = XLSX.readFile(EXPIRED_FILE, { cellDates: true });
  const wsExpired = wbExpired.Sheets[wbExpired.SheetNames[0]];
  const expiredRows = XLSX.utils.sheet_to_json(wsExpired, { defval: '' });
  console.log(`   Total rows in expired file: ${expiredRows.length}`);

  // Collect rows to import (skip already imported + track unique codes)
  const processedCodes = new Set([...importedCodes]);
  const toImport = [];

  for (let i = 0; i < expiredRows.length; i++) {
    const row = expiredRows[i];
    const vals = Object.values(row);
    const playerCode = (vals[0] || '').toString().trim();
    const playerName = (vals[1] || '').toString().trim();

    if (!playerCode || !playerName) continue;
    if (processedCodes.has(playerCode)) continue;
    processedCodes.add(playerCode);
    toImport.push({ row, index: i });
  }

  console.log(`   Remaining to import: ${toImport.length} expired members\n`);

  if (toImport.length === 0) {
    console.log('✅ All members already imported! Generating credentials file...');
  }

  // ── Step 3: Import remaining expired members ──
  const newCredentials = [];
  let importCount = 0;
  let errorCount = 0;

  for (const { row, index: i } of toImport) {
    const vals = Object.values(row);
    const playerCode    = (vals[0] || '').toString().trim();
    const playerName    = (vals[1] || '').toString().trim();
    const subCode       = (vals[2] || '').toString().trim();
    const membershipType = (vals[3] || '').toString().trim();
    const section       = (vals[4] || '').toString().trim();
    const phoneRaw      = (vals[5] || '').toString().trim();
    const startDateRaw  = vals[6];
    const endDateRaw    = vals[7];
    const clientAnswer  = (vals[8] || '').toString().trim();

    try {
      const gender    = sectionToGender(section);
      const phone     = cleanPhone(phoneRaw);
      const startDate = parseDate(startDateRaw);
      const endDate   = parseDate(endDateRaw);
      const planInfo  = mapPlan(membershipType);

      const email    = generateEmail(playerCode, 10000 + i);
      const password = generatePassword();

      // Create Firebase Auth account (disabled for expired)
      let uid;
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: playerName,
          disabled: true,
        });
        uid = userRecord.uid;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-exists') {
          const existing = await auth.getUserByEmail(email);
          uid = existing.uid;
        } else {
          throw authErr;
        }
      }

      // Create users doc
      await db.collection('users').doc(uid).set({
        uid,
        email,
        phone: phone || '',
        displayName: playerName,
        role: 'member',
        lang: 'ar',
        avatar: '',
        isActive: false,
        tenantId: TENANT_ID,
        superAdmin: false,
        tenantRole: 'member',
        fcmTokens: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Create member document
      const memberData = {
        fullName: { ar: playerName, en: playerName },
        phone: phone || '',
        whatsapp: phone || '',
        email: email,
        gender,
        dateOfBirth: null,
        nationalId: '',
        address: '',
        photo: '',
        emergencyContact: { name: '', phone: '', relation: '' },
        membershipNumber: playerCode,
        qrCode: playerCode,
        joinDate: startDate ? Timestamp.fromDate(startDate) : FieldValue.serverTimestamp(),
        status: 'expired',
        currentPlan: {
          planId: planInfo.planId,
          planName: membershipType,
          type: planInfo.type,
          startDate: startDate ? Timestamp.fromDate(startDate) : null,
          endDate: endDate ? Timestamp.fromDate(endDate) : null,
        },
        planName: membershipType,
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        assignedTrainer: null,
        assignedTrainerName: null,
        assignedTrainerDocId: null,
        height: null,
        weight: null,
        bloodType: '',
        medicalNotes: '',
        fitnessGoal: 'fitness',
        totalVisits: 0,
        lastVisit: null,
        totalSpent: 0,
        tags: [],
        notes: clientAnswer || '',
        uid: uid,
        accountEmail: email,
        accountPassword: password,
        section: section,
        originalPlayerCode: playerCode,
        originalSubCode: subCode,
        importedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const memberRef = await db.collection(`tenants/${TENANT_ID}/members`).add(memberData);

      // Create subscription document
      await db.collection(`tenants/${TENANT_ID}/subscriptions`).add({
        memberId: memberRef.id,
        planId: planInfo.planId,
        planSnapshot: {
          id: planInfo.planId,
          name: { ar: membershipType, en: membershipType },
          type: planInfo.type,
          duration: planInfo.duration,
          sessions: planInfo.sessions,
        },
        startDate: startDate ? Timestamp.fromDate(startDate) : FieldValue.serverTimestamp(),
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        originalEndDate: endDate ? Timestamp.fromDate(endDate) : null,
        status: 'expired',
        totalSessions: planInfo.sessions,
        usedSessions: planInfo.sessions || 0,
        remainingSessions: 0,
        freezeDaysUsed: 0,
        maxFreezeDays: 14,
        currentFreezeStart: null,
        amountPaid: 0,
        discountApplied: { percentage: 0, amount: 0 },
        paymentMethod: 'cash',
        invitationsUsed: 0,
        maxInvitations: 2,
        autoRenew: false,
        renewalReminded: false,
        createdBy: 'import',
        importedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      newCredentials.push({
        name: playerName,
        playerCode,
        email,
        password,
        phone: phone || '',
        section,
        membershipType,
        status: 'expired',
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        daysLeft: 0,
        uid,
      });

      importCount++;
      if (importCount % 50 === 0) {
        console.log(`   ✅ ${importCount}/${toImport.length} imported...`);
      }

      // Rate-limit to avoid Firebase Auth quota issues
      if (importCount % 10 === 0) await sleep(1100);

    } catch (err) {
      errorCount++;
      console.error(`   ❌ [${i+1}] Error for "${playerName}" (${playerCode}):`, err.message);
    }
  }

  console.log(`\n   ✅ Resume import done: ${importCount} success, ${errorCount} errors\n`);

  // ── Step 4: Save ALL credentials (existing + new) ──
  console.log('📝 Saving credentials log for ALL members...');

  const allCredentials = [...existingCredentials, ...newCredentials];

  // Save as JSON
  const logPath = path.join(PROJECT_ROOT, 'member-credentials.json');
  fs.writeFileSync(logPath, JSON.stringify(allCredentials, null, 2), 'utf8');
  console.log(`   Saved to: ${logPath} (${allCredentials.length} entries)`);

  // Save as CSV
  const csvPath = path.join(PROJECT_ROOT, 'member-credentials.csv');
  const csvHeader = 'الاسم,كود اللاعب,البريد الإلكتروني,كلمة المرور,الهاتف,القسم,نوع العضوية,الحالة,بداية الاشتراك,نهاية الاشتراك,الأيام المتبقية,UID';
  const csvRows = allCredentials.map(c =>
    `"${c.name}","${c.playerCode}","${c.email}","${c.password}","${c.phone}","${c.section}","${c.membershipType}","${c.status}","${c.startDate}","${c.endDate}","${c.daysLeft}","${c.uid}"`
  );
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + '\n' + csvRows.join('\n'), 'utf8');
  console.log(`   Saved to: ${csvPath}`);

  // ── Summary ──
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Resume Import Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Previously imported:      ${importedCodes.size}`);
  console.log(`  Newly imported:           ${importCount}`);
  console.log(`  Total members in system:  ${importedCodes.size + importCount}`);
  console.log(`  Import errors:            ${errorCount}`);
  console.log(`  Credentials saved:        ${allCredentials.length} entries`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run
resumeImport()
  .then(() => {
    console.log('🎉 Resume import complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
