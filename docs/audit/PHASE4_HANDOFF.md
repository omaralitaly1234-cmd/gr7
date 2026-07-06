# PHASE 4 — Verification & Handoff

**System:** Power Time (GR7) gym-management SaaS · **Branch:** `audit/deep-clean` (10 commits ahead of `main`)
**Date:** 2026-07-02 · **Build:** passing (exit 0) · **Live DB:** untouched — 32 docs, identical to the Phase 0 backup (all smoke-test docs cleaned up).

---

## 1. What was done (Phase 3 batches)

| Commit | Batch | Summary | Deploy needed |
|---|---|---|---|
| `d4a6da7` | Safety | DB backup/restore scripts, ignore backups | — |
| `0bba16d` | 0 | Remove dead code, duplicate pages, 4 unused deps | code only |
| `47d4ff9` | 1 | Unify drifted collection names → snake_case; trainer-write rules; fix indexes | **rules + indexes** |
| `86018d5` | 2 | Member self-service writes via secure Admin-SDK API (6 endpoints) | code only |
| `9dba12f` | 3 | Security: owner-update rule lock, seed guard, rate-limit, audit logging, invoice XSS, commission clamp | **rules** |
| `64fe661` | 4 | Integrity transactions: atomic check-in, invoice/membership counters, soft-delete | code only |
| `cec8fbc` | 5 | Subscription-lifecycle scheduled functions (expire + reminders) | **functions** |
| `1e38afe` | Cleanup | Fix 69 missing i18n keys, delete stale message dir, hide 24 stub pages | code only |
| `478baad` | — | Phase 4 handoff doc | — |
| `8ab1075` | 6 | Single source of truth for SaaS plan definitions (lib/plans.js) — removes 4-way drift | code only |
| `3a0da30` | 8 | Secrets hygiene: env-driven set-admins (scrub 3 hardcoded super-admin UIDs) | code only |
| `1979899` | 9 | Normalize members.endDate string→Timestamp + robust lib/format.js + user-run migration | code only (+ optional migration) |
| `1962c55` | 10 | Server-side filter for messages reads (was load-entire-collection) | code only |

Net (whole audit): ~60 files changed. Deep-work continuation (batches 6–10) is behavior-preserving cleanup/hardening.

### Deep-work continuation (batches 14–18)
| Commit | Batch | Change |
|---|---|---|
| `d97d786` | 14 | Test suite: `format`/`plans`/`subscription-math` unit tests + `i18n-coverage` & `collection-drift` regression guards + security-rules test artifact. `npm test` (39 passing), `npm run test:rules`. |
| `9c559b4` | 15 | Extracted freeze math into pure, tested `lib/subscription-math.js`; deduped the 3 freeze paths. |
| `1a4936b` | 16 | AI prompt injection defense — sanitize/clamp all client fields in nutrition/workout prompts (C4). |
| `36511f1` | 17 | Bounded the unbounded engagement attendance query (C7). |
| `583e1ea` | 18 | Client-side audit logging (`logAuditClient`) on member create/archive + payment record (C3). |
| `11ec006` | 19 | Server-side trainer-client loading (`getTrainerClients`) — killed load-all + a dead OR clause; adopted in the hook + 3 trainer pages (C7). |
| `df840f2` | 20 | O(1) member-lookup Maps in admin subscriptions (per-render) + dashboard (C7). |
| `e1de6b8` | 21 | **messages rule** — trainers can now write messages (trainer↔member chat was blocked by the admin-only catch-all). Rules-compile-verified. **Needs the rules deploy.** |

**Tests:** `npm test` runs 39 unit + regression-guard tests (no emulator needed). `npm run test:rules` runs the security-rules suite (needs Java + emulator + `npm i -D @firebase/rules-unit-testing`). See `tests/README.md`.

### Optional user-run migration (Batch 9)
`members.endDate` is written correctly (Timestamp) going forward. To normalize the 2 existing string-typed docs:
```bash
node scripts/db-backup.js                                   # backup first
node scripts/migrate-normalize-member-enddate.js            # dry-run (writes nothing)
node scripts/migrate-normalize-member-enddate.js --confirm  # apply
```
It rewrites each member's endDate from their active-subscription Timestamp (not by parsing the lossy string). Dry-run verified: 2 members convertible.

---

## 2. Re-audit — findings resolved vs. deferred

### Resolved (verified in code)
| # | Finding | Verification |
|---|---|---|
| A1 | Collection-name drift (diet/program/sessions/notes) | 0 kebab variants remain in code; rules + indexes aligned |
| A2 | Rules blocked member writes | Member writes now go through Admin-SDK API (bypass rules); 0 direct client writes to blocked collections |
| A3 | Orphan records on delete | Member delete now soft-deletes + cancels subs; keeps financial history |
| A6 | No membership/invoice uniqueness | Atomic counters (live-tested: 5 parallel → 5 distinct) |
| B1 | Check-in / invoice / freeze / guest races | Transactions (live-tested: 2 concurrent check-ins → 1 win, 1 blocked); freeze/guest transactional in API |
| B2 | No lifecycle enforcement | Scheduled Functions for expiry + renewal reminders |
| C2 | Owner could self-upgrade plan/features | Rules restrict owner tenant-updates to profile fields (compile-verified) |
| C3 | Rate-limiter + audit unused | Rate-limiter on 2 public APIs; audit on 3 mutation APIs |
| C4 | Weak API validation | Commission clamped 0–100; member APIs validate/clamp all inputs |
| C5 | Seed callable in prod | Gated behind `ALLOW_SEED=true` |
| C6 | Client member-creation, mass-assignment | Profile API whitelists fields (status/plan/uid uneditable by member) |
| C8 | Invoice print XSS | Member-controlled fields escaped |
| C10 | Unused deps / dead lib | 4 deps + storage-helpers removed |
| i18n | 69 code keys rendering as raw strings | Migrated; 0 unresolved keys; stale dir deleted |

### Deferred (need your decision / bigger scope — NOT done)
| # | Finding | Why deferred |
|---|---|---|
| A4 | Denormalized dup links (assignedTrainer vs assignedTrainerDocId; endDate stored 3×) | Data-shape change; needs a migration + product decision on canonical field |
| A5 | Wrong types (members.endDate string; renewal-requests date strings) | Migration; low urgency |
| A7 | Broader index/query drift | Only fixed indexes touched by this work; full regen best done after A4/A5 |
| B3 | Freeze semantics (extend up-front vs. credit on unfreeze) | **Needs your product decision**; current cap enforced, model unchanged |
| B4 | Attendance check-out/duration unused | Build checkout flow or drop fields — product call |
| — | Trainer sessions/assessments have **no writer** | The scheduling feature was never built; needs a create flow or removal |
| — | Super-admin `analytics`/`plans`/`settings` don't persist | Separate menu (not the main Sidebar); left visible as core pages |
| C7 | N+1 / unbounded queries | Harmless at current scale (2 members); refactor before growth |
| C9 | Duplicated logic (PLAN_DEFINITIONS ×5, spinner, date coercion) | Refactor-only; no behavior change; safe to do anytime |
| C1 | Ops scripts + local secrets in tree | Left `setAdminsRaw.js`/`generate-secret-value.js` + service-account JSON in place — see §5 |

---

## 3. Before / After metrics

| Metric | Before | After |
|---|---|---|
| Collection-name spellings for diet/program/sessions | 3 each (code/rules/index disagree) | 1 canonical (snake_case) |
| Member-portal write features working | 0 (rules deny) | 6 (via API) |
| Broken (raw-key) translations | 69 | 0 |
| Firestore composite indexes matching real queries | ~3 of 16 | 14 (phantoms removed) |
| Security rules: owner self-upgrade | possible | blocked |
| Public APIs with rate limiting | 0 | 2 |
| Mutation APIs with audit logging | 0 | 3 |
| Race conditions (check-in, invoice#, freeze, guest) | 4 | 0 |
| Unused npm deps | 4 | 0 |
| Non-functional pages in nav | 24 | 0 (hidden) |
| Lifecycle jobs | 0 | 2 (scheduled) |

---

## 4. CONSOLIDATED DEPLOY CHECKLIST

Run from the project root, in order. **Take a fresh DB backup first** (`node scripts/db-backup.js`).

```bash
# 0. Backup (member PII — stays local, git-ignored)
node scripts/db-backup.js

# 1. Merge the audit branch (or deploy from it)
#    git checkout main && git merge audit/deep-clean

# 2. Deploy Firestore rules + indexes  (Batch 1 + Batch 3)
firebase deploy --only firestore:rules,firestore:indexes
#    - rules: trainer-write collections, owner-update lock
#    - indexes: builds diet_plans/training_programs/measurements, drops phantoms

# 3. Deploy the app (Firebase App Hosting picks up the new build)
#    (your normal app deploy — push to the tracked branch / App Hosting)

# 4. Deploy scheduled functions  (Batch 5) — first time will prompt to enable APIs
firebase deploy --only functions
#    Creates: expireSubscriptions (daily 02:00), sendRenewalReminders (daily 09:00)

# 5. Env flags (set in App Hosting / Secret Manager):
#    - ALLOW_SEED: leave UNSET in production (seeding stays disabled)
#      set to "true" only when you deliberately want to run /api/admin/seed
```

**Verification after deploy:**
- Trainer creates a diet plan → member's "My Diet Plan" shows it (was empty before).
- Member edits profile / logs a measurement / sends a message → persists (was silently failing).
- Double-scan a QR fast → second scan says "already checked in" (no duplicate row).
- Check the Firestore console → `auditLogs` gets entries on payment confirm / trainer create.

---

## 5. Rollback

**Code (any batch):** `git revert <commit>` — each batch is an isolated commit. Or abandon everything: `git checkout main` (branch untouched).

**Rules/indexes:** re-deploy the previous versions — they're in git history at `main` (`c4e6cad`):
```bash
git checkout main -- firestore.rules firestore.indexes.json
firebase deploy --only firestore:rules,firestore:indexes
```

**Functions:** `firebase functions:delete expireSubscriptions sendRenewalReminders`.

**Data:** `node scripts/db-restore.js _db-backups/<stamp>/firestore-full.json --confirm` (add `--prune` to also remove docs created after the backup). Refuses to run without `--confirm`.

---

## 6. Remaining risks & recommended follow-ups (priority order)

1. **Local secrets hygiene (do soon).** The service-account JSON, `.env.local`, and `new fire base.txt` (contains a VAPID private key) sit in the working tree. They were **never committed** (verified against full history) and are git-ignored, but you should: confirm Secret Manager holds these, then delete the local copies; move `setAdminsRaw.js` / `generate-secret-value.js` to an untracked `ops/` dir and scrub the hardcoded super-admin UIDs.
2. **Decide freeze semantics (B3)** so the freeze model can be finalized.
3. **Build or remove the trainer-sessions feature** — the dashboard queries an always-empty collection nothing writes.
4. **Normalize the duplicated relationships (A4)** — pick one trainer-link field, one end-date source of truth; then run a data migration.
5. **Refactor duplicated logic (C9)** — single `PLAN_DEFINITIONS`, shared `<Spinner/>`, shared date/format util. Pure cleanup, no behavior change.
6. **Add server-side validation lib (zod)** across the older admin APIs and paginate the unbounded report queries (C7) before member counts grow.
7. **Test suite** — ✅ started (batch 14): 39 unit + regression-guard tests run via `npm test`, and a security-rules suite (`npm run test:rules`) is ready to run once you have Java + the emulator. Extend coverage toward the API routes and the check-in transaction next (those need the emulator or a mocked Admin SDK).

---

## 7. Updated ERD (post-audit)

Changes vs. the Phase 1 ERD: canonical snake_case trainer collections now exist and are writable; member soft-delete adds `status='archived'`; atomic `counters/*` docs added; scheduled functions drive expiry/reminders.

```mermaid
erDiagram
    USERS ||--o| TENANTS : "owns (ownerUid)"
    USERS }o--|| TENANTS : "belongs to (tenantId)"
    TENANTS ||--o{ MEMBERS : contains
    TENANTS ||--o{ TRAINERS : contains
    TENANTS ||--o{ COUNTERS : "atomic seq (invoices/members)"
    MEMBERS ||--o{ SUBSCRIPTIONS : has
    MEMBERS ||--o{ PAYMENTS : makes
    MEMBERS ||--o{ ATTENDANCE : "checks in (1/day, atomic)"
    MEMBERS ||--o{ MEASUREMENTS : "logs (via API)"
    MEMBERS ||--o{ CHECKINS : "daily (via API)"
    MEMBERS ||--o{ MESSAGES : "to trainer (via API)"
    MEMBERS ||--o{ RENEWAL_REQUESTS : requests
    MEMBERS ||--o{ GUEST_INVITATIONS : "invites (via API, capped)"
    TRAINERS ||--o{ DIET_PLANS : authors
    TRAINERS ||--o{ TRAINING_PROGRAMS : authors
    TRAINERS ||--o{ SESSION_NOTES : authors
    TRAINERS ||--o{ EVALUATIONS : authors
    TRAINERS ||--o{ INJURIES : logs
    SUBSCRIPTIONS ||--o{ ATTENDANCE : "deducts sessions (atomic)"
    SCHEDULED_FN ..> SUBSCRIPTIONS : "expire + remind (daily)"
```

Referential integrity is still application-enforced (Firestore has no FKs); the member APIs and transactions now guarantee ownership and atomicity for the paths they cover.
