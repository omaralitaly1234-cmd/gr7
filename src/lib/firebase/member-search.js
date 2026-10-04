// ============================================
// Member search for every search box (members page, MemberPicker, scanner).
//
// Names are found by ANY word (see lib/name-search.js for why that needs the
// `nameTokens` field rather than a range query on `fullName.ar`); codes and
// phones by prefix. planMemberSearch picks only the queries that can match
// what was typed — an Arabic name runs one query, not four.
// ============================================

import { getTenantDocuments } from './firestore';
import {
  NAME_TOKENS_FIELD, primarySearchWord, searchWords, memberMatchesName, planMemberSearch,
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

/**
 * Members whose name contains every word of `queryText` (each word matched from
 * its start: "النجا" finds "النجار"). Archived members are left out.
 *
 * The server filters on the longest word; when more than one word was typed the
 * rest are checked here, so it reads a wider window first to leave enough
 * matches after that narrowing.
 *
 * @returns {Promise<Array>} member docs, at most `limit`
 */
export async function searchMembersByName(tenantId, queryText, limit = 25) {
  const word = primarySearchWord(queryText);
  if (!tenantId || !word) return [];

  const multiWord = searchWords(queryText).length > 1;
  const data = await run(tenantId,
    [{ field: NAME_TOKENS_FIELD, operator: 'array-contains', value: word }],
    multiWord ? Math.max(limit * 4, 100) : limit, 'name');

  return data
    .filter(m => m.status !== 'archived' && (!multiWord || memberMatchesName(m, queryText)))
    .slice(0, limit);
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
