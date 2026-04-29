'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientAssessmentPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClient, setSelectedClient] = useState(0);

  const clients = [
    { name: 'أحمد محمد سعيد', age: 28, goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss' },
    { name: 'عمر حسام الدين', age: 24, goal: locale === 'ar' ? 'تضخيم' : 'Bulking' },
    { name: 'نور أحمد', age: 32, goal: locale === 'ar' ? 'لياقة عامة' : 'General Fitness' },
  ];

  const assessments = [
    {
      date: '2026-03-24', weight: 82, bodyFat: 18, muscleMass: 38,
      measurements: { chest: 104, waist: 82, hips: 98, bicepR: 36, bicepL: 35, thighR: 58, thighL: 57, calf: 38, shoulders: 118 },
      fitness: { pushups: 30, situps: 40, plank: 90, squat1rm: 120, bench1rm: 85, deadlift1rm: 140, flexibility: locale === 'ar' ? 'متوسط' : 'Average', cardio: locale === 'ar' ? '12 دقيقة (1.5 ميل)' : '12 min (1.5 mile)' },
      notes: locale === 'ar' ? 'تحسن ملحوظ في القوة. يحتاج عمل أكثر على الكارديو.' : 'Noticeable strength improvement. Needs more cardio work.',
    },
    {
      date: '2026-02-24', weight: 85, bodyFat: 21, muscleMass: 36,
      measurements: { chest: 102, waist: 86, hips: 100, bicepR: 34, bicepL: 34, thighR: 57, thighL: 56, calf: 37, shoulders: 116 },
      fitness: { pushups: 22, situps: 30, plank: 60, squat1rm: 100, bench1rm: 75, deadlift1rm: 120, flexibility: locale === 'ar' ? 'ضعيف' : 'Poor', cardio: locale === 'ar' ? '14 دقيقة (1.5 ميل)' : '14 min (1.5 mile)' },
      notes: locale === 'ar' ? 'بداية جيدة. التزام بالبرنامج الغذائي مطلوب.' : 'Good start. Diet compliance needed.',
    },
  ];

  const current = assessments[0];
  const previous = assessments[1];
  const diff = (curr, prev) => {
    const d = curr - prev;
    return d > 0 ? { val: `+${d}`, color: '#00C853', arrow: '↑' } : d < 0 ? { val: `${d}`, color: '#FF5252', arrow: '↓' } : { val: '0', color: 'var(--pt-gray-500)', arrow: '→' };
  };

  const BodyStat = ({ label, current: c, prev, unit, inverse }) => {
    const d = diff(c, prev);
    const isGood = inverse ? c < prev : c > prev;
    return (
      <div style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{c}<span style={{ fontSize: '12px', fontWeight: 400 }}>{unit}</span></div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: isGood ? '#00C853' : c === prev ? 'var(--pt-gray-500)' : '#FF5252' }}>
          {d.arrow} {d.val}{unit}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {locale === 'ar' ? 'تقييم جسمي شامل' : 'Body Assessment'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select className="form-select" style={{ maxWidth: 200 }} value={selectedClient} onChange={e => setSelectedClient(Number(e.target.value))}>
            {clients.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm">+ {locale === 'ar' ? 'تقييم جديد' : 'New Assessment'}</button>
        </div>
      </div>

      {/* Client Info */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderInlineStart: '4px solid var(--pt-gold)' }}>
        <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold-glow)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
          {clients[selectedClient].name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h3>{clients[selectedClient].name}</h3>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
            🎯 {clients[selectedClient].goal} &nbsp; 📅 {locale === 'ar' ? 'آخر تقييم' : 'Last Assessment'}: {current.date}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span className="badge badge-gold">{locale === 'ar' ? 'تقييمان' : '2 Assessments'}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <BodyStat label={locale === 'ar' ? 'الوزن' : 'Weight'} current={current.weight} prev={previous.weight} unit="kg" inverse />
        <BodyStat label={locale === 'ar' ? 'نسبة الدهون' : 'Body Fat'} current={current.bodyFat} prev={previous.bodyFat} unit="%" inverse />
        <BodyStat label={locale === 'ar' ? 'كتلة عضلية' : 'Muscle Mass'} current={current.muscleMass} prev={previous.muscleMass} unit="kg" />
        <div style={{ padding: 'var(--space-3)', background: 'var(--pt-dark)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: '4px' }}>BMI</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: current.weight / (1.78*1.78) < 25 ? '#00C853' : '#FFD740' }}>
            {(current.weight / (1.78*1.78)).toFixed(1)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--pt-gray-500)' }}>{current.weight / (1.78*1.78) < 25 ? (locale === 'ar' ? 'طبيعي' : 'Normal') : (locale === 'ar' ? 'زيادة' : 'Overweight')}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Body Measurements */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📐 {locale === 'ar' ? 'القياسات الجسمية (سم)' : 'Body Measurements (cm)'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {Object.entries({
              [locale === 'ar' ? 'الأكتاف' : 'Shoulders']: [current.measurements.shoulders, previous.measurements.shoulders],
              [locale === 'ar' ? 'الصدر' : 'Chest']: [current.measurements.chest, previous.measurements.chest],
              [locale === 'ar' ? 'الخصر' : 'Waist']: [current.measurements.waist, previous.measurements.waist],
              [locale === 'ar' ? 'الأرداف' : 'Hips']: [current.measurements.hips, previous.measurements.hips],
              [locale === 'ar' ? 'بايسبس يمين' : 'Bicep R']: [current.measurements.bicepR, previous.measurements.bicepR],
              [locale === 'ar' ? 'بايسبس شمال' : 'Bicep L']: [current.measurements.bicepL, previous.measurements.bicepL],
              [locale === 'ar' ? 'فخذ يمين' : 'Thigh R']: [current.measurements.thighR, previous.measurements.thighR],
              [locale === 'ar' ? 'فخذ شمال' : 'Thigh L']: [current.measurements.thighL, previous.measurements.thighL],
              [locale === 'ar' ? 'سمانة' : 'Calf']: [current.measurements.calf, previous.measurements.calf],
            }).map(([label, [curr, prev]], i) => {
              const d = curr - prev;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                  <span style={{ color: 'var(--pt-gray-400)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700 }}>{curr}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: d > 0 ? '#00C853' : d < 0 ? '#FF5252' : 'var(--pt-gray-600)' }}>
                      {d > 0 ? `+${d}` : d === 0 ? '—' : d}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fitness Tests */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🏋️ {locale === 'ar' ? 'اختبارات اللياقة' : 'Fitness Tests'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[
              { label: locale === 'ar' ? 'ضغط (عدات)' : 'Push-ups', curr: current.fitness.pushups, prev: previous.fitness.pushups },
              { label: locale === 'ar' ? 'بطن (عدات)' : 'Sit-ups', curr: current.fitness.situps, prev: previous.fitness.situps },
              { label: locale === 'ar' ? 'بلانك (ثانية)' : 'Plank (sec)', curr: current.fitness.plank, prev: previous.fitness.plank },
              { label: locale === 'ar' ? 'سكوات 1RM' : 'Squat 1RM', curr: current.fitness.squat1rm, prev: previous.fitness.squat1rm },
              { label: locale === 'ar' ? 'بنش 1RM' : 'Bench 1RM', curr: current.fitness.bench1rm, prev: previous.fitness.bench1rm },
              { label: locale === 'ar' ? 'ديدليفت 1RM' : 'Deadlift 1RM', curr: current.fitness.deadlift1rm, prev: previous.fitness.deadlift1rm },
            ].map((test, i) => {
              const d = test.curr - test.prev;
              const pct = (test.curr / (test.label.includes('1RM') || test.label.includes('RM') ? 200 : test.label.includes('Plank') || test.label.includes('بلانك') ? 180 : 60)) * 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '3px' }}>
                    <span>{test.label}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontWeight: 700 }}>{test.curr}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: d > 0 ? '#00C853' : 'var(--pt-gray-500)' }}>{d > 0 ? `+${d}` : '—'}</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct >= 70 ? '#00C853' : pct >= 40 ? 'var(--pt-gold)' : '#FF5252', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <div style={{ padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'المرونة' : 'Flexibility'}</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{current.fitness.flexibility}</div>
            </div>
            <div style={{ padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'تحمل كارديو' : 'Cardio'}</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{current.fitness.cardio}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trainer Notes */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-3)' }}>📝 {locale === 'ar' ? 'ملاحظات المدرب' : 'Trainer Notes'}</h3>
        <p style={{ color: 'var(--pt-gray-400)', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderInlineStart: '3px solid var(--pt-gold)' }}>{current.notes}</p>
      </div>
    </div>
  );
}
