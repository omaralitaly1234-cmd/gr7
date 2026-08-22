// Unit tests for the member check-in code rules. Real codes in this gym are
// short numeric strings with significant leading zeros ("0634"), so the
// string-ness matters and is pinned here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCode, validateCode, findCodeConflict, CODE_MIN, CODE_MAX,
} from '../src/lib/member-code.js';

test('normalisation trims, strips inner spaces and upper-cases', () => {
  assert.equal(normalizeCode('  7470 '), '7470');
  assert.equal(normalizeCode('ab 12'), 'AB12');
  assert.equal(normalizeCode('pt-2026-0001'), 'PT-2026-0001');
  assert.equal(normalizeCode(null), '');
  assert.equal(normalizeCode(undefined), '');
});

test('a leading zero is preserved — codes are strings, not numbers', () => {
  assert.equal(normalizeCode('0634'), '0634');
  assert.equal(validateCode('0634').code, '0634');
  // and a numeric input does not silently lose it either
  assert.equal(normalizeCode(634), '634');
});

test('valid codes are accepted', () => {
  for (const raw of ['7470', '0634', '11381', 'VIP-01', 'a_b1']) {
    const r = validateCode(raw);
    assert.equal(r.ok, true, `${raw} should be valid`);
  }
});

test('empty, too short, too long and bad characters are rejected', () => {
  assert.equal(validateCode('').error, 'empty');
  assert.equal(validateCode('   ').error, 'empty');
  assert.equal(validateCode('7').error, 'too_short');
  assert.equal(validateCode('1'.repeat(CODE_MAX + 1)).error, 'too_long');
  assert.equal(validateCode('12/34').error, 'bad_chars');
  assert.equal(validateCode('كود').error, 'bad_chars');
  assert.equal(validateCode('١٢٣٤').error, 'bad_chars', 'Arabic-Indic digits are not typeable at the door');
});

test('a code exactly at each boundary is allowed', () => {
  assert.equal(validateCode('1'.repeat(CODE_MIN)).ok, true);
  assert.equal(validateCode('1'.repeat(CODE_MAX)).ok, true);
});

const MEMBERS = [
  { id: 'm1', membershipNumber: '7470', qrCode: '7470' },
  { id: 'm2', membershipNumber: '0634', qrCode: '0634' },
  { id: 'm3', membershipNumber: 'OLD-1', qrCode: 'NEW-1' },
];

test('a code already used by another member is a conflict', () => {
  assert.equal(findCodeConflict(MEMBERS, '7470')?.id, 'm1');
  assert.equal(findCodeConflict(MEMBERS, '0634')?.id, 'm2');
});

test('a member keeping its own code is not a conflict', () => {
  assert.equal(findCodeConflict(MEMBERS, '7470', 'm1'), null);
});

test('a conflict is detected on either field, since both are matched at the door', () => {
  assert.equal(findCodeConflict(MEMBERS, 'OLD-1')?.id, 'm3', 'membershipNumber must be checked');
  assert.equal(findCodeConflict(MEMBERS, 'NEW-1')?.id, 'm3', 'qrCode must be checked');
});

test('conflict matching ignores case and spacing, like the door lookup does', () => {
  assert.equal(findCodeConflict(MEMBERS, normalizeCode('old-1'))?.id, 'm3');
});

test('an unused code is free', () => {
  assert.equal(findCodeConflict(MEMBERS, '9999'), null);
  assert.equal(findCodeConflict([], '7470'), null);
});
