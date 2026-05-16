'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function RatingsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [trainers, setTrainers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data: trs } = await getTenantDocuments(tenantId, 'trainers');
        const { data: fbs } = await getTenantDocuments(tenantId, 'feedback', [], { field: 'createdAt', direction: 'desc' });
        setTrainers(trs || []);
        setFeedbacks(fbs || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  // Calculate trainer ratings from feedback
  const trainerRatings = trainers
    .map(tr => {
      const trainerFeedbacks = feedbacks.filter(f => f.trainerId === tr.id || f.category === 'trainer');
      const avgRating = trainerFeedbacks.length > 0
        ? trainerFeedbacks.reduce((s, f) => s + (f.rating || 0), 0) / trainerFeedbacks.length
        : (tr.rating || 0);
      return {
        id: tr.id,
        name: tr.name?.[locale] || tr.name?.ar || '—',
        specialization: tr.specialization || '—',
        rating: Number(avgRating.toFixed(1)),
        reviews: trainerFeedbacks.length || (tr.totalSessions || 0),
        status: tr.status,
      };
    })
    .filter(tr => tr.status === 'active')
    .sort((a, b) => b.rating - a.rating);

  // Calculate service ratings from feedback with category
  const serviceCategories = ['equipment', 'cleanliness', 'customer_service', 'pricing', 'facilities', 'spa'];
  const serviceMeta = {
    equipment: { ar: 'المعدات والأجهزة', en: 'Equipment', icon: '🏋️' },
    cleanliness: { ar: 'النظافة', en: 'Cleanliness', icon: '✨' },
    customer_service: { ar: 'خدمة العملاء', en: 'Customer Service', icon: '🤝' },
    pricing: { ar: 'الأسعار', en: 'Pricing', icon: '💰' },
    facilities: { ar: 'المرافق', en: 'Facilities', icon: '🏢' },
    spa: { ar: 'سبا وساونا', en: 'Spa & Sauna', icon: '🧖' },
  };

  const serviceRatings = serviceCategories.map(cat => {
    const catFeedbacks = feedbacks.filter(f => f.serviceCategory === cat);
    const avgRating = catFeedbacks.length > 0
      ? catFeedbacks.reduce((s, f) => s + (f.rating || 0), 0) / catFeedbacks.length
      : 0;
    return {
      name: serviceMeta[cat]?.[locale] || cat,
      icon: serviceMeta[cat]?.icon || '📋',
      rating: Number(avgRating.toFixed(1)),
      reviews: catFeedbacks.length,
    };
  }).filter(s => s.reviews > 0).sort((a, b) => b.rating - a.rating);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⭐</span> {t('sidebar.ratings')}</h1>
      </div>

      <div className="grid grid-2">
        {/* Trainer Ratings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>👨‍🏫 {isAr ? 'تقييمات المدربين' : 'Trainer Ratings'}</h3>
          {trainerRatings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>👨‍🏫</div>
              {isAr ? 'لا يوجد مدربين بعد' : 'No trainers yet'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {trainerRatings.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: 32, textAlign: 'center', fontSize: 'var(--font-size-lg)', fontWeight: 800, color: i === 0 ? 'var(--pt-gold)' : 'var(--pt-gray-500)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{item.specialization}</div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{item.rating}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{item.reviews} {isAr ? 'تقييم' : 'reviews'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Ratings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🧖 {isAr ? 'تقييمات الخدمات' : 'Service Ratings'}</h3>
          {serviceRatings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📋</div>
              {isAr ? 'لا توجد تقييمات خدمات بعد' : 'No service ratings yet'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {serviceRatings.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)', letterSpacing: '2px' }}>{renderStars(item.rating)}</div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{item.rating}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{item.reviews} {isAr ? 'تقييم' : 'reviews'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
