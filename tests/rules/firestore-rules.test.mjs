// Security-rules tests — the app's ONLY real authorization boundary (middleware
// is cosmetic; every page is client-rendered). Requires the Firestore emulator:
//   npm run test:rules      (runs `firebase emulators:exec --only firestore ...`)
//
// Covers the guarantees this audit introduced/verified:
//   - privilege-escalation blocks on users/{uid}
//   - tenant owner CANNOT self-upgrade plan/features/limits/status (C2)
//   - trainer-managed collections are trainer-writable, member-readable
//   - members cannot write member-scoped collections directly (writes go via API)
//   - auditLogs are immutable
//   - platform payments: tenant creates own, only super-admin mutates
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT_A = 'tenantA';
const TENANT_B = 'tenantB';

let testEnv;

function ctx(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}
const unauth = () => testEnv.unauthenticatedContext().firestore();

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gr7-rules-test',
    firestore: { rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8') },
  });
});

after(async () => { await testEnv?.cleanup(); });

// Seed role/tenant docs with rules DISABLED before each test.
beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'users/superadmin'), { superAdmin: true, role: 'superadmin', tenantRole: 'superadmin' });
    await setDoc(doc(db, 'users/ownerA'), { superAdmin: false, tenantId: TENANT_A, tenantRole: 'owner', role: 'admin', isActive: true });
    await setDoc(doc(db, 'users/adminA'), { superAdmin: false, tenantId: TENANT_A, tenantRole: 'admin', role: 'admin', isActive: true });
    await setDoc(doc(db, 'users/trainerA'), { superAdmin: false, tenantId: TENANT_A, tenantRole: 'trainer', role: 'trainer', isActive: true });
    await setDoc(doc(db, 'users/memberA'), { superAdmin: false, tenantId: TENANT_A, tenantRole: 'member', role: 'member', isActive: true });
    await setDoc(doc(db, 'users/memberB'), { superAdmin: false, tenantId: TENANT_B, tenantRole: 'member', role: 'member', isActive: true });
    await setDoc(doc(db, `tenants/${TENANT_A}`), { status: 'active', ownerUid: 'ownerA', subscription: { plan: 'trial' }, features: {}, limits: { maxMembers: 100 } });
    await setDoc(doc(db, `tenants/${TENANT_B}`), { status: 'active', ownerUid: 'ownerB' });
    await setDoc(doc(db, `tenants/${TENANT_A}/members/m1`), { memberId: 'm1', fullName: { ar: 'x' }, status: 'active' });
  });
});

// ---------- users: privilege escalation ----------
test('user can read own doc, not another user in a different tenant', async () => {
  await assertSucceeds(getDoc(doc(ctx('memberA'), 'users/memberA')));
  await assertFails(getDoc(doc(ctx('memberA'), 'users/memberB')));
});

test('user CANNOT escalate own privileges (superAdmin/tenantRole)', async () => {
  await assertFails(updateDoc(doc(ctx('memberA'), 'users/memberA'), { superAdmin: true }));
  await assertFails(updateDoc(doc(ctx('memberA'), 'users/memberA'), { tenantRole: 'owner' }));
  await assertFails(updateDoc(doc(ctx('memberA'), 'users/memberA'), { role: 'admin' }));
});

test('user CAN update a non-privileged field on own doc', async () => {
  await assertSucceeds(updateDoc(doc(ctx('memberA'), 'users/memberA'), { displayName: 'New Name' }));
});

test('self-registration cannot mint an admin/superadmin', async () => {
  await assertFails(setDoc(doc(ctx('newuser'), 'users/newuser'), { superAdmin: true, role: 'member', tenantRole: 'member' }));
  await assertFails(setDoc(doc(ctx('newuser'), 'users/newuser'), { superAdmin: false, role: 'admin', tenantRole: 'admin' }));
  await assertSucceeds(setDoc(doc(ctx('newuser'), 'users/newuser'), { superAdmin: false, role: 'member', tenantRole: 'member' }));
});

// ---------- tenant owner cannot self-upgrade (C2) ----------
test('owner CAN update tenant profile fields', async () => {
  await assertSucceeds(updateDoc(doc(ctx('ownerA'), `tenants/${TENANT_A}`), { name: 'New Gym', phone: '0100' }));
});

test('owner CANNOT self-grant plan / features / limits / status', async () => {
  await assertFails(updateDoc(doc(ctx('ownerA'), `tenants/${TENANT_A}`), { 'subscription.plan': 'annual' }));
  await assertFails(updateDoc(doc(ctx('ownerA'), `tenants/${TENANT_A}`), { features: { ai_nutrition: true } }));
  await assertFails(updateDoc(doc(ctx('ownerA'), `tenants/${TENANT_A}`), { limits: { maxMembers: -1 } }));
  await assertFails(updateDoc(doc(ctx('ownerA'), `tenants/${TENANT_A}`), { status: 'active' }));
});

test('non-owner admin cannot update the tenant doc', async () => {
  await assertFails(updateDoc(doc(ctx('adminA'), `tenants/${TENANT_A}`), { name: 'x' }));
});

// ---------- members subcollection ----------
test('admin can write members; member cannot; cross-tenant cannot read', async () => {
  await assertSucceeds(setDoc(doc(ctx('adminA'), `tenants/${TENANT_A}/members/m2`), { fullName: { ar: 'y' }, status: 'active' }));
  await assertFails(setDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/members/m3`), { fullName: { ar: 'z' } }));
  await assertSucceeds(getDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/members/m1`)));
  await assertFails(getDoc(doc(ctx('memberB'), `tenants/${TENANT_A}/members/m1`)));
});

// ---------- trainer-managed collections ----------
for (const coll of ['diet_plans', 'training_programs', 'trainer_sessions', 'measurements']) {
  test(`${coll}: trainer can write, member can read, member cannot write`, async () => {
    await assertSucceeds(setDoc(doc(ctx('trainerA'), `tenants/${TENANT_A}/${coll}/d1`), { trainerId: 'trainerA' }));
    await assertSucceeds(getDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/${coll}/d1`)));
    await assertFails(setDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/${coll}/d2`), { trainerId: 'x' }));
  });
}

// ---------- messages: trainer creates, member reads, member can't create ----------
test('messages: trainer can create, member can read + update, member cannot create', async () => {
  await assertSucceeds(setDoc(doc(ctx('trainerA'), `tenants/${TENANT_A}/messages/msg1`), { memberId: 'm1', from: 'trainer', text: 'hi' }));
  await assertSucceeds(getDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/messages/msg1`)));
  await assertSucceeds(updateDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/messages/msg1`), { read: true }));
  await assertFails(setDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/messages/msg2`), { memberId: 'm1', from: 'member', text: 'x' }));
});

// ---------- renewal-requests: member creates, member can't approve ----------
test('member can create a renewal-request but not update one', async () => {
  await assertSucceeds(setDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/renewal-requests/r1`), { memberId: 'm1', status: 'pending' }));
  await assertFails(updateDoc(doc(ctx('memberA'), `tenants/${TENANT_A}/renewal-requests/r1`), { status: 'approved' }));
  await assertSucceeds(updateDoc(doc(ctx('adminA'), `tenants/${TENANT_A}/renewal-requests/r1`), { status: 'approved' }));
});

// ---------- auditLogs immutable ----------
test('auditLogs: any authed user can create; nobody can update/delete', async () => {
  await assertSucceeds(addDoc(collection(ctx('memberA'), 'auditLogs'), { action: 'x', createdAt: Date.now() }));
  await testEnv.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'auditLogs/log1'), { action: 'seed' });
  });
  await assertFails(updateDoc(doc(ctx('superadmin'), 'auditLogs/log1'), { action: 'tamper' }));
  await assertFails(deleteDoc(doc(ctx('superadmin'), 'auditLogs/log1')));
});

// ---------- platform payments ----------
test('tenant member creates a payment for own tenant (amount>0); cannot confirm', async () => {
  await assertSucceeds(setDoc(doc(ctx('memberA'), 'payments/p1'), { tenantId: TENANT_A, amount: 100 }));
  await assertFails(setDoc(doc(ctx('memberA'), 'payments/p2'), { tenantId: TENANT_A, amount: 0 }));
  await assertFails(setDoc(doc(ctx('memberA'), 'payments/p3'), { tenantId: TENANT_B, amount: 100 }));
  await assertFails(updateDoc(doc(ctx('memberA'), 'payments/p1'), { status: 'confirmed' }));
  await assertSucceeds(updateDoc(doc(ctx('superadmin'), 'payments/p1'), { status: 'confirmed' }));
});

// ---------- unauthenticated ----------
test('unauthenticated access is denied', async () => {
  await assertFails(getDoc(doc(unauth(), `tenants/${TENANT_A}/members/m1`)));
  await assertFails(getDoc(doc(unauth(), 'users/memberA')));
});
