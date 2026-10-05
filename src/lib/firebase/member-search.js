// ============================================
// Member search for every search box (members page, MemberPicker, scanner).
//
// Names are found by ANY word (see lib/name-search.js for why that needs the
// `nameTokens` field rather than a range query on `fullName.ar`); codes and
// phones by prefix. planMemberSearch picks only the queries that can match
// what was typed — an Arabic name runs one query, not four.
// ============================================

import { getTenantDocuments, getTenantCollectionCount } from './firestore';
import {
  NAME_TOKENS_FIELD, nameSearchTokens, primarySearchWord, primarySearchPair, searchWords, memberMatchesName,
  planMemberSearch,
} from '../name-search';

const HIGH = ''; // end of a prefix range

const prefixFilters = (field, value) => [
  { field, operator: '>=', value },
  { field, operator: '<=', value: value + HIGH },
];

async function run(tenantId, filters, limit, label) {
  const { data, error } = await getTenantDocuments(tenantId, 'members', filters, null, limit);
  if (error) {
    console.error(`[MemberSearch] ${label} failed:`, error);
    return [];
  }
  return data || [];
}

// Words counted to pick the rarest; a longer search is cut to its longest words.
const MAX_COUNTED_WORDS = 4;
// Docs read for the rarest word, before checking the other words here. "عز"
// alone matches ~130 members; "محمد" matches ~1600 and must never be the one.
const RAREST_WINDOW = 200;

/**
 * Members whose name contains every word of `queryText` (each word matched from
 * its start: "النجا" finds "النجار"). Archived members are left out.
 *
 * One word: one `array-contains` query. Several words:
 *   1. the neighbouring-words token ("محمد عز") — exact, one small query;
 *   2. when that finds nobody (words typed out of order, or a member written
 *      before those tokens existed), the RAREST word is queried and the rest
 *      checked here. Counts come from Firestore's count(), which runs alongside
 *      step 1 so the fallback costs one more round trip, not two.
 *
 * Querying the longest word instead used to miss members: "محمد عز" read the
 * first 100 of 1644 "محمد"s and the one wanted wasn't among them.
 *
 * @returns {Promise<Array>} member docs, at most `limit`
 */
export async function searchMembersByName(tenantId, queryText, limit = 25) {
  const word = primarySearchWord(queryText);
  if (!tenantId || !word) return [];

  const keep = (docs, check) => docs
    .filter(m => m.status !== 'archived' && (!check || memberMatchesName(m, queryText)))
    .slice(0, limit);
  const byToken = (token, n, label) =>
    run(tenantId, [{ field: NAME_TOKENS_FIELD, operator: 'array-contains', value: token }], n, label);

  const pair = primarySearchPair(queryText);
  if (!pair) return keep(await byToken(word, limit, 'name'), false);

  const words = [...new Set(searchWords(queryText))]
    .sort((a, b) => b.length - a.length)
    .slice(0, MAX_COUNTED_WORDS);
  const [pairHits, counts] = await Promise.all([
    byToken(pair, Math.max(limit * 4, 100), 'name pair'),
    Promise.all(words.map(w => getTenantCollectionCount(tenantId, 'members',
      [{ field: NAME_TOKENS_FIELD, operator: 'array-contains', value: w }]))),
  ]);

  const exact = keep(pairHits, true);
  if (exact.length > 0) return exact;

  // A word nobody has means nobody has them all.
  if (counts.some(c => !c?.error && c?.count === 0)) return [];
  // A failed count sorts last; if every count failed, the longest word is used.
  const rarest = words
    .map((w, i) => ({ w, n: counts[i]?.error ? Infinity : counts[i]?.count ?? Infinity }))
    .reduce((a, b) => (b.n < a.n ? b : a)).w;
  // Names with the words in the order typed first: "محمد عز" matches 36
  // members, and "محمد عز ..." should not be cut off by the limit.
  const inOrder = m => (nameSearchTokens(m.fullName).includes(pair) ? 0 : 1);
  const hits = await byToken(rarest, RAREST_WINDOW, 'name rarest');
  return keep(hits.filter(m => memberMatchesName(m, queryText))
    .sort((a, b) => inOrder(a) - inOrder(b)), false);
}

/**
 * Search members by whatever was typed: name, member code or phone.
 * Code matches come first (an exact code is the strongest signal), then phone,
 * then name. Archived members are left out.
 *
 * @returns {Promise<Array>} member docs, at most `limit`
 */
export async function searchMembers(tenantId, queryText, limit = 25) {
  if (!tenantId) return [];
  const plan = planMemberSearch(queryText);

  const groups = await Promise.all([
    plan.code ? run(tenantId, prefixFilters('membershipNumber', plan.code), limit, 'code') : [],
    plan.phone ? run(tenantId, prefixFilters('phone', plan.phone), limit, 'phone') : [],
    plan.name ? searchMembersByName(tenantId, queryText, limit) : [],
    plan.namePrefix ? run(tenantId, prefixFilters('fullName.ar', plan.namePrefix), limit, 'name prefix') : [],
  ]);

  const seen = new Set();
  return groups.flat()
    .filter(m => m.status !== 'archived' && !seen.has(m.id) && seen.add(m.id))
    .slice(0, limit);
}
