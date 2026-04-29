'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClientSleepTrackerPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';

  const todaySleep = { hours: 7.5, quality: 82, deep: 1.8, light: 3.5, rem: 1.5, awake: 0.7, bedtime: '23:15', wakeup: '06:45' };

  const weeklyData = [
    { day: locale === 'ar' ? 'سبت' : 'Sat', hours: 8.0, quality: 88 },
    { day: locale === 'ar' ? 'أحد' : 'Sun', hours: 6.5, quality: 65 },
    { day: locale === 'ar' ? 'إثنين' : 'Mon', hours: 7.0, quality: 75 },
    { day: locale === 'ar' ? 'ثلاثاء' : 'Tue', hours: 7.5, quality: 80 },
    { day: locale === 'ar' ? 'أربعاء' : 'Wed', hours: 8.2, quality: 90 },
    { day: locale === 'ar' ? 'خميس' : 'Thu', hours: 6.8, quality: 70 },
    { day: locale === 'ar' ? 'جمعة' : 'Fri', hours: 7.5, quality: 82 },
  ];

  const avgSleep = (weeklyData.reduce((s, d) => s + d.hours, 0) / 7).toFixed(1);
  const avgQuality = Math.round(weeklyData.reduce((s, d) => s + d.quality, 0) / 7);

  const sleepTips = [
    { icon: '🌙', tip: locale === 'ar' ? 'حاول النوم والاستيقاظ في نفس الوقت يومياً — حتى في العطلات' : 'Sleep and wake at the same time daily — even weekends' },
    { icon: '📱', tip: locale === 'ar' ? 'أوقف الشاشات قبل النوم بساعة — الضوء الأزرق يقلل الميلاتونين' : 'No screens 1 hour before bed — blue light reduces melatonin' },
    { icon: '🧊', tip: locale === 'ar' ? 'درجة حرارة الغرفة المثالية 18-20°C للنوم العميق' : 'Ideal room temp 18-20°C for deep sleep' },
    { icon: '☕', tip: locale === 'ar' ? 'تجنب الكافيين بعد الساعة 2 ظهراً' : 'Avoid caffeine after 2 PM' },
  ];

  const stagesData = [
    { label: locale === 'ar' ? 'نوم عميق' : 'Deep', value: todaySleep.deep, color: '#3949AB', pct: Math.round((todaySleep.deep / todaySleep.hours) * 100) },
    { label: locale === 'ar' ? 'نوم خفيف' : 'Light', value: todaySleep.light, color: '#4FC3F7', pct: Math.round((todaySleep.light / todaySleep.hours) * 100) },
    { label: 'REM', value: todaySleep.rem, color: '#7C4DFF', pct: Math.round((todaySleep.rem / todaySleep.hours) * 100) },
    { label: locale === 'ar' ? 'مستيقظ' : 'Awake', value: todaySleep.awake, color: '#FF9100', pct: Math.round((todaySleep.awake / todaySleep.hours) * 100) },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>😴</span> {locale === 'ar' ? 'متتبع النوم' : 'Sleep Tracker'}</h1>
      </div>

      {/* Today's Sleep Summary */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', borderTop: '3px solid #3949AB', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: 'var(--space-2)' }}>🌙 {locale === 'ar' ? 'نوم الليلة الماضية' : "Last Night's Sleep"}</div>
        <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto var(--space-2)' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="56" fill="none" stroke="var(--pt-darker)" strokeWidth="10" />
            <circle cx="65" cy="65" r="56" fill="none" stroke={todaySleep.quality >= 80 ? '#00C853' : todaySleep.quality >= 60 ? '#FFD740' : '#FF5252'} strokeWidth="10"
              strokeDasharray={`${(todaySleep.quality / 100) * 352} 352`} strokeLinecap="round" transform="rotate(-90 65 65)" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', color: '#3949AB' }}>{todaySleep.hours}h</div>
            <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{todaySleep.quality}% {locale === 'ar' ? 'جودة' : 'quality'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', fontSize: '10px', color: 'var(--pt-gray-500)' }}>
          <span>🛏️ {todaySleep.bedtime}</span>
          <span>⏰ {todaySleep.wakeup}</span>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Sleep Stages */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'مراحل النوم' : 'Sleep Stages'}</h3>
          {/* Stacked bar */}
          <div style={{ height: 24, borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', marginBottom: 'var(--space-3)' }}>
            {stagesData.map((s, i) => (
              <div key={i} style={{ width: `${s.pct}%`, background: s.color, height: '100%' }} title={s.label} />
            ))}
          </div>
          {stagesData.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                <span>{s.label}</span>
              </div>
              <span style={{ fontWeight: 700, color: s.color }}>{s.value}h ({s.pct}%)</span>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>📅 {locale === 'ar' ? 'النوم هذا الأسبوع' : 'This Week'}</h3>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: 100, marginBottom: 'var(--space-2)' }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: d.quality >= 80 ? '#00C853' : d.quality >= 70 ? '#FFD740' : '#FF9100' }}>{d.hours}h</span>
                <div style={{ width: '100%', height: `${(d.hours / 10) * 80}px`, background: d.quality >= 80 ? '#3949AB' : d.quality >= 70 ? 'rgba(57,73,171,0.5)' : 'rgba(57,73,171,0.25)', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '8px', color: 'var(--pt-gray-600)' }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', fontSize: '10px', marginTop: 'var(--space-2)' }}>
            <span>{locale === 'ar' ? 'متوسط:' : 'Avg:'} <strong style={{ color: '#3949AB' }}>{avgSleep}h</strong></span>
            <span>{locale === 'ar' ? 'جودة:' : 'Quality:'} <strong style={{ color: avgQuality >= 80 ? '#00C853' : '#FFD740' }}>{avgQuality}%</strong></span>
          </div>
        </div>
      </div>

      {/* Sleep Tips */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>💡 {locale === 'ar' ? 'نصائح لنوم أفضل' : 'Sleep Tips'}</h3>
        <div className="grid grid-2" style={{ gap: 'var(--space-2)' }}>
          {sleepTips.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: '11px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
              <span style={{ color: 'var(--pt-gray-400)', lineHeight: 1.5 }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
