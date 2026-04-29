'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminEngagementPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [period, setPeriod] = useState('week');

  const heatmapData = [
    { hour: '6AM', mon: 8, tue: 12, wed: 10, thu: 14, fri: 6, sat: 18, sun: 4 },
    { hour: '7AM', mon: 15, tue: 20, wed: 18, thu: 22, fri: 10, sat: 25, sun: 8 },
    { hour: '8AM', mon: 22, tue: 28, wed: 25, thu: 30, fri: 15, sat: 35, sun: 12 },
    { hour: '9AM', mon: 18, tue: 22, wed: 20, thu: 25, fri: 12, sat: 28, sun: 10 },
    { hour: '10AM', mon: 10, tue: 14, wed: 12, thu: 16, fri: 8, sat: 20, sun: 6 },
    { hour: '4PM', mon: 20, tue: 25, wed: 22, thu: 28, fri: 15, sat: 30, sun: 5 },
    { hour: '5PM', mon: 32, tue: 38, wed: 35, thu: 40, fri: 20, sat: 42, sun: 8 },
    { hour: '6PM', mon: 38, tue: 45, wed: 42, thu: 48, fri: 25, sat: 50, sun: 10 },
    { hour: '7PM', mon: 35, tue: 40, wed: 38, thu: 45, fri: 22, sat: 48, sun: 8 },
    { hour: '8PM', mon: 25, tue: 30, wed: 28, thu: 32, fri: 18, sat: 35, sun: 6 },
    { hour: '9PM', mon: 15, tue: 18, wed: 16, thu: 20, fri: 10, sat: 22, sun: 4 },
  ];

  const days = locale === 'ar' ? ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayKeys = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

  const getHeatColor = (v) => {
    if (v >= 40) return 'rgba(245,197,24,0.9)';
    if (v >= 30) return 'rgba(245,197,24,0.6)';
    if (v >= 20) return 'rgba(245,197,24,0.35)';
    if (v >= 10) return 'rgba(245,197,24,0.15)';
    return 'rgba(245,197,24,0.05)';
  };

  const topActivities = [
    { name: locale === 'ar' ? 'تمارين الأوزان' : 'Weight Training', pct: 45, color: 'var(--pt-gold)', users: 112 },
    { name: locale === 'ar' ? 'كارديو' : 'Cardio', pct: 22, color: '#FF5252', users: 55 },
    { name: locale === 'ar' ? 'حصص جماعية' : 'Group Classes', pct: 15, color: '#4FC3F7', users: 38 },
    { name: locale === 'ar' ? 'سبا وساونا' : 'Spa & Sauna', pct: 10, color: '#00C853', users: 25 },
    { name: locale === 'ar' ? 'سباحة' : 'Swimming', pct: 8, color: '#7C4DFF', users: 15 },
  ];

  const engagementKPIs = [
    { v: '42', l: locale === 'ar' ? 'متوسط حضور/يوم' : 'Avg Attendance/Day', icon: '📊', color: 'var(--pt-gold)', sub: '+12% ↑' },
    { v: '6:15 PM', l: locale === 'ar' ? 'ساعة الذروة' : 'Peak Hour', icon: '⏰', color: '#FF9100', sub: locale === 'ar' ? 'السبت' : 'Saturday' },
    { v: '3.2', l: locale === 'ar' ? 'زيارات/عضو/أسبوع' : 'Visits/Member/Week', icon: '🔄', color: '#4FC3F7', sub: '+0.3 ↑' },
    { v: '68min', l: locale === 'ar' ? 'متوسط مدة التمرين' : 'Avg Session Duration', icon: '⏱️', color: 'var(--pt-success)', sub: locale === 'ar' ? 'مثالي ✅' : 'Optimal ✅' },
  ];

  const retentionFunnel = [
    { stage: locale === 'ar' ? 'مسجلين' : 'Registered', count: 280, pct: 100, color: 'var(--pt-gold)' },
    { stage: locale === 'ar' ? 'حضروا أول أسبوع' : 'Week 1 Active', count: 252, pct: 90, color: '#00C853' },
    { stage: locale === 'ar' ? 'حضروا شهر كامل' : 'Month 1 Active', count: 210, pct: 75, color: '#4FC3F7' },
    { stage: locale === 'ar' ? 'جددوا الاشتراك' : 'Renewed', count: 195, pct: 70, color: '#FFD740' },
    { stage: locale === 'ar' ? 'أعضاء دائمون' : 'Long-term Members', count: 155, pct: 55, color: '#7C4DFF' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {locale === 'ar' ? 'تحليل التفاعل' : 'Engagement Analytics'}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {engagementKPIs.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
            <div style={{ fontSize: '9px', color: 'var(--pt-success)', fontWeight: 600, marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Heatmap */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🔥 {locale === 'ar' ? 'خريطة الحرارة — الحضور' : 'Attendance Heatmap'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: '2px', minWidth: 350 }}>
              <div />
              {days.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--pt-gray-500)', padding: '4px 0' }}>{d}</div>
              ))}
              {heatmapData.map((row, ri) => (
                <>
                  <div key={`h-${ri}`} style={{ fontSize: '9px', fontWeight: 600, color: 'var(--pt-gray-600)', display: 'flex', alignItems: 'center' }}>{row.hour}</div>
                  {dayKeys.map((dk, di) => (
                    <div key={`${ri}-${di}`} style={{ background: getHeatColor(row[dk]), borderRadius: '3px', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: row[dk] >= 30 ? '#1a1a1a' : 'var(--pt-gray-500)', cursor: 'pointer' }}>
                      {row[dk]}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: 'var(--space-3)', fontSize: '9px', alignItems: 'center' }}>
            <span style={{ color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'أقل' : 'Less'}</span>
            {[0.05, 0.15, 0.35, 0.6, 0.9].map((o, i) => (
              <div key={i} style={{ width: 14, height: 14, background: `rgba(245,197,24,${o})`, borderRadius: 2 }} />
            ))}
            <span style={{ color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'أكثر' : 'More'}</span>
          </div>
        </div>

        {/* Top Activities */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🏋️ {locale === 'ar' ? 'الأنشطة الأكثر شعبية' : 'Top Activities'}</h3>
          {topActivities.map((a, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                <span style={{ fontWeight: 700, color: a.color }}>{a.pct}% ({a.users} {locale === 'ar' ? 'عضو' : 'members'})</span>
              </div>
              <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${a.pct}%`, height: '100%', background: a.color, borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Funnel */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📈 {locale === 'ar' ? 'قمع الاحتفاظ' : 'Retention Funnel'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          {retentionFunnel.map((s, i) => (
            <div key={i} style={{ width: `${60 + ((100 - 60) * (s.pct / 100))}%`, background: `${s.color}15`, borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderInlineStart: `3px solid ${s.color}`, fontSize: 'var(--font-size-xs)' }}>
              <span style={{ fontWeight: 600 }}>{s.stage}</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: s.color }}>{s.count}</span>
                <span style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>({s.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
