'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { PLAN_DEFINITIONS, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';

/**
 * ExpiredScreen - Full screen shown when subscription has expired
 * Blocks all access to the system
 */
export default function ExpiredScreen() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const { tenantData, currentPlan } = useTenant();

  const plans = [
    PLAN_DEFINITIONS.monthly,
    PLAN_DEFINITIONS.quarterly,
    PLAN_DEFINITIONS.semi_annual,
    PLAN_DEFINITIONS.annual,
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--pt-black)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      overflow: 'auto',
    }}>
      <div className="animate-fadeIn" style={{
        maxWidth: 700,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 100,
          height: 100,
          borderRadius: 'var(--radius-full)',
          background: 'var(--pt-danger-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-5)',
          fontSize: '3rem',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          ⏰
        </div>

        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 800,
          marginBottom: 'var(--space-3)',
          color: 'var(--pt-white)',
        }}>
          {locale === 'ar' ? 'انتهت فترتك التجريبية' : 'Your Trial Has Expired'}
        </h1>

        <p style={{
          fontSize: 'var(--font-size-md)',
          color: 'var(--pt-gray-400)',
          maxWidth: 500,
          margin: '0 auto var(--space-8)',
          lineHeight: 1.8,
        }}>
          {locale === 'ar'
            ? 'شكراً لتجربتك GR 7! لمتابعة استخدام النظام وإدارة جيمك بكفاءة، اختر خطة مناسبة لك.'
            : 'Thanks for trying GR 7! To continue managing your gym efficiently, choose a plan that suits you.'}
        </p>

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: 'var(--space-4)',
                textAlign: 'center',
                border: plan.type === 'annual' ? '2px solid var(--pt-gold)' : undefined,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>
                {plan.name[locale] || plan.name.ar}
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--pt-gold)' }}>
                {plan.price.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                {locale === 'ar' ? 'ج.م' : 'EGP'} / {plan.durationDays} {locale === 'ar' ? 'يوم' : 'days'}
              </div>
              {plan.discount && (
                <div className="badge badge-success" style={{ marginTop: 'var(--space-2)' }}>
                  {locale === 'ar' ? `خصم ${plan.discount}%` : `${plan.discount}% off`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="https://wa.me/01000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg"
          style={{
            padding: 'var(--space-4) var(--space-10)',
            fontSize: 'var(--font-size-lg)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-4)',
            display: 'inline-flex',
          }}
        >
          💬 {locale === 'ar' ? 'تواصل معنا للاشتراك' : 'Contact Us to Subscribe'}
        </a>

        <p style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--pt-gray-600)',
          marginTop: 'var(--space-2)',
        }}>
          {locale === 'ar'
            ? 'بياناتك محفوظة بأمان وستعود فور تفعيل اشتراكك'
            : 'Your data is safely preserved and will be restored once your subscription is activated'}
        </p>
      </div>
    </div>
  );
}
