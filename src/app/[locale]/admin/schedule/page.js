'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

const DAYS = {
  ar: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  en: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

const DEFAULT_SCHEDULE = DAYS.ar.map((_, i) => ({
  day: i,
  isOpen: i !== 6,
  menOpen: '06:00', menClose: '14:00',
  womenOpen: '14:00', womenClose: '22:00',
}));

export default function SchedulePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocument(tenantId, 'config', 'schedule');
        if (data?.days) setSchedule(data.days);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      await updateTenantDocument(tenantId, 'config', 'schedule', { days: schedule });
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(t('common.error'));
    }
    setSaving(false);
  };

  const updateDay = (dayIndex, field, value) => {
    setSchedule(prev => prev.map((d, i) =>
      i === dayIndex ? { ...d, [field]: value } : d
    ));
  };

  const now = new Date();
  const currentDayIndex = (now.getDay() + 1) % 7; // Adjusting to Saturday=0
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const getCurrentSession = () => {
    const today = schedule[currentDayIndex];
    if (!today?.isOpen) return { type: 'closed', label: isAr ? 'مغلق' : 'Closed' };
    if (currentTime >= today.menOpen && currentTime < today.menClose) return { type: 'men', label: isAr ? 'فترة الرجال' : "Men's Session" };
    if (currentTime >= today.womenOpen && currentTime < today.womenClose) return { type: 'women', label: isAr ? 'فترة السيدات' : "Women's Session" };
    return { type: 'between', label: isAr ? 'بين الفترات' : 'Between Sessions' };
  };

  const session = getCurrentSession();

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {isAr ? 'مواعيد العمل' : 'Operating Hours'}</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⏳' : '💾'} {t('common.save')}
        </button>
      </div>

      {/* Current Session Badge */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>{isAr ? 'الفترة الحالية' : 'Current Session'}:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 4 }}>
            <span style={{
              width: 12, height: 12, borderRadius: 'var(--radius-full)',
              background: session.type === 'men' ? 'var(--pt-info)' : session.type === 'women' ? '#EC407A' : 'var(--pt-gray-600)',
              display: 'inline-block', animation: session.type !== 'closed' ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{session.label}</span>
          </div>
        </div>
        <div style={{ marginInlineStart: 'auto', textAlign: 'end' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)', fontFamily: 'var(--font-en)' }}>{currentTime}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>{DAYS[locale][currentDayIndex]}</div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{isAr ? 'اليوم' : 'Day'}</th>
              <th>{isAr ? 'الحالة' : 'Status'}</th>
              <th style={{ color: 'var(--pt-info)' }}>♂️ {isAr ? 'فترة الرجال' : "Men's"}</th>
              <th style={{ color: '#EC407A' }}>♀️ {isAr ? 'فترة السيدات' : "Women's"}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((day, i) => (
              <tr key={i} style={{
                background: i === currentDayIndex ? 'rgba(245,197,24,0.05)' : undefined,
                borderInlineStart: i === currentDayIndex ? '3px solid var(--pt-gold)' : undefined,
              }}>
                <td style={{ fontWeight: i === currentDayIndex ? 800 : 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {i === currentDayIndex && <span style={{ color: 'var(--pt-gold)' }}>●</span>}
                  {DAYS[locale][i]}
                </td>
                <td>
                  <button onClick={() => updateDay(i, 'isOpen', !day.isOpen)} style={{
                    padding: '4px 14px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                    background: day.isOpen ? 'rgba(0,200,83,0.15)' : 'rgba(255,23,68,0.15)',
                    color: day.isOpen ? 'var(--pt-success)' : 'var(--pt-danger)', fontWeight: 700, fontSize: 'var(--font-size-xs)',
                  }}>
                    {day.isOpen ? (isAr ? 'مفتوح' : 'Open') : (isAr ? 'عطلة' : 'Closed')}
                  </button>
                </td>
                <td>
                  {day.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input type="time" className="form-input" dir="ltr" value={day.menOpen} onChange={e => updateDay(i, 'menOpen', e.target.value)} style={{ width: 110, padding: '4px 8px', fontSize: '12px' }} />
                      <span style={{ color: 'var(--pt-gray-500)' }}>→</span>
                      <input type="time" className="form-input" dir="ltr" value={day.menClose} onChange={e => updateDay(i, 'menClose', e.target.value)} style={{ width: 110, padding: '4px 8px', fontSize: '12px' }} />
                    </div>
                  ) : <span style={{ color: 'var(--pt-gray-600)' }}>—</span>}
                </td>
                <td>
                  {day.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input type="time" className="form-input" dir="ltr" value={day.womenOpen} onChange={e => updateDay(i, 'womenOpen', e.target.value)} style={{ width: 110, padding: '4px 8px', fontSize: '12px' }} />
                      <span style={{ color: 'var(--pt-gray-500)' }}>→</span>
                      <input type="time" className="form-input" dir="ltr" value={day.womenClose} onChange={e => updateDay(i, 'womenClose', e.target.value)} style={{ width: 110, padding: '4px 8px', fontSize: '12px' }} />
                    </div>
                  ) : <span style={{ color: 'var(--pt-gray-600)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
