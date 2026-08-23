// ============================================
// Spa service / package catalogue — the built-in defaults.
// Framework-neutral (NO 'use client') so server routes and client components
// can both import it.
//
// This list used to live inline in admin/spa/page.js, which meant a gym could
// not change its own spa prices. It is now only the SEED: each gym's editable
// catalogue lives in `tenants/{tid}/spa_services` (see
// lib/firebase/spa-services-store.js) and is written from this list the first
// time the spa page is opened.
// ============================================

// duration — minutes of the session
// sessions — for multi-session packages; null = a single visit
export const SPA_SERVICES = [
  { id: 'steam', icon: '♨️', name: { ar: 'غرفة بخار', en: 'Steam Room' }, price: 150, duration: 60, sessions: null },
  { id: 'sauna', icon: '🧖', name: { ar: 'ساونا', en: 'Sauna' }, price: 200, duration: 60, sessions: null },
  { id: 'jacuzzi', icon: '🛁', name: { ar: 'جاكوزي', en: 'Jacuzzi' }, price: 250, duration: 60, sessions: null },
  { id: 'massage', icon: '💆', name: { ar: 'مساج', en: 'Massage' }, price: 350, duration: 60, sessions: null },
  { id: 'facial', icon: '✨', name: { ar: 'تنظيف بشرة', en: 'Facial' }, price: 300, duration: 60, sessions: null },
  { id: 'body_wrap', icon: '🧴', name: { ar: 'لفائف الجسم', en: 'Body Wrap' }, price: 400, duration: 60, sessions: null },
  { id: 'cryo', icon: '❄️', name: { ar: 'علاج بالتبريد', en: 'Cryotherapy' }, price: 500, duration: 30, sessions: null },
  { id: 'turkish_bath', icon: '🏠', name: { ar: 'حمام تركي', en: 'Turkish Bath' }, price: 450, duration: 90, sessions: null },
];

export const SPA_SERVICES_BY_ID = Object.fromEntries(
  SPA_SERVICES.map((s) => [s.id, s])
);

export function getSpaService(serviceId) {
  return SPA_SERVICES_BY_ID[serviceId] || null;
}

export const DEFAULT_SPA_ICON = '🧖';

// ============================================
// Pure helpers — kept here (and not in the Firestore store) so they can be
// unit-tested without pulling the Firebase SDK into the test process.
// ============================================

/** Coerce a stored document into the shape the spa page expects. */
export function toSpaService(doc) {
  return {
    id: doc.id,
    // `serviceId` is what bookings record; for seeded services it is the
    // original catalogue id so historical bookings still resolve.
    serviceId: doc.serviceId || doc.id,
    icon: doc.icon || DEFAULT_SPA_ICON,
    name: { ar: doc.name?.ar || '', en: doc.name?.en || doc.name?.ar || '' },
    price: Number(doc.price) || 0,
    duration: Number(doc.duration) || 0,
    sessions: doc.sessions === null || doc.sessions === undefined || doc.sessions === ''
      ? null
      : Number(doc.sessions),
    active: doc.active !== false,
    sortOrder: Number(doc.sortOrder) || 0,
  };
}

/** Validate a service/package the admin typed. */
export function validateSpaService(form) {
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
      icon: (form.icon || '').trim() || DEFAULT_SPA_ICON,
      name: { ar: nameAr, en: (form.nameEn || '').trim() || nameAr },
      price,
      duration,
      sessions,
      active: form.active !== false,
    },
  };
}

export function spaServiceErrorMessage(error, isAr) {
  switch (error) {
    case 'name_required': return isAr ? 'اكتب اسم الخدمة' : 'Enter a service name';
    case 'bad_price': return isAr ? 'السعر لازم يكون رقم موجب' : 'Price must be a positive number';
    case 'bad_duration': return isAr ? 'المدة لازم تكون دقيقة على الأقل' : 'Duration must be at least 1 minute';
    case 'bad_sessions': return isAr ? 'عدد الجلسات لازم يكون 1 أو أكتر (أو سيبها فاضية)' : 'Sessions must be 1 or more (or left blank)';
    case 'write_failed': return isAr ? 'تعذّر الحفظ' : 'Could not save';
    default: return isAr ? 'بيانات غير صالحة' : 'Invalid data';
  }
}
