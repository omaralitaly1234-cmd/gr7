'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function WorkoutStatsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [period, setPeriod] = useState('month');

  // Monthly overview
  const monthStats = {
    totalSessions: 18, totalSets: 324, totalReps: 4260,
    totalVolume: 156800, avgSessionDuration: 72, personalRecords: 3,
    muscleGroupSplit: [
      { muscle: locale === 'ar' ? 'صدر' : 'Chest', sessions: 4, volume: 28500, color: '#FF5252' },
      { muscle: locale === 'ar' ? 'ظهر' : 'Back', sessions: 4, volume: 32400, color: '#4FC3F7' },
      { muscle: locale === 'ar' ? 'أرجل' : 'Legs', sessions: 3, volume: 45000, color: '#FFD740' },
      { muscle: locale === 'ar' ? 'كتف' : 'Shoulders', sessions: 3, volume: 18200, color: '#7C4DFF' },
      { muscle: locale === 'ar' ? 'ذراعين' : 'Arms', sessions: 2, volume: 12500, color: '#00C853' },
      { muscle: locale === 'ar' ? 'كارديو' : 'Cardio', sessions: 2, volume: 0, color: '#FF9100' },
    ],
  };

  const maxVolume = Math.max(...monthStats.muscleGroupSplit.map(m => m.volume));

  // Personal Records
  const prs = [
    { exercise: locale === 'ar' ? 'بنش بريس' : 'Bench Press', weight: 100, date: '2026-03-20', prev: 90, icon: '🏋️' },
    { exercise: locale === 'ar' ? 'سكوات' : 'Squat', weight: 130, date: '2026-03-18', prev: 120, icon: '🦵' },
    { exercise: locale === 'ar' ? 'ديد ليفت' : 'Deadlift', weight: 140, date: '2026-03-15', prev: 130, icon: '💪' },
  ];

  // Weekly volume trend
  const weeklyVolume = [
    { week: locale === 'ar' ? 'أسبوع 1' : 'Week 1', volume: 34200 },
    { week: locale === 'ar' ? 'أسبوع 2' : 'Week 2', volume: 38500 },
    { week: locale === 'ar' ? 'أسبوع 3' : 'Week 3', volume: 41800 },
    { week: locale === 'ar' ? 'أسبوع 4' : 'Week 4', volume: 42300 },
  ];
  const maxWeekVol = Math.max(...weeklyVolume.map(w => w.volume));

  // Strength progress (last 4 months comparison)
  const strengthProgress = [
    { exercise: locale === 'ar' ? 'بنش بريس' : 'Bench', m1: 70, m2: 80, m3: 90, m4: 100, unit: 'kg' },
    { exercise: locale === 'ar' ? 'سكوات' : 'Squat', m1: 90, m2: 100, m3: 120, m4: 130, unit: 'kg' },
    { exercise: locale === 'ar' ? 'ديد ليفت' : 'Deadlift', m1: 100, m2: 110, m3: 130, m4: 140, unit: 'kg' },
    { exercise: locale === 'ar' ? 'ضغط كتف' : 'OHP', m1: 40, m2: 45, m3: 50, m4: 55, unit: 'kg' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {locale === 'ar' ? 'إحصائيات التدريب' : 'Workout Stats'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['week', 'month', '3month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`btn ${period === p ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
              {p === 'week' ? (locale === 'ar' ? 'أسبوع' : 'Week') : p === 'month' ? (locale === 'ar' ? 'شهر' : 'Month') : (locale === 'ar' ? '3 أشهر' : '3 Months')}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">🏋️</div>
          <div className="stat-info">
            <div className="stat-value">{monthStats.totalSessions}</div>
            <div className="stat-label">{locale === 'ar' ? 'حصة تدريب' : 'Sessions'}</div>
            <span className="stat-change up">↑ +3</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">⚖️</div>
          <div className="stat-info">
            <div className="stat-value">{(monthStats.totalVolume / 1000).toFixed(0)}K</div>
            <div className="stat-label">{locale === 'ar' ? 'حجم كلي (kg)' : 'Total Volume (kg)'}</div>
            <span className="stat-change up">↑ +12%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">🏆</div>
          <div className="stat-info">
            <div className="stat-value">{monthStats.personalRecords}</div>
            <div className="stat-label">{locale === 'ar' ? 'أرقام شخصية جديدة' : 'New PRs'}</div>
            <span className="stat-change up">🔥</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: monthStats.totalSets, l: locale === 'ar' ? 'مجموعة' : 'Sets', icon: '🔢' },
          { v: monthStats.totalReps.toLocaleString(), l: locale === 'ar' ? 'تكرار' : 'Reps', icon: '🔁' },
          { v: `${monthStats.avgSessionDuration}m`, l: locale === 'ar' ? 'متوسط المدة' : 'Avg Duration', icon: '⏱️' },
          { v: `${(monthStats.totalVolume / monthStats.totalSessions / 1000).toFixed(1)}K`, l: locale === 'ar' ? 'حجم/حصة' : 'Vol/Session', icon: '📈' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--pt-gold)' }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Muscle Group Split */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>💪 {locale === 'ar' ? 'توزيع العضلات' : 'Muscle Split'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {monthStats.muscleGroupSplit.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, display: 'inline-block' }} />
                    {m.muscle}
                  </span>
                  <span style={{ color: 'var(--pt-gray-500)' }}>{m.sessions} {locale === 'ar' ? 'حصص' : 'sessions'} • {(m.volume / 1000).toFixed(1)}K kg</span>
                </div>
                <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${maxVolume > 0 ? (m.volume / maxVolume) * 100 : 0}%`, height: '100%', background: m.color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Volume Trend */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📈 {locale === 'ar' ? 'تطور الحجم الأسبوعي' : 'Weekly Volume Trend'}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 120, marginBottom: 'var(--space-3)' }}>
            {weeklyVolume.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: i === weeklyVolume.length - 1 ? 'var(--pt-gold)' : 'var(--pt-gray-400)' }}>{(w.volume / 1000).toFixed(1)}K</span>
                <div style={{
                  width: '100%', height: `${(w.volume / maxWeekVol) * 100}%`,
                  background: i === weeklyVolume.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.3)',
                  borderRadius: '6px 6px 0 0', minHeight: 8,
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {weeklyVolume.map((w, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'var(--pt-gray-600)' }}>{w.week}</div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'نمو الحجم' : 'Volume Growth'}</span>
            <span style={{ fontWeight: 700, color: 'var(--pt-success)' }}>+{Math.round(((weeklyVolume[3].volume - weeklyVolume[0].volume) / weeklyVolume[0].volume) * 100)}% 📈</span>
          </div>
        </div>
      </div>

      {/* Personal Records */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🏆 {locale === 'ar' ? 'أرقام شخصية جديدة' : 'Personal Records'}</h3>
        <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
          {prs.map((pr, i) => (
            <div key={i} style={{ padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', textAlign: 'center', borderTop: '3px solid var(--pt-gold)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{pr.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{pr.exercise}</div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)', marginBottom: '4px' }}>{pr.weight} kg</div>
              <div style={{ fontSize: '10px', color: 'var(--pt-success)', fontWeight: 700, marginBottom: '4px' }}>
                ↑ +{pr.weight - pr.prev} kg ({locale === 'ar' ? 'من' : 'from'} {pr.prev} kg)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>📅 {pr.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Strength Progress Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'تطور القوة (4 أشهر)' : 'Strength Progress (4 Months)'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'التمرين' : 'Exercise'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'ديسمبر' : 'Dec'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'يناير' : 'Jan'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'فبراير' : 'Feb'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'مارس' : 'Mar'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'التغيير' : 'Change'}</th>
            </tr>
          </thead>
          <tbody>
            {strengthProgress.map((sp, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{sp.exercise}</td>
                <td style={{ textAlign: 'center', color: 'var(--pt-gray-500)' }}>{sp.m1} {sp.unit}</td>
                <td style={{ textAlign: 'center', color: 'var(--pt-gray-400)' }}>{sp.m2} {sp.unit}</td>
                <td style={{ textAlign: 'center' }}>{sp.m3} {sp.unit}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--pt-gold)' }}>{sp.m4} {sp.unit}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--pt-success)' }}>
                  ↑ +{sp.m4 - sp.m1} {sp.unit} ({Math.round(((sp.m4 - sp.m1) / sp.m1) * 100)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
