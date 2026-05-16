'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function AdminEngagementPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const [attRes, memRes] = await Promise.all([
          getTenantDocuments(tenantId, 'attendance', [], { field: 'createdAt', direction: 'desc' }),
          getTenantDocuments(tenantId, 'members'),
        ]);
        setAttendance(attRes.data || []);
        setMembers(memRes.data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const days = isAr ? ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Build heatmap from real attendance data
  const hourSlots = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'];
  const hourMap = { '6AM': 6, '7AM': 7, '8AM': 8, '9AM': 9, '10AM': 10, '11AM': 11, '4PM': 16, '5PM': 17, '6PM': 18, '7PM': 19, '8PM': 20, '9PM': 21 };

  const heatmapData = {};
  hourSlots.forEach(h => {
    heatmapData[h] = { sat: 0, sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 };
  });

  const dayKeyByIndex = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
  const dayKeys = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

  attendance.forEach(att => {
    const ts = att.createdAt?.toDate ? att.createdAt.toDate() : att.createdAt ? new Date(att.createdAt) : null;
    if (!ts) return;
    const dayIndex = ts.getDay(); // 0=Sun ... 6=Sat
    const hour = ts.getHours();
    const dayKey = dayKeyByIndex[dayIndex];

    // Find the closest hour slot
    hourSlots.forEach(slot => {
      if (hourMap[slot] === hour && heatmapData[slot]) {
        heatmapData[slot][dayKey] = (heatmapData[slot][dayKey] || 0) + 1;
      }
    });
  });

  const heatmapRows = hourSlots.map(hour => ({
    hour,
    ...heatmapData[hour],
  }));

  const maxHeat = Math.max(...heatmapRows.flatMap(r => dayKeys.map(dk => r[dk] || 0)), 1);

  const getHeatColor = (v) => {
    const ratio = v / maxHeat;
    if (ratio >= 0.8) return 'rgba(245,197,24,0.9)';
    if (ratio >= 0.6) return 'rgba(245,197,24,0.6)';
    if (ratio >= 0.4) return 'rgba(245,197,24,0.35)';
    if (ratio >= 0.2) return 'rgba(245,197,24,0.15)';
    return 'rgba(245,197,24,0.05)';
  };

  // KPIs from real data
  const totalAttendance = attendance.length;
  // Calculate unique days with attendance
  const uniqueDays = new Set();
  attendance.forEach(att => {
    const ts = att.createdAt?.toDate ? att.createdAt.toDate() : att.createdAt ? new Date(att.createdAt) : null;
    if (ts) uniqueDays.add(ts.toDateString());
  });
  const avgAttendancePerDay = uniqueDays.size > 0 ? Math.round(totalAttendance / uniqueDays.size) : 0;

  // Peak hour
  const hourCounts = {};
  attendance.forEach(att => {
    const ts = att.createdAt?.toDate ? att.createdAt.toDate() : att.createdAt ? new Date(att.createdAt) : null;
    if (!ts) return;
    const h = ts.getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const peakHourLabel = peakHour ? `${peakHour[0]}:00` : '--:--';

  // Peak day
  const dayCounts = {};
  attendance.forEach(att => {
    const ts = att.createdAt?.toDate ? att.createdAt.toDate() : att.createdAt ? new Date(att.createdAt) : null;
    if (!ts) return;
    const d = dayKeyByIndex[ts.getDay()];
    dayCounts[d] = (dayCounts[d] || 0) + 1;
  });
  const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const dayNameMap = isAr
    ? { sat: 'السبت', sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' }
    : { sat: 'Saturday', sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };
  const peakDayLabel = peakDay ? dayNameMap[peakDay[0]] : '—';

  // Visits per member per week (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekAttendance = attendance.filter(att => {
    const ts = att.createdAt?.toDate ? att.createdAt.toDate() : att.createdAt ? new Date(att.createdAt) : null;
    return ts && ts >= weekAgo;
  });
  const uniqueMembersWeek = new Set(weekAttendance.map(a => a.memberId)).size;
  const visitsPerMemberPerWeek = uniqueMembersWeek > 0 ? (weekAttendance.length / uniqueMembersWeek).toFixed(1) : '0';

  // Retention funnel
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const membersWithAttendance = new Set(attendance.map(a => a.memberId)).size;

  const retentionFunnel = [
    { stage: isAr ? 'مسجلين' : 'Registered', count: totalMembers, pct: 100, color: 'var(--pt-gold)' },
    { stage: isAr ? 'نشطين' : 'Active', count: activeMembers, pct: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0, color: '#00C853' },
    { stage: isAr ? 'حضروا مرة واحدة' : 'Attended Once', count: membersWithAttendance, pct: totalMembers > 0 ? Math.round((membersWithAttendance / totalMembers) * 100) : 0, color: '#4FC3F7' },
    { stage: isAr ? 'حضروا هذا الأسبوع' : 'This Week Active', count: uniqueMembersWeek, pct: totalMembers > 0 ? Math.round((uniqueMembersWeek / totalMembers) * 100) : 0, color: '#7C4DFF' },
  ];

  const engagementKPIs = [
    { v: String(avgAttendancePerDay), l: isAr ? 'متوسط حضور/يوم' : 'Avg Attendance/Day', icon: '📊', color: 'var(--pt-gold)', sub: `${totalAttendance} ${isAr ? 'إجمالي' : 'total'}` },
    { v: peakHourLabel, l: isAr ? 'ساعة الذروة' : 'Peak Hour', icon: '⏰', color: '#FF9100', sub: peakDayLabel },
    { v: visitsPerMemberPerWeek, l: isAr ? 'زيارات/عضو/أسبوع' : 'Visits/Member/Week', icon: '🔄', color: '#4FC3F7', sub: `${uniqueMembersWeek} ${isAr ? 'عضو' : 'members'}` },
    { v: String(totalMembers), l: isAr ? 'إجمالي الأعضاء' : 'Total Members', icon: '👥', color: 'var(--pt-success)', sub: `${activeMembers} ${isAr ? 'نشط' : 'active'}` },
  ];

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {isAr ? 'تحليل التفاعل' : 'Engagement Analytics'}</h1>
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

      {totalAttendance === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>{isAr ? 'لا توجد بيانات حضور بعد' : 'No attendance data yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>
            {isAr ? 'سيتم عرض تحليلات التفاعل عند تسجيل حضور الأعضاء' : 'Engagement analytics will appear when members check in'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Heatmap */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🔥 {isAr ? 'خريطة الحرارة — الحضور' : 'Attendance Heatmap'}</h3>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: '2px', minWidth: 350 }}>
                  <div />
                  {days.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--pt-gray-500)', padding: '4px 0' }}>{d}</div>
                  ))}
                  {heatmapRows.map((row, ri) => (
                    <>
                      <div key={`h-${ri}`} style={{ fontSize: '9px', fontWeight: 600, color: 'var(--pt-gray-600)', display: 'flex', alignItems: 'center' }}>{row.hour}</div>
                      {dayKeys.map((dk, di) => (
                        <div key={`${ri}-${di}`} style={{ background: getHeatColor(row[dk] || 0), borderRadius: '3px', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: (row[dk] || 0) / maxHeat >= 0.6 ? '#1a1a1a' : 'var(--pt-gray-500)', cursor: 'pointer' }}>
                          {row[dk] || 0}
                        </div>
                      ))}
                    </>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: 'var(--space-3)', fontSize: '9px', alignItems: 'center' }}>
                <span style={{ color: 'var(--pt-gray-600)' }}>{isAr ? 'أقل' : 'Less'}</span>
                {[0.05, 0.15, 0.35, 0.6, 0.9].map((o, i) => (
                  <div key={i} style={{ width: 14, height: 14, background: `rgba(245,197,24,${o})`, borderRadius: 2 }} />
                ))}
                <span style={{ color: 'var(--pt-gray-600)' }}>{isAr ? 'أكثر' : 'More'}</span>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📈 {isAr ? 'إحصائيات الحضور' : 'Attendance Stats'}</h3>
              {dayKeys.map((dk, i) => {
                const count = dayCounts[dk] || 0;
                const maxDay = Math.max(...Object.values(dayCounts), 1);
                return (
                  <div key={dk} style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600 }}>{days[i]}</span>
                      <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{count} {isAr ? 'حضور' : 'check-ins'}</span>
                    </div>
                    <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${(count / maxDay) * 100}%`, height: '100%', background: 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retention Funnel */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📈 {isAr ? 'قمع الاحتفاظ' : 'Retention Funnel'}</h3>
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
        </>
      )}
    </div>
  );
}
