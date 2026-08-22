'use client';

// ============================================
// Per-gym subscription plan catalogue.
//
// The plans used to be a hard-coded list in src/lib/membership-plans.js, so a
// gym could not change its own prices or rename a plan. They now live in
// `tenants/{tid}/membership_plans`, seeded from that list the first time a gym
// opens the pricing page so nothing disappears for existing gyms.
//
// Editing a plan does NOT touch subscriptions already sold: every subscription
// stores a `planSnapshot` taken at purchase time, so a member keeps the price
// and name they signed up on.
// ============================================

import {
  getTenantDocuments,
  addTenantDocument,
  setTenantDocument,
  updateTenantDocument,
  deleteTenantDocument,
} from './firestore';
import { MEMBERSHIP_PLANS } from '@/lib/membership-plans';

export const PLANS_COLLECTION = 'membership_plans';

/** Coerce a stored document into the shape the rest of the app expects. */
export function toPlan(doc) {
  return {
    id: doc.id,
    // `planId` is what subscriptions record; for seeded plans it is the original
    // catalogue id so historical subscriptions still resolve.
    planId: doc.planId || doc.id,
    name: { ar: doc.name?.ar || '', en: doc.name?.en || doc.name?.ar || '' },
    type: doc.type === 'diamond' ? 'diamond' : 'gold',
    duration: Number(doc.duration) || 0,
    price: Number(doc.price) || 0,
    sessions: doc.sessions === null || doc.sessions === undefined || doc.sessions === ''
      ? null
      : Number(doc.sessions),
    active: doc.active !== false,
    sortOrder: Number(doc.sortOrder) || 0,
  };
}

/**
 * Load a gym's plans, seeding the collection from the built-in catalogue the
 * first time. Returns active plans only unless `includeInactive` is set.
 */
export async function loadTenantPlans(tenantId, { includeInactive = false } = {}) {
  if (!tenantId) return { plans: [], error: 'no_tenant' };

  const { data, error } = await getTenantDocuments(tenantId, PLANS_COLLECTION, [],
    { field: 'sortOrder', direction: 'asc' });
  if (error) return { plans: [], error };

  if (!data || data.length === 0) {
    const seeded = await seedTenantPlans(tenantId);
    return { plans: includeInactive ? seeded : seeded.filter(p => p.active), error: null };
  }

  const plans = data.map(toPlan);
  return { plans: includeInactive ? plans : plans.filter(p => p.active), error: null };
}

/**
 * Write the built-in catalogue into a gym that has no plans yet.
 *
 * Uses the catalogue id as the document id rather than an auto-id, so two
 * admins opening the page at the same moment write the same nine documents
 * instead of racing to create eighteen. It also makes the document id and the
 * `planId` recorded on subscriptions the same value for seeded plans.
 */
export async function seedTenantPlans(tenantId) {
  const created = [];
  for (let i = 0; i < MEMBERSHIP_PLANS.length; i += 1) {
    const p = MEMBERSHIP_PLANS[i];
    const payload = {
      planId: p.id,
      name: p.name,
      type: p.type,
      duration: p.duration,
      price: p.price,
      sessions: p.sessions ?? null,
      active: true,
      sortOrder: i,
    };
    const { error } = await setTenantDocument(tenantId, PLANS_COLLECTION, p.id, payload);
    if (!error) created.push(toPlan({ id: p.id, ...payload }));
  }
  return created;
}

/** Validate a plan the admin typed. Pure enough to reason about inline. */
export function validatePlan(form) {
  const nameAr = (form.nameAr || '').trim();
  const price = Number(form.price);
  const duration = Math.floor(Number(form.duration));
  const sessions = form.sessions === '' || form.sessions === null || form.sessions === undefined
    ? null
    : Math.floor(Number(form.sessions));

  if (!nameAr) return { ok: false, error: 'name_required' };
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'bad_price' };
  if (!Number.isFinite(duration) || duration < 1) return { ok: false, error: 'bad_duration' };
  if (sessions !== null && (!Number.isFinite(sessions) || sessions < 1)) {
    return { ok: false, error: 'bad_sessions' };
  }

  return {
    ok: true,
    value: {
      name: { ar: nameAr, en: (form.nameEn || '').trim() || nameAr },
      type: form.type === 'diamond' ? 'diamond' : 'gold',
      price,
      duration,
      sessions,
      active: form.active !== false,
    },
  };
}

export async function createTenantPlan(tenantId, form, sortOrder = 999) {
  const v = validatePlan(form);
  if (!v.ok) return v;
  const { id, error } = await addTenantDocument(tenantId, PLANS_COLLECTION, {
    ...v.value,
    // A brand-new plan needs a stable planId for the subscriptions that will
    // reference it; the document id is the natural choice.
    planId: null,
    sortOrder,
  });
  if (error) return { ok: false, error: 'write_failed', message: error };
  await updateTenantDocument(tenantId, PLANS_COLLECTION, id, { planId: id });
  return { ok: true, id };
}

export async function updateTenantPlan(tenantId, planDocId, form) {
  const v = validatePlan(form);
  if (!v.ok) return v;
  const { error } = await updateTenantDocument(tenantId, PLANS_COLLECTION, planDocId, v.value);
  if (error) return { ok: false, error: 'write_failed', message: error };
  return { ok: true };
}

export async function deleteTenantPlan(tenantId, planDocId) {
  const { error } = await deleteTenantDocument(tenantId, PLANS_COLLECTION, planDocId);
  if (error) return { ok: false, error: 'write_failed', message: error };
  return { ok: true };
}

export function planErrorMessage(error, isAr) {
  switch (error) {
    case 'name_required': return isAr ? 'اكتب اسم الباقة' : 'Enter a plan name';
    case 'bad_price': return isAr ? 'السعر لازم يكون رقم موجب' : 'Price must be a positive number';
    case 'bad_duration': return isAr ? 'المدة لازم تكون يوم على الأقل' : 'Duration must be at least 1 day';
    case 'bad_sessions': return isAr ? 'عدد الحصص لازم يكون 1 أو أكتر (أو سيبها فاضية)' : 'Sessions must be 1 or more (or left blank)';
    case 'write_failed': return isAr ? 'تعذّر الحفظ' : 'Could not save';
    default: return isAr ? 'بيانات غير صالحة' : 'Invalid data';
  }
}
