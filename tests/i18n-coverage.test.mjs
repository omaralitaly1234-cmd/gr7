// Regression guard for the i18n fix: every t('key') referenced in the code must
// resolve in BOTH messages/ar.json and messages/en.json. This is exactly the
// class of bug the audit found (69 keys rendering as raw strings).
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

function flatKeys(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatKeys(v, key, out);
    else out.add(key);
  }
  return out;
}

function usedKeys() {
  const used = new Set();
  const re = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
  for (const f of walk(path.join(ROOT, 'src'))) {
    const src = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) used.add(m[1]);
  }
  return used;
}

for (const locale of ['ar', 'en']) {
  test(`every t() key resolves in messages/${locale}.json`, () => {
    const messages = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', `${locale}.json`), 'utf8'));
    const available = flatKeys(messages);
    const missing = [...usedKeys()].filter(k => !available.has(k));
    assert.deepEqual(missing, [], `missing ${locale} keys: ${missing.join(', ')}`);
  });
}

test('ar.json and en.json have identical key sets', () => {
  const ar = flatKeys(JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/ar.json'), 'utf8')));
  const en = flatKeys(JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/en.json'), 'utf8')));
  const onlyAr = [...ar].filter(k => !en.has(k));
  const onlyEn = [...en].filter(k => !ar.has(k));
  assert.deepEqual({ onlyAr, onlyEn }, { onlyAr: [], onlyEn: [] });
});
