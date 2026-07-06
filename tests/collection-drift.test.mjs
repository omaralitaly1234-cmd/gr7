// Regression guard for the Batch 1 fix: the old kebab-case collection-name
// variants must never reappear in code (they caused trainer-written data to be
// invisible to members). Also asserts the canonical snake_case names ARE used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, acc);
    else if (e.name.endsWith('.js')) acc.push(fp);
  }
  return acc;
}

const allSource = () => walk(path.join(ROOT, 'src')).map(f => fs.readFileSync(f, 'utf8')).join('\n');

const BANNED = ["'diet-plans'", "'training-programs'", "'trainer-sessions'", "'session-notes'"];
const CANONICAL = ["'diet_plans'", "'training_programs'", "'trainer_sessions'", "'session_notes'"];

test('no kebab-case collection-name variants reappear in code', () => {
  const src = allSource();
  const found = BANNED.filter(name => src.includes(name));
  assert.deepEqual(found, [], `banned collection names present: ${found.join(', ')}`);
});

test('canonical snake_case collection names are present', () => {
  const src = allSource();
  const missing = CANONICAL.filter(name => !src.includes(name));
  assert.deepEqual(missing, [], `expected canonical names missing: ${missing.join(', ')}`);
});

test('client diet/training pages read the same collection the trainer writes', () => {
  const dietClient = fs.readFileSync(path.join(ROOT, 'src/app/[locale]/client/diet/page.js'), 'utf8');
  const dietTrainer = fs.readFileSync(path.join(ROOT, 'src/app/[locale]/trainer/diet-plans/page.js'), 'utf8');
  assert.ok(dietClient.includes("'diet_plans'"), 'client/diet must read diet_plans');
  assert.ok(dietTrainer.includes("'diet_plans'"), 'trainer/diet-plans must write diet_plans');

  const trainClient = fs.readFileSync(path.join(ROOT, 'src/app/[locale]/client/training/page.js'), 'utf8');
  const progTrainer = fs.readFileSync(path.join(ROOT, 'src/app/[locale]/trainer/programs/page.js'), 'utf8');
  assert.ok(trainClient.includes("'training_programs'"), 'client/training must read training_programs');
  assert.ok(progTrainer.includes("'training_programs'"), 'trainer/programs must write training_programs');
});
