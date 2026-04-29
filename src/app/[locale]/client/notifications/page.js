'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientNotifications() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const notifications = [
    { icon: '🎉', title: locale === 'ar' ? 'مرحباً بك في Power Time!' : 'Welcome to Power Time!', body: locale === 'ar' ? 'نتمنى لك تجربة رائعة' : 'We wish you a great experience', time: '2026-03-23 10:00', read: false },
    { icon: '📅', title: locale === 'ar' ? 'موعد حصتك القادمة غداً' : 'Your next session is tomorrow', body: locale === 'ar' ? 'مع كابتن أحمد حسن — 08:00 صباحاً' : 'With Captain Ahmed — 08:00 AM', time: '2026-03-23 08:00', read: false },
    { icon: '⏰', title: locale === 'ar' ? 'اشتراكك ينتهي خلال 39 يوم' : 'Your sub expires in 39 days', body: locale === 'ar' ? 'جدد اشتراكك للاستمرار' : 'Renew to continue', time: '2026-03-22 12:00', read: true },
    { icon: '🧖', title: locale === 'ar' ? 'تأكيد حجز السبا' : 'Spa booking confirmed', body: locale === 'ar' ? 'مساج ريلاكس — 25 مارس 2:00 PM' : 'Relaxation Massage — Mar 25 2:00 PM', time: '2026-03-21 16:00', read: true },
    { icon: '🏆', title: locale === 'ar' ? 'أحسنت! 6 أيام متتالية' : 'Great! 6 day streak', body: locale === 'ar' ? 'استمر في الحفاظ على نشاطك' : 'Keep up the great work', time: '2026-03-20 20:00', read: true },
    { icon: '🎂', title: locale === 'ar' ? 'عيد ميلاد سعيد!' : 'Happy Birthday!', body: locale === 'ar' ? 'Power Time تتمنى لك عيد ميلاد سعيد 🎉' : 'Power Time wishes you a happy birthday 🎉', time: '2026-03-15 09:00', read: true },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔔</span> {locale === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {notifications.map((notif, i) => (
          <div key={i} className="card" style={{
            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4)',
            borderInlineStart: !notif.read ? '3px solid var(--pt-gold)' : 'none',
            opacity: notif.read ? 0.7 : 1
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {notif.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: notif.read ? 400 : 600, marginBottom: '4px' }}>{notif.title}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: '4px' }}>{notif.body}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>{notif.time}</div>
            </div>
            {!notif.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pt-gold)', flexShrink: 0, marginTop: '8px' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
