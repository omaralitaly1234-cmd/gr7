// Invariants for the editable spa catalogue. The validation is what stands
// between an admin typo and a service that sells at NaN EGP.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPA_SERVICES, toSpaService, validateSpaService, DEFAULT_SPA_ICON,
} from '../src/lib/spa-services.js';

test('every built-in service has the fields the store seeds', () => {
  for (const s of SPA_SERVICES) {
    assert.equal(typeof s.id, 'string');
    assert.equal(typeof s.icon, 'string');
    assert.equal(typeof s.name?.ar, 'string');
    assert.equal(typeof s.name?.en, 'string');
    assert.equal(typeof s.price, 'number');
    assert.ok(s.duration > 0, `${s.id} needs a duration`);
  }
});

test('built-in service ids are unique', () => {
  const ids = SPA_SERVICES.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('toSpaService fills in the gaps of a partial document', () => {
  const s = toSpaService({ id: 'x', name: { ar: 'ساونا' } });
  assert.equal(s.serviceId, 'x');
  assert.equal(s.icon, DEFAULT_SPA_ICON);
  assert.equal(s.name.en, 'ساونا', 'English falls back to Arabic');
  assert.equal(s.price, 0);
  assert.equal(s.sessions, null);
  assert.equal(s.active, true, 'a document with no active flag is sellable');
});

test('toSpaService keeps an explicit sessions count and hidden flag', () => {
  const s = toSpaService({ id: 'x', name: { ar: 'a' }, sessions: '8', active: false, price: '250' });
  assert.equal(s.sessions, 8);
  assert.equal(s.active, false);
  assert.equal(s.price, 250);
});

test('validateSpaService rejects the ways an admin can break a price list', () => {
  assert.equal(validateSpaService({ nameAr: '  ', price: 10, duration: 30 }).error, 'name_required');
  assert.equal(validateSpaService({ nameAr: 'a', price: -1, duration: 30 }).error, 'bad_price');
  assert.equal(validateSpaService({ nameAr: 'a', price: 'abc', duration: 30 }).error, 'bad_price');
  assert.equal(validateSpaService({ nameAr: 'a', price: 10, duration: 0 }).error, 'bad_duration');
  assert.equal(validateSpaService({ nameAr: 'a', price: 10, duration: 30, sessions: 0 }).error, 'bad_sessions');
});

test('validateSpaService normalises a good form', () => {
  const v = validateSpaService({
    nameAr: ' ساونا ', nameEn: '', icon: '', price: '200', duration: '45.9', sessions: '', active: true,
  });
  assert.equal(v.ok, true);
  assert.deepEqual(v.value.name, { ar: 'ساونا', en: 'ساونا' });
  assert.equal(v.value.icon, DEFAULT_SPA_ICON);
  assert.equal(v.value.price, 200);
  assert.equal(v.value.duration, 45, 'duration is floored to whole minutes');
  assert.equal(v.value.sessions, null, 'blank sessions means a single visit');
});
