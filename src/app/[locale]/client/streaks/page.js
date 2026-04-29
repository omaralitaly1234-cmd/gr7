'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClientStreaksPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';

  const currentStreak = 12;
  const bestStreak = 21;
  const totalDays = 85;

  const monthCalendar = (() => {
    const today = 27;
    const daysInMonth = 31;
    const streakDays = new Set([1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27]);
    const missedDays = new Set([4, 14, 21]);
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      type: i + 1 > today ? 'future' : streakDays.has(i + 1) ? 'active' : missedDays.has(i + 1) ? 'missed' : 'rest',
    }));
  })();

  const badges = [
    { icon: '🔥', title: locale === 'ar' ? 'أسبوع كامل' : '7 Day Streak', requirement: '7 ' + (locale === 'ar' ? 'أيام متتالية' : 'consecutive days'), earned: true, date: '2026-02-10' },
    { icon: '⚡', title: locale === 'ar' ? 'أسبوعين متتاليين' : '14 Day Streak', requirement: '14 ' + (locale === 'ar' ? 'يوم متتالي' : 'consecutive days'), earned: true, date: '2026-02-21' },
    { icon: '🏆', title: locale === 'ar' ? '21 يوم بطل' : '21 Day Champion', requirement: '21 ' + (locale === 'ar' ? 'يوم متتالي' : 'consecutive days'), earned: true, date: '2026-03-05' },
    { icon: '💎', title: locale === 'ar' ? 'شهر كامل' : '30 Day Legend', requirement: '30 ' + (locale === 'ar' ? 'يوم متتالي' : 'consecutive days'), earned: false },
    { icon: '👑', title: locale === 'ar' ? '60 يوم أسطوري' : '60 Day Legendary', requirement: '60 ' + (locale === 'ar' ? 'يوم متتالي' : 'consecutive days'), earned: false },
    { icon: '🌟', title: locale === 'ar' ? '100 يوم خالد' : '100 Day Immortal', requirement: '100 ' + (locale === 'ar' ? 'يوم متتالي' : 'consecutive days'), earned: false },
  ];

  const monthlyHistory = [
    { month: locale === 'ar' ? 'أكتوبر' : 'Oct', days: 18, total: 31, streak: 8 },
    { month: locale === 'ar' ? 'نوفمبر' : 'Nov', days: 20, total: 30, streak: 12 },
    { month: locale === 'ar' ? 'ديسمبر' : 'Dec', days: 16, total: 31, streak: 6 },
    { month: locale === 'ar' ? 'يناير' : 'Jan', days: 22, total: 31, streak: 15 },
    { month: locale === 'ar' ? 'فبراير' : 'Feb', days: 24, total: 28, streak: 21 },
    { month: locale === 'ar' ? 'مارس' : 'Mar', days: 24, total: 27, streak: 12 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔥</span> {locale === 'ar' ? 'السلاسل والالتزام' : 'Streaks & Consistency'}</h1>
      </div>

      {/* Current Streak Hero */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', borderTop: '3px solid var(--pt-gold)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-1)' }}>🔥</div>
        <div style={{ fontWeight: 900, fontSize: '3rem', color: 'var(--pt-gold)', lineHeight: 1 }}>{currentStreak}</div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)' }}>
          {locale === 'ar' ? 'يوم متتالي!' : 'day streak!'}
        </div>
        <div className="grid grid-3" style={{ maxWidth: 450, margin: '0 auto' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: '#FF9100' }}>🏅 {bestStreak}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'أفضل سلسلة' : 'Best Streak'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: 'var(--pt-success)' }}>📅 {totalDays}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'إجمالي أيام التمرين' : 'Total Workout Days'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: '#4FC3F7' }}>89%</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'نسبة الالتزام' : 'Consistency'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* March Calendar */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>📅 {locale === 'ar' ? 'مارس 2026' : 'March 2026'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {(locale === 'ar' ? ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--pt-gray-600)', padding: '4px 0' }}>{d}</div>
            ))}
            {monthCalendar.map((d, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, margin: '0 auto',
                background: d.type === 'active' ? 'rgba(245,197,24,0.15)' : d.type === 'missed' ? 'rgba(255,82,82,0.1)' : 'transparent',
                color: d.type === 'active' ? 'var(--pt-gold)' : d.type === 'missed' ? '#FF5252' : d.type === 'future' ? 'var(--pt-gray-700)' : 'var(--pt-gray-500)',
                border: d.day === 27 ? '2px solid var(--pt-gold)' : 'none',
              }}>
                {d.type === 'active' ? '✅' : d.type === 'missed' ? '❌' : d.day}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)', fontSize: '10px' }}>
            <span>✅ {locale === 'ar' ? 'تمرين' : 'Trained'} ({monthCalendar.filter(d => d.type === 'active').length})</span>
            <span>❌ {locale === 'ar' ? 'فات' : 'Missed'} ({monthCalendar.filter(d => d.type === 'missed').length})</span>
          </div>
        </div>

        {/* Monthly History */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'سجل الشهور' : 'Monthly History'}</h3>
          {monthlyHistory.map((m, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>{m.month}</span>
                <span style={{ fontSize: '10px' }}>
                  <span style={{ color: 'var(--pt-success)', fontWeight: 700 }}>{m.days}/{m.total}</span>
                  <span style={{ color: 'var(--pt-gray-600)', marginInlineStart: '8px' }}>🔥 {m.streak}</span>
                </span>
              </div>
              <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${(m.days / m.total) * 100}%`, height: '100%', background: (m.days / m.total) >= 0.8 ? 'var(--pt-success)' : 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🏅 {locale === 'ar' ? 'شارات الالتزام' : 'Streak Badges'}</h3>
        <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
          {badges.map((b, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', opacity: b.earned ? 1 : 0.4, borderTop: b.earned ? '2px solid var(--pt-gold)' : '2px solid transparent' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-1)', filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>{b.title}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{b.requirement}</div>
              {b.earned && <div style={{ fontSize: '9px', color: 'var(--pt-success)', marginTop: '4px' }}>✅ {b.date}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
