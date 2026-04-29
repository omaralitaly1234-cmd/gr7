'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerWeeklyPlannerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [currentWeek, setCurrentWeek] = useState(0);

  const days = locale === 'ar'
    ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const sessions = [
    { day: 0, time: '08:00', client: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', type: locale === 'ar' ? 'تمرين قوة' : 'Strength', duration: 60, color: '#FF5252', status: 'confirmed' },
    { day: 0, time: '17:00', client: locale === 'ar' ? 'سارة علي' : 'Sara A.', type: locale === 'ar' ? 'تنشيف' : 'Cutting', duration: 45, color: '#4FC3F7', status: 'confirmed' },
    { day: 0, time: '19:00', client: locale === 'ar' ? 'عمر حسام' : 'Omar H.', type: locale === 'ar' ? 'تضخيم' : 'Bulking', duration: 60, color: '#00C853', status: 'confirmed' },
    { day: 1, time: '09:00', client: locale === 'ar' ? 'نور أحمد' : 'Nour A.', type: locale === 'ar' ? 'لياقة عامة' : 'General Fitness', duration: 45, color: '#FFD740', status: 'confirmed' },
    { day: 1, time: '17:00', client: locale === 'ar' ? 'كروس فيت (مجموعة)' : 'CrossFit (Group)', type: locale === 'ar' ? 'حصة جماعية' : 'Group Class', duration: 60, color: '#FF9100', status: 'confirmed', isGroup: true },
    { day: 2, time: '07:00', client: locale === 'ar' ? 'خالد أحمد' : 'Khaled A.', type: locale === 'ar' ? 'تمرين قوة' : 'Strength', duration: 60, color: '#FF5252', status: 'confirmed' },
    { day: 2, time: '10:00', client: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', type: locale === 'ar' ? 'كارديو' : 'Cardio', duration: 30, color: '#E040FB', status: 'pending' },
    { day: 2, time: '18:00', client: locale === 'ar' ? 'سارة علي' : 'Sara A.', type: locale === 'ar' ? 'تنشيف' : 'Cutting', duration: 45, color: '#4FC3F7', status: 'confirmed' },
    { day: 3, time: '08:00', client: locale === 'ar' ? 'عمر حسام' : 'Omar H.', type: locale === 'ar' ? 'تضخيم' : 'Bulking', duration: 60, color: '#00C853', status: 'confirmed' },
    { day: 3, time: '16:00', client: locale === 'ar' ? 'HIIT (مجموعة)' : 'HIIT (Group)', type: locale === 'ar' ? 'حصة جماعية' : 'Group Class', duration: 45, color: '#FF9100', status: 'confirmed', isGroup: true },
    { day: 4, time: '09:00', client: locale === 'ar' ? 'نور أحمد' : 'Nour A.', type: locale === 'ar' ? 'لياقة عامة' : 'General Fitness', duration: 45, color: '#FFD740', status: 'confirmed' },
    { day: 4, time: '18:00', client: locale === 'ar' ? 'خالد أحمد' : 'Khaled A.', type: locale === 'ar' ? 'تمرين قوة' : 'Strength', duration: 60, color: '#FF5252', status: 'pending' },
    { day: 5, time: '08:00', client: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', type: locale === 'ar' ? 'أرجل' : 'Legs', duration: 60, color: '#7C4DFF', status: 'confirmed' },
    { day: 5, time: '17:00', client: locale === 'ar' ? 'سارة علي' : 'Sara A.', type: locale === 'ar' ? 'تنشيف' : 'Cutting', duration: 45, color: '#4FC3F7', status: 'confirmed' },
  ];

  const totalSessions = sessions.length;
  const confirmedSessions = sessions.filter(s => s.status === 'confirmed').length;
  const groupSessions = sessions.filter(s => s.isGroup).length;
  const totalHours = sessions.reduce((a, s) => a + s.duration, 0) / 60;

  const getSessionForSlot = (dayIdx, time) => sessions.find(s => s.day === dayIdx && s.time === time);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {locale === 'ar' ? 'المخطط الأسبوعي' : 'Weekly Planner'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentWeek(w => w - 1)}>◀</button>
          <span style={{ fontWeight: 700, minWidth: 140, textAlign: 'center' }}>
            {currentWeek === 0 ? (locale === 'ar' ? 'هذا الأسبوع' : 'This Week') :
             currentWeek === 1 ? (locale === 'ar' ? 'الأسبوع القادم' : 'Next Week') :
             (locale === 'ar' ? 'الأسبوع الماضي' : 'Last Week')}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentWeek(w => w + 1)}>▶</button>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: totalSessions, l: locale === 'ar' ? 'حصة هذا الأسبوع' : 'Sessions', icon: '📋', color: 'var(--pt-gold)' },
          { v: confirmedSessions, l: locale === 'ar' ? 'مؤكدة' : 'Confirmed', icon: '✅', color: 'var(--pt-success)' },
          { v: groupSessions, l: locale === 'ar' ? 'جماعية' : 'Group', icon: '👥', color: '#4FC3F7' },
          { v: totalHours.toFixed(1) + 'h', l: locale === 'ar' ? 'ساعات تدريب' : 'Training Hours', icon: '⏱️', color: '#7C4DFF' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Weekly Grid */}
      <div className="card" style={{ overflowX: 'auto', padding: 'var(--space-3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '1px', minWidth: 800 }}>
          {/* Header */}
          <div style={{ padding: 'var(--space-2)', fontWeight: 800, fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>⏰</div>
          {days.map((day, i) => (
            <div key={i} style={{ padding: 'var(--space-2)', textAlign: 'center', fontWeight: 800, fontSize: 'var(--font-size-xs)', color: i === new Date().getDay() ? 'var(--pt-gold)' : 'var(--pt-gray-400)', background: i === new Date().getDay() ? 'rgba(245,197,24,0.06)' : 'transparent', borderRadius: 'var(--radius-sm)' }}>
              {day}
            </div>
          ))}

          {/* Time Slots */}
          {timeSlots.map((time, ti) => (
            <>
              <div key={`t-${ti}`} style={{ padding: 'var(--space-2)', fontSize: '10px', color: 'var(--pt-gray-600)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{time}</div>
              {days.map((_, di) => {
                const session = getSessionForSlot(di, time);
                return (
                  <div key={`${ti}-${di}`} style={{ padding: '2px', minHeight: 44 }}>
                    {session ? (
                      <div style={{
                        padding: '4px 6px', borderRadius: 'var(--radius-sm)',
                        background: `${session.color}12`, borderInlineStart: `3px solid ${session.color}`,
                        fontSize: '10px', height: '100%', cursor: 'pointer',
                        opacity: session.status === 'pending' ? 0.6 : 1,
                      }}>
                        <div style={{ fontWeight: 700, color: session.color, marginBottom: '1px' }}>{session.client}</div>
                        <div style={{ color: 'var(--pt-gray-500)', fontSize: '9px' }}>
                          {session.type} • {session.duration}{locale === 'ar' ? 'د' : 'm'}
                          {session.status === 'pending' && <span style={{ marginInlineStart: '4px' }}>⏳</span>}
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '100%', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)' }} />
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Today's Sessions Detail */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📋 {locale === 'ar' ? 'حصص اليوم' : "Today's Sessions"}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {sessions.filter(s => s.day === 0).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: `3px solid ${s.color}` }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', minWidth: 50 }}>{s.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{s.client}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.type} • {s.duration} {locale === 'ar' ? 'دقيقة' : 'min'}</div>
              </div>
              <span className={`badge ${s.status === 'confirmed' ? 'badge-success' : 'badge-gold'}`} style={{ fontSize: '9px' }}>
                {s.status === 'confirmed' ? '✅' : '⏳'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
