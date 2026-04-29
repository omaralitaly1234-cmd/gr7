'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerProgressPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClient, setSelectedClient] = useState('c1');

  const clientsData = {
    c1: {
      name: 'أحمد محمد سعيد',
      goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss',
      measurements: [
        { date: '2026-01-15', weight: 105, bodyFat: 28, muscle: 38, chest: 110, waist: 105, arms: 36, thighs: 62 },
        { date: '2026-02-01', weight: 101, bodyFat: 26, muscle: 39, chest: 108, waist: 101, arms: 36.5, thighs: 61 },
        { date: '2026-02-15', weight: 98, bodyFat: 24, muscle: 40, chest: 106, waist: 98, arms: 37, thighs: 60 },
        { date: '2026-03-01', weight: 95, bodyFat: 22, muscle: 41, chest: 105, waist: 95, arms: 37.5, thighs: 59 },
        { date: '2026-03-15', weight: 92, bodyFat: 20, muscle: 42, chest: 104, waist: 92, arms: 38, thighs: 58 },
      ],
    },
    c2: {
      name: 'عمر حسام الدين',
      goal: locale === 'ar' ? 'تضخيم' : 'Bulking',
      measurements: [
        { date: '2026-01-15', weight: 68, bodyFat: 12, muscle: 35, chest: 92, waist: 76, arms: 32, thighs: 52 },
        { date: '2026-02-15', weight: 71, bodyFat: 13, muscle: 37, chest: 96, waist: 77, arms: 34, thighs: 54 },
        { date: '2026-03-15', weight: 75, bodyFat: 14, muscle: 39, chest: 100, waist: 78, arms: 36, thighs: 56 },
      ],
    },
  };

  const current = clientsData[selectedClient];
  const measurements = current.measurements;
  const first = measurements[0];
  const last = measurements[measurements.length - 1];

  const changes = {
    weight: last.weight - first.weight,
    bodyFat: last.bodyFat - first.bodyFat,
    muscle: last.muscle - first.muscle,
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {t('trainer.progress')}</h1>
        <select className="form-select" value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ width: 'auto' }}>
          {Object.entries(clientsData).map(([key, data]) => (
            <option key={key} value={key}>{data.name}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card" style={{ borderTop: `3px solid ${changes.weight <= 0 ? 'var(--pt-success)' : 'var(--pt-gold)'}` }}>
          <div className="stat-icon gold">⚖️</div>
          <div className="stat-info">
            <div className="stat-value">{last.weight} <span style={{ fontSize: 'var(--font-size-sm)' }}>kg</span></div>
            <div className="stat-label">{locale === 'ar' ? 'الوزن الحالي' : 'Current Weight'}</div>
            <span className={`stat-change ${changes.weight <= 0 ? 'up' : 'down'}`}>
              {changes.weight > 0 ? '+' : ''}{changes.weight} kg
            </span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #FF5252' }}>
          <div className="stat-icon danger">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{last.bodyFat}%</div>
            <div className="stat-label">{locale === 'ar' ? 'نسبة الدهون' : 'Body Fat'}</div>
            <span className={`stat-change ${changes.bodyFat <= 0 ? 'up' : 'down'}`}>
              {changes.bodyFat > 0 ? '+' : ''}{changes.bodyFat}%
            </span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #4FC3F7' }}>
          <div className="stat-icon info">💪</div>
          <div className="stat-info">
            <div className="stat-value">{last.muscle} <span style={{ fontSize: 'var(--font-size-sm)' }}>kg</span></div>
            <div className="stat-label">{locale === 'ar' ? 'الكتلة العضلية' : 'Muscle Mass'}</div>
            <span className={`stat-change ${changes.muscle >= 0 ? 'up' : 'down'}`}>
              +{changes.muscle} kg
            </span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--pt-gold)' }}>
          <div className="stat-icon gold">📅</div>
          <div className="stat-info">
            <div className="stat-value">{measurements.length}</div>
            <div className="stat-label">{locale === 'ar' ? 'عدد القياسات' : 'Measurements'}</div>
          </div>
        </div>
      </div>

      {/* Weight Chart (CSS-based) */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)' }}>📈 {locale === 'ar' ? 'تطور الوزن' : 'Weight Progress'}</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 200, padding: 'var(--space-4) 0' }}>
          {measurements.map((m, i) => {
            const minW = Math.min(...measurements.map(x => x.weight));
            const maxW = Math.max(...measurements.map(x => x.weight));
            const range = maxW - minW || 1;
            const heightPercent = ((m.weight - minW) / range) * 80 + 20;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700 }}>{m.weight}</span>
                <div style={{ width: '100%', maxWidth: 48, height: `${heightPercent}%`, background: i === measurements.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.3)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '10px', color: 'var(--pt-gray-600)', writingMode: 'horizontal-tb' }}>{m.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Measurements History Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h3>📋 {locale === 'ar' ? 'سجل القياسات' : 'Measurement Log'}</h3>
          <button className="btn btn-primary btn-sm">+ {locale === 'ar' ? 'قياس جديد' : 'New Measurement'}</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{locale === 'ar' ? 'الوزن' : 'Weight'} (kg)</th>
                <th>{locale === 'ar' ? 'دهون' : 'Fat'} %</th>
                <th>{locale === 'ar' ? 'عضلات' : 'Muscle'} (kg)</th>
                <th>{locale === 'ar' ? 'صدر' : 'Chest'} (cm)</th>
                <th>{locale === 'ar' ? 'وسط' : 'Waist'} (cm)</th>
                <th>{locale === 'ar' ? 'ذراع' : 'Arms'} (cm)</th>
                <th>{locale === 'ar' ? 'فخذ' : 'Thighs'} (cm)</th>
              </tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m, i) => {
                const prev = measurements[measurements.length - 1 - i - 1];
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{m.date}</td>
                    <td>
                      {m.weight}
                      {prev && <span style={{ fontSize: '10px', marginInlineStart: '4px', color: m.weight < prev.weight ? 'var(--pt-success)' : m.weight > prev.weight ? 'var(--pt-danger)' : 'var(--pt-gray-500)' }}>
                        {m.weight < prev.weight ? '▼' : m.weight > prev.weight ? '▲' : '—'}
                      </span>}
                    </td>
                    <td style={{ color: 'var(--pt-danger)' }}>{m.bodyFat}%</td>
                    <td style={{ color: '#4FC3F7' }}>{m.muscle}</td>
                    <td>{m.chest}</td>
                    <td>{m.waist}</td>
                    <td>{m.arms}</td>
                    <td>{m.thighs}</td>
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
