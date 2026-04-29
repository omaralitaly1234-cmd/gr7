'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerSchedulePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedDay, setSelectedDay] = useState(0);

  const days = [
    { name: locale === 'ar' ? 'السبت' : 'Saturday', date: '2026-03-23', sessions: [
      { time: '08:00 - 09:00', client: 'أحمد محمد سعيد', type: locale === 'ar' ? 'تدريب قوة' : 'Strength', status: 'completed' },
      { time: '09:30 - 10:30', client: 'عمر حسام الدين', type: locale === 'ar' ? 'تضخيم' : 'Bulking', status: 'completed' },
      { time: '16:00 - 17:00', client: 'نور أحمد', type: locale === 'ar' ? 'لياقة عامة' : 'General', status: 'upcoming' },
    ]},
    { name: locale === 'ar' ? 'الأحد' : 'Sunday', date: '2026-03-24', sessions: [
      { time: '08:00 - 09:00', client: 'أحمد محمد سعيد', type: locale === 'ar' ? 'كارديو' : 'Cardio', status: 'upcoming' },
      { time: '10:00 - 11:00', client: 'سارة علي حسن', type: locale === 'ar' ? 'تنشيف' : 'Cutting', status: 'upcoming' },
    ]},
    { name: locale === 'ar' ? 'الإثنين' : 'Monday', date: '2026-03-25', sessions: [
      { time: '08:00 - 09:00', client: 'عمر حسام الدين', type: locale === 'ar' ? 'أرجل' : 'Legs', status: 'upcoming' },
      { time: '16:00 - 17:00', client: 'نور أحمد', type: locale === 'ar' ? 'كارديو + بطن' : 'Cardio + Abs', status: 'upcoming' },
      { time: '17:30 - 18:30', client: 'سارة علي حسن', type: locale === 'ar' ? 'ظهر' : 'Back', status: 'upcoming' },
    ]},
    { name: locale === 'ar' ? 'الثلاثاء' : 'Tuesday', date: '2026-03-26', sessions: [] },
    { name: locale === 'ar' ? 'الأربعاء' : 'Wednesday', date: '2026-03-27', sessions: [
      { time: '08:00 - 09:00', client: 'أحمد محمد سعيد', type: locale === 'ar' ? 'كتف' : 'Shoulders', status: 'upcoming' },
    ]},
    { name: locale === 'ar' ? 'الخميس' : 'Thursday', date: '2026-03-28', sessions: [] },
  ];

  const totalWeekSessions = days.reduce((s, d) => s + d.sessions.length, 0);
  const completedSessions = days.reduce((s, d) => s + d.sessions.filter(s => s.status === 'completed').length, 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {t('sidebar.schedule')}</h1>
      </div>

      {/* Week Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📅</div>
          <div className="stat-info">
            <div className="stat-value">{totalWeekSessions}</div>
            <div className="stat-label">{locale === 'ar' ? 'حصص هذا الأسبوع' : "This Week's Sessions"}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{completedSessions}</div>
            <div className="stat-label">{locale === 'ar' ? 'حصص مكتملة' : 'Completed'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{totalWeekSessions - completedSessions}</div>
            <div className="stat-label">{locale === 'ar' ? 'حصص متبقية' : 'Remaining'}</div>
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
        {days.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            className={`btn ${selectedDay === i ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            style={{ minWidth: 100, flexDirection: 'column', alignItems: 'center', padding: 'var(--space-2) var(--space-3)' }}>
            <span style={{ fontWeight: 700 }}>{day.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>{day.sessions.length} {locale === 'ar' ? 'حصص' : 'sessions'}</span>
          </button>
        ))}
      </div>

      {/* Day Sessions */}
      {days[selectedDay].sessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {days[selectedDay].sessions.map((session, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', borderInlineStart: `3px solid ${session.status === 'completed' ? 'var(--pt-success)' : 'var(--pt-gold)'}` }}>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>{session.time.split(' - ')[0]}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{session.time.split(' - ')[1]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{session.client}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🏋️ {session.type}</div>
              </div>
              <span className={`badge ${session.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {session.status === 'completed' ? (locale === 'ar' ? '✓ مكتمل' : '✓ Done') : (locale === 'ar' ? '⏳ قادمة' : '⏳ Upcoming')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🏖️</div>
          <p style={{ color: 'var(--pt-gray-400)' }}>{locale === 'ar' ? 'لا توجد حصص في هذا اليوم — يوم راحة!' : 'No sessions today — Rest day!'}</p>
        </div>
      )}
    </div>
  );
}
