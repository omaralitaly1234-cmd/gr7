'use client';

import React from 'react';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function WorkoutLogPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedDay, setSelectedDay] = useState(0);

  const days = [
    { name: locale === 'ar' ? 'السبت' : 'Sat', date: '22/3', muscles: locale === 'ar' ? 'صدر + ترايسبس' : 'Chest + Triceps', icon: '💪', done: true },
    { name: locale === 'ar' ? 'الأحد' : 'Sun', date: '23/3', muscles: locale === 'ar' ? 'ظهر + بايسبس' : 'Back + Biceps', icon: '🏋️', done: true },
    { name: locale === 'ar' ? 'الاثنين' : 'Mon', date: '24/3', muscles: locale === 'ar' ? 'أرجل' : 'Legs', icon: '🦵', done: false },
    { name: locale === 'ar' ? 'الثلاثاء' : 'Tue', date: '25/3', muscles: locale === 'ar' ? 'كتف + ترابيس' : 'Shoulders + Traps', icon: '🔥', done: false },
    { name: locale === 'ar' ? 'الأربعاء' : 'Wed', date: '26/3', muscles: locale === 'ar' ? 'ذراع كامل' : 'Full Arms', icon: '💪', done: false },
    { name: locale === 'ar' ? 'الخميس' : 'Thu', date: '27/3', muscles: locale === 'ar' ? 'كارديو + بطن' : 'Cardio + Abs', icon: '🏃', done: false },
  ];

  const [workouts, setWorkouts] = useState([
    [
      { exercise: locale === 'ar' ? 'بنش بريس بار' : 'Barbell Bench Press', sets: [{ weight: 60, reps: 12, done: true },{ weight: 70, reps: 10, done: true },{ weight: 80, reps: 8, done: true },{ weight: 80, reps: 6, done: true }], rest: '90s', muscle: locale === 'ar' ? 'صدر' : 'Chest' },
      { exercise: locale === 'ar' ? 'بنش دمبل مائل' : 'Incline DB Press', sets: [{ weight: 24, reps: 12, done: true },{ weight: 28, reps: 10, done: true },{ weight: 30, reps: 8, done: true }], rest: '75s', muscle: locale === 'ar' ? 'صدر علوي' : 'Upper Chest' },
      { exercise: locale === 'ar' ? 'فلاي كيبل' : 'Cable Fly', sets: [{ weight: 15, reps: 15, done: true },{ weight: 17.5, reps: 12, done: true },{ weight: 20, reps: 10, done: true }], rest: '60s', muscle: locale === 'ar' ? 'صدر (عزل)' : 'Chest (Iso)' },
      { exercise: locale === 'ar' ? 'دبس متوازي' : 'Parallel Dips', sets: [{ weight: 0, reps: 15, done: true },{ weight: 10, reps: 12, done: false },{ weight: 10, reps: 10, done: false }], rest: '90s', muscle: locale === 'ar' ? 'صدر + ترايسبس' : 'Chest + Triceps' },
      { exercise: locale === 'ar' ? 'تراي كيبل' : 'Tricep Pushdown', sets: [{ weight: 25, reps: 15, done: false },{ weight: 30, reps: 12, done: false },{ weight: 35, reps: 10, done: false }], rest: '60s', muscle: locale === 'ar' ? 'ترايسبس' : 'Triceps' },
    ],
    [
      { exercise: locale === 'ar' ? 'ديد ليفت' : 'Deadlift', sets: [{ weight: 80, reps: 10, done: true },{ weight: 100, reps: 8, done: true },{ weight: 110, reps: 6, done: true },{ weight: 120, reps: 4, done: true }], rest: '120s', muscle: locale === 'ar' ? 'ظهر' : 'Back' },
      { exercise: locale === 'ar' ? 'سحب أمامي' : 'Lat Pulldown', sets: [{ weight: 50, reps: 12, done: true },{ weight: 55, reps: 10, done: true },{ weight: 60, reps: 8, done: true }], rest: '75s', muscle: locale === 'ar' ? 'ظهر' : 'Back' },
      { exercise: locale === 'ar' ? 'سحب أرضي' : 'Seated Cable Row', sets: [{ weight: 45, reps: 12, done: false },{ weight: 50, reps: 10, done: false },{ weight: 55, reps: 8, done: false }], rest: '75s', muscle: locale === 'ar' ? 'ظهر' : 'Back' },
      { exercise: locale === 'ar' ? 'بايسبس بار EZ' : 'EZ Bar Curl', sets: [{ weight: 25, reps: 12, done: false },{ weight: 30, reps: 10, done: false },{ weight: 30, reps: 8, done: false }], rest: '60s', muscle: locale === 'ar' ? 'بايسبس' : 'Biceps' },
    ],
    [], [], [], [],
  ]);

  const toggleSet = (exIdx, setIdx) => {
    const updated = [...workouts];
    updated[selectedDay] = [...updated[selectedDay]];
    updated[selectedDay][exIdx] = { ...updated[selectedDay][exIdx], sets: [...updated[selectedDay][exIdx].sets] };
    updated[selectedDay][exIdx].sets[setIdx] = { ...updated[selectedDay][exIdx].sets[setIdx], done: !updated[selectedDay][exIdx].sets[setIdx].done };
    setWorkouts(updated);
  };

  const currentExercises = workouts[selectedDay] || [];
  const totalSets = currentExercises.reduce((s, ex) => s + ex.sets.length, 0);
  const doneSets = currentExercises.reduce((s, ex) => s + ex.sets.filter(set => set.done).length, 0);
  const totalVolume = currentExercises.reduce((s, ex) => s + ex.sets.reduce((ss, set) => ss + (set.done ? set.weight * set.reps : 0), 0), 0);
  const completion = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏋️</span> {locale === 'ar' ? 'سجل التمرين' : 'Workout Log'}</h1>
      </div>

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
        {days.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: selectedDay === i ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)', background: selectedDay === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', textAlign: 'center', minWidth: 90, position: 'relative', color: 'white' }}>
            {day.done && <div style={{ position: 'absolute', top: 4, insetInlineEnd: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--pt-success)' }} />}
            <div style={{ fontSize: 'var(--font-size-lg)' }}>{day.icon}</div>
            <div style={{ fontWeight: selectedDay === i ? 800 : 500, fontSize: 'var(--font-size-sm)' }}>{day.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{day.date}</div>
            <div style={{ fontSize: '9px', color: 'var(--pt-gold)', marginTop: '2px' }}>{day.muscles}</div>
          </button>
        ))}
      </div>

      {/* Session Summary */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{completion}%</div>
            <div className="stat-label">{locale === 'ar' ? 'إتمام' : 'Complete'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔢</div>
          <div className="stat-info">
            <div className="stat-value">{doneSets}/{totalSets}</div>
            <div className="stat-label">{locale === 'ar' ? 'مجموعات' : 'Sets'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-info">
            <div className="stat-value">{currentExercises.length}</div>
            <div className="stat-label">{locale === 'ar' ? 'تمارين' : 'Exercises'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-info">
            <div className="stat-value">{(totalVolume / 1000).toFixed(1)}K</div>
            <div className="stat-label">{locale === 'ar' ? 'حجم كلي (kg)' : 'Volume (kg)'}</div>
          </div>
        </div>
      </div>

      {/* Exercises */}
      {currentExercises.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {currentExercises.map((ex, exIdx) => {
            const exDone = ex.sets.filter(s => s.done).length;
            const exTotal = ex.sets.length;
            return (
              <div key={exIdx} className="card" style={{ borderInlineStart: `4px solid ${exDone === exTotal ? 'var(--pt-success)' : exDone > 0 ? 'var(--pt-gold)' : 'var(--pt-gray-700)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ marginBottom: '2px' }}>{ex.exercise}</h3>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      🎯 {ex.muscle} | ⏱ {locale === 'ar' ? 'راحة' : 'Rest'}: {ex.rest}
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: exDone === exTotal ? 'var(--pt-success)' : 'var(--pt-gold)' }}>
                    {exDone}/{exTotal} {locale === 'ar' ? 'مجموعة' : 'sets'}
                  </span>
                </div>

                {/* Sets Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px', gap: '1px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ padding: '6px', background: 'rgba(245,197,24,0.1)', fontSize: '10px', fontWeight: 700, textAlign: 'center', color: 'var(--pt-gold)' }}>#</div>
                  <div style={{ padding: '6px', background: 'rgba(245,197,24,0.1)', fontSize: '10px', fontWeight: 700, textAlign: 'center', color: 'var(--pt-gold)' }}>⚖️ {locale === 'ar' ? 'وزن' : 'Weight'}</div>
                  <div style={{ padding: '6px', background: 'rgba(245,197,24,0.1)', fontSize: '10px', fontWeight: 700, textAlign: 'center', color: 'var(--pt-gold)' }}>🔁 {locale === 'ar' ? 'تكرار' : 'Reps'}</div>
                  <div style={{ padding: '6px', background: 'rgba(245,197,24,0.1)', fontSize: '10px', fontWeight: 700, textAlign: 'center', color: 'var(--pt-gold)' }}>✅</div>

                  {ex.sets.map((set, setIdx) => (
                    <React.Fragment key={setIdx}>
                      <div style={{ padding: '8px', background: 'var(--pt-darker)', textAlign: 'center', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>{setIdx + 1}</div>
                      <div style={{ padding: '8px', background: 'var(--pt-darker)', textAlign: 'center', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{set.weight > 0 ? `${set.weight} kg` : (locale === 'ar' ? 'وزن جسم' : 'BW')}</div>
                      <div style={{ padding: '8px', background: 'var(--pt-darker)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>×{set.reps}</div>
                      <div style={{ padding: '8px', background: 'var(--pt-darker)', textAlign: 'center' }}>
                        <button onClick={() => toggleSet(exIdx, setIdx)}
                          style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '14px',
                            background: set.done ? 'var(--pt-success)' : 'var(--pt-gray-800)', color: set.done ? 'white' : 'var(--pt-gray-600)' }}>
                          {set.done ? '✓' : '○'}
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>😴</div>
          <h3>{locale === 'ar' ? 'يوم راحة' : 'Rest Day'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'لا توجد تمارين مجدولة لهذا اليوم' : 'No exercises scheduled for this day'}</p>
        </div>
      )}
    </div>
  );
}
