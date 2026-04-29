'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function AttendanceCalendarPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [month, setMonth] = useState(2); // March (0-indexed)

  const months = locale === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو']
    : ['January', 'February', 'March', 'April', 'May', 'June'];

  const dayNames = locale === 'ar'
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثا', 'أربعا', 'خميس', 'جمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Demo attendance data for March 2026
  const attendanceData = {
    2: { // March
      1: 42, 2: 38, 3: 45, 4: 40, 5: 35, 6: 0, 7: 44, 8: 48, 9: 38,
      10: 50, 11: 42, 12: 30, 13: 0, 14: 46, 15: 52, 16: 40, 17: 55,
      18: 38, 19: 28, 20: 0, 21: 48, 22: 50, 23: 45, 24: 42, 25: 0,
      26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0,
    },
  };

  const data = attendanceData[month] || {};
  const maxAttendance = Math.max(...Object.values(data).filter(v => v > 0), 1);
  const totalDays = Object.values(data).filter(v => v > 0).length;
  const totalVisits = Object.values(data).reduce((s, v) => s + v, 0);
  const avgDaily = totalDays > 0 ? Math.round(totalVisits / totalDays) : 0;
  const peakDay = Object.entries(data).reduce((best, [day, count]) => count > (best.count || 0) ? { day, count } : best, {});

  const getColor = (count) => {
    if (count === 0) return 'var(--pt-darker)';
    const ratio = count / maxAttendance;
    if (ratio > 0.8) return '#FF5252';
    if (ratio > 0.6) return '#FFD740';
    if (ratio > 0.3) return 'rgba(245,197,24,0.4)';
    return 'rgba(245,197,24,0.15)';
  };

  // Generate calendar grid (March 2026 starts on Sunday)
  const startDay = 1; // Sunday = index 1
  const daysInMonth = 31;
  const weeks = [];
  let current = 1;
  let firstWeek = Array(7).fill(null);
  for (let i = startDay; i < 7 && current <= daysInMonth; i++) {
    firstWeek[i] = current++;
  }
  weeks.push(firstWeek);
  while (current <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(current <= daysInMonth ? current++ : null);
    }
    weeks.push(week);
  }

  const todayStats = [
    { time: '6-8 AM', count: 8, label: locale === 'ar' ? 'صباح باكر' : 'Early Morning' },
    { time: '8-10 AM', count: 15, label: locale === 'ar' ? 'صباحي' : 'Morning' },
    { time: '10-12 PM', count: 6, label: locale === 'ar' ? 'ضحى' : 'Late Morning' },
    { time: '12-2 PM', count: 3, label: locale === 'ar' ? 'ظهر' : 'Noon' },
    { time: '2-4 PM', count: 5, label: locale === 'ar' ? 'عصر' : 'Afternoon' },
    { time: '4-6 PM', count: 18, label: locale === 'ar' ? 'مساء باكر' : 'Early Evening' },
    { time: '6-8 PM', count: 22, label: locale === 'ar' ? '⬆ ذروة' : '⬆ Peak' },
    { time: '8-10 PM', count: 15, label: locale === 'ar' ? 'مساء' : 'Evening' },
  ];
  const maxHourly = Math.max(...todayStats.map(s => s.count));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {locale === 'ar' ? 'تقويم الحضور' : 'Attendance Calendar'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMonth(Math.max(0, month - 1))}>←</button>
          <span style={{ fontWeight: 700, minWidth: 80, textAlign: 'center' }}>{months[month]} 2026</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMonth(Math.min(5, month + 1))}>→</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{totalVisits}</div>
            <div className="stat-label">{locale === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <div className="stat-value">{avgDaily}</div>
            <div className="stat-label">{locale === 'ar' ? 'متوسط يومي' : 'Daily Average'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{peakDay.count || 0}</div>
            <div className="stat-label">{locale === 'ar' ? 'أعلى يوم (يوم ' + peakDay.day + ')' : 'Peak Day (Day ' + peakDay.day + ')'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{totalDays}</div>
            <div className="stat-label">{locale === 'ar' ? 'أيام عمل' : 'Working Days'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Calendar Heatmap */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🗓️ {locale === 'ar' ? 'خريطة الحضور' : 'Attendance Heatmap'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--pt-gray-500)', fontWeight: 700, padding: '4px' }}>{d}</div>
            ))}
            {weeks.flat().map((day, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 'var(--radius-sm)', background: day ? getColor(data[day] || 0) : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: day === 24 ? 900 : 500, border: day === 24 ? '2px solid var(--pt-gold)' : 'none', cursor: day ? 'pointer' : 'default', position: 'relative' }}>
                {day && <span>{day}</span>}
                {day && data[day] > 0 && <span style={{ fontSize: '8px', color: 'var(--pt-gray-400)' }}>{data[day]}</span>}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-3)', fontSize: '10px', color: 'var(--pt-gray-500)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(245,197,24,0.15)' }} /> {locale === 'ar' ? 'قليل' : 'Low'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(245,197,24,0.4)' }} /> {locale === 'ar' ? 'متوسط' : 'Medium'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#FFD740' }} /> {locale === 'ar' ? 'مرتفع' : 'High'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#FF5252' }} /> {locale === 'ar' ? 'ذروة' : 'Peak'}</span>
          </div>
        </div>

        {/* Today's Hourly Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>⏰ {locale === 'ar' ? 'حضور اليوم حسب الساعة' : 'Today Hourly'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {todayStats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ minWidth: 60, fontSize: '10px', color: 'var(--pt-gray-500)', textAlign: 'end' }} dir="ltr">{s.time}</span>
                <div style={{ flex: 1, background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 20, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.count / maxHourly) * 100}%`, height: '100%', background: s.count >= 20 ? '#FF5252' : s.count >= 15 ? '#FFD740' : 'rgba(245,197,24,0.4)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingInlineEnd: 6 }}>
                    <span style={{ fontSize: '9px', fontWeight: 700 }}>{s.count}</span>
                  </div>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--pt-gray-600)', minWidth: 50 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
