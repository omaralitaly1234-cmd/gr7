'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TrainerClientsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const clients = [
    { id: 'c1', name: 'أحمد محمد سعيد', phone: '01012345678', plan: locale === 'ar' ? 'ذهبي - ربع سنوي' : 'Gold - Quarterly', goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss', age: 28, weight: 92, height: 178, startWeight: 105, gender: 'male', status: 'active', lastVisit: '2026-03-22', sessions: 52, progress: 65 },
    { id: 'c2', name: 'عمر حسام الدين', phone: '01155667788', plan: locale === 'ar' ? 'ماسي - سنوي' : 'Diamond - Annual', goal: locale === 'ar' ? 'تضخيم' : 'Bulking', age: 24, weight: 75, height: 182, startWeight: 68, gender: 'male', status: 'active', lastVisit: '2026-03-23', sessions: 200, progress: 40 },
    { id: 'c3', name: 'نور أحمد', phone: '01099887766', plan: locale === 'ar' ? 'ذهبي - شهري' : 'Gold - Monthly', goal: locale === 'ar' ? 'لياقة عامة' : 'General Fitness', age: 22, weight: 65, height: 160, startWeight: 70, gender: 'female', status: 'active', lastVisit: '2026-03-21', sessions: 15, progress: 30 },
    { id: 'c4', name: 'سارة علي حسن', phone: '01098765432', plan: locale === 'ar' ? 'ماسي - ربع سنوي' : 'Diamond - Quarterly', goal: locale === 'ar' ? 'تنشيف' : 'Cutting', age: 26, weight: 58, height: 165, startWeight: 62, gender: 'female', status: 'active', lastVisit: '2026-03-20', sessions: 92, progress: 80 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👥</span> {t('trainer.myClients')}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {clients.map(client => (
          <div key={client.id} className="card" style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-full)', background: client.gender === 'male' ? 'rgba(0,176,255,0.12)' : 'rgba(224,64,251,0.12)', color: client.gender === 'male' ? '#00B0FF' : '#E040FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0 }}>
              {client.name.split(' ')[0].charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '4px' }}>{client.name}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', flexWrap: 'wrap' }}>
                    <span>📞 <span dir="ltr">{client.phone}</span></span>
                    <span>🎯 {client.goal}</span>
                    <span>🎂 {client.age} {locale === 'ar' ? 'سنة' : 'y'}</span>
                    <span>{client.gender === 'male' ? '♂' : '♀'}</span>
                  </div>
                </div>
                <span className="badge badge-success">{t('common.active')}</span>
              </div>

              {/* Body Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{client.weight}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'الوزن (kg)' : 'Weight'}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{client.height}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'الطول (cm)' : 'Height'}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: client.weight < client.startWeight ? 'var(--pt-success)' : 'var(--pt-gold)' }}>{client.weight - client.startWeight > 0 ? '+' : ''}{client.weight - client.startWeight}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'فرق الوزن' : 'Δ Weight'}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{client.sessions}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'حصص' : 'Sessions'}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--pt-gold)' }}>{client.progress}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'التقدم' : 'Progress'}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${client.progress}%`, height: '100%', background: client.progress >= 70 ? 'var(--pt-success)' : client.progress >= 40 ? 'var(--pt-gold)' : '#4FC3F7', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Link href={`/${locale}/trainer/diet-plans`} className="btn btn-outline btn-sm">🥗 {locale === 'ar' ? 'الخطة الغذائية' : 'Diet Plan'}</Link>
                <Link href={`/${locale}/trainer/programs`} className="btn btn-outline btn-sm">🏋️ {locale === 'ar' ? 'البرنامج' : 'Program'}</Link>
                <button className="btn btn-outline btn-sm">📊 {locale === 'ar' ? 'القياسات' : 'Measurements'}</button>
                <button className="btn btn-ghost btn-sm">📞 {locale === 'ar' ? 'اتصال' : 'Call'}</button>
                <button className="btn btn-ghost btn-sm">💬 WhatsApp</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
