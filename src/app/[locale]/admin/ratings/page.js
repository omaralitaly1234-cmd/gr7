'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function RatingsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const trainerRatings = [
    { name: 'كابتن سارة محمود', specialization: locale === 'ar' ? 'زومبا' : 'Zumba', rating: 4.9, reviews: 45, trend: 'up' },
    { name: 'كابتن أحمد حسن', specialization: locale === 'ar' ? 'كمال أجسام' : 'Bodybuilding', rating: 4.8, reviews: 38, trend: 'up' },
    { name: 'كابتن خالد إبراهيم', specialization: locale === 'ar' ? 'علاج طبيعي' : 'Physiotherapy', rating: 4.7, reviews: 22, trend: 'same' },
    { name: 'كابتن محمد علي', specialization: locale === 'ar' ? 'كروس فيت' : 'CrossFit', rating: 4.5, reviews: 30, trend: 'down' },
  ];

  const serviceRatings = [
    { name: locale === 'ar' ? 'مساج ريلاكس' : 'Relaxation Massage', icon: '💆', rating: 4.9, reviews: 28 },
    { name: locale === 'ar' ? 'حمام مغربي' : 'Moroccan Bath', icon: '🧖', rating: 4.8, reviews: 20 },
    { name: locale === 'ar' ? 'حجامة' : 'Cupping', icon: '🩸', rating: 4.7, reviews: 15 },
    { name: locale === 'ar' ? 'ساونا' : 'Sauna', icon: '🔥', rating: 4.6, reviews: 35 },
    { name: locale === 'ar' ? 'جاكوزي' : 'Jacuzzi', icon: '🫧', rating: 4.5, reviews: 42 },
  ];

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⭐</span> {t('sidebar.ratings')}</h1>
      </div>

      <div className="grid grid-2">
        {/* Trainer Ratings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>👨‍🏫 {locale === 'ar' ? 'تقييمات المدربين' : 'Trainer Ratings'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {trainerRatings.sort((a, b) => b.rating - a.rating).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 32, textAlign: 'center', fontSize: 'var(--font-size-lg)', fontWeight: 800, color: i === 0 ? 'var(--pt-gold)' : 'var(--pt-gray-500)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{item.specialization}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{item.rating}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{item.reviews} {locale === 'ar' ? 'تقييم' : 'reviews'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Ratings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🧖 {locale === 'ar' ? 'تقييمات الخدمات' : 'Service Ratings'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {serviceRatings.sort((a, b) => b.rating - a.rating).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)', letterSpacing: '2px' }}>{renderStars(item.rating)}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{item.rating}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{item.reviews} {locale === 'ar' ? 'تقييم' : 'reviews'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
