# Tests

The audit found the project had **no tests**, yet the Firestore security rules are
its only real authorization boundary. This suite establishes a foundation and
locks in the audit's highest-risk fixes.

## Unit + regression guards (no emulator needed)

```bash
npm test
```

Runs (Node's built-in test runner, `node --test`):

| File | What it guards |
|---|---|
| `format.test.mjs` | `lib/format.js` date/number coercion across all value shapes |
| `plans.test.mjs` | `lib/plans.js` invariants — single source of truth for SaaS plans (feature keys, trial gating, unique order) |
| `i18n-coverage.test.mjs` | **every `t('key')` used in code resolves in both `ar.json`/`en.json`** — guards the 69-missing-key bug the audit fixed |
| `collection-drift.test.mjs` | the kebab-case collection names (`diet-plans`, …) never reappear — guards the trainer→member delivery fix |

These run in plain Node (the source modules are ESM; Node ≥20 auto-detects).

## Security-rules tests (needs the Firestore emulator + Java)

```bash
npm run test:rules
```

Runs `tests/rules/firestore-rules.test.mjs` via
`firebase emulators:exec --only firestore`, using
[`@firebase/rules-unit-testing`](https://firebase.google.com/docs/rules/unit-tests).

**Prerequisites:** Java 11+ (the emulator is a JVM app), `firebase-tools`, and:

```bash
npm i -D @firebase/rules-unit-testing
```

Covers: privilege-escalation blocks on `users/{uid}`, the tenant-owner
self-upgrade lock (C2), trainer-managed collections being trainer-writable /
member-readable, members being unable to write member-scoped collections
directly, `auditLogs` immutability, and platform-payment authorization.

> Note: the rules tests could not be executed in the audit sandbox (no Java).
> They are written against the deployed rules and are ready to run in any
> environment with the emulator.
