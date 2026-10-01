// Searching a member by any word of their name — the tokens stored on the doc
// and the words pulled out of what the desk typed must agree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nameSearchTokens, normalizeName, searchWords, primarySearchWord, memberMatchesName,
} from '../src/lib/name-search.js';

const omar = { fullName: { ar: 'عمر علي النجار', en: 'Omar Ali Elnagar' } };

test('the last name alone finds the member', () => {
  const tokens = nameSearchTokens(omar.fullName);
  assert.ok(tokens.includes('النجار'));
  assert.ok(memberMatchesName(omar, 'النجار'));
});

test('part of a word finds the member (typed from the start of that word)', () => {
  assert.ok(memberMatchesName(omar, 'النج'));
  assert.ok(memberMatchesName(omar, 'عل'));
});

test('the family name without "ال" still matches', () => {
  assert.ok(memberMatchesName(omar, 'نجار'));
});

test('several words must all match, in any order', () => {
  assert.ok(memberMatchesName(omar, 'علي النجار'));
  assert.ok(memberMatchesName(omar, 'النجار عمر'));
  assert.equal(memberMatchesName(omar, 'النجار محمد'), false);
});

test('hamza, taa marbuta, alef maqsura and diacritics are folded', () => {
  assert.equal(normalizeName('أحمد'), 'احمد');
  assert.equal(normalizeName('إسلام'), 'اسلام');
  assert.equal(normalizeName('فاطمة'), 'فاطمه');
  assert.equal(normalizeName('مُصْطَفَى'), 'مصطفي');
  const ahmed = { fullName: { ar: 'أحمد مصطفى' } };
  assert.ok(memberMatchesName(ahmed, 'احمد'));
  assert.ok(memberMatchesName(ahmed, 'مصطفي'));
});

test('"عبد الله" and "عبدالله" find each other', () => {
  assert.ok(memberMatchesName({ fullName: { ar: 'محمد عبد الله' } }, 'عبدالله'));
  assert.ok(memberMatchesName({ fullName: { ar: 'محمد عبدالله' } }, 'عبد'));
});

test('names split by "/" (trainer suffix) are separate words', () => {
  const m = { fullName: { ar: 'عمر محمد صالح ك/جهاد' } };
  assert.ok(memberMatchesName(m, 'صالح'));
  assert.ok(memberMatchesName(m, 'جهاد'));
});

test('the English name is searchable too, case-insensitively', () => {
  assert.ok(memberMatchesName(omar, 'elnagar'));
  assert.ok(memberMatchesName(omar, 'OMAR'));
});

test('single letters are never stored or searched', () => {
  assert.ok(nameSearchTokens(omar.fullName).every(t => t.length >= 2));
  assert.deepEqual(searchWords('ع'), []);
  assert.equal(primarySearchWord('ع'), null);
});

test('the server query runs on the longest word typed', () => {
  assert.equal(primarySearchWord('علي النجار'), 'النجار');
});

test('a very long word is cut to the stored prefix length, so it still matches', () => {
  const m = { fullName: { ar: 'عبدالرحمنالمصطفاوي' } };
  const word = primarySearchWord('عبدالرحمنالمصطفاوي');
  assert.ok(nameSearchTokens(m.fullName).includes(word));
});

test('missing or odd names produce no tokens rather than throwing', () => {
  assert.deepEqual(nameSearchTokens(undefined), []);
  assert.deepEqual(nameSearchTokens({}), []);
  assert.equal(memberMatchesName({}, 'عمر'), false);
});

test('tokens are unique', () => {
  const tokens = nameSearchTokens({ ar: 'محمد محمد', en: 'محمد' });
  assert.equal(new Set(tokens).size, tokens.length);
});
