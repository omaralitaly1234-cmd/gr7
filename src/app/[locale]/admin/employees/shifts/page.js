'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function EmployeeShiftPlannerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedWeek, setSelectedWeek] = useState(0);

  const employees = [
    { id: 'e1', name: locale === 'ar' ? 'محمد عادل' : 'Mohamed Adel', role: locale === 'ar' ? 'مدير' : 'Manager', avatar: 'م', color: '#F5C518' },
    { id: 'e2', name: locale === 'ar' ? 'علي حسن' : 'Ali Hassan', role: locale === 'ar' ? 'استقبال' : 'Reception', avatar: 'ع', color: '#4FC3F7' },
    { id: 'e3', name: locale === 'ar' ? 'مريم أحمد' : 'Mariam Ahmed', role: locale === 'ar' ? 'استقبال نسائي' : 'Women Reception', avatar: 'م', color: '#E040FB' },
    { id: 'e4', name: locale === 'ar' ? 'أحمد سمير' : 'Ahmed Samir', role: locale === 'ar' ? 'نظافة' : 'Cleaning', avatar: 'أ', color: '#00C853' },
    { id: 'e5', name: locale === 'ar' ? 'حسن محمود' : 'Hassan Mahmoud', role: locale === 'ar' ? 'سبا' : 'Spa', avatar: 'ح', color: '#B388FF' },
  ];

  const days = locale === 'ar'
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const shifts = {
    morning: { label: locale === 'ar' ? 'صباحي' : 'Morning', time: '6AM-2PM', color: '#FFD740', bg: 'rgba(255,215,64,0.1)' },
    evening: { label: locale === 'ar' ? 'مسائي' : 'Evening', time: '2PM-10PM', color: '#4FC3F7', bg: 'rgba(79,195,247,0.1)' },
    off: { label: locale === 'ar' ? 'إجازة' : 'Off', time: '', color: 'var(--pt-gray-600)', bg: 'rgba(255,255,255,0.02)' },
  };

  const [schedule, setSchedule] = useState({
    'e1': ['morning', 'morning', 'morning', 'morning', 'morning', 'morning', 'off'],
    'e2': ['morning', 'morning', 'morning', 'evening', 'evening', 'morning', 'off'],
    'e3': ['evening', 'evening', 'evening', 'evening', 'evening', 'evening', 'off'],
    'e4': ['morning', 'morning', 'evening', 'morning', 'morning', 'evening', 'off'],
    'e5': ['morning', 'evening', 'morning', 'evening', 'morning', 'morning', 'off'],
  });

  const cycleShift = (empId, dayIndex) => {
    const current = schedule[empId][dayIndex];
    const next = current === 'morning' ? 'evening' : current === 'evening' ? 'off' : 'morning';
    const updated = { ...schedule };
    updated[empId] = [...updated[empId]];
    updated[empId][dayIndex] = next;
    setSchedule(updated);
  };

  const stats = employees.map(emp => {
    const s = schedule[emp.id];
    return {
      ...emp,
      mornings: s.filter(x => x === 'morning').length,
      evenings: s.filter(x => x === 'evening').length,
      offs: s.filter(x => x === 'off').length,
      totalHours: s.filter(x => x !== 'off').length * 8,
    };
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {locale === 'ar' ? 'جدول شيفتات الموظفين' : 'Employee Shift Planner'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedWeek(selectedWeek - 1)}>←</button>
          <span style={{ fontWeight: 700, color: 'var(--pt-gold)', lineHeight: '32px' }}>
            {locale === 'ar' ? `الأسبوع ${selectedWeek === 0 ? 'الحالي' : selectedWeek > 0 ? 'القادم' : 'السابق'}` : `${selectedWeek === 0 ? 'Current' : selectedWeek > 0 ? 'Next' : 'Previous'} Week`}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedWeek(selectedWeek + 1)}>→</button>
          <button className="btn btn-primary btn-sm">💾 {locale === 'ar' ? 'حفظ' : 'Save'}</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {Object.values(shifts).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: s.bg, border: `2px solid ${s.color}` }} />
            <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
            {s.time && <span style={{ color: 'var(--pt-gray-600)', fontSize: '10px' }} dir="ltr">{s.time}</span>}
          </div>
        ))}
      </div>

      {/* Shift Grid */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>{locale === 'ar' ? 'الموظف' : 'Employee'}</th>
              {days.map((d, i) => (
                <th key={i} style={{ textAlign: 'center', minWidth: 80 }}>{d}</th>
              ))}
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'ساعات' : 'Hours'}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: `${emp.color}20`, color: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{emp.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{emp.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{emp.role}</div>
                    </div>
                  </div>
                </td>
                {schedule[emp.id].map((shift, di) => {
                  const s = shifts[shift];
                  return (
                    <td key={di} style={{ textAlign: 'center' }}>
                      <button onClick={() => cycleShift(emp.id, di)}
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${s.color}30`, background: s.bg, color: s.color, fontWeight: 700, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minWidth: 60 }}>
                        {s.label}
                      </button>
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--pt-gold)' }}>
                  {schedule[emp.id].filter(x => x !== 'off').length * 8}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Stats */}
      <h3 style={{ marginBottom: 'var(--space-4)' }}>📊 {locale === 'ar' ? 'ملخص الأسبوع' : 'Weekly Summary'}</h3>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-4)' }}>
        {stats.map(emp => (
          <div key={emp.id} className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: `${emp.color}20`, color: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{emp.avatar}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{emp.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{emp.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(255,215,64,0.08)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 800, color: '#FFD740' }}>{emp.mornings}</div>
                <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'صباحي' : 'AM'}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(79,195,247,0.08)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 800, color: '#4FC3F7' }}>{emp.evenings}</div>
                <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'مسائي' : 'PM'}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 800 }}>{emp.offs}</div>
                <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'إجازة' : 'Off'}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(245,197,24,0.08)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{emp.totalHours}h</div>
                <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'ساعات' : 'Hours'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
