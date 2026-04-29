'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientProgressPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const bodyData = [
    { date: '2026-01-15', weight: 105, bodyFat: 28, muscle: 38, waist: 105 },
    { date: '2026-02-01', weight: 101, bodyFat: 26, muscle: 39, waist: 101 },
    { date: '2026-02-15', weight: 98, bodyFat: 24, muscle: 40, waist: 98 },
    { date: '2026-03-01', weight: 95, bodyFat: 22, muscle: 41, waist: 95 },
    { date: '2026-03-15', weight: 92, bodyFat: 20, muscle: 42, waist: 92 },
  ];

  const first = bodyData[0];
  const last = bodyData[bodyData.length - 1];

  const achievements = [
    { icon: '🏆', title: locale === 'ar' ? 'خسرت 13 كيلو!' : 'Lost 13 kg!', desc: locale === 'ar' ? 'من 105 إلى 92 كيلو' : 'From 105 to 92 kg', color: '#FFD740' },
    { icon: '🔥', title: locale === 'ar' ? '6 أيام متتالية' : '6 Day Streak', desc: locale === 'ar' ? 'حافظ على الاستمرارية' : 'Keep it up!', color: '#FF5252' },
    { icon: '💪', title: locale === 'ar' ? '+4 كيلو عضلات' : '+4 kg Muscle', desc: locale === 'ar' ? 'ممتاز' : 'Excellent', color: '#4FC3F7' },
    { icon: '📉', title: locale === 'ar' ? '-8% دهون' : '-8% Body Fat', desc: locale === 'ar' ? 'من 28% إلى 20%' : '28% → 20%', color: '#00C853' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {t('client.myProgress')}</h1>
      </div>

      {/* Achievement Badges */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {achievements.map((a, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${a.color}` }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{a.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>{a.title}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {/* Before & After */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)' }}>📊 {locale === 'ar' ? 'التحول — قبل وبعد' : 'Transformation — Before & After'}</h3>
        <div className="grid grid-2">
          <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--pt-gray-400)', marginBottom: 'var(--space-4)' }}>📅 {first.date}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FF5252' }}>{first.weight} kg</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'الوزن' : 'Weight'}</div></div>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FF5252' }}>{first.bodyFat}%</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'دهون' : 'Fat'}</div></div>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>{first.muscle} kg</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'عضلات' : 'Muscle'}</div></div>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>{first.waist} cm</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'وسط' : 'Waist'}</div></div>
            </div>
          </div>
          <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center', border: '2px solid var(--pt-gold)' }}>
            <h4 style={{ color: 'var(--pt-gold)', marginBottom: 'var(--space-4)' }}>⭐ {last.date} — {locale === 'ar' ? 'الآن' : 'Now'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-success)' }}>{last.weight} kg</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'الوزن' : 'Weight'} <span style={{ color: 'var(--pt-success)' }}>▼{first.weight - last.weight}</span></div></div>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-success)' }}>{last.bodyFat}%</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'دهون' : 'Fat'} <span style={{ color: 'var(--pt-success)' }}>▼{first.bodyFat - last.bodyFat}%</span></div></div>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#4FC3F7' }}>{last.muscle} kg</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'عضلات' : 'Muscle'} <span style={{ color: '#4FC3F7' }}>▲{last.muscle - first.muscle}</span></div></div>
              <div><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-success)' }}>{last.waist} cm</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'وسط' : 'Waist'} <span style={{ color: 'var(--pt-success)' }}>▼{first.waist - last.waist}</span></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-5)' }}>⚖️ {locale === 'ar' ? 'رحلة الوزن' : 'Weight Journey'}</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 180, padding: 'var(--space-3) 0' }}>
          {bodyData.map((m, i) => {
            const minW = Math.min(...bodyData.map(x => x.weight));
            const maxW = Math.max(...bodyData.map(x => x.weight));
            const range = maxW - minW || 1;
            const h = ((m.weight - minW) / range) * 80 + 20;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: i === bodyData.length - 1 ? 'var(--pt-gold)' : 'white' }}>{m.weight}</span>
                <div style={{ width: '100%', maxWidth: 48, height: `${h}%`, background: i === bodyData.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.25)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'height 0.5s' }} />
                <span style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{m.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
