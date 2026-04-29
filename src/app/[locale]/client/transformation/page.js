'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function BodyTransformationPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedPeriod, setSelectedPeriod] = useState(0);

  const timeline = [
    { date: '2025-12-01', label: locale === 'ar' ? 'البداية' : 'Start', weight: 105, bodyFat: 28, muscle: 38, chest: 106, waist: 100, arm: 35, thigh: 62 },
    { date: '2026-01-15', label: locale === 'ar' ? 'شهر 1.5' : 'Month 1.5', weight: 98, bodyFat: 24, muscle: 40, chest: 104, waist: 95, arm: 36, thigh: 60 },
    { date: '2026-03-01', label: locale === 'ar' ? 'شهر 3' : 'Month 3', weight: 92, bodyFat: 20, muscle: 42, chest: 102, waist: 88, arm: 37, thigh: 58 },
    { date: '2026-03-24', label: locale === 'ar' ? 'الآن' : 'Now', weight: 89, bodyFat: 18, muscle: 44, chest: 101, waist: 84, arm: 38, thigh: 57 },
  ];

  const first = timeline[0];
  const current = timeline[timeline.length - 1];

  const achievements = [
    { icon: '🔥', value: `-${first.weight - current.weight} kg`, label: locale === 'ar' ? 'خسرت من وزنك' : 'Weight Lost', color: '#FF5252' },
    { icon: '💪', value: `+${current.muscle - first.muscle} kg`, label: locale === 'ar' ? 'عضلات مكتسبة' : 'Muscle Gained', color: '#4FC3F7' },
    { icon: '📉', value: `-${first.bodyFat - current.bodyFat}%`, label: locale === 'ar' ? 'نسبة دهون' : 'Fat Lost', color: '#FFD740' },
    { icon: '📏', value: `-${first.waist - current.waist} cm`, label: locale === 'ar' ? 'محيط الوسط' : 'Waist Reduced', color: '#B388FF' },
  ];

  const measurements = [
    { key: 'weight', label: locale === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)', icon: '⚖️', good: 'down' },
    { key: 'bodyFat', label: locale === 'ar' ? 'دهون %' : 'Fat %', icon: '🔥', good: 'down' },
    { key: 'muscle', label: locale === 'ar' ? 'عضلات (كجم)' : 'Muscle (kg)', icon: '💪', good: 'up' },
    { key: 'chest', label: locale === 'ar' ? 'صدر (سم)' : 'Chest (cm)', icon: '📐', good: 'down' },
    { key: 'waist', label: locale === 'ar' ? 'وسط (سم)' : 'Waist (cm)', icon: '📏', good: 'down' },
    { key: 'arm', label: locale === 'ar' ? 'ذراع (سم)' : 'Arm (cm)', icon: '💪', good: 'up' },
    { key: 'thigh', label: locale === 'ar' ? 'فخذ (سم)' : 'Thigh (cm)', icon: '🦵', good: 'down' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔄</span> {locale === 'ar' ? 'رحلة التحول' : 'Body Transformation'}</h1>
      </div>

      {/* Achievement Summary */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {achievements.map((a, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${a.color}` }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{a.icon}</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: a.color }}>{a.value}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{a.label}</div>
          </div>
        ))}
      </div>

      {/* Before/After Comparison */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)' }}>📸 {locale === 'ar' ? 'مقارنة قبل وبعد' : 'Before & After'}</h3>
        <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', height: 250, background: 'linear-gradient(135deg, rgba(255,82,82,0.1), rgba(255,82,82,0.05))', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,82,82,0.2)' }}>
              <div style={{ fontSize: '4rem', opacity: 0.3 }}>📷</div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-2)' }}>📤 {locale === 'ar' ? 'رفع صورة "قبل"' : 'Upload "Before"'}</button>
            </div>
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>{first.weight}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>kg</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FF5252' }}>{first.bodyFat}%</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'دهون' : 'fat'}</div>
              </div>
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-600)', marginTop: '4px' }}>{first.date}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', height: 250, background: 'linear-gradient(135deg, rgba(0,200,83,0.1), rgba(0,200,83,0.05))', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(0,200,83,0.2)' }}>
              <div style={{ fontSize: '4rem', opacity: 0.3 }}>📷</div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-2)' }}>📤 {locale === 'ar' ? 'رفع صورة "بعد"' : 'Upload "After"'}</button>
            </div>
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-success)' }}>{current.weight}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>kg</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-success)' }}>{current.bodyFat}%</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'دهون' : 'fat'}</div>
              </div>
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-600)', marginTop: '4px' }}>{current.date}</div>
          </div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)' }}>📊 {locale === 'ar' ? 'مسار التقدم' : 'Progress Timeline'}</h3>
        {measurements.map(m => {
          const values = timeline.map(t => t[m.key]);
          const min = Math.min(...values) * 0.95;
          const max = Math.max(...values) * 1.05;
          const diff = values[values.length - 1] - values[0];
          const isGood = (m.good === 'down' && diff < 0) || (m.good === 'up' && diff > 0);

          return (
            <div key={m.key} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{m.icon} {m.label}</span>
                <span style={{ fontWeight: 700, color: isGood ? 'var(--pt-success)' : 'var(--pt-danger)', fontSize: 'var(--font-size-sm)' }}>
                  {diff > 0 ? '+' : ''}{diff} {isGood ? '✓' : '✗'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 40 }}>
                {values.map((v, i) => {
                  const h = ((v - min) / (max - min || 1)) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700 }}>{v}</span>
                      <div style={{ width: '100%', height: `${h}%`, minHeight: 4, background: i === values.length - 1 ? (isGood ? 'var(--pt-success)' : 'var(--pt-danger)') : 'rgba(245,197,24,0.25)', borderRadius: '2px 2px 0 0' }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                {timeline.map((t, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '8px', color: 'var(--pt-gray-600)' }}>{t.label}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Measurements Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 {locale === 'ar' ? 'جدول القياسات التفصيلي' : 'Detailed Measurements'}</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'القياس' : 'Measurement'}</th>
                {timeline.map((t, i) => <th key={i}>{t.label}</th>)}
                <th>{locale === 'ar' ? 'الفرق' : 'Change'}</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map(m => {
                const diff = timeline[timeline.length - 1][m.key] - timeline[0][m.key];
                const isGood = (m.good === 'down' && diff < 0) || (m.good === 'up' && diff > 0);
                return (
                  <tr key={m.key}>
                    <td style={{ fontWeight: 600 }}>{m.icon} {m.label}</td>
                    {timeline.map((t, i) => <td key={i}>{t[m.key]}</td>)}
                    <td style={{ fontWeight: 700, color: isGood ? 'var(--pt-success)' : 'var(--pt-danger)' }}>
                      {diff > 0 ? '+' : ''}{diff} {isGood ? '✓' : '✗'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
