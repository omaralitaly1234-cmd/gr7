'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientMeasurementsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [showAddModal, setShowAddModal] = useState(false);

  const measurements = [
    { date: '2026-03-22', weight: 92, chest: 102, waist: 84, hips: 100, arms: 37, thighs: 60, shoulders: 118, bodyFat: 20 },
    { date: '2026-02-22', weight: 96, chest: 104, waist: 88, hips: 102, arms: 36, thighs: 61, shoulders: 117, bodyFat: 23 },
    { date: '2026-01-22', weight: 100, chest: 106, waist: 92, hips: 105, arms: 35, thighs: 62, shoulders: 116, bodyFat: 25 },
    { date: '2025-12-15', weight: 105, chest: 108, waist: 96, hips: 108, arms: 34, thighs: 63, shoulders: 115, bodyFat: 28 },
  ];

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];

  const bodyParts = [
    { key: 'chest', label: locale === 'ar' ? 'الصدر' : 'Chest', icon: '🫁', color: '#FF5252' },
    { key: 'waist', label: locale === 'ar' ? 'الخصر' : 'Waist', icon: '📏', color: '#4FC3F7', lowerBetter: true },
    { key: 'hips', label: locale === 'ar' ? 'الأرداف' : 'Hips', icon: '🍑', color: '#FFD740', lowerBetter: true },
    { key: 'arms', label: locale === 'ar' ? 'الذراع' : 'Arms', icon: '💪', color: '#00C853' },
    { key: 'thighs', label: locale === 'ar' ? 'الفخذ' : 'Thighs', icon: '🦵', color: '#7C4DFF' },
    { key: 'shoulders', label: locale === 'ar' ? 'الأكتاف' : 'Shoulders', icon: '🏋️', color: '#FF9100' },
  ];

  const calcTarget = (start, current, lowerBetter) => {
    const d = current - start;
    const good = lowerBetter ? d < 0 : d > 0;
    return { delta: d, good };
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📐</span> {locale === 'ar' ? 'قياسات الجسم' : 'Body Measurements'}</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ {locale === 'ar' ? 'تسجيل قياس' : 'New Entry'}</button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: latest.weight, l: locale === 'ar' ? 'الوزن (kg)' : 'Weight (kg)', d: latest.weight - oldest.weight, lb: true, icon: '⚖️' },
          { v: latest.bodyFat + '%', l: locale === 'ar' ? 'نسبة الدهون' : 'Body Fat %', d: latest.bodyFat - oldest.bodyFat, lb: true, icon: '🔥' },
          { v: latest.waist, l: locale === 'ar' ? 'الخصر (cm)' : 'Waist (cm)', d: latest.waist - oldest.waist, lb: true, icon: '📏' },
          { v: latest.arms, l: locale === 'ar' ? 'الذراع (cm)' : 'Arms (cm)', d: latest.arms - oldest.arms, lb: false, icon: '💪' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.v}</div>
              <div className="stat-label">{s.l}</div>
              <span className={`stat-change ${(s.lb ? s.d < 0 : s.d > 0) ? 'up' : 'down'}`} style={{ color: (s.lb ? s.d < 0 : s.d > 0) ? 'var(--pt-success)' : 'var(--pt-danger)' }}>
                {s.d > 0 ? '+' : ''}{s.d} {locale === 'ar' ? 'منذ البداية' : 'since start'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Body Parts Progress */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📐 {locale === 'ar' ? 'تطور القياسات' : 'Measurement Progress'}</h3>
          {bodyParts.map((bp, i) => {
            const { delta, good } = calcTarget(oldest[bp.key], latest[bp.key], bp.lowerBetter);
            return (
              <div key={i} style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: `3px solid ${bp.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>{bp.icon} {bp.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 800 }}>{latest[bp.key]} cm</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: good ? 'var(--pt-success)' : 'var(--pt-danger)' }}>
                      ({delta > 0 ? '+' : ''}{delta})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Body Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🧍 {locale === 'ar' ? 'خريطة الجسم' : 'Body Map'}</h3>
          <div style={{ position: 'relative', width: 180, height: 280 }}>
            {/* Simplified body silhouette using CSS */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,197,24,0.1)', border: '2px solid var(--pt-gold)', margin: '0 auto', position: 'absolute', top: 0, left: 70 }} />
            <div style={{ width: 80, height: 90, borderRadius: '10px 10px 0 0', background: 'rgba(245,197,24,0.06)', border: '2px solid rgba(245,197,24,0.3)', margin: '0 auto', position: 'absolute', top: 44, left: 50 }} />
            <div style={{ width: 30, height: 70, borderRadius: '6px', background: 'rgba(245,197,24,0.04)', border: '1px solid rgba(245,197,24,0.2)', position: 'absolute', top: 44, left: 14 }} />
            <div style={{ width: 30, height: 70, borderRadius: '6px', background: 'rgba(245,197,24,0.04)', border: '1px solid rgba(245,197,24,0.2)', position: 'absolute', top: 44, right: 14 }} />
            <div style={{ width: 35, height: 90, borderRadius: '6px', background: 'rgba(245,197,24,0.04)', border: '1px solid rgba(245,197,24,0.2)', position: 'absolute', bottom: 0, left: 46 }} />
            <div style={{ width: 35, height: 90, borderRadius: '6px', background: 'rgba(245,197,24,0.04)', border: '1px solid rgba(245,197,24,0.2)', position: 'absolute', bottom: 0, right: 46 }} />

            {/* Labels */}
            <div style={{ position: 'absolute', top: 50, right: -40, fontSize: '9px', color: '#FF9100', fontWeight: 700 }}>{latest.shoulders}</div>
            <div style={{ position: 'absolute', top: 65, left: -30, fontSize: '9px', color: '#FF5252', fontWeight: 700 }}>{latest.chest}</div>
            <div style={{ position: 'absolute', top: 55, right: -30, fontSize: '9px', color: '#00C853', fontWeight: 700 }}>{latest.arms}</div>
            <div style={{ position: 'absolute', top: 115, left: -30, fontSize: '9px', color: '#4FC3F7', fontWeight: 700 }}>{latest.waist}</div>
            <div style={{ position: 'absolute', top: 140, right: -30, fontSize: '9px', color: '#FFD740', fontWeight: 700 }}>{latest.hips}</div>
            <div style={{ position: 'absolute', bottom: 40, left: -20, fontSize: '9px', color: '#7C4DFF', fontWeight: 700 }}>{latest.thighs}</div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginTop: 'var(--space-3)' }}>
            📅 {locale === 'ar' ? 'آخر قياس' : 'Last measurement'}: {latest.date}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'سجل القياسات' : 'Measurement History'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
              <th style={{ textAlign: 'center' }}>⚖️ {locale === 'ar' ? 'وزن' : 'Wt'}</th>
              <th style={{ textAlign: 'center' }}>🫁 {locale === 'ar' ? 'صدر' : 'Chest'}</th>
              <th style={{ textAlign: 'center' }}>📏 {locale === 'ar' ? 'خصر' : 'Waist'}</th>
              <th style={{ textAlign: 'center' }}>🍑 {locale === 'ar' ? 'أرداف' : 'Hips'}</th>
              <th style={{ textAlign: 'center' }}>💪 {locale === 'ar' ? 'ذراع' : 'Arms'}</th>
              <th style={{ textAlign: 'center' }}>🦵 {locale === 'ar' ? 'فخذ' : 'Thighs'}</th>
              <th style={{ textAlign: 'center' }}>🔥 {locale === 'ar' ? 'دهون' : 'Fat%'}</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m, i) => (
              <tr key={i} style={{ opacity: i === 0 ? 1 : 0.7 }}>
                <td style={{ fontWeight: i === 0 ? 700 : 400 }}>{m.date}</td>
                <td style={{ textAlign: 'center' }}>{m.weight} kg</td>
                <td style={{ textAlign: 'center' }}>{m.chest}</td>
                <td style={{ textAlign: 'center' }}>{m.waist}</td>
                <td style={{ textAlign: 'center' }}>{m.hips}</td>
                <td style={{ textAlign: 'center' }}>{m.arms}</td>
                <td style={{ textAlign: 'center' }}>{m.thighs}</td>
                <td style={{ textAlign: 'center' }}>{m.bodyFat}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Measurement Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>📐 {locale === 'ar' ? 'تسجيل قياس جديد' : 'New Measurement'}</h2>
            <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'التاريخ' : 'Date'}</label>
                <input className="form-input" type="date" dir="ltr" />
              </div>
              <div className="form-group">
                <label className="form-label">⚖️ {locale === 'ar' ? 'الوزن (kg)' : 'Weight (kg)'}</label>
                <input className="form-input" type="number" dir="ltr" step="0.1" />
              </div>
              {bodyParts.map((bp, i) => (
                <div key={i} className="form-group">
                  <label className="form-label">{bp.icon} {bp.label} (cm)</label>
                  <input className="form-input" type="number" dir="ltr" step="0.5" />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">🔥 {locale === 'ar' ? 'نسبة الدهون' : 'Body Fat %'}</label>
                <input className="form-input" type="number" dir="ltr" step="0.1" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                <textarea className="form-input" rows={2} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(false)}>✓ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
