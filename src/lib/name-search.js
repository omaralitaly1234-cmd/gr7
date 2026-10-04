// ============================================
// Search a member by ANY word of their name — pure, no Firebase imports, so it
// is unit-testable and usable from the admin scripts as well as the pages.
//
// Firestore has no substring search: a range query on `fullName.ar` only
// matches from the start of the name, so "النجار" never finds
// "عمر علي النجار". Instead every member doc carries `nameTokens` — the
// normalised words of the name plus every prefix of each word — and a search
// is an `array-contains` on one word of what was typed. Typing part of a word
// ("النج") works too, because the prefixes are tokens.
//
// Normalisation folds the spellings people type interchangeably (أ/إ/آ → ا,
// ة → ه, ى → ي, diacritics, tatweel), so "احمد" finds "أحمد".
//
// Every code path that writes `fullName` on a member must also write
// `nameTokens: nameSearchTokens(fullName)`; scripts/backfill-name-tokens.js
// fills it in for existing members.
// ============================================

/** Field name on the member doc. */
export const NAME_TOKENS_FIELD = 'nameTokens';

// Shortest prefix stored. One letter would match half the gym.
const MIN_TOKEN = 2;
// Longest prefix stored — longer search words are cut to this before querying.
const MAX_TOKEN = 15;
// Firestore caps a doc's index entries; real names land far below this.
const MAX_TOKENS = 150;

/** Fold the spelling variants people type interchangeably. */
export function normalizeName(value) {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // diacritics, superscript alef, tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

/** Normalised words, split on spaces and the punctuation names carry ("ك/جهاد", "-"). */
function words(value) {
  return normalizeName(value)
    .split(/[\s/\\\-_.,،()|]+/)
    .filter(Boolean);
}

/**
 * The tokens stored on a member doc.
 *
 * @param {{ ar?: string, en?: string } | string} fullName
 * @returns {string[]} unique, at most MAX_TOKENS
 */
export function nameSearchTokens(fullName) {
  const names = typeof fullName === 'string'
    ? [fullName]
    : [fullName?.ar, fullName?.en];
  const out = new Set();

  const addPrefixes = (word) => {
    const end = Math.min(word.length, MAX_TOKEN);
    for (let i = MIN_TOKEN; i <= end; i++) out.add(word.slice(0, i));
  };

  for (const name of names) {
    const ws = words(name);
    ws.forEach((w, i) => {
      addPrefixes(w);
      // "النجار" is also found by "نجار".
      if (w.startsWith('ال') && w.length > 4) addPrefixes(w.slice(2));
      // "عبد الله" and "عبدالله" are the same name; so are "ابو بكر"/"ابوبكر".
      if ((w === 'عبد' || w === 'ابو') && ws[i + 1]) addPrefixes(w + ws[i + 1]);
    });
  }
  return [...out].slice(0, MAX_TOKENS);
}

/**
 * Turn what was typed into the words to search for.
 *
 * @returns {string[]} normalised words, each cut to MAX_TOKEN; words shorter
 *                     than MIN_TOKEN are dropped (they are never stored).
 */
export function searchWords(query) {
  return words(query)
    .filter(w => w.length >= MIN_TOKEN)
    .map(w => w.slice(0, MAX_TOKEN));
}

/**
 * The single word the server query runs on: the longest one, since it is the
 * most selective. Null when nothing typed is long enough.
 */
export function primarySearchWord(query) {
  const ws = searchWords(query);
  if (ws.length === 0) return null;
  return ws.reduce((a, b) => (b.length > a.length ? b : a));
}

/**
 * Decide which member queries a search box actually needs.
 *
 * Every search used to fire the same four queries (code, phone, name prefix,
 * name word) and wait for the slowest — ~1 s from the gym — although an Arabic
 * name can never match a phone or a code, and a number can never match a name.
 *
 * @returns {{ code: string|null, phone: string|null, name: boolean, namePrefix: string|null }}
 *   code       — prefix to match membershipNumber against (codes are upper-case)
 *   phone      — prefix to match phone against, as typed
 *   name       — run the any-word name search
 *   namePrefix — one-letter fallback: range on fullName.ar (words are ≥ 2 letters)
 */
export function planMemberSearch(raw) {
  const term = String(raw ?? '')
    .trim()
    // Arabic-Indic digits → Latin, so "٠١٠" finds the phone stored as "010".
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
  const plan = { code: null, phone: null, name: false, namePrefix: null };
  if (!term) return plan;

  if (/[؀-ۿ]/.test(term)) {
    // Arabic letters: only ever a name.
    if (primarySearchWord(term)) plan.name = true;
    else plan.namePrefix = term;
  } else if (/^[\d\s+\-()]+$/.test(term)) {
    // Digits: a member code or a phone number. The phone is matched as typed —
    // a few are stored with "+" or spaces, and stripping those would stop the
    // exact form from matching. Codes never contain either.
    plan.phone = term;
    const code = term.replace(/[^\dA-Za-z_-]/g, '');
    if (code) plan.code = code;
  } else {
    // Latin letters: a letter-bearing code, or an English name.
    plan.code = term.replace(/\s+/g, '').toUpperCase();
    plan.name = !!primarySearchWord(term);
  }
  return plan;
}

/**
 * Does this member match EVERY word typed? The server query only filters on
 * one word, so "علي النجار" is narrowed down here.
 */
export function memberMatchesName(member, query) {
  const ws = searchWords(query);
  if (ws.length === 0) return false;
  const tokens = new Set(nameSearchTokens(member?.fullName));
  return ws.every(w => tokens.has(w));
}
