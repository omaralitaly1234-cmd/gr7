// ============================================
// Find members by any word of their name (see lib/name-search.js for why this
// needs the `nameTokens` field rather than a range query on `fullName.ar`).
// ============================================

import { getTenantDocuments } from './firestore';
import { NAME_TOKENS_FIELD, primarySearchWord, searchWords, memberMatchesName } from '../name-search';

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
  const { data, error } = await getTenantDocuments(tenantId, 'members',
    [{ field: NAME_TOKENS_FIELD, operator: 'array-contains', value: word }],
    null, multiWord ? Math.max(limit * 4, 100) : limit);
  if (error) {
    console.error('[MemberSearch] name search failed:', error);
    return [];
  }

  return (data || [])
    .filter(m => m.status !== 'archived' && (!multiWord || memberMatchesName(m, queryText)))
    .slice(0, limit);
}
