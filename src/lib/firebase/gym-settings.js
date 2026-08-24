'use client';

// ============================================
// The gym's settings document, read once and reused.
//
// The invoice header, the printed receipt and every invoice serial need it, so
// without a memo a busy payments desk would re-read the same document on every
// keystroke-sized action. It changes only when someone saves the settings page,
// which is why a short TTL is enough and why that page clears it explicitly.
// ============================================

import { getTenantDocument } from './firestore';
import { toGymProfile, DEFAULT_GYM_PROFILE, SETTINGS_COLLECTION, SETTINGS_DOC_ID } from '@/lib/gym-profile';

const TTL_MS = 60_000;
const cache = new Map(); // tenantId -> { at, profile }

/**
 * Load a tenant's gym profile. Never throws and never returns null: a missing
 * or unreadable settings document falls back to the defaults, because an
 * invoice must still print if the gym never opened the settings page.
 */
export async function loadGymProfile(tenantId) {
  if (!tenantId) return { ...DEFAULT_GYM_PROFILE };

  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.profile;

  try {
    const { data } = await getTenantDocument(tenantId, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const profile = toGymProfile(data || {});
    cache.set(tenantId, { at: Date.now(), profile });
    return profile;
  } catch (err) {
    console.error('[gym-settings] could not read the settings document:', err);
    return { ...DEFAULT_GYM_PROFILE };
  }
}

/** Call after saving the settings page so the next invoice picks the change up. */
export function clearGymProfileCache(tenantId) {
  if (tenantId) cache.delete(tenantId);
  else cache.clear();
}
