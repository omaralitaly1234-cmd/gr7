'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminFeedbackPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [tab, setTab] = useState('overview');

  const overallRating = 4.3;
  const totalReviews = 186;

  const ratingBreakdown = [
    { stars: 5, count: 92, pct: 49 },
    { stars: 4, count: 52, pct: 28 },
    { stars: 3, count: 25, pct: 13 },
    { stars: 2, count: 12, pct: 7 },
    { stars: 1, count: 5, pct: 3 },
  ];

  const categories = [
    { name: locale === 'ar' ? 'المعدات والأجهزة' : 'Equipment', rating: 4.5, icon: '🏋️', reviews: 48 },
    { name: locale === 'ar' ? 'النظافة' : 'Cleanliness', rating: 4.7, icon: '✨', reviews: 62 },
    { name: locale === 'ar' ? 'المدربين' : 'Trainers', rating: 4.8, icon: '👨‍🏫', reviews: 75 },
    { name: locale === 'ar' ? 'خدمة العملاء' : 'Customer Service', rating: 4.2, icon: '🤝', reviews: 40 },
    { name: locale === 'ar' ? 'الأسعار' : 'Pricing', rating: 3.8, icon: '💰', reviews: 35 },
    { name: locale === 'ar' ? 'المرافق' : 'Facilities', rating: 4.4, icon: '🏢', reviews: 44 },
  ];

  const recentReviews = [
    { name: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', avatar: 'أ', rating: 5, date: '2026-03-27', text: locale === 'ar' ? 'أفضل جيم روحته في حياتي! المدربين محترفين جداً والأجهزة حديثة. Thank you Power Time 💪' : 'Best gym I\'ve ever been to! Very professional trainers and modern equipment.', category: locale === 'ar' ? 'المدربين' : 'Trainers' },
    { name: locale === 'ar' ? 'سارة علي' : 'Sara A.', avatar: 'س', rating: 4, date: '2026-03-26', text: locale === 'ar' ? 'الجيم نظيف جداً ومنظم. بس ياريت تزودوا أجهزة الكارديو لأن بتبقى مشغولة وقت الذروة.' : 'Very clean and organized. Need more cardio machines during peak hours.', category: locale === 'ar' ? 'المعدات' : 'Equipment' },
    { name: locale === 'ar' ? 'خالد أحمد' : 'Khaled A.', avatar: 'خ', rating: 5, date: '2026-03-25', text: locale === 'ar' ? 'كابتن سارة أحسن مدربة! البرنامج اللي عملته ليا غير حياتي. نزلت 15 كيلو في 3 شهور 🔥' : 'Coach Sara is the best! Her program changed my life. Lost 15kg in 3 months 🔥', category: locale === 'ar' ? 'المدربين' : 'Trainers' },
    { name: locale === 'ar' ? 'نور أحمد' : 'Nour A.', avatar: 'ن', rating: 3, date: '2026-03-24', text: locale === 'ar' ? 'الجيم كويس بس الاشتراك غالي شوية مقارنة بالمنطقة. ياريت عروض للطلاب.' : 'Good gym but subscription is a bit expensive. Student discounts would be nice.', category: locale === 'ar' ? 'الأسعار' : 'Pricing' },
    { name: locale === 'ar' ? 'مريم حسن' : 'Maryam H.', avatar: 'م', rating: 5, date: '2026-03-23', text: locale === 'ar' ? 'القسم النسائي رائع! خصوصية تامة وأجواء مريحة جداً. شكراً Power Time ❤️' : 'Women\'s section is amazing! Complete privacy and comfortable atmosphere ❤️', category: locale === 'ar' ? 'المرافق' : 'Facilities' },
  ];

  const nps = { promoters: 62, passives: 28, detractors: 10, score: 52 };

  const tabs = [
    { id: 'overview', label: locale === 'ar' ? 'نظرة عامة' : 'Overview', icon: '📊' },
    { id: 'reviews', label: locale === 'ar' ? 'التقييمات' : 'Reviews', icon: '💬' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⭐</span> {locale === 'ar' ? 'آراء وتقييمات الأعضاء' : 'Member Feedback'}</h1>
        <button className="btn btn-primary">📋 {locale === 'ar' ? 'إرسال استبيان' : 'Send Survey'}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Overall Rating */}
            <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--pt-gold)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--pt-gold)' }}>{overallRating}</div>
              <div style={{ marginBottom: 'var(--space-2)' }}>
                {'⭐'.repeat(Math.round(overallRating))}{'☆'.repeat(5 - Math.round(overallRating))}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{totalReviews} {locale === 'ar' ? 'تقييم' : 'reviews'}</div>
            </div>

            {/* NPS Score */}
            <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--pt-success)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: 'var(--space-2)' }}>Net Promoter Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--pt-success)' }}>{nps.score}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)', fontSize: '9px' }}>
                <span>🟢 {nps.promoters}%</span>
                <span>🟡 {nps.passives}%</span>
                <span>🔴 {nps.detractors}%</span>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="card">
              {ratingBreakdown.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', fontSize: '11px' }}>
                  <span style={{ width: 14, fontWeight: 700 }}>{r.stars}</span>
                  <span style={{ width: 14 }}>⭐</span>
                  <div style={{ flex: 1, background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: r.stars >= 4 ? 'var(--pt-gold)' : r.stars === 3 ? '#FFD740' : '#FF5252', borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <span style={{ width: 30, textAlign: 'end', fontSize: '10px', color: 'var(--pt-gray-500)' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'تقييم حسب الفئة' : 'Ratings by Category'}</h3>
            <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
              {categories.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)', color: c.rating >= 4.5 ? 'var(--pt-success)' : c.rating >= 4 ? 'var(--pt-gold)' : '#FF9100' }}>{c.rating}</span>
                      <span style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>({c.reviews})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Reviews Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {recentReviews.map((r, i) => (
            <div key={i} className="card" style={{ borderInlineStart: `3px solid ${r.rating === 5 ? 'var(--pt-gold)' : r.rating === 4 ? 'var(--pt-success)' : '#FF9100'}` }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{r.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{r.name}</span>
                      <span style={{ fontSize: '9px', color: 'var(--pt-gray-600)', marginInlineStart: '8px' }}>📅 {r.date}</span>
                    </div>
                    <span>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)', lineHeight: 1.6, marginBottom: '4px' }}>{r.text}</p>
                  <span style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(245,197,24,0.08)', borderRadius: 'var(--radius-full)', color: 'var(--pt-gold)' }}>{r.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
