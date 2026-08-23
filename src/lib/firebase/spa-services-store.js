'use client';

// ============================================
// Per-gym spa catalogue.
//
// Mirrors lib/firebase/membership-plans-store.js: the services used to be a
// hard-coded list inside admin/spa/page.js, so a gym could not change its own
// spa prices, rename a service or add a package. They now live in
// `tenants/{tid}/spa_services`, seeded from src/lib/spa-services.js the first
// time a gym opens the spa page so nothing disappears for existing gyms.
//
// Editing a service does NOT touch bookings already made: every booking stores
// the price and the service name it was sold at.
// ============================================

import {
  getTenantDocuments,
  addTenantDocument,
  setTenantDocument,
  updateTenantDocument,
  deleteTenantDocument,
} from './firestore';
import { SPA_SERVICES, toSpaService, validateSpaService } from '@/lib/spa-services';

export const SPA_SERVICES_COLLECTION = 'spa_services';

/**
 * Load a gym's spa catalogue, seeding it from the built-in list the first time.
 * Returns active services only unless `includeInactive` is set.
 */
export async function loadTenantSpaServices(tenantId, { includeInactive = false } = {}) {
  if (!tenantId) return { services: [], error: 'no_tenant' };

  const { data, error } = await getTenantDocuments(tenantId, SPA_SERVICES_COLLECTION, [],
    { field: 'sortOrder', direction: 'asc' });
  if (error) return { services: [], error };

  if (!data || data.length === 0) {
    const seeded = await seedTenantSpaServices(tenantId);
    return { services: includeInactive ? seeded : seeded.filter(s => s.active), error: null };
  }

  const services = data.map(toSpaService);
  return { services: includeInactive ? services : services.filter(s => s.active), error: null };
}

/**
 * Write the built-in catalogue into a gym that has no spa services yet.
 *
 * Uses the catalogue id as the document id rather than an auto-id, so two
 * admins opening the page at the same moment write the same eight documents
 * instead of racing to create sixteen. It also keeps the document id and the
 * `serviceId` recorded on bookings the same value for seeded services.
 */
export async function seedTenantSpaServices(tenantId) {
  const created = [];
  for (let i = 0; i < SPA_SERVICES.length; i += 1) {
    const s = SPA_SERVICES[i];
    const payload = {
      serviceId: s.id,
      icon: s.icon,
      name: s.name,
      price: s.price,
      duration: s.duration,
      sessions: s.sessions ?? null,
      active: true,
      sortOrder: i,
    };
    const { error } = await setTenantDocument(tenantId, SPA_SERVICES_COLLECTION, s.id, payload);
    if (!error) created.push(toSpaService({ id: s.id, ...payload }));
  }
  return created;
}

export async function createTenantSpaService(tenantId, form, sortOrder = 999) {
  const v = validateSpaService(form);
  if (!v.ok) return v;
  const { id, error } = await addTenantDocument(tenantId, SPA_SERVICES_COLLECTION, {
    ...v.value,
    // A brand-new service needs a stable serviceId for the bookings that will
    // reference it; the document id is the natural choice.
    serviceId: null,
    sortOrder,
  });
  if (error) return { ok: false, error: 'write_failed', message: error };
  await updateTenantDocument(tenantId, SPA_SERVICES_COLLECTION, id, { serviceId: id });
  return { ok: true, id };
}

export async function updateTenantSpaService(tenantId, serviceDocId, form) {
  const v = validateSpaService(form);
  if (!v.ok) return v;
  const { error } = await updateTenantDocument(tenantId, SPA_SERVICES_COLLECTION, serviceDocId, v.value);
  if (error) return { ok: false, error: 'write_failed', message: error };
  return { ok: true };
}

export async function deleteTenantSpaService(tenantId, serviceDocId) {
  const { error } = await deleteTenantDocument(tenantId, SPA_SERVICES_COLLECTION, serviceDocId);
  if (error) return { ok: false, error: 'write_failed', message: error };
  return { ok: true };
}
