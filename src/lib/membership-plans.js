// ============================================
// Gym MEMBER subscription plans — single source of truth.
// Framework-neutral (NO 'use client') so both server routes and client
// components can import it. Previously this list was inline in
// admin/members/new/page.js, with partial copies in offers and register.
//
// NOTE: this is the plan catalogue a gym sells to its MEMBERS. It is unrelated
// to lib/plans.js, which holds the SaaS plans the platform sells to gym owners.
// ============================================

// duration  — days of validity
// sessions  — session-limited plans deduct one per check-in; null = unlimited
export const MEMBERSHIP_PLANS = [
  { id: 'gold-monthly', name: { ar: 'ذهبي — شهري', en: 'Gold — Monthly' }, type: 'gold', duration: 30, price: 900, sessions: null },
  { id: 'gold-quarterly', name: { ar: 'ذهبي — ربع سنوي', en: 'Gold — Quarterly' }, type: 'gold', duration: 90, price: 2400, sessions: null },
  { id: 'gold-semi', name: { ar: 'ذهبي — نصف سنوي', en: 'Gold — Semi-Annual' }, type: 'gold', duration: 180, price: 4200, sessions: null },
  { id: 'gold-annual', name: { ar: 'ذهبي — سنوي', en: 'Gold — Annual' }, type: 'gold', duration: 365, price: 7200, sessions: null },
  { id: 'gold-12sessions', name: { ar: 'ذهبي — 12 حصة', en: 'Gold — 12 Sessions' }, type: 'gold', duration: 30, price: 600, sessions: 12 },
  { id: 'class-12', name: { ar: '12 كلاس', en: '12 Classes' }, type: 'gold', duration: 30, price: 750, sessions: 12 },
  { id: 'diamond-quarterly', name: { ar: 'ماسي — ربع سنوي', en: 'Diamond — Quarterly' }, type: 'diamond', duration: 90, price: 4500, sessions: null },
  { id: 'diamond-semi', name: { ar: 'ماسي — نصف سنوي', en: 'Diamond — Semi-Annual' }, type: 'diamond', duration: 180, price: 8000, sessions: null },
  { id: 'diamond-annual', name: { ar: 'ماسي — سنوي', en: 'Diamond — Annual' }, type: 'diamond', duration: 365, price: 14000, sessions: null },
];

export const MEMBERSHIP_PLANS_BY_ID = Object.fromEntries(
  MEMBERSHIP_PLANS.map((p) => [p.id, p])
);

export function getMembershipPlan(planId) {
  return MEMBERSHIP_PLANS_BY_ID[planId] || null;
}
