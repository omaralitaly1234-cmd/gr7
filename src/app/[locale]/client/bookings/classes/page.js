'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientClassBookingsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const classes = [
    { id: 'cl1', name: { ar: 'زومبا', en: 'Zumba' }, icon: '💃', trainer: 'سارة حسام', schedule: locale === 'ar' ? 'السبت/الإثنين/الأربعاء — 6:00 PM' : 'Sat/Mon/Wed — 6:00 PM', duration: '60 min', capacity: 20, enrolled: 15, price: 300, gender: locale === 'ar' ? 'سيدات' : 'Ladies', color: '#E040FB' },
    { id: 'cl2', name: { ar: 'رقص شرقي', en: 'Belly Dance' }, icon: '🩰', trainer: 'نورا عبد العزيز', schedule: locale === 'ar' ? 'الأحد/الثلاثاء — 5:00 PM' : 'Sun/Tue — 5:00 PM', duration: '60 min', capacity: 15, enrolled: 12, price: 350, gender: locale === 'ar' ? 'سيدات' : 'Ladies', color: '#FF5252' },
    { id: 'cl3', name: { ar: 'يوجا', en: 'Yoga' }, icon: '🧘', trainer: 'أمل حسن', schedule: locale === 'ar' ? 'السبت/الأربعاء — 7:00 AM' : 'Sat/Wed — 7:00 AM', duration: '45 min', capacity: 20, enrolled: 8, price: 250, gender: locale === 'ar' ? 'مختلط' : 'Mixed', color: '#4FC3F7' },
    { id: 'cl4', name: { ar: 'كيك بوكسينج', en: 'Kickboxing' }, icon: '🥊', trainer: 'كابتن محمود', schedule: locale === 'ar' ? 'الأحد/الثلاثاء/الخميس — 8:00 PM' : 'Sun/Tue/Thu — 8:00 PM', duration: '60 min', capacity: 15, enrolled: 14, price: 400, gender: locale === 'ar' ? 'رجال' : 'Men', color: '#FFD740' },
  ];

  const myEnrolled = ['cl3'];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {t('client.bookClass')}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {classes.map(cls => {
          const isEnrolled = myEnrolled.includes(cls.id);
          const capacityPercent = Math.round((cls.enrolled / cls.capacity) * 100);
          return (
            <div key={cls.id} className="card" style={{ borderTop: `3px solid ${cls.color}`, position: 'relative' }}>
              {isEnrolled && (
                <div style={{ position: 'absolute', top: 12, insetInlineEnd: 16 }}>
                  <span className="badge badge-success" style={{ fontSize: 'var(--font-size-sm)' }}>✓ {locale === 'ar' ? 'مسجل' : 'Enrolled'}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '3rem', flexShrink: 0 }}>{cls.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>{cls.name[locale]}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)' }}>
                    <span>👨‍🏫 {cls.trainer}</span>
                    <span>📅 {cls.schedule}</span>
                    <span>⏱ {cls.duration}</span>
                    <span>{cls.gender === (locale === 'ar' ? 'سيدات' : 'Ladies') ? '♀' : cls.gender === (locale === 'ar' ? 'رجال' : 'Men') ? '♂' : '👫'} {cls.gender}</span>
                  </div>

                  {/* Capacity Bar */}
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>
                      <span>{cls.enrolled}/{cls.capacity} {locale === 'ar' ? 'مشترك' : 'enrolled'}</span>
                      <span>{capacityPercent}%</span>
                    </div>
                    <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${capacityPercent}%`, height: '100%', background: capacityPercent >= 90 ? 'var(--pt-danger)' : cls.color, borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-lg)' }}>{cls.price} {t('common.egp')}/{locale === 'ar' ? 'شهر' : 'month'}</span>
                    {isEnrolled ? (
                      <button className="btn btn-outline btn-sm">{locale === 'ar' ? 'إلغاء التسجيل' : 'Unenroll'}</button>
                    ) : (
                      <button className="btn btn-primary btn-sm">{locale === 'ar' ? 'سجل الآن' : 'Enroll Now'}</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
