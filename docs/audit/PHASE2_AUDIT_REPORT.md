# PHASE 2 — Deep Audit Report (GATE 2 Deliverable)

**System:** Power Time (GR7) Gym Management SaaS · **Branch:** `audit/deep-clean` · **Date:** 2026-07-02
**Method:** Full code read (169 files), live-DB schema extraction (32 docs), **deployed rules & indexes fetched via API and verified byte-identical to repo**, usage-graph verification of every deletion candidate.
**Nothing has been changed.** Every finding below cites its evidence.

**Severity totals: 8 Critical · 10 High · 14 Medium · 8 Low**
**Classification totals: FIX 24 · REFACTOR 10 · DELETE 22 items (see §5) · KEEP (explicit) 4**

---

## 1 · CRITICAL — broken core behavior in production

### C1. Firestore rules silently block most trainer & member features — the app's biggest defect
- **Location:** `firestore.rules:241-248` (generic catch-all) — deployed version identical (verified via Rules API).
- **Evidence:** Catch-all requires `isTenantAdmin` for create/update. Collections with **no specific rule** include: `messages`, `diet_plans`, `training_programs`, `measurements`, `session-notes`, `evaluations`, `injuries`, `checkins`, `guest-invitations`, `subscriptions`. Trainer users have `tenantRole='trainer'`, members `'member'` → **every write from trainer/member UI to these collections is permission-denied**.
- **Corroboration from live DB:** all of these collections contain **zero documents**, while admin-written collections (attendance, payments, spa_bookings) and member-permitted ones (renewal-requests, admin-notifications) have data. The pattern matches the rules exactly.
- **Compounding defect:** `firestore.js` helpers swallow errors into `{ error }` return values; many pages never check them (e.g. client freeze shows "تم التجميد بنجاح" toast although the write was denied — [subscription/page.js:242-246](../../src/app/%5Blocale%5D/client/subscription/page.js)). Users see success; nothing is saved.
- **Impact:** Trainer chat, member replies, diet plans, training programs, measurements by trainer, session notes, evaluations, injuries, mood check-ins, guest invites, member freeze — all broken in production.
- **Fix:** rewrite rules with explicit per-collection matrix (trainer-writable set via `isTenantTrainer`, member-self-writable set with `request.resource.data.memberId` ownership checks), then verify with emulator tests. → **FIX**

### C2. Naming-split: trainers write `diet_plans` / `training_programs`, members read `diet-plans` / `training-programs`
- **Location:** writer [trainer/diet-plans/page.js:102](../../src/app/%5Blocale%5D/trainer/diet-plans/page.js) → `diet_plans`; reader [client/diet/page.js](../../src/app/%5Blocale%5D/client/diet/page.js) → `diet-plans`. Same for programs ([trainer/programs](../../src/app/%5Blocale%5D/trainer/programs/page.js) vs [client/training](../../src/app/%5Blocale%5D/client/training/page.js)); also `trainer_sessions` (3 pages) vs `trainer-sessions` (planner page).
- **Impact:** even after C1 is fixed, members will never see what trainers create.
- **Fix:** single canonical name per concept + one shared constants module (`lib/firebase/collections.js`). → **FIX**

### C3. Subscription expiry is never enforced anywhere
- **Evidence:** `grep status: 'expired'` → zero writers. No Cloud Functions/cron exist. Scanner trusts `member.status` ([scanner/page.js:75](../../src/app/%5Blocale%5D/admin/attendance/scanner/page.js)) and never compares `endDate` to today. `expireTenant()` exported, never called. `renewalReminded`/`autoRenew` fields never used.
- **Impact:** an expired member checks in indefinitely; tenant SaaS expiry only "enforced" by client-side layout rendering.
- **Fix:** (a) scanner must validate `subscription.endDate >= today` at check-in; (b) add scheduled function (or on-read reconciliation) to flip statuses; (c) tenant expiry enforced in rules via `isTenantActive` (already there) **plus** a job that flips `tenants.status`. → **FIX**

### C4. Tenant owner can self-upgrade plan/features/limits for free; tenant creation is unvalidated
- **Location:** `firestore.rules:117` (`allow update: isTenantOwner` — no field restrictions) and `firestore.rules:112-114` (create validates nothing about content).
- **Impact:** any gym owner can write `subscription.plan='annual'`, `features.*=true`, `limits.maxMembers=-1` directly and bypass billing; a new user can create a tenant already "active/annual".
- **Fix:** rules field-allowlist on owner update (`diff().affectedKeys()` must not touch `subscription`, `features`, `limits`, `status`); force onboarding-created tenants to trial via rules or move creation server-side. → **FIX**

### C5. Invoice numbers are duplicated by design
- **Evidence:** [finance/payments/page.js:106](../../src/app/%5Blocale%5D/admin/finance/payments/page.js) `INV-${year}-${payments.length + 1}` where `payments` is loaded with `limit 100` → after payment #100 **every** invoice is `INV-YYYY-0101`. [spa/page.js:96](../../src/app/%5Blocale%5D/admin/spa/page.js) `SPA-…-${bookings.length + 1}` where `bookings` is filtered **by selected date** → numbering resets per day. Concurrent admins duplicate numbers too. Live data corroborates: only 1 of 3 payments even has an invoiceNumber.
- **Impact:** billing/accounting integrity; legally significant for invoices.
- **Fix:** atomic counter doc (`config/counters`) updated in a Firestore transaction, or timestamp-based IDs. → **FIX**

### C6. Tenant-wide PII exposure to every member
- **Location:** `firestore.rules:125-131` — `members` read for any `belongsToTenant`; plus [client/messages/page.js:27](../../src/app/%5Blocale%5D/client/messages/page.js) fetches **all** messages then filters client-side (any member can read everyone's chats once C1 is fixed — the current denial is the only thing hiding this hole).
- **Impact:** `nationalId`, `medicalNotes`, phone, address of all members readable by any gym member; `subscriptions`/`spa_bookings` (catch-all read) likewise.
- **Fix:** members read restricted to admin/trainer/self (`resource.data.uid == request.auth.uid`); messages rule with `participants`-based access + server-side filtered queries. → **FIX**

### C7. AI usage tracking & budget enforcement never work
- **Location:** [token-tracker.js:16](../../src/lib/ai/token-tracker.js) imports the **client** SDK `db` yet runs inside API routes (server, unauthenticated) → root `aiUsage` writes/reads are rules-denied (no rule matches root `aiUsage`; rules only cover `tenants/{tid}/aiUsage`).
- **Corroboration:** root `aiUsage` collection does not exist in live DB despite AI features being used; `checkLimit()` catches the error and returns zero usage → **monthly budget is never enforced** (unlimited free Gemini usage), and the admin AI-dashboard has nothing to display (it's hardcoded).
- **Fix:** rewrite token-tracker on `firebase-admin` (`getAdminDb()`), keep collection root-side (admin SDK bypasses rules). Also fix `>=` off-by-one at [token-tracker.js:168] and stop trusting `role` from request body ([api/ai/chat/route.js:11]). → **FIX**

### C8. Storage: all client-side upload paths are dead, and rules can never pass
- **Evidence:** `storage.rules:18-27` authorize via **custom claims** (`request.auth.token.tenantId`), but zero of the 9 Auth users have claims (verified via Admin SDK; claims are only set for API-created trainers). Additionally `uploadImage`/`uploadFile` from [storage-helpers.js](../../src/lib/firebase/storage-helpers.js) are imported **nowhere** — no upload UI exists (member `photo`, tenant `logo` are always empty strings).
- **Impact:** photos/logos/receipts features are phantom end-to-end.
- **Fix decision needed:** either implement uploads (align storage.rules to Firestore-doc-based auth or set claims for all users at login) — or remove the dead helper + rules blocks. → **FIX or DELETE (needs your call)**

---

## 2 · HIGH

| # | Finding | Evidence | Class |
|---|---|---|---|
| H1 | **Check-in race + non-atomic session deduction**: "already checked in today" is check-then-write; session deducted *before* attendance insert; double-scan → double deduction; no transaction | [scanner/page.js:88-135](../../src/app/%5Blocale%5D/admin/attendance/scanner/page.js) | FIX (transaction) |
| H2 | **Trainer earnings are a phantom relationship**: queries `payments.trainerId` — no writer ever sets `trainerId` on payments; earnings/commissions permanently 0 | [trainer/earnings/page.js:35] vs the 3 payment writers (members/new:192, spa:87, finance/payments:95) | FIX (stamp trainerId or drop page) |
| H3 | **Renewal approval renews nothing**: sets `status:'approved'` + notification only; no endDate extension, no payment, no new subscription | [admin/renewal-requests/page.js:53-77] | FIX (or explicitly document manual flow) |
| H4 | **Member self-freeze = free extension** (once C1 unblocks it): immediately extends `endDate` without status change, no admin approval, no unfreeze — member keeps training during "freeze" | [client/subscription/page.js:241-247] | FIX (make it a request, like renewal) |
| H5 | **Public member registration is a dead-end funnel**: creates `users` doc with `tenantId:null`, no join-a-gym flow; register page advertises unrelated gold/diamond plans. 2 orphan member users exist in prod | [register/page.js:72-77], `lib/firebase/auth.js registerUser`, live users data | FIX (invite-code flow) or DELETE page (**needs your call**) |
| H6 | **Audit/activity pages read collections nothing writes**: `audit_logs`, `activity_log` have zero writers; root `auditLogs` lib (`logAudit`) never called. 3 competing audit designs, 0 working | [admin/audit/page.js:39], [admin/activity/page.js:23], [lib/firebase/audit.js] | FIX (wire ONE audit path) + DELETE the other two |
| H7 | **Unbounded fetch + client-side filtering** of whole collections (members ×5 trainer pages, messages ×2, attendance in engagement, subscriptions+expenses in forecast) — cost, latency, and (post-C1) privacy | trainer/clients:26, trainer/progress:31, trainer/schedule:33, trainer/messages:30+47, client/messages:27, admin/engagement:23, admin/forecast:26-28 | FIX (server-side where-filters; `useTrainerClients` already exists) |
| H8 | **Onboarding API abuse surface**: public, no rate limit (rate-limiter.js exists, unused), no email verification, no CAPTCHA; free 90-day tenants en masse | [api/admin/onboarding/route.js:14-140], [lib/rate-limiter.js] | FIX |
| H9 | **XSS in invoice print**: `window.open` + HTML string interpolating member-controlled names/notes unescaped | [admin/finance/invoices/page.js:44-96] | FIX (escape or use jsPDF) |
| H10 | **Broadcast notifications**: one doc **per member** (N writes, no batching) *and* a second incompatible broadcast shape (`target/readBy`) mixed in the same collection | [admin/notifications/page.js:71-85]; live data shows both shapes | REFACTOR (single broadcast doc + `readBy`, or batched writes) |

---

## 3 · MEDIUM

| # | Finding | Evidence | Class |
|---|---|---|---|
| M1 | Freeze/unfreeze logic duplicated in 2 admin pages (already diverging) | members/[id]/page.js:73-119 vs subscriptions/page.js:76-108 | REFACTOR → shared service |
| M2 | `PLAN_DEFINITIONS` duplicated ×5 (subscription.js, onboarding API, onboarding page, register page, landing) | §8 of Phase 1 report | REFACTOR (single source; server = authority) |
| M3 | `members.endDate` stored as **localized display string** (Arabic-Indic digits) duplicating `subscriptions.endDate` (Timestamp); unqueryable, drifts | members/new/page.js:149; live data | FIX (drop field or store Timestamp) |
| M4 | Dual trainer FK on members: `assignedTrainer` (auth uid) **and** `assignedTrainerDocId` (trainers doc id) + denormalized `assignedTrainerName`; every consumer checks both | members/new:151-153, useTrainerClients, 5 trainer pages | FIX (canonical = trainers doc id; keep uid only on trainers doc) |
| M5 | Scanner writes `subscriptionId: currentPlan.planId` (a **plan** id, not subscription doc id) and `sessionDeducted` computed from plan shape, not from actual deduction | scanner/page.js:132-134 | FIX |
| M6 | Rules: any member can update any `notifications` doc; any member can create `attendance` (fake check-ins bypassing session deduction); any member can create root `payments` | firestore.rules:228-237, 135-142, 279-284 | FIX (tighten) |
| M7 | 8 of 16 deployed indexes reference non-existent fields/collections (`membershipStatus`, `checkInTime`, `