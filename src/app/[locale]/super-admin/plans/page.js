'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PLAN_DEFINITIONS, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';

export default function PlansPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [plans, setPlans] = useState(Object.values(PLAN_DEFINITIONS));
  const [editingPlan, setEditingPlan] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const handleSavePrice = (planId) => {
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, price: parseInt(editPrice) || p.price } : p
    ));
    setEditingPlan(null);
    setEditPrice('');
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💎</span> {locale === 'ar' ? 'إدارة خطط الأسعار' : 'Manage Pricing Plans'}</h1>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-8)',
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              border: plan.type === 'annual' ? '2px solid var(--pt-gold)' : undefined,
            }}
          >
            {plan.type === 'trial' && (
              <div style={{
                position: 'absolute',
                top: 12,
                [locale === 'ar' ? 'left' : 'right']: 12,
                background: 'var(--pt-info-bg)',
                color: 'var(--pt-info)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
              }}>
                🎁 {locale === 'ar' ? 'مجانية' : 'Free'}
              </div>
            )}

            {plan.type === 'annual' && (
              <div style={{
                position: 'absolute',
                top: 12,
                [locale === 'ar' ? 'left' : 'right']: 12,
                background: 'var(--pt-gold)',
                color: 'var(--pt-black)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
              }}>
                ⭐ {locale === 'ar' ? 'الأفضل' : 'Best'}
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                {plan.name[locale] || plan.name.ar}
              </h3>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                {plan.durationDays} {locale === 'ar' ? 'يوم' : 'days'}
              </div>
            </div>

            {/* Price */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
              {editingPlan === plan.id ? (
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{ width: 100, textAlign: 'center' }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleSavePrice(plan.id)}>✓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingPlan(null)}>✕</button>
                </div>
              ) : (
                <div>
                  <span style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 800,
                    color: plan.price === 0 ? 'var(--pt-success)' : 'var(--pt-gold)',
                  }}>
                    {plan.price === 0 ? (locale === 'ar' ? 'مجاناً' : 'Free') : plan.price.toLocaleString()}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>
                      {' '}{locale === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  )}
                  {plan.price > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginInlineStart: 'var(--space-2)' }}
                      onClick={() => { setEditingPlan(plan.id); setEditPrice(plan.price.toString()); }}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}

              {plan.discount && (
                <div style={{
                  display: 'inline-block',
                  background: 'var(--pt-success-bg)',
                  color: 'var(--pt-success)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 10px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginTop: 'var(--space-2)',
                }}>
                  {locale === 'ar' ? `خصم ${plan.discount}%` : `${plan.discount}% off`}
                </div>
              )}
            </div>

            {/* Limits */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: 'var(--space-3)',
              background: 'var(--pt-darker)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                  {locale === 'ar' ? 'أعضاء' : 'Members'}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--pt-white)' }}>
                  {plan.maxMembers === -1 ? '♾' : plan.maxMembers}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                  {locale === 'ar' ? 'مدربين' : 'Trainers'}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--pt-white)' }}>
                  {plan.maxTrainers === -1 ? '♾' : plan.maxTrainers}
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div style={{ fontSize: 'var(--font-size-xs)' }}>
              <div style={{
                fontWeight: 600,
                color: 'var(--pt-gray-400)',
                marginBottom: 'var(--space-2)',
              }}>
                🤖 {locale === 'ar' ? 'ميزات AI' : 'AI Features'}:
              </div>
              <div style={{ color: plan.features?.ai_nutrition ? 'var(--pt-success)' : 'var(--pt-gray-600)' }}>
                {plan.features?.ai_nutrition ? '✅' : '❌'} {locale === 'ar' ? 'جميع ميزات الذكاء الاصطناعي' : 'All AI features'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
