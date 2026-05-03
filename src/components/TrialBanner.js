'use client';

import { useParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';

/**
 * TrialBanner - Top banner showing trial countdown
 * Shows in admin/trainer layouts when the gym is in trial period
 */
export default function TrialBanner() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const { isTrial, daysRemaining, isExpiringSoon, isExpired } = useTenant();

  // Don't show if not on trial
  if (!isTrial && !isExpired) return null;

  // Expired state
  if (isExpired) {
    return (
      <div style={{
        background: 'linear-gradient(90deg, #FF1744, #D50000)',
        color: 'white',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        zIndex: 100,
        position: 'relative',
        flexWrap: 'wrap',
      }}>
        <span>⛔</span>
        <span>
          {locale === 'ar'
            ? 'انتهت فترتك التجريبية المجانية. قم بترقية خطتك لمتابعة استخدام النظام بجميع المميزات.'
            : 'Your free trial has ended. Upgrade your plan to continue using the system with all features.'
          }
        </span>
        <a
          href={`/${locale}/onboarding`}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '4px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            textDecoration: 'none',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.35)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          {locale === 'ar' ? '💎 ترقية الخطة' : '💎 Upgrade Plan'}
        </a>
      </div>
    );
  }

  // Trial active - determine urgency colors
  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent
    ? 'linear-gradient(90deg, #FF6D00, #FF1744)'
    : isExpiringSoon
      ? 'linear-gradient(90deg, #FF9100, #FF6D00)'
      : 'linear-gradient(90deg, var(--pt-gold-dim), var(--pt-gold))';

  const textColor = isUrgent || isExpiringSoon ? 'white' : 'var(--pt-black)';

  return (
    <div style={{
      background: bgColor,
      color: textColor,
      padding: 'var(--space-2) var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-3)',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 600,
      zIndex: 100,
      position: 'relative',
    }}>
      <span style={{ fontSize: '1.1rem' }}>
        {isUrgent ? '🔴' : isExpiringSoon ? '🟡' : '🎁'}
      </span>

      <span>
        {locale === 'ar'
          ? `الفترة التجريبية المجانية — باقي ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : daysRemaining <= 10 ? 'أيام' : 'يوم'}`
          : `Free Trial — ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
        }
      </span>

      {isExpiringSoon && (
        <a
          href="https://wa.me/01000000000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(0,0,0,0.15)',
            color: 'inherit',
            padding: '3px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.25)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.15)'}
        >
          {locale === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
        </a>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        fontSize: 'var(--font-size-xs)',
        opacity: 0.85,
      }}>
        <span>🤖</span>
        <span>
          {locale === 'ar' ? 'ميزات AI متاحة في الخطط المدفوعة' : 'AI features available in paid plans'}
        </span>
      </div>
    </div>
  );
}
