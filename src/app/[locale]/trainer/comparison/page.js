'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerComparisonPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClients, setSelectedClients] = useState([0, 1]);

  const clients = [
    {
      name: 'أحمد محمد سعيد', avatar: 'أ', goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss',
      startDate: '2025-12-15', months: 3,
      start: { weight: 105, fat: 28, muscle: 38, bmi: 33.1 },
      current: { weight: 92, fat: 20, muscle: 42, bmi: 29.0 },
      attendance: { total: 52, thisMonth: 18, avg: 4.3, streak: 6 },
      adherence: 92, satisfaction: 4.8,
    },
    {
      name: 'عمر حسام الدين', avatar: 'ع', goal: locale === 'ar' ? 'تضخيم' : 'Bulking',
      startDate: '2026-01-10', months: 2.5,
      start: { weight: 68, fat: 12, muscle: 30, bmi: 22.1 },
      current: { weight: 75, fat: 13, muscle: 35, bmi: 24.4 },
      attendance: { total: 38, thisMonth: 14, avg: 3.8, streak: 8 },
      adherence: 85, satisfaction: 4.5,
    },
    {
      name: 'سارة علي حسن', avatar: 'س', goal: locale === 'ar' ? 'تنشيف' : 'Cutting',
      startDate: '2025-11-01', months: 5,
      start: { weight: 78, fat: 32, muscle: 28, bmi: 29.3 },
      current: { weight: 65, fat: 22, muscle: 30, bmi: 24.4 },
      attendance: { total: 80, thisMonth: 20, avg: 4.0, streak: 20 },
      adherence: 95, satisfaction: 5.0,
    },
    {
      name: 'نور أحمد', avatar: 'ن', goal: locale === 'ar' ? 'لياقة عامة' : 'General Fitness',
      startDate: '2026-02-01', months: 2,
      start: { weight: 88, fat: 25, muscle: 34, bmi: 28.5 },
      current: { weight: 84, fat: 22, muscle: 36, bmi: 27.2 },
      attendance: { total: 24, thisMonth: 10, avg: 3.0, streak: 3 },
      adherence: 70, satisfaction: 4.2,
    },
  ];

  const c1 = clients[selectedClients[0]];
  const c2 = clients[selectedClients[1]];

  const compareMetrics = (label, v1, v2, unit = '', lowerBetter = false) => {
    const better1 = lowerBetter ? v1 < v2 : v1 > v2;
    const better2 = lowerBetter ? v2 < v1 : v2 > v1;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ textAlign: 'center', fontWeight: 700, color: better1 ? 'var(--pt-success)' : 'var(--pt-gray-400)' }}>
          {v1}{unit} {better1 && '✓'}
        </div>
        <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', minWidth: 100 }}>{label}</div>
        <div style={{ textAlign: 'center', fontWeight: 700, color: better2 ? 'var(--pt-success)' : 'var(--pt-gray-400)' }}>
          {v2}{unit} {better2 && '✓'}
        </div>
      </div>
    );
  };

  const deltaDisplay = (start, current, lowerBetter = false) => {
    const d = current - start;
    const isGood = lowerBetter ? d < 0 : d > 0;
    return (
      <span style={{ fontSize: '10px', fontWeight: 700, color: isGood ? 'var(--pt-success)' : 'var(--pt-danger)' }}>
        {d > 0 ? '+' : ''}{d}
      </span>
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {locale === 'ar' ? 'مقارنة العملاء' : 'Client Comparison'}</h1>
      </div>

      {/* Client Selectors */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)', gap: 'var(--space-4)' }}>
        {[0, 1].map(idx => (
          <div key={idx} className="card" style={{ borderTop: `3px solid ${idx === 0 ? 'var(--pt-gold)' : '#4FC3F7'}` }}>
            <select className="form-select" value={selectedClients[idx]} onChange={e => {
              const newSel = [...selectedClients];
              newSel[idx] = parseInt(e.target.value);
              setSelectedClients(newSel);
            }} style={{ marginBottom: 'var(--space-3)' }}>
              {clients.map((c, i) => <option key={i} value={i}>{c.name} — {c.goal}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: idx === 0 ? 'rgba(245,197,24,0.15)' : 'rgba(79,195,247,0.15)', color: idx === 0 ? 'var(--pt-gold)' : '#4FC3F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem', flexShrink: 0 }}>
                {clients[selectedClients[idx]].avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{clients[selectedClients[idx]].name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                  🎯 {clients[selectedClients[idx]].goal} • 📅 {clients[selectedClients[idx]].months} {locale === 'ar' ? 'شهور' : 'months'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Body Comparison */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', textAlign: 'center' }}>
          📏 {locale === 'ar' ? 'مقارنة التحول الجسدي' : 'Body Transformation Comparison'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ textAlign: 'center', fontWeight: 800, color: 'var(--pt-gold)' }}>{c1.name.split(' ')[0]}</div>
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>⚔️</div>
          <div style={{ textAlign: 'center', fontWeight: 800, color: '#4FC3F7' }}>{c2.name.split(' ')[0]}</div>
        </div>

        {compareMetrics(locale === 'ar' ? 'الوزن الحالي (kg)' : 'Current Weight', c1.current.weight, c2.current.weight, ' kg')}
        {compareMetrics(locale === 'ar' ? 'خسارة/زيادة وزن' : 'Weight Change', Math.abs(c1.current.weight - c1.start.weight), Math.abs(c2.current.weight - c2.start.weight), ' kg')}
        {compareMetrics(locale === 'ar' ? 'نسبة الدهون' : 'Body Fat', c1.current.fat, c2.current.fat, '%', true)}
        {compareMetrics(locale === 'ar' ? 'تغيير الدهون' : 'Fat Change', Math.abs(c1.start.fat - c1.current.fat), Math.abs(c2.start.fat - c2.current.fat), '%')}
        {compareMetrics(locale === 'ar' ? 'كتلة عضلية' : 'Muscle Mass', c1.current.muscle, c2.current.muscle, ' kg')}
        {compareMetrics(locale === 'ar' ? 'زيادة عضلية' : 'Muscle Gained', c1.current.muscle - c1.start.muscle, c2.current.muscle - c2.start.muscle, ' kg')}
        {compareMetrics('BMI', c1.current.bmi, c2.current.bmi, '', true)}
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'الالتزام والحضور' : 'Adherence & Attendance'}</h3>
          {[c1, c2].map((c, idx) => (
            <div key={idx} style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: `3px solid ${idx === 0 ? 'var(--pt-gold)' : '#4FC3F7'}` }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>{c.name.split(' ').slice(0, 2).join(' ')}</div>
              <div className="grid grid-4" style={{ gap: 'var(--space-2)' }}>
                {[
                  { l: locale === 'ar' ? 'إجمالي' : 'Total', v: c.attendance.total },
                  { l: locale === 'ar' ? 'الشهر' : 'Month', v: c.attendance.thisMonth },
                  { l: locale === 'ar' ? 'متوسط' : 'Avg/w', v: c.attendance.avg },
                  { l: '🔥 Streak', v: c.attendance.streak },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>{s.v}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🏆 {locale === 'ar' ? 'معدلات النجاح' : 'Success Rates'}</h3>
          {[c1, c2].map((c, idx) => (
            <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span>{c.name.split(' ').slice(0, 2).join(' ')}</span>
                <span style={{ fontWeight: 700, color: c.adherence >= 90 ? 'var(--pt-success)' : 'var(--pt-gold)' }}>{c.adherence}%</span>
              </div>
              <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden', marginBottom: '2px' }}>
                <div style={{ width: `${c.adherence}%`, height: '100%', background: idx === 0 ? 'var(--pt-gold)' : '#4FC3F7', borderRadius: 'var(--radius-full)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: 'var(--space-2)' }}>
                <span>⭐ {c.satisfaction}/5</span>
                <span>📅 {c.months} {locale === 'ar' ? 'شهور' : 'months'}</span>
              </div>
            </div>
          ))}

          {/* Winner */}
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(245,197,24,0.06)', borderRadius: 'var(--radius-md)', textAlign: 'center', borderTop: '2px solid var(--pt-gold)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏅</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)' }}>
              {c1.adherence >= c2.adherence ? c1.name.split(' ').slice(0, 2).join(' ') : c2.name.split(' ').slice(0, 2).join(' ')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'أعلى التزام هذا الشهر' : 'Highest adherence this month'}</div>
          </div>
        </div>
      </div>

      {/* Transformation Timeline */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>⚖️ {locale === 'ar' ? 'ملخص التحول' : 'Transformation Summary'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'المقياس' : 'Metric'}</th>
              <th style={{ textAlign: 'center', color: 'var(--pt-gold)' }}>{c1.name.split(' ')[0]} ({locale === 'ar' ? 'بداية' : 'Start'})</th>
              <th style={{ textAlign: 'center', color: 'var(--pt-gold)' }}>{c1.name.split(' ')[0]} ({locale === 'ar' ? 'حالي' : 'Now'})</th>
              <th style={{ textAlign: 'center', color: 'var(--pt-gold)' }}>Δ</th>
              <th style={{ textAlign: 'center', color: '#4FC3F7' }}>{c2.name.split(' ')[0]} ({locale === 'ar' ? 'بداية' : 'Start'})</th>
              <th style={{ textAlign: 'center', color: '#4FC3F7' }}>{c2.name.split(' ')[0]} ({locale === 'ar' ? 'حالي' : 'Now'})</th>
              <th style={{ textAlign: 'center', color: '#4FC3F7' }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {[
              { l: locale === 'ar' ? 'الوزن' : 'Weight', k: 'weight', u: ' kg', lb: true },
              { l: locale === 'ar' ? 'الدهون' : 'Fat', k: 'fat', u: '%', lb: true },
              { l: locale === 'ar' ? 'العضلات' : 'Muscle', k: 'muscle', u: ' kg', lb: false },
              { l: 'BMI', k: 'bmi', u: '', lb: true },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.l}</td>
                <td style={{ textAlign: 'center' }}>{c1.start[row.k]}{row.u}</td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{c1.current[row.k]}{row.u}</td>
                <td style={{ textAlign: 'center' }}>{deltaDisplay(c1.start[row.k], c1.current[row.k], row.lb)}</td>
                <td style={{ textAlign: 'center' }}>{c2.start[row.k]}{row.u}</td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{c2.current[row.k]}{row.u}</td>
                <td style={{ textAlign: 'center' }}>{deltaDisplay(c2.start[row.k], c2.current[row.k], row.lb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
