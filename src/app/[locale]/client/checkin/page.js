'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientCheckInPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [soreness, setSoreness] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const moods = [
    { val: 5, emoji: '😁', label: locale === 'ar' ? 'ممتاز' : 'Great' },
    { val: 4, emoji: '😊', label: locale === 'ar' ? 'جيد' : 'Good' },
    { val: 3, emoji: '😐', label: locale === 'ar' ? 'عادي' : 'Okay' },
    { val: 2, emoji: '😔', label: locale === 'ar' ? 'مش كويس' : 'Low' },
    { val: 1, emoji: '😩', label: locale === 'ar' ? 'سيء' : 'Bad' },
  ];

  const energyLevels = [
    { val: 5, icon: '⚡⚡⚡', label: locale === 'ar' ? 'مشحون بالكامل' : 'Fully Charged' },
    { val: 4, icon: '⚡⚡', label: locale === 'ar' ? 'نشيط' : 'Energetic' },
    { val: 3, icon: '⚡', label: locale === 'ar' ? 'متوسط' : 'Average' },
    { val: 2, icon: '🔋', label: locale === 'ar' ? 'منخفض' : 'Low' },
    { val: 1, icon: '🪫', label: locale === 'ar' ? 'مرهق' : 'Exhausted' },
  ];

  const sleepOptions = [
    { val: '8+', label: locale === 'ar' ? '+8 ساعات' : '8+ hours', icon: '😴', quality: 'great' },
    { val: '7', label: locale === 'ar' ? '7 ساعات' : '7 hours', icon: '🛏️', quality: 'good' },
    { val: '6', label: locale === 'ar' ? '6 ساعات' : '6 hours', icon: '😐', quality: 'ok' },
    { val: '5', label: locale === 'ar' ? '5 ساعات' : '5 hours', icon: '😟', quality: 'low' },
    { val: '<5', label: locale === 'ar' ? 'أقل من 5' : '<5 hours', icon: '☕', quality: 'bad' },
  ];

  const sorenessOptions = [
    { val: 0, label: locale === 'ar' ? 'لا يوجد ألم' : 'No soreness', color: '#00C853' },
    { val: 1, label: locale === 'ar' ? 'ألم خفيف' : 'Mild', color: '#FFD740' },
    { val: 2, label: locale === 'ar' ? 'ألم متوسط' : 'Moderate', color: '#FF9100' },
    { val: 3, label: locale === 'ar' ? 'ألم شديد' : 'Severe', color: '#FF5252' },
  ];

  const weekHistory = [
    { day: locale === 'ar' ? 'سبت' : 'Sat', mood: 5, energy: 4, sleep: '7', soreness: 1 },
    { day: locale === 'ar' ? 'أحد' : 'Sun', mood: 4, energy: 5, sleep: '8+', soreness: 0 },
    { day: locale === 'ar' ? 'اثنين' : 'Mon', mood: 4, energy: 3, sleep: '6', soreness: 2 },
    { day: locale === 'ar' ? 'ثلاثاء' : 'Tue', mood: 3, energy: 3, sleep: '5', soreness: 2 },
    { day: locale === 'ar' ? 'أربعاء' : 'Wed', mood: 5, energy: 4, sleep: '7', soreness: 1 },
    { day: locale === 'ar' ? 'خميس' : 'Thu', mood: 4, energy: 4, sleep: '8+', soreness: 0 },
  ];

  const moodEmoji = (v) => moods.find(m => m.val === v)?.emoji || '—';
  const energyIcon = (v) => energyLevels.find(e => e.val === v)?.icon?.charAt(0) || '—';

  if (submitted) {
    return (
      <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
        <div style={{ fontSize: '5rem', marginBottom: 'var(--space-4)' }}>✅</div>
        <h1 style={{ color: 'var(--pt-gold)', marginBottom: 'var(--space-3)' }}>
          {locale === 'ar' ? 'تم تسجيل الدخول اليومي!' : 'Daily Check-in Complete!'}
        </h1>
        <p style={{ color: 'var(--pt-gray-400)', maxWidth: 400, margin: '0 auto var(--space-5)' }}>
          {locale === 'ar' ? 'شكراً لتسجيل حالتك اليوم. مدربك هيقدر يتابع تطورك بشكل أفضل.' : 'Thanks for checking in! Your trainer can now better track your recovery.'}
        </p>
        <div className="card" style={{ maxWidth: 350, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
            <div style={{ fontSize: '2rem' }}>{moodEmoji(mood)}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'المزاج' : 'Mood'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
            <div style={{ fontSize: '2rem' }}>{energyLevels.find(e => e.val === energy)?.icon?.slice(0, 2) || '—'}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'الطاقة' : 'Energy'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
            <div style={{ fontSize: '2rem' }}>{sleepOptions.find(s => s.val === sleep)?.icon || '—'}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'النوم' : 'Sleep'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: sorenessOptions[soreness]?.color }}>{sorenessOptions[soreness]?.label}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'الألم' : 'Soreness'}</div>
          </div>
        </div>
        <button className="btn btn-secondary" style={{ marginTop: 'var(--space-5)' }} onClick={() => setSubmitted(false)}>
          ← {locale === 'ar' ? 'تعديل' : 'Edit'}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {locale === 'ar' ? 'تسجيل الحالة اليومية' : 'Daily Check-in'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gold)' }}>📅 24 {locale === 'ar' ? 'مارس' : 'March'} 2026</span>
      </div>

      <div style={{ maxWidth: 650, margin: '0 auto' }}>
        {/* Mood */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>😊 {locale === 'ar' ? 'كيف حاسس النهاردة؟' : 'How are you feeling today?'}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {moods.map(m => (
              <button key={m.val} onClick={() => setMood(m.val)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: mood === m.val ? '2px solid var(--pt-gold)' : '2px solid transparent', background: mood === m.val ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: 'white', transform: mood === m.val ? 'scale(1.1)' : 'scale(1)',
              }}>
                <span style={{ fontSize: '2rem' }}>{m.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>⚡ {locale === 'ar' ? 'مستوى الطاقة' : 'Energy Level'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {energyLevels.map(e => (
              <button key={e.val} onClick={() => setEnergy(e.val)} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: energy === e.val ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)', background: energy === e.val ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: 'white', textAlign: 'start',
              }}>
                <span style={{ fontSize: '1.2rem', minWidth: 50 }}>{e.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sleep */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>😴 {locale === 'ar' ? 'ساعات النوم' : 'Hours of Sleep'}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {sleepOptions.map(s => (
              <button key={s.val} onClick={() => setSleep(s.val)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: sleep === s.val ? '2px solid var(--pt-gold)' : '2px solid transparent', background: sleep === s.val ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: 'white', minWidth: 70,
              }}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Soreness */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>💪 {locale === 'ar' ? 'ألم العضلات' : 'Muscle Soreness'}</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {sorenessOptions.map(s => (
              <button key={s.val} onClick={() => setSoreness(s.val)} style={{
                flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: soreness === s.val ? `2px solid ${s.color}` : '1px solid var(--glass-border)', background: soreness === s.val ? `${s.color}15` : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: soreness === s.val ? s.color : 'var(--pt-gray-400)', textAlign: 'center', fontSize: 'var(--font-size-xs)', fontWeight: 600,
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 'var(--space-6)' }} onClick={() => setSubmitted(true)}
          disabled={mood === null || energy === null || sleep === null || soreness === null}>
          ✓ {locale === 'ar' ? 'تسجيل الحالة' : 'Submit Check-in'}
        </button>
      </div>

      {/* Weekly History */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>📊 {locale === 'ar' ? 'سجل الأسبوع' : 'This Week'}</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'اليوم' : 'Day'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'المزاج' : 'Mood'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'الطاقة' : 'Energy'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'النوم' : 'Sleep'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'الألم' : 'Soreness'}</th>
              </tr>
            </thead>
            <tbody>
              {weekHistory.map((day, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{day.day}</td>
                  <td style={{ textAlign: 'center', fontSize: '1.3rem' }}>{moodEmoji(day.mood)}</td>
                  <td style={{ textAlign: 'center' }}>{energyIcon(day.energy)}</td>
                  <td style={{ textAlign: 'center' }}>{day.sleep}h</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: sorenessOptions[day.soreness]?.color, fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>{sorenessOptions[day.soreness]?.label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
