# Deep audit & cleanup — `audit/deep-clean` → `main`

Ready-to-use PR description. Push the branch and open the PR with the steps at the bottom.

---

## Title
`Deep audit: fix member portal, integrity, security, lifecycle + cleanup (16 commits)`

## Summary

End-to-end audit and safe cleanup of the Power Time gym-management SaaS. 16 commits, 61 files, +2280/−1513. Every batch is build-verified; security-sensitive changes were compile-verified against the Firebase Rules API and key data paths were smoke-tested against the live DB (all test docs cleaned up — the live database is unchanged).

### Highlights
- **Member portal now works.** Fixed a 3-way collection-name drift (trainer wrote `diet_plans`, client read `diet-plans`, rules used `dietPlans`) and added 6 secure Admin-SDK API endpoints so members can actually save measurements, check-ins, messages, profile edits, freezes, and guest invites (previously all silently denied by security rules).
- **Data integrity.** Atomic check-in (no double-scan / double session-deduction), atomic invoice + membership numbering (no duplicates), soft-delete that preserves financial history.
- **Security.** Locked the tenant-owner self-upgrade rule, gated the seed endpoint, wired the (previously unused) rate-limiter and audit logging, fixed invoice-print XSS, clamped commission.
- **Lifecycle.** New scheduled Cloud Functions expire subscriptions and send renewal reminders (the model had these fields but nothing acted on them).
- **Cleanup.** Removed dead code + 4 unused deps; consolidated plan definitions to one source; fixed 69 broken translations; hid 24 non-functional stub pages; scrubbed hardcoded super-admin UIDs.

### Commits
| Batch | Commit | Change |
|---|---|---|
| 0 | `0bba16d` | Remove dead code, duplicate pages, unused deps |
| 1 | `47d4ff9` | Unify collection names → snake_case; trainer-write rules; fix indexes |
| 2 | `86018d5` | Member self-service writes via secure Admin-SDK API |
| 3 | `9dba12f` | Security hardening (rules, rate-limit, audit, XSS, seed guard) |
| 4 | `64fe661` | Integrity transactions (check-in, invoice/membership counters, soft-delete) |
| 5 | `cec8fbc` | Subscription-lifecycle scheduled functions |
| — | `1e38afe` | i18n fix + hide stub pages |
| 6 | `8ab1075` | Single source of truth for plan definitions |
| 8 | `3a0da30` | Secrets hygiene (env-driven set-admins) |
| 9 | `1979899` | Normalize members.endDate + robust date util + migration |
| 10 | `1962c55` | Server-side message queries |

Full detail: `docs/audit/PHASE1_INVENTORY.md`, `PHASE2_AUDIT.md`, `PHASE4_HANDOFF.md`.

## ⚠️ Required after merge (does not happen on merge)
```bash
node scripts/db-backup.js                                   # backup
firebase deploy --only firestore:rules,firestore:indexes    # Batches 1 + 3
firebase deploy --only functions                            # Batch 5
```
Keep `ALLOW_SEED` unset in production. Full checklist + rollback in `PHASE4_HANDOFF.md`.

## Follow-ups — now implemented (batches 11–13)
- **Batch 11 (B4)** `90e4696` — removed the dead `checkOut`/`duration` attendance fields + empty columns.
- **Batch 12 (B3)** `c9f8fbc` — standardized both admin freeze paths on the up-front model (added days input; unfreeze just clears status).
- **Batch 13** `01ce3ed` — trainer session-create flow (schedule page) so `trainer_sessions` has a writer; added its trainer-write rule + `trainer_sessions(trainerId,date)` index (**included in the rules+indexes deploy**).

## Security note (unrelated to code)
The `origin` remote URL has a **GitHub PAT embedded in `.git/config`** (and it's now expired). Rotate it and switch to SSH or a credential helper.

---

## How to push + open the PR (needs valid GitHub auth)
```bash
# 1. Fix auth (the stored token is expired). Either:
#    git remote set-url origin git@github.com:omaralitaly1234-cmd/gr7.git   # SSH
#    …or set a fresh PAT via a credential helper.

# 2. Push the branch
git push -u origin audit/deep-clean

# 3. Open the PR — via web:
#    https://github.com/omaralitaly1234-cmd/gr7/compare/main...audit/deep-clean
#    …or with the gh CLI (if installed):
gh pr create --base main --head audit/deep-clean \
  --title "Deep audit: fix member portal, integrity, security, lifecycle + cleanup" \
  --body-file docs/audit/PULL_REQUEST.md
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
