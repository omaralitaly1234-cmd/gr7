'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientSpaBooking() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedService, setSelectedService] = useState(null);
  const [step, setStep] = useState(1); // 1: choose, 2: date/time, 3: confirm

  const services = [
    { id: 's1', name: { ar: 'حمام بخار', en: 'Steam Room' }, icon: '♨️', price: 100, duration: '30 min' },
    { id: 's2', name: { ar: 'ساونا', en: 'Sauna' }, icon: '🔥', price: 100, duration: '30 min' },
    { id: 's3', name: { ar: 'جاكوزي', en: 'Jacuzzi' }, icon: '🫧', price: 150, duration: '30 min' },
    { id: 's4', name: { ar: 'مساج ريلاكس', en: 'Relaxation Massage' }, icon: '💆', price: 450, duration: '60 min' },
    { id: 's5', name: { ar: 'مساج ديب تيشو', en: 'Deep Tissue Massage' }, icon: '💪', price: 550, duration: '60 min' },
    { id: 's6', name: { ar: 'حجامة', en: 'Cupping Therapy' }, icon: '🩸', price: 350, duration: '45 min' },
    { id: 's7', name: { ar: 'حمام مغربي', en: 'Moroccan Bath' }, icon: '🧖', price: 500, duration: '90 min' },
    { id: 's9', name: { ar: 'علاج طبيعي', en: 'Physiotherapy' }, icon: '🏥', price: 600, duration: '60 min' },
  ];

  const myBookings = [
    { service: locale === 'ar' ? 'مساج ريلاكس' : 'Relaxation Massage', date: '2026-03-25', time: '14:00', status: 'confirmed' },
    { service: locale === 'ar' ? 'حمام مغربي' : 'Moroccan Bath', date: '2026-03-20', time: '15:00', status: 'completed' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧖</span> {locale === 'ar' ? 'حجز سبا' : 'Spa Booking'}</h1>
      </div>

      {/* My Bookings */}
      {myBookings.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 {locale === 'ar' ? 'حجوزاتي' : 'My Bookings'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {myBookings.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.service}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{b.date} — {b.time}</div>
                </div>
                <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-info'}`}>
                  {b.status === 'confirmed' ? (locale === 'ar' ? '✓ مؤكد' : '✓ Confirmed') : (locale === 'ar' ? '✓ مكتمل' : '✓ Completed')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <h3 style={{ marginBottom: 'var(--space-4)' }}>🧖 {locale === 'ar' ? 'اختر خدمة' : 'Choose a Service'}</h3>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        {services.map(service => (
          <div key={service.id} className="card" onClick={() => { setSelectedService(service); setStep(2); }}
            style={{ textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', border: selectedService?.id === service.id ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{service.icon}</div>
            <h4 style={{ marginBottom: 'var(--space-1)' }}>{service.name[locale]}</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{service.price} {t('common.egp')}</span>
              <span style={{ color: 'var(--pt-gray-500)' }}>⏱ {service.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedService && step >= 2 && (
        <div className="modal-overlay" onClick={() => { setSelectedService(null); setStep(1); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>{selectedService.icon} {selectedService.name[locale]}</h2>
              <button onClick={() => { setSelectedService(null); setStep(1); }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--pt-gold)' }}>{selectedService.price} {t('common.egp')}</span>
                <span style={{ color: 'var(--pt-gray-500)', marginInlineStart: 'var(--space-2)' }}>⏱ {selectedService.duration}</span>
              </div>
              <div className="form-group">
                <label className="form-label">{t('spa.selectDate')}</label>
                <input type="date" className="form-input" dir="ltr" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('spa.selectTime')}</label>
                <select className="form-select">
                  <option>09:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>02:00 PM</option>
                  <option>03:00 PM</option>
                  <option>04:00 PM</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                <textarea className="form-input" rows="2" placeholder={locale === 'ar' ? 'أي ملاحظات خاصة...' : 'Any special notes...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setSelectedService(null); setStep(1); }}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={() => { setSelectedService(null); setStep(1); }}>✓ {t('spa.confirmBooking')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
