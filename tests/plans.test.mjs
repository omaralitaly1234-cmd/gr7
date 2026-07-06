// Invariant tests for lib/plans.js — the single source of truth for SaaS plans.
// Guards the Batch 6 consolidation: if a plan drifts (missing feature key, wrong
// trial gating, duplicate order), this fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_DEFINITIONS, AI_FEATURES, AI_FEATURE_LABELS } from '../src/lib/plans.js';

const plans = Object.values(PLAN_DEFINITIONS);
const REQUIRED_PLAN_KEYS = ['trial', 'monthly', 'quarterly', 'semi_annual', 'annual'];

test('all expected plan keys exist', () => {
  for (const k of REQUIRED_PLAN_KEYS) assert.ok(PLAN_DEFINITIONS[k], `missing plan: ${k}`);
});

test('every plan has required fields', () => {
  for (const p of plans) {
    assert.equal(typeof p.id, 'string');
    assert.equal(typeof p.name?.ar, 'string');
    assert.equal(typeof p.name?.en, 'string');
    assert.equal(typeof p.durationDays, 'number');
    assert.equal(typeof p.maxMembers, 'number');
    assert.equal(typeof p.maxTrainers, 'number');
    assert.equal(typeof p.features, 'object');
    assert.equal(typeof p.order, 'number');
  }
});

test('every plan.features contains every AI_FEATURES key (as boolean)', () => {
  for (const p of plans) {
    for (const f of AI_FEATURES) {
      assert.equal(typeof p.features[f], 'boolean', `${p.id}.features.${f} not boolean`);
    }
  }
});

test('trial has all AI features OFF', () => {
  for (const f of AI_FEATURES) assert.equal(PLAN_DEFINITIONS.trial.features[f], false, `trial ${f} should be false`);
});

test('paid plans have all AI features ON', () => {
  for (const key of ['monthly', 'quarterly', 'semi_annual', 'annual']) {
    for (const f of AI_FEATURES) assert.equal(PLAN_DEFINITIONS[key].features[f], true, `${key} ${f} should be true`);
  }
});

test('plan.order values are unique', () => {
  const orders = plans.map(p => p.order);
  assert.equal(new Set(orders).size, orders.length, 'duplicate order values');
});

test('durations are sane and monotonic-ish by tier', () => {
  assert.equal(PLAN_DEFINITIONS.trial.durationDays, 90);
  assert.equal(PLAN_DEFINITIONS.monthly.durationDays, 30);
  assert.equal(PLAN_DEFINITIONS.annual.durationDays, 365);
});

test('annual is unlimited (-1) members & trainers', () => {
  assert.equal(PLAN_DEFINITIONS.annual.maxMembers, -1);
  assert.equal(PLAN_DEFINITIONS.annual.maxTrainers, -1);
});

test('AI_FEATURE_LABELS covers every AI_FEATURES key with ar/en/icon', () => {
  for (const f of AI_FEATURES) {
    const label = AI_FEATURE_LABELS[f];
    assert.ok(label, `missing label for ${f}`);
    assert.equal(typeof label.ar, 'string');
    assert.equal(typeof label.en, 'string');
    assert.equal(typeof label.icon, 'string');
  }
});
