// ============================================
// "Your subscription is about to end" — decided at the moment of check-in.
//
// A 12-class plan warns when the classes left after today's visit drop to the
// gym's threshold (2 by default, then again at 1 and on the last class). A
// time plan (a month, three months, diamond) warns when the days left until
// its end date drop to the threshold (2 by default, then again at 1). The days
// count is the same ceil() the scanner's member card shows, so the warning and
// the "Days left" row never disagree.
//
// Pure, no Firebase, so the scanner, the settings page and the tests share it.
// ============================================

const DAY = 86400000;

export const DEFAULT_EXPIRY_WARNING = {
  enabled: true,
  sessionsBefore: 2,
  daysBefore: 2,
};

function clampThreshold(value, fallback) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(30, n);
}

/** Read the warning options out of the stored settings document. */
export function toExpiryWarningSettings(doc) {
  return {
    enabled: doc?.expiryWarningEnabled !== false,
    sessionsBefore: clampThreshold(doc?.expiryWarningSessions, DEFAULT_EXPIRY_WARNING.sessionsBefore),
    daysBefore: clampThreshold(doc?.expiryWarningDays, DEFAULT_EXPIRY_WARNING.daysBefore),
  };
}

/**
 * Should this check-in carry an expiry warning?
 *
 * @param {{
 *   totalSessions?: number|null,      // null/undefined for a time plan
 *   remainingSessions?: number|null,  // AFTER today's visit was deducted
 *   endDateMs?: number|null,
 *   nowMs?: number,
 *   settings?: ReturnType<typeof toExpiryWarningSettings>,
 * }} input
 * @returns {null | { kind: 'sessions' | 'days', left: number }}
 */
export function computeExpiryWarning({
  totalSessions = null,
  remainingSessions = null,
  endDateMs = null,
  nowMs = Date.now(),
  settings = DEFAULT_EXPIRY_WARNING,
} = {}) {
  if (!settings?.enabled) return null;

  // Classes run out before the calendar does on a session plan, so they win.
  const isSessionPlan = totalSessions !== null && totalSessions !== undefined;
  if (isSessionPlan) {
    const left = Math.max(0, Number(remainingSessions) || 0);
    if (left <= settings.sessionsBefore) return { kind: 'sessions', left };
  }

  const end = Number(endDateMs);
  if (Number.isFinite(end) && end > nowMs) {
    const left = Math.ceil((end - nowMs) / DAY);
    if (left <= settings.daysBefore) return { kind: 'days', left };
  }

  return null;
}

function arCount(kind, n) {
  if (kind === 'sessions') {
    if (n === 1) return 'حصة واحدة';
    if (n === 2) return 'حصتين';
    return `${n} حصص`;
  }
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومين';
  return `${n} أيام`;
}

function enCount(kind, n) {
  if (kind === 'sessions') return `${n} ${n === 1 ? 'class' : 'classes'}`;
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

/**
 * The text for both the front-desk banner and the member's notification.
 * @returns {{ title: {ar: string, en: string}, body: {ar: string, en: string}, desk: {ar: string, en: string} }}
 */
export function expiryWarningText(warning) {
  const { kind, left } = warning;

  if (kind === 'sessions' && left === 0) {
    return {
      title: { ar: '⏳ دي آخر حصة في اشتراكك', en: '⏳ That was your last class' },
      body: {
        ar: 'خلصت حصص اشتراكك النهارده — جدد اشتراكك عشان تكمل تمرينك من غير ما تقف.',
        en: 'Today used the last class on your subscription — renew to keep training without a break.',
      },
      desk: { ar: 'دي آخر حصة في اشتراكه — فكّره بالتجديد', en: 'Last class on this subscription — remind them to renew' },
    };
  }

  const ar = arCount(kind, left);
  const en = enCount(kind, left);
  return {
    title: { ar: '⏳ اشتراكك قرب يخلص', en: '⏳ Your subscription is ending soon' },
    body: {
      ar: `فاضل في اشتراكك ${ar} بس — جدد اشتراكك عشان تكمل تمرينك من غير ما تقف.`,
      en: `Only ${en} left on your subscription — renew to keep training without a break.`,
    },
    desk: {
      ar: `الاشتراك قرب يخلص — فاضل ${ar}`,
      en: `Subscription ending soon — ${en} left`,
    },
  };
}

/**
 * One notification per subscription per step, so a double-scan or a second
 * visit the same day does not send the same warning twice.
 */
export function expiryNotificationId(subscriptionId, warning) {
  const sub = String(subscriptionId || 'nosub').replace(/[^A-Za-z0-9_-]/g, '');
  return `expiry_${sub}_${warning.kind === 'sessions' ? 's' : 'd'}${warning.left}`;
}
