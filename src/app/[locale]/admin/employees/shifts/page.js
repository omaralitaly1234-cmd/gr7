'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, getTenantDocument, setTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

// Helper: get the Monday (start) of a given week offset from current week
function getWeekStart(weekOffset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  // Shift to Saturday-based week (Sat=0)
  const saturdayOffset = (day + 1) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - saturdayOffset + weekOffset * 7);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}

function formatWeekRange(weekOffset, locale) {
  const start = getWeekStart(weekOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  const loc = locale === 'ar' ? 'ar-EG' : 'en-US';
  return `${start.toLocaleDateString(loc, opts)} - ${end.toLocaleDateString(loc, opts)}`;
}

function getWeekId(weekOffset) {
  const start = getWeekStart(weekOffset);
  return `${start.getFullYear()}-W${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

const DEPT_COLORS = {
  management: '#F5C518',
  reception: '#4FC3F7',
  trainers: '#FF7043',
  cleaning: '#00C853',
  maintenance: '#FF9800',
  spa: '#B388FF',
  security: '#78909C',
};

export default function EmployeeShiftPlannerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [selectedWeek, setSelectedWeek] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const days = isAr
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const shifts = {
    morning: { label: isAr ? 'صباحي' : 'Morning', time: '6AM-2PM', color: '#FFD740', bg: 'rgba(255,215,64,0.1)' },
    evening: { label: isAr ? 'مسائي' : 'Evening', time: '2PM-10PM', color: '#4FC3F7', bg: 'rgba(79,195,247,0.1)' },
    off: { label: isAr ? 'إجازة' : 'Off', time: '', color: 'var(--pt-gray-600)', bg: 'rgba(255,255,255,0.02)' },
  };

  // Load employees from Firestore
  const loadEmployees = useCallback(async () => {
    if (!tenantId) return [];
    try {
      const { data } = await getTenantDocuments(tenantId, 'employees', [
        { field: 'status', operator: '==', value: 'active' },
      ]);
      return data || [];
    } catch (err) {
      console.error('Failed to load employees:', err);
      return [];
    }
  }, [tenantId]);

  // Load shift schedule for a specific week from Firestore
  const loadSchedule = useCallback(async (weekId, empList) => {
    if (!tenantId) return {};
    try {
      const { data } = await getTenantDocument(tenantId, 'shifts', weekId);
      if (data && data.schedule) {
        return data.schedule;
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
    // Return default schedule (all off) for employees if no saved data
    const defaultSchedule = {};
    empList.forEach(emp => {
      defaultSchedule[emp.id] = ['off', 'off', 'off', 'off', 'off', 'off', 'off'];
    });
    return defaultSchedule;
  }, [tenantId]);

  // Load data when tenantId or selectedWeek changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const empList = await loadEmployees();
      if (cancelled) return;
      setEmployees(empList);

      const weekId = getWeekId(selectedWeek);
      const sched = await loadSchedule(weekId, empList);
      if (cancelled) return;

      // Ensure all current employees have a schedule entry
      const mergedSchedule = { ...sched };
      empList.forEach(emp => {
        if (!mergedSchedule[emp.id]) {
          mergedSchedule[emp.id] = ['off', 'off', 'off', 'off', 'off', 'off', 'off'];
        }
      });
      setSchedule(mergedSchedule);
      setHasChanges(false);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [tenantId, selectedWeek, loadEmployees, loadSchedule]);

  const cycleShift = (empId, dayIndex) => {
    const current = schedule[empId]?.[dayIndex] || 'off';
    const next = current === 'morning' ? 'evening' : current === 'evening' ? 'off' : 'morning';
    setSchedule(prev => {
      const updated = { ...prev };
      updated[empId] = [...(updated[empId] || ['off', 'off', 'off', 'off', 'off', 'off', 'off'])];
      updated[empId][dayIndex] = next;
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const weekId = getWeekId(selectedWeek);
      await setTenantDocument(tenantId, 'shifts', weekId, {
        schedule,
        weekLabel: formatWeekRange(selectedWeek, 'en'),
        weekOffset: selectedWeek,
      });
      toast.success(isAr ? 'تم حفظ الجدول بنجاح' : 'Schedule saved successfully');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      toast.error(isAr ? 'فشل في حفظ الجدول' : 'Failed to save schedule');
    }
    setSaving(false);
  };

  const getEmpDisplayName = (emp) => {
    return emp.name?.[locale] || emp.name?.ar || emp.name?.en || '?';
  };

  const getEmpColor = (emp) => {
    return DEPT_COLORS[emp.department] || '#F5C518';
  };

  const getEmpRole = (emp) => {
    const deptMap = {
      management: isAr ? 'إدارة' : 'Management',
      reception: isAr ? 'استقبال' : 'Reception',
      trainers: isAr ? 'تدريب' : 'Training',
      cleaning: isAr ? 'نظافة' : 'Cleaning',
      maintenance: isAr ? 'صيانة' : 'Maintenance',
      spa: isAr ? 'سبا' : 'Spa',
      security: isAr ? 'أمن' : 'Security',
    };
    return emp.position || deptMap[emp.department] || (isAr ? 'موظف' : 'Staff');
  };

  const stats = employees.map(emp => {
    const s = schedule[emp.id] || ['off', 'off', 'off', 'off', 'off', 'off', 'off'];
    return {
      ...emp,
      displayName: getEmpDisplayName(emp),
      color: getEmpColor(emp),
      avatar: getEmpDisplayName(emp).charAt(0),
      role: getEmpRole(emp),
      mornings: s.filter(x => x === 'morning').length,
      evenings: s.filter(x => x === 'evening').length,
      offs: s.filter(x => x === 'off').length,
      totalHours: s.filter(x => x !== 'off').length * 8,
    };
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {isAr ? 'جدول شيفتات الموظفين' : 'Employee Shift Planner'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedWeek(selectedWeek - 1)}>←</button>
          <div style={{ textAlign: 'center', minWidth: 160 }}>
            <span style={{ fontWeight: 700, color: 'var(--pt-gold)', lineHeight: '32px', display: 'block' }}>
              {selectedWeek === 0
                ? (isAr ? 'الأسبوع الحالي' : 'Current Week')
                : selectedWeek > 0
                  ? (isAr ? 'الأسبوع القادم' : 'Next Week')
                  : (isAr ? 'الأسبوع السابق' : 'Previous Week')}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--pt-gray-500)' }} dir="ltr">
              {formatWeekRange(selectedWeek, locale)}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedWeek(selectedWeek + 1)}>→</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{ opacity: hasChanges ? 1 : 0.5 }}
          >
            {saving ? '⏳' : '💾'} {isAr ? 'حفظ' : 'Save'}
          </button>
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
              <th style={{ minWidth: 160 }}>{isAr ? 'الموظف' : 'Employee'}</th>
              {days.map((d, i) => (
                <th key={i} style={{ textAlign: 'center', minWidth: 80 }}>{d}</th>
              ))}
              <th style={{ textAlign: 'center' }}>{isAr ? 'ساعات' : 'Hours'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                  📭 {isAr ? 'لا يوجد موظفين. أضف موظفين أولاً من صفحة الموظفين.' : 'No employees found. Add employees first from the Employees page.'}
                </td>
              </tr>
            ) : (
              employees.map(emp => {
                const empName = getEmpDisplayName(emp);
                const empColor = getEmpColor(emp);
                const empRole = getEmpRole(emp);
                const empSchedule = schedule[emp.id] || ['off', 'off', 'off', 'off', 'off', 'off', 'off'];
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: `${empColor}20`, color: empColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                          {empName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{empName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{empRole}</div>
                        </div>
                      </div>
                    </td>
                    {empSchedule.map((shift, di) => {
                      const s = shifts[shift] || shifts.off;
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
                      {empSchedule.filter(x => x !== 'off').length * 8}h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Employee Stats */}
      {!loading && employees.length > 0 && (
        <>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'ملخص الأسبوع' : 'Weekly Summary'}</h3>
          <div className="grid grid-3" style={{ marginBottom: 'var(--space-4)' }}>
            {stats.map(emp => (
              <div key={emp.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: `${emp.color}20`, color: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{emp.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{emp.displayName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{emp.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(255,215,64,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, color: '#FFD740' }}>{emp.mornings}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{isAr ? 'صباحي' : 'AM'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(79,195,247,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, color: '#4FC3F7' }}>{emp.evenings}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{isAr ? 'مسائي' : 'PM'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800 }}>{emp.offs}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{isAr ? 'إجازة' : 'Off'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(245,197,24,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{emp.totalHours}h</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{isAr ? 'ساعات' : 'Hours'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
