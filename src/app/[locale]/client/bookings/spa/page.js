'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientSpaBookingsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    { id: 's1', name: { ar: 'حمام بخار', en: 'Steam Room' }, icon: '♨️', price: 100, duration: '30 min', available: true },
    { id: 's2', name: { ar: 'ساونا', en: 'Sauna' }, icon: '🔥', price: 100, duration: '30 min', available: true },
    { id: 's3', name: { ar: 'جاكوزي', en: 'Jacuzzi' }, icon: '🫧', price: 150, duration: '30 min', available: true },
    { id: 's4', name: { ar: 'مساج ريلاكس', en: 'Relaxation Massage' }, icon: '💆', price: 450, duration: '60 min', available: true },
    { id: 's5', name: { ar: 'مساج ديب تيشو', en: 'Deep Tissue Massage' }, icon: '💪', price: 550, duration: '60 min', available: true },
    { id: 's6', name: { ar: 'حجامة', en: 'Cupping' }, icon: '🩸', price: 350, duration: '45 min', available: true },
    { id: 's7', name: { ar: 'حمام مغربي', en: 'Moroccan Bath' }, icon: '🧖', price: 500, duration: '90 min', available: true },
    { id: 's8', name: { ar: 'حمام تركي', en: 'Turkish Bath' }, icon: '🛁', price: 400, duration: '60 min', available: false },
    { id: 's9', name: { ar: 'علاج طبيعي', en: 'Physiotherapy' }, icon: '🏥', price: 600, duration: '60 min', available: true },
  ];

  const myBookings = [
    { service: locale === 'ar' ? 'مساج ريلاكس' : 'Relaxation Massage', date: '2026-03-25', time: '14:00', status: 'confirmed', price: 450 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧖</span> {t('client.bookSpa')}</h1>
      </div>

      {myBookings.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 {locale === 'ar' ? 'حجوزاتي القادمة' : 'Upcoming Bookings'}</h3>
          {myBookings.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{b.service}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>📅 {b.date} — ⏰ {b.time}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{b.price} {t('common.egp')}</div>
                <span className="badge badge-success">{locale === 'ar' ? '✓ مؤكد' : '✓ Confirmed'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-3">
        {services.map(s => (
          <div key={s.id} className="card" style={{ textAlign: 'center', cursor: s.available ? 'pointer' : 'default', opacity: s.available ? 1 : 0.5, transition: 'all 0.2s', border: selectedService === s.id ? '2px solid var(--pt-gold)' : '' }}
            onClick={() => s.available && setSelectedService(s.id)}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{s.icon}</div>
            <h4>{s.name[locale]}</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-2) 0' }}>
              <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{s.price} {t('common.egp')}</span>
              <span style={{ color: 'var(--pt-gray-500)' }}>⏱ {s.duration}</span>
            </div>
            {s.available ? (
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>{locale === 'ar' ? 'احجز الآن' : 'Book Now'}</button>
            ) : (
              <span style={{ color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)' }}>{locale === 'ar' ? 'غير متاح حالياً' : 'Unavailable'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
