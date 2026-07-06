# PHASE 2 — Deep Audit Report (GATE 2 Deliverable)

**System:** Power Time (GR7) gym-management SaaS · **Branch:** `audit/deep-clean`
**Method:** read-only. Deployed Firestore rules & indexes fetched via REST and confirmed **identical** to repo. Findings cite file:line or collection. Nothing changed.

**Severity scale:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low
**Disposition:** KEEP / FIX / REFACTOR / DELETE / NEEDS CONFIRMATION

---

## Executive summary

The app builds and the admin portal is largely functional, but three structural problems dominate:

1. **The member (client) portal is mostly non-functional at the data layer.** Security rules silently deny almost every member-initiated write, and two core features are additionally broken by collection-name drift (member reads `diet-plans`/`training-programs`; trainer writes `diet_plans`/`training_programs`). So "My Diet Plan", "My Program", daily check-in, measurements, profile edit, member-side freeze, guest invite, and trainer chat do not persist for real members. This matches the live DB, which has **zero** member-generated documents.
2. **No integrity or lifecycle layer.** No transactions (race conditions on check-in, invoice numbers, freeze, session deduction), no server-side validation, no FK cleanup on delete, and no background jobs — so `autoRenew`, `renewalReminded`, tenant/subscription expiry, and attendance check-out are dead fields nothing ever drives.
3. **Significant dead surface.** ~29 of 101 portal pages are UI shells; a whole audit-logging library and the rate-limiter are defined but never called; index/rules entries point at collections that don't exist.

Counts: **8 root files/secrets issues**, **~20 stub pages**, **6 duplicate/drift relationships**, **2 fully-dead libraries**, **12 phantom indexes**. No evidence of data corruption in the live 32 docs — the problems are structural, so cleanup is low-risk if sequenced correctly.

---

## A) Database & relationships

### A1 🔴 Collection-name drift breaks diet-plan & program delivery — FIX
**Evidence:** trainer writes `diet_plans` ([trainer/diet-plans/page.js:102](src/app/[locale]/trainer/diet-plans/page.js)) and `training_programs` ([trainer/programs/page.js:96](src/app/[locale]/trainer/programs/page.js)); client reads `diet-plans` ([client/diet/page.js](src/app/[locale]/client/diet/page.js), [client/diet-plan/page.js](src/app/[locale]/client/diet-plan/page.js)) and `training-programs` ([client/training/page.js](src/app/[locale]/client/training/page.js)). Rules/indexes use a **third** spelling `dietPlans`/`trainingPrograms`.
**Impact:** A trainer builds a plan; the member's page is permanently empty. Silent — no error. Same for trainer-sessions (`trainer_sessions` vs `trainer-sessions` in [trainer/planner/page.js](src/app/[locale]/trainer/planner/page.js)).
**Fix:** pick one canonical name per concept (recommend `diet_plans`, `training_programs`, `trainer_sessions`), update reads+writes+rules+indexes together, and run a one-time data-copy migration for any existing docs (none exist today, so migration is a no-op now — cheap to fix immediately).

### A2 🔴 Security rules silently block member writes — FIX (rules)
**Evidence:** `firestore.rules:241` catch-all `match /{subcollection}/{docId}` requires `isTenantAdmin` for create/update. Members write to `checkins`, `measurements`, `members` (self-edit), `messages`, `subscriptions` (freeze/guest), `guest-invitations` — none has a member-permissive rule. Only `renewal-requests` and `admin-notifications` creates succeed.
**Impact:** Core member features fail closed. Confirmed by live DB: no `measurements`/`checkins`/`messages`/`guest-invitations` collections exist at all.
**Fix:** add explicit rules allowing a member to write **their own** docs (guarded by `request.resource.data.memberId == <their member doc>`), or route these writes through authenticated API endpoints. Needs a decision: rules-based vs API-based (I recommend API for measurements/messages so `memberId` can't be spoofed).

### A3 🟠 No referential-integrity cleanup on delete — FIX
**Evidence:** [admin/members/page.js](src/app/[locale]/admin/members/page.js) `deleteTenantDocument('members', id)` deletes only the member doc. `subscriptions`, `payments`, `attendance`, `messages`, `renewal-requests` keep dangling `memberId`. Trainer delete ([admin/trainers/page.js](src/app/[locale]/admin/trainers/page.js)) leaves `members.assignedTrainer` pointing at a deleted trainer.
**Impact:** Orphaned financial/attendance records; revenue reports double-count or misattribute; assigned-trainer UI breaks.
**Fix:** soft-delete (status `archived`) or a cascading cleanup batch. Recommend soft-delete to preserve financial history.

### A4 🟠 Duplicate/denormalized relationships that can drift — FIX/NEEDS CONFIRMATION
- **Two trainer→member links:** `members.assignedTrainer` (trainer *uid*) **and** `members.assignedTrainerDocId` (trainer *doc id*), plus denormalized `assignedTrainerName`. Set together in [members/new/page.js:151-153](src/app/[locale]/admin/members/new/page.js) but queried inconsistently (some pages filter `assignedTrainer`, some check both). **Fix:** keep one (recommend `assignedTrainerDocId` as the FK; derive uid/name at read time).
- **Subscription end-date stored 3×:** `members.endDate` (a *locale string*!), `members.currentPlan.endDate` (timestamp), `subscriptions.endDate` (timestamp). Freeze updates only `subscriptions.endDate` → member card shows stale date. **Fix:** single source of truth = `subscriptions.endDate`; drop the string copy.
- **`members.status` vs `subscriptions.status`** both hold frozen/active and are updated in pairs by admin but not by the (blocked) client path → can desync. **Fix:** derive member status from active subscription.

### A5 🟡 Wrong data types & NULL misuse — FIX
- `members.endDate`: **string** (`toLocaleDateString`) — [members/new/page.js:149](src/app/[locale]/admin/members/new/page.js). Should be Timestamp or removed (A4).
- `renewal-requests.requestedAt/rejectedAt/approvedAt`: **ISO strings** while every other timestamp is a Firestore Timestamp — [renewal-requests/page.js:58,84](src/app/[locale]/admin/renewal-requests/page.js). Breaks ordering vs `createdAt`.
- `subscriptions.totalSessions/remainingSessions`: **null** used as "unlimited" sentinel, then compared `!== null` in scanner logic ([scanner/page.js:109](src/app/[locale]/admin/attendance/scanner/page.js)). Works but fragile; prefer an explicit `sessionBased: boolean`.

### A6 🟡 Missing UNIQUE/constraint enforcement — FIX
No uniqueness on `members.membershipNumber` / `qrCode` (generated as `count+1`, races → duplicate QR → wrong member check-in). No uniqueness on `users.email` in trainer/member creation. Firestore can't do UNIQUE natively → needs a transaction + lookup, or a `membershipNumbers/{number}` marker doc.

### A7 🟡 Indexes ↔ queries fully drifted — FIX/DELETE
**Deployed indexes** (verified) reference non-existent fields/collections: `members.membershipStatus+membershipEnd`, `attendance.checkInTime` (real: `checkIn`), `finances` (no such collection), `auditLogs`×3 (never written), `dietPlans`/`trainingPrograms`/`classes.schedule.dayOfWeek` (unused spellings). Meanwhile recent commits *removed compound queries* to avoid missing indexes.
**Fix:** regenerate `firestore.indexes.json` from actual queries after A1/A8 land; **DELETE** the phantom index entries.

---

## B) Domain logic (gym-specific)

### B1 🟠 Race conditions — no transactions — FIX
| Location | Race |
|---|---|
| [scanner/page.js:90-135](src/app/[locale]/admin/attendance/scanner/page.js) | Check "already checked in today" then write attendance + decrement `remainingSessions` non-atomically → double check-in / double session deduction on rapid re-scan |
| [spa/page.js:96](src/app/[locale]/admin/spa/page.js), [finance/payments/page.js:106](src/app/[locale]/admin/finance/payments/page.js) | `invoiceNumber = collection.length + 1` → concurrent bookings produce duplicate invoice numbers |
| [client/subscription freeze](src/app/[locale]/client/subscription/page.js) + [members/[id] freeze](src/app/[locale]/admin/members/[id]/page.js) | Two independent freeze paths, no lock, no `maxFreezeDays` server check → freeze days can exceed cap / double-extend endDate |
| [client/subscription guest invite](src/app/[locale]/client/subscription/page.js) | create `guest-invitations` then `invitationsUsed++` in two writes → counter drifts if second fails |

**Fix:** wrap each in a Firestore `runTransaction`; move invoice numbering to a counter doc or timestamp-based id.

### B2 🟠 Subscription lifecycle never enforced — FIX (needs background jobs)
`autoRenew`, `renewalReminded`, `nextPaymentDate`, tenant `subscription.endDate` are written but **nothing reads/acts on them**. Expiry is computed client-side on page load only ([TenantContext.js:57-59](src/context/TenantContext.js)); `expireTenant()` is exported but never called. Members/tenants never actually transition to `expired`.
**Fix:** a scheduled job (Cloud Function / cron) to expire subscriptions, send renewal reminders, and flip statuses. This is a **missing subsystem**, not a bug to patch — flag for roadmap.

### B3 🟡 Freeze math extends end-date at freeze time — NEEDS CONFIRMATION
Both freeze paths do `endDate += freezeDays` immediately ([members/[id]/page.js unfreeze recomputes from actual days](src/app/[locale]/admin/members/[id]/page.js:96-119); client path adds up-front). Admin unfreeze recomputes from elapsed days (correct); client freeze adds up-front (assumes full freeze used). Two different models. **Confirm intended freeze semantics** before fixing.

### B4 🟡 Attendance check-out / duration never implemented — FIX or DELETE fields
`attendance.checkOut` and `duration` are always `null`; no checkout flow exists. Either build checkout or drop the fields + the "duration" analytics that assume them.

### B5 ⚪ Session deduction skips "diamond" by string — FIX
[scanner/page.js:102](src/app/[locale]/admin/attendance/scanner/page.js) `if (member.currentPlan?.type !== 'diamond')` hardcodes a plan type that comes from free-text plan snapshots. Unlimited-plan detection should read `subscription.totalSessions === null`, not a magic string.

---

## C) Code quality & security

### C1 🔴 Secrets & privileged scripts committed to git — FIX (rotate + purge)
**Evidence (git-tracked):**
- `setAdminsRaw.js` / `setAdmins.js` — **3 real super-admin UIDs + emails hardcoded** ([setAdminsRaw.js:3-12](setAdminsRaw.js)); `setAdmins.js` is corrupt UTF-16 and won't run.
- `generate-secret-value.js` — reads the service-account JSON from repo root.
- `apphosting.yaml` — public Firebase web config (expected public) but the repo also contains `new fire base.txt` with a **VAPID private key** and the service-account JSON in the working tree (both are git-ignored — verified never committed, but present locally).

**Impact:** Anyone with repo access learns the super-admin UIDs. The admin scripts can grant superadmin.
**Fix:** DELETE `setAdmins.js` (broken) and move `setAdminsRaw.js`/`generate-secret-value.js` to an untracked `ops/` dir or `.gitignore` them; scrub hardcoded UIDs; confirm the service-account key isn't needed in-tree. **NEEDS CONFIRMATION** before removing — you may run these manually.

### C2 🟠 Rules let tenant owner self-upgrade plan/features — FIX
`firestore.rules:117` `allow update: if isTenantOwner(tenantId)` with **no field restriction**. An owner can PATCH their own `tenants/{id}` to set `features.*=true`, `limits.maxMembers=-1`, `subscription.plan='annual'`, `status='active'` — bypassing payment entirely.
**Fix:** restrict owner-updatable fields (name/phone/address/logo only); route plan/feature/limit/status changes through the payment API (super-admin) exclusively.

### C3 🟠 Unused security controls — FIX
- `lib/rate-limiter.js` — defined, **imported by nothing**. Public `POST /api/admin/onboarding` and `/api/admin/trainers` have **no rate limiting** → account-creation abuse.
- `lib/firebase/audit.js` (entire module, 5 exports) — **never called**. Yet 3 deployed indexes + the admin `audit`/`activity` pages assume audit data exists. So the audit UI reads collections nothing writes.
**Fix:** either wire audit logging into payment/trainer/member/subscription mutations (recommended — it's already designed) or DELETE the module + indexes + reading pages. Wire rate-limiter into public endpoints.

### C4 🟠 Input validation gaps on APIs — FIX
- `/api/ai/*`: `role` accepted from client ([chat/route.js](src/app/api/ai/chat/route.js)); numeric fields (weight/age/daysPerWeek) unvalidated; `sanitizeInput` exists in [prompts.js](src/lib/ai/prompts.js) but isn't applied at the route boundary.
- `/api/admin/trainers`: `commission` unbounded (can be negative or 1000%); no email-uniqueness check.
- `/api/admin/onboarding`: no rate limit / CAPTCHA; `selectedPlan` from client (mitigated — non-trial → `pending_payment`, gated by `isTenantActive`).
**Fix:** zod-validate all API bodies (zod is already a dependency); clamp commission 0–100; apply prompt sanitization.

### C5 🟠 `/api/admin/seed` callable in production — FIX
[api/admin/seed/route.js](src/app/api/admin/seed/route.js) runs `seedDatabase()` for any caller whose uid === `SUPER_ADMIN_UID`; [seed.js](src/lib/firebase/seed.js) `set(..., {merge:true})` can overwrite the super-admin user doc and platform settings. No "already seeded" guard.
**Fix:** gate behind an explicit env flag disabled in prod, or make idempotent + no-op if data exists.

### C6 🟡 Client-side secondary-app member creation — REFACTOR
[members/new/page.js:206-227](src/app/[locale]/admin/members/new/page.js) spins up a secondary Firebase app in the browser to create the member's Auth user, and writes the `users/{uid}` doc **without custom claims**. Trainers get claims (via API), owners get claims (via API), members don't → storage rules (claim-based) can never pass for members.
**Fix:** move member creation to an Admin-SDK API route mirroring `/api/admin/trainers` (sets claims, server validation, no client credentials).

### C7 🟡 N+1 / unbounded queries (fine now, bad at scale) — REFACTOR
Load-all-then-filter-client-side: trainer `clients`/`progress`/`schedule`/`messages` (all members/messages), admin `engagement` (**all** attendance, no limit — [engagement/page.js:23](src/app/[locale]/admin/engagement/page.js)), `forecast`, `finance/reports` (500 rows), `subscriptions`/`ratings`/`trainers` (per-row member lookups). Harmless at 2 members; O(n²) at 500.
**Fix:** server-side `where` filters + the existing `useTrainerClients` hook everywhere; paginate reports.

### C8 🟡 XSS in invoice print — FIX
[finance/invoices/page.js:44-96](src/app/[locale]/admin/finance/invoices/page.js) builds an HTML string with unsanitized member name/notes and `window.open().write()`. Member-controlled fields (name, notes) → stored XSS in the printed invoice window.
**Fix:** escape interpolated values or render via DOM/text nodes.

### C9 🟡 Duplicate logic — REFACTOR
`PLAN_DEFINITIONS` in 5 places (§Phase1-8); timestamp→Date coercion reimplemented in 20+ pages; loading spinner copy-pasted in ~60 pages; per-page status-badge/date-filter/locale helpers. **Fix:** shared `lib/format.js`, `lib/plans.js` (single source), `<Spinner/>`, `<StatusBadge/>`.

### C10 ⚪ Unused dependencies — DELETE
`qrcode`, `jspdf`, `jspdf-autotable`, `react-dropzone`, and the entire `lib/firebase/storage-helpers.js` are imported by **no** source file (verified). `messages/` at repo root duplicates `src/lib/i18n/messages/`. Storage upload is never wired — member photos/logos/receipts are never uploaded (fields stay `''`).
**Fix:** remove deps + dead lib, or wire uploads if intended (NEEDS CONFIRMATION — do you want photo upload?).

---

## Classification summary

| Disposition | Items |
|---|---|
| **KEEP** | Admin portal core (members, subscriptions, payments, attendance scanner logic sans race, finance), auth model, `api-auth.js`, AI token-tracker, feature-gate system, i18n |
| **FIX** | A1, A2, A3, A4, A5, A6, A7, B1, B2, B4, B5, C1, C2, C4, C5, C8 |
| **REFACTOR** | A4 (dedup links), C6, C7, C9 |
| **DELETE** (pending approval) | see list below |
| **NEEDS CONFIRMATION** | B3 (freeze semantics), C1 (ops scripts), C10 (uploads intended?), stub pages (build vs remove?) |

---

## PROPOSED DELETIONS LIST (nothing deleted yet — awaiting GATE 2 approval)

Each item: what · why · blast radius.

### Group 1 — Dead code, zero references (safest)
| # | Item | Why | Blast radius |
|---|---|---|---|
| D1 | `lib/rate-limiter.js` | imported nowhere | None — but prefer **wiring it in** (C3) over deleting |
| D2 | `lib/firebase/audit.js` (5 exports) | never called | Admin `audit`+`activity` pages read `audit_logs`/`activity_log` — coupled; delete only if we also drop those pages, else **wire it** |
| D3 | Unused exports in `firestore.js` (`subscribeToCollection/Document`, tenant variants, `getTenantPaginatedDocuments`, `batchWrite`, `getCollectionCount`) | 0 external imports | None |
| D4 | Unused exports in `subscription.js` (`expireTenant`, `suspendTenant`, `reactivateTenant`, `updateTenantFeatures`, `upgradePlan`, `getPlans`, `getTenantSubscription`, `getTenantPayments`, `registerGymOwner`) | 0 imports | ⚠️ some (`expireTenant`) *should* be wired for B2 — delete only the truly-orphan ones |
| D5 | Unused deps: `qrcode`, `jspdf`, `jspdf-autotable`, `react-dropzone` + `lib/firebase/storage-helpers.js` | 0 imports (C10) | None if uploads not wanted (confirm C10) |
| D6 | Root `messages/` dir | duplicate of `src/lib/i18n/messages/` | None — verify next-intl points at `src/lib/i18n` (it does) |

### Group 2 — Phantom DB config
| # | Item | Why | Blast radius |
|---|---|---|---|
| D7 | Phantom index entries: `members(membershipStatus,membershipEnd)`, `attendance(checkInTime)`, `finances(*)`, `auditLogs`×3, `dietPlans`, `trainingPrograms`, `classes(schedule.dayOfWeek)` | fields/collections don't exist | Removing an unused index can't break reads; frees index quota. Regenerate from real queries |
| D8 | Dead rules blocks: `dietPlans`, `trainingPrograms`, `bodyMetrics` (camelCase), `invoices` | match no real collection | None (they never fire); tidy after A1 |

### Group 3 — Broken/duplicate pages (needs product decision)
| # | Item | Why | Blast radius |
|---|---|---|---|
| D9 | Duplicate pages `client/diet-plan` (≡`client/diet`), `client/spa-booking` (≡`client/bookings/spa`) | byte-identical except title; only one is linked in Sidebar | Delete the unlinked twin; keep sidebar target |
| D10 | ~20 client stub pages + 4 admin mock pages (`ai-dashboard`, `insights`, `attendance/calendar`, `finance/invoices/[id]`) + trainer `plan-builder`/`templates` | render fake/no data, buttons inert | **Product call:** hide from Sidebar now, build later — or delete. I recommend *hiding* (comment out Sidebar links) over deleting, to preserve intended roadmap |
| D11 | `setAdmins.js` (corrupt UTF-16, non-runnable) | broken | None |

### Group 4 — NEEDS CONFIRMATION before any removal
- Ops scripts `setAdminsRaw.js`, `generate-secret-value.js` (you may run these manually — move to ignored `ops/` rather than delete).
- Service-account JSON / `new fire base.txt` in working tree (local only; recommend deleting local copies after confirming Secret Manager has them).

---

## Recommended fix sequencing (for Phase 3, safest-first)

1. **Batch 0 (no behavior change):** D1–D8 dead code/config removal + C9 shared helpers. Build-verify.
2. **Batch 1 (unblock members):** A1 name unification (+no-op data migration) → A2 rules for member writes → C6 member-creation API. Manual-verify a full member flow.
3. **Batch 2 (integrity):** B1 transactions (scanner, invoice, freeze, guest) + A6 uniqueness + A3 soft-delete.
4. **Batch 3 (security):** C2 tenant-field rules, C4 zod validation, C5 seed guard, C8 invoice escaping, C3 wire rate-limiter + audit.
5. **Batch 4 (lifecycle):** B2 scheduled expiry/renewal jobs (new subsystem).

Each batch = its own commit(s) + fresh DB backup before any data migration, with rollback noted.

---

## Open questions for GATE 2 (I need your calls)

1. **Member writes (A2/C6):** rules-based self-writes, or route through Admin-SDK APIs? (I recommend APIs for measurements/messages.)
2. **Stub pages (D10):** hide from navigation (keep for roadmap) or delete outright?
3. **Audit + rate-limiter (D1/D2/C3):** wire them in (they're already built) or delete?
4. **Uploads (C10/D5):** is member photo / gym logo / receipt upload a real requirement? If no → delete storage lib + 4 deps.
5. **Ops scripts & local secrets (C1/Group 4):** OK to move scripts to an ignored `ops/` dir and scrub hardcoded UIDs? Keep or delete local service-account file?
6. **Freeze semantics (B3):** should freeze extend end-date up-front, or only by actual elapsed days on unfreeze?
