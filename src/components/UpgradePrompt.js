'use client';

import { useParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { AI_FEATURE_LABELS, PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

/**
 * UpgradePrompt - Beautiful prompt shown when accessing a locked AI feature
 */
export default function UpgradePrompt({ feature = null, onClose = null }) {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const { daysRemaining, isTrial, isExpired, currentPlan } = useTenant();

  const featureInfo = feature && AI_FEATURE_LABELS[feature]
    ? AI_FEATURE_LABELS[feature]
    : null;

  const plans = [
    PLAN_DEFINITIONS.monthly,
    PLAN_DEFINITIONS.quarterly,
    PLAN_DEFINITIONS.semi_annual,
    PLAN_DEFINITIONS.annual,
  ];

  return (
    <div className="animate-fadeIn" style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 'var(--space-6)',
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'var(--space-8)',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)',
          fontSize: '2.5rem',
          animation: 'float 3s ease-in-out infinite',
        }}>
          {featureInfo ? featureInfo.icon : '🔒'}
        </div>

        <h2 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          marginBottom: 'var(--space-2)',
          color: 'var(--pt-white)',
        }}>
          {isExpired
            ? (locale === 'ar' ? '⏰ انتهت فترتك التجريبية' : '⏰ Your Trial Has Expired')
            : (locale === 'ar' ? '🔒 ميزة متقدمة' : '🔒 Premium Feature')
          }
        </h2>

        {featureInfo && (
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--pt-gold)',
            fontWeight: 600,
            marginBottom: 'var(--space-2)',
          }}>
            {featureInfo[locale] || featureInfo.ar}
          </p>
        )}

        <p style={{
          fontSize: 'var(--font-size-md)',
          color: 'var(--pt-gray-400)',
          maxWidth: 500,
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          {isExpired
            ? (locale === 'ar'
              ? 'لمتابعة استخدام النظام وجميع الميزات المتقدمة، اختر خطة مناسبة لك.'
              : 'To continue using the system and all advanced features, choose a plan that suits you.')
            : (locale === 'ar'
              ? 'هذه الميزة متاحة فقط في الخطط المدفوعة. اشترك الآن للاستفادة من جميع ميزات الذكاء الاصطناعي.'
              : 'This feature is only available on paid plans. Subscribe now to unlock all AI features.')
          }
        </p>

        {isTrial && daysRemaining > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: daysRemaining <= 7 ? 'var(--pt-danger-bg)' : 'var(--pt-warning-bg)',
            color: daysRemaining <= 7 ? 'var(--pt-danger)' : 'var(--pt-warning)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            marginTop: 'var(--space-3)',
          }}>
            ⏳ {locale === 'ar'
              ? `باقي ${daysRemaining} يوم في فترتك التجريبية`
              : `${daysRemaining} days remaining in your trial`}
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              textAlign: 'center',
              padding: 'var(--space-5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: plan.type === 'annual' ? '2px solid var(--pt-gold)' : undefined,
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,197,24,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {plan.type === 'annual' && (
              <div style={{
                position: 'absolute',
                top: 8,
                [locale === 'ar' ? 'left' : 'right']: -32,
                background: 'var(--pt-gold)',
                color: 'var(--pt-black)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '2px 36px',
                transform: locale === 'ar' ? 'rotate(-45deg)' : 'rotate(45deg)',
              }}>
                {locale === 'ar' ? 'الأفضل' : 'Best'}
              </div>
            )}

            <div style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--pt-gray-300)',
              marginBottom: 'var(--space-3)',
            }}>
              {plan.name[locale] || plan.name.ar}
            </div>

            <div style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 800,
              color: 'var(--pt-gold)',
              lineHeight: 1,
              marginBottom: 'var(--space-1)',
            }}>
              {plan.price.toLocaleString()}
            </div>

            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--pt-gray-500)',
              marginBottom: 'var(--space-3)',
            }}>
              {locale === 'ar' ? 'ج.م' : 'EGP'} / {plan.durationDays} {locale === 'ar' ? 'يوم' : 'days'}
            </div>

            {plan.discount && (
              <div style={{
                display: 'inline-block',
                background: 'var(--pt-success-bg)',
                color: 'var(--pt-success)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 10px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-3)',
              }}>
                {locale === 'ar' ? `خصم ${plan.discount}%` : `${plan.discount}% off`}
              </div>
            )}

            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--pt-gray-500)',
            }}>
              {plan.maxMembers === -1
                ? (locale === 'ar' ? '♾ أعضاء غير محدود' : '♾ Unlimited members')
                : (locale === 'ar' ? `👥 حتى ${plan.maxMembers} عضو` : `👥 Up to ${plan.maxMembers} members`)
              }
            </div>
          </div>
        ))}
      </div>

      {/* AI Features Included */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
          textAlign: 'center',
        }}>
          🤖 {locale === 'ar' ? 'ميزات الذكاء الاصطناعي المضمّنة في كل الخطط المدفوعة' : 'AI Features Included in All Paid Plans'}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {Object.entries(AI_FEATURE_LABELS).map(([key, info]) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--pt-darker)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
            }}>
              <span>{info.icon}</span>
              <span>{info[locale] || info.ar}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div style={{ textAlign: 'center' }}>
        <a
          href="https://wa.me/01000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg"
          style={{
            padding: 'var(--space-4) var(--space-10)',
            fontSize: 'var(--font-size-lg)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          💬 {locale === 'ar' ? 'تواصل معنا للاشتراك' : 'Contact Us to Subscribe'}
        </a>
        <p style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--pt-gray-500)',
          marginTop: 'var(--space-3)',
        }}>
          {locale === 'ar' ? 'أو أرسل لنا على واتساب وسنساعدك في اختيار الخطة المناسبة' : 'Or message us on WhatsApp and we\'ll help you choose the right plan'}
        </p>
      </div>

      {onClose && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-ghost" onClick={onClose}>
            {locale === 'ar' ? '← العودة' : '← Go Back'}
          </button>
        </div>
      )}
    </div>
  );
}
