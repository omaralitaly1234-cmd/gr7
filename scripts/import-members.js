/**
 * Power Time — Member Import Script
 * ==================================
 * Reads two Excel files:
 *   1. Active subscriptions (554 members)
 *   2. Expired/non-renewed subscriptions (4,734 members)
 *
 * For each member:
 *   - Creates a Firebase Auth account (email + password)
 *   - Creates a Firestore "members" document under the tenant
 *   - Creates a Firestore "subscriptions" document
 *   - Creates a Firestore "users" document (for login mapping)
 *   - Stores the generated credentials in the member doc
 *
 * Usage:  node scripts/import-members.js
 */

const admin = require('firebase-admin');
const XLSX  = require('xlsx');
const path  = require('path');
const fs    = require('fs');

// ── Config ──────────────────────────────────────────────────────────────────
const TENANT_ID = 'XFpPXmCqzgOeLOgjGhSR';
const PROJECT_ROOT = path.resolve(__dirname, '..');

const ACTIVE_FILE  = path.join(PROJECT_ROOT, 'الاشتراكات النشطة حاليآ حتى تاريخ 28-7-2026.xlsx');
const EXPIRED_FILE = path.join(PROJECT_ROOT, 'الاشتراكات المنتهية و غير مجددة حتى تاريخ 28-7-2026.xlsx');

const SA_PATH = path.join(PROJECT_ROOT, 'gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json');

// ── Initialize Firebase Admin ───────────────────────────────────────────────
const sa = require(SA_PATH);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db   = admin.firestore();
const auth = admin.auth();
const { FieldValue, Timestamp } = admin.firestore;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Map Arabic section name → gender */
function sectionToGender(section) {
  if (!section) return 'male';
  const s = section.toString().trim();
  if (s.includes('سيدات')) return 'female';
  return 'male';
}

/** Parse a date value from Excel (could be Date object, string, or serial number) */
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    // Validate the date is reasonable (between 2000 and 2100)
    if (val.getFullYear() >= 2000 && val.getFullYear() <= 2100) return val;
    return null;
  }
  // Handle Excel serial number
  if (typeof val === 'number') {
    // Excel serial date: days since 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) return d;
    return null;
  }
  const s = val.toString().trim();
  // Try ISO-like: "2026-06-28 00:00:00"
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100) return d;
  return null;
}

/** Map Arabic plan name to system plan info */
function mapPlan(arabicPlanName) {
  if (!arabicPlanName) return { planId: 'unknown', type: 'gold', duration: 30, sessions: null };
  const p = arabicPlanName.toString().trim();

  // Session-based plans
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

  // Annual plans
  if (p.includes('السنوي الذهبي') || p.includes('سنوي ذهبي')) {
    return { planId: 'gold-annual', type: 'gold', duration: 365, sessions: null };
  }
  if (p.includes('السنوي الفضي')) {
    return { planId: 'silver-annual', type: 'gold', duration: 365, sessions: null };
  }
  if (p.includes('السنوي vip') || p.includes('السنوي VIP')) {
    return { planId: 'vip-annual', type: 'diamond', duration: 365, sessions: null };
  }

  // Semi-annual plans
  if (p.includes('النصف سنوي الذهبي') || p.includes('نصف سنوي ذهبي')) {
    return { planId: 'gold-semi', type: 'gold', duration: 180, sessions: null };
  }
  if (p.includes('النصف سنوي فضي') || p.includes('النصف سنوي الفضي')) {
    return { planId: 'silver-semi', type: 'gold', duration: 180, sessions: null };
  }
  if (p.includes('8 شهور')) {
    return { planId: 'gold-8months', type: 'gold', duration: 240, sessions: null };
  }

  // Quarterly plans
  if (p.includes('الربع سنوي الذهبي') || p.includes('ربع سنوي ذهبي')) {
    return { planId: 'gold-quarterly', type: 'gold', duration: 90, sessions: null };
  }
  if (p.includes('جيم ربع سنوي فضى') || p.includes('ربع سنوي فض')) {
    return { planId: 'silver-quarterly', type: 'gold', duration: 90, sessions: null };
  }
  if (p.includes('ربع سنوي VIP')) {
    return { planId: 'vip-quarterly', type: 'diamond', duration: 90, sessions: null };
  }

  // 4 months
  if (p.includes('4 شهور')) {
    return { planId: 'gold-4months', type: 'gold', duration: 120, sessions: null };
  }

  // Monthly plans
  if (p.includes('شهري ذهبي') || p.includes('شهر ذهبي')) {
    return { planId: 'gold-monthly', type: 'gold', duration: 30, sessions: null };
  }
  if (p.includes('شهري فضي') || p.includes('نصف شهر فضي')) {
    return { planId: 'silver-monthly', type: 'gold', duration: 30, sessions: null };
  }

  // Special classes
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

/** Clean phone number */
function cleanPhone(val) {
  if (!val) return '';
  let p = val.toString().trim();
  // Remove leading zeros from country code style "002..."
  if (p.startsWith('002')) p = p.substring(2);
  // If just "2" or "002" it's invalid
  if (p === '2' || p === '002' || p === '0' || p.length < 5) return '';
  // Ensure starts with "20" for Egypt country code, or "01" for local
  if (p.startsWith('2010') || p.startsWith('2011') || p.startsWith('2012') || p.startsWith('2015')) {
    // Already has country code without +
  } else if (p.startsWith('010') || p.startsWith('011') || p.startsWith('012') || p.startsWith('015')) {
    // Local format - OK
  }
  return p;
}

/** Generate a random password */
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 8; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

/** Generate email from player code */
function generateEmail(playerCode, index) {
  const code = playerCode.toString().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `member${code || index}@powertime.gym`;
}

/** Sleep for ms */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main Import Logic ───────────────────────────────────────────────────────

async function importMembers() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Power Time — Member Import');
  console.log('  Tenant:', TENANT_ID);
  console.log('═══════════════════════════════════════════════════════\n');

  // Track created credentials for the log file
  const credentials = [];
  // Track player codes to avoid duplicates
  const processedCodes = new Set();

  // ──────────────────────────────────────────────────────────
  // PHASE 1: Active Subscriptions
  // ──────────────────────────────────────────────────────────
  console.log('📂 Reading active subscriptions file...');
  const wbActive = XLSX.readFile(ACTIVE_FILE, { cellDates: true });
  const wsActive = wbActive.Sheets[wbActive.SheetNames[0]];
  const activeRows = XLSX.utils.sheet_to_json(wsActive, { defval: '' });
  console.log(`   Found ${activeRows.length} active members\n`);

  // Column mapping for active file:
  // كود اللاعب, اسم اللاعب, إسم القسم, نوع العضوية, بداية الاشتراك, نهاية الاشتراك, رقم الهاتف, المدة المتبقية, إجابة العميل, كود الاشتراك
  const activeHeaders = Object.keys(activeRows[0] || {});
  console.log('   Active headers:', activeHeaders.join(' | '));

  let activeCount = 0;
  let activeErrors = 0;

  for (let i = 0; i < activeRows.length; i++) {
    const row = activeRows[i];
    const vals = Object.values(row);

    const playerCode    = (vals[0] || '').toString().trim();
    const playerName    = (vals[1] || '').toString().trim();
    const section       = (vals[2] || '').toString().trim();
    const membershipType = (vals[3] || '').toString().trim();
    const startDateRaw  = vals[4];
    const endDateRaw    = vals[5];
    const phoneRaw      = (vals[6] || '').toString().trim();
    const remainingDays = vals[7];
    const clientAnswer  = (vals[8] || '').toString().trim();
    const subCode       = (vals[9] || '').toString().trim();

    if (!playerCode || !playerName) continue;
    if (processedCodes.has(playerCode)) {
      console.log(`   ⏭️  [${i+1}] Skipping duplicate code: ${playerCode}`);
      continue;
    }
    processedCodes.add(playerCode);

    try {
      const gender    = sectionToGender(section);
      const phone     = cleanPhone(phoneRaw);
      const startDate = parseDate(startDateRaw);
      const endDate   = parseDate(endDateRaw);
      const planInfo  = mapPlan(membershipType);

      // Generate auth credentials
      const email    = generateEmail(playerCode, i);
      const password = generatePassword();

      // Create Firebase Auth account
      let uid;
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: playerName,
          disabled: false,
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

      // Create users doc (login mapping)
      await db.collection('users').doc(uid).set({
        uid,
        email,
        phone: phone || '',
        displayName: playerName,
        role: 'member',
        lang: 'ar',
        avatar: '',
        isActive: true,
        tenantId: TENANT_ID,
        superAdmin: false,
        tenantRole: 'member',
        fcmTokens: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Calculate remaining days
      let daysLeft = 0;
      if (endDate) {
        const now = new Date();
        daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      }

      // Determine status based on remaining days
      const memberStatus = daysLeft > 0 ? 'active' : 'expired';

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
        status: memberStatus,
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
        // Store credentials for admin reference
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
        status: memberStatus,
        totalSessions: planInfo.sessions,
        usedSessions: 0,
        remainingSessions: planInfo.sessions,
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

      credentials.push({
        name: playerName,
        playerCode,
        email,
        password,
        phone: phone || '',
        section,
        membershipType,
        status: memberStatus,
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        daysLeft,
        uid,
      });

      activeCount++;
      if (activeCount % 25 === 0) {
        console.log(`   ✅ Active: ${activeCount}/${activeRows.length} imported...`);
      }

      // Rate-limit to avoid Firebase Auth quota issues (max ~10/sec)
      if (activeCount % 10 === 0) await sleep(1100);

    } catch (err) {
      activeErrors++;
      console.error(`   ❌ [${i+1}] Error for "${playerName}" (${playerCode}):`, err.message);
      // Don't stop on individual errors
    }
  }

  console.log(`\n   ✅ Active import done: ${activeCount} success, ${activeErrors} errors\n`);

  // ──────────────────────────────────────────────────────────
  // PHASE 2: Expired Subscriptions
  // ──────────────────────────────────────────────────────────
  console.log('📂 Reading expired subscriptions file...');
  const wbExpired = XLSX.readFile(EXPIRED_FILE, { cellDates: true });
  const wsExpired = wbExpired.Sheets[wbExpired.SheetNames[0]];
  const expiredRows = XLSX.utils.sheet_to_json(wsExpired, { defval: '' });
  console.log(`   Found ${expiredRows.length} expired members\n`);

  const expiredHeaders = Object.keys(expiredRows[0] || {});
  console.log('   Expired headers:', expiredHeaders.join(' | '));

  let expiredCount = 0;
  let expiredErrors = 0;
  let expiredSkipped = 0;

  for (let i = 0; i < expiredRows.length; i++) {
    const row = expiredRows[i];
    const vals = Object.values(row);

    // Expired file columns:
    // A: كود اللاعب, B: اسم الحساب, C: كود الاشتراك, D: نوع العضوية,
    // E: إسم القسم, F: رقم الهاتف, G: بداية الاشتراك, H: نهاية الاشتراك, I: إجابة العميل
    const playerCode    = (vals[0] || '').toString().trim();
    const playerName    = (vals[1] || '').toString().trim();
    const subCode       = (vals[2] || '').toString().trim();
    const membershipType = (vals[3] || '').toString().trim();
    const section       = (vals[4] || '').toString().trim();
    const phoneRaw      = (vals[5] || '').toString().trim();
    const startDateRaw  = vals[6];
    const endDateRaw    = vals[7];
    const clientAnswer  = (vals[8] || '').toString().trim();

    if (!playerCode || !playerName) continue;
    if (processedCodes.has(playerCode)) {
      expiredSkipped++;
      continue;
    }
    processedCodes.add(playerCode);

    try {
      const gender    = sectionToGender(section);
      const phone     = cleanPhone(phoneRaw);
      const startDate = parseDate(startDateRaw);
      const endDate   = parseDate(endDateRaw);
      const planInfo  = mapPlan(membershipType);

      // Generate auth credentials
      const email    = generateEmail(playerCode, 10000 + i);
      const password = generatePassword();

      // Create Firebase Auth account (disabled for expired members)
      let uid;
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: playerName,
          disabled: true, // ← disabled for expired/inactive accounts
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

      // Create member document — status: expired
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
        // Store credentials for admin reference
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

      credentials.push({
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

      expiredCount++;
      if (expiredCount % 100 === 0) {
        console.log(`   ✅ Expired: ${expiredCount}/${expiredRows.length} imported... (${expiredSkipped} skipped as duplicates)`);
      }

      // Rate-limit
      if (expiredCount % 10 === 0) await sleep(1100);

    } catch (err) {
      expiredErrors++;
      console.error(`   ❌ [${i+1}] Error for "${playerName}" (${playerCode}):`, err.message);
    }
  }

  console.log(`\n   ✅ Expired import done: ${expiredCount} success, ${expiredErrors} errors, ${expiredSkipped} duplicates skipped\n`);

  // ──────────────────────────────────────────────────────────
  // PHASE 3: Save credentials log
  // ──────────────────────────────────────────────────────────
  console.log('📝 Saving credentials log...');

  // Save as JSON
  const logPath = path.join(PROJECT_ROOT, 'member-credentials.json');
  fs.writeFileSync(logPath, JSON.stringify(credentials, null, 2), 'utf8');
  console.log(`   Saved to: ${logPath}`);

  // Save as CSV for easy viewing
  const csvPath = path.join(PROJECT_ROOT, 'member-credentials.csv');
  const csvHeader = 'الاسم,كود اللاعب,البريد الإلكتروني,كلمة المرور,الهاتف,القسم,نوع العضوية,الحالة,بداية الاشتراك,نهاية الاشتراك,الأيام المتبقية,UID';
  const csvRows = credentials.map(c =>
    `"${c.name}","${c.playerCode}","${c.email}","${c.password}","${c.phone}","${c.section}","${c.membershipType}","${c.status}","${c.startDate}","${c.endDate}","${c.daysLeft}","${c.uid}"`
  );
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + '\n' + csvRows.join('\n'), 'utf8');
  console.log(`   Saved to: ${csvPath}`);

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Import Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Active members imported:  ${activeCount}`);
  console.log(`  Expired members imported: ${expiredCount}`);
  console.log(`  Total imported:           ${activeCount + expiredCount}`);
  console.log(`  Active errors:            ${activeErrors}`);
  console.log(`  Expired errors:           ${expiredErrors}`);
  console.log(`  Duplicates skipped:       ${expiredSkipped}`);
  console.log(`  Credentials saved to:     member-credentials.json / .csv`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run
importMembers()
  .then(() => {
    console.log('🎉 Import complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
