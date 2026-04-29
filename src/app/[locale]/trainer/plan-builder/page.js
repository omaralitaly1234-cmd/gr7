'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function WorkoutPlanBuilderPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const days = locale === 'ar'
    ? ['يوم 1 — صدر', 'يوم 2 — ظهر', 'يوم 3 — كتف', 'يوم 4 — أرجل', 'يوم 5 — ذراع', 'يوم 6 — كارديو']
    : ['Day 1 — Chest', 'Day 2 — Back', 'Day 3 — Shoulders', 'Day 4 — Legs', 'Day 5 — Arms', 'Day 6 — Cardio'];

  const [plans, setPlans] = useState([
    [
      { name: locale === 'ar' ? 'بنش بريس بار' : 'Barbell Bench Press', sets: 4, reps: '10-12', rest: '90s', notes: '' },
      { name: locale === 'ar' ? 'بنش بريس مائل دمبل' : 'Incline DB Press', sets: 4, reps: '10-12', rest: '90s', notes: '' },
      { name: locale === 'ar' ? 'فلاي كابل' : 'Cable Fly', sets: 3, reps: '12-15', rest: '60s', notes: '' },
      { name: locale === 'ar' ? 'ضغط صدر ماشين' : 'Chest Press Machine', sets: 3, reps: '12', rest: '60s', notes: locale === 'ar' ? 'drop set آخر مجموعة' : 'Drop set last set' },
      { name: locale === 'ar' ? 'ترايسبس بوش داون' : 'Tricep Pushdown', sets: 3, reps: '12-15', rest: '60s', notes: '' },
    ],
    [
      { name: locale === 'ar' ? 'ديد ليفت' : 'Deadlift', sets: 4, reps: '8-10', rest: '120s', notes: locale === 'ar' ? '⚠️ تمرين أساسي' : '⚠️ Core lift' },
      { name: locale === 'ar' ? 'سحب علوي واسع' : 'Wide Lat Pulldown', sets: 4, reps: '10-12', rest: '90s', notes: '' },
      { name: locale === 'ar' ? 'تجديف بار' : 'Barbell Row', sets: 4, reps: '10-12', rest: '90s', notes: '' },
      { name: locale === 'ar' ? 'سحب سفلي كابل' : 'Seated Cable Row', sets: 3, reps: '12', rest: '60s', notes: '' },
      { name: locale === 'ar' ? 'بايسبس EZ' : 'EZ Bar Curl', sets: 3, reps: '12-15', rest: '60s', notes: '' },
    ],
    [], [], [], [],
  ]);

  const exercises = plans[selectedDay] || [];

  const availableExercises = locale === 'ar'
    ? ['بنش بريس بار', 'سكوات', 'ديد ليفت', 'كتف بريس', 'بايسبس EZ', 'ترايسبس بوش داون', 'فلاي كابل', 'ليج بريس', 'ليج كيرل', 'بلانك', 'كرنش', 'لاتيرال ريز', 'فرنت ريز']
    : ['Bench Press', 'Squat', 'Deadlift', 'Shoulder Press', 'EZ Curl', 'Tricep Pushdown', 'Cable Fly', 'Leg Press', 'Leg Curl', 'Plank', 'Crunch', 'Lateral Raise', 'Front Raise'];

  const addExercise = (name) => {
    const updated = [...plans];
    updated[selectedDay] = [...(updated[selectedDay] || []), { name, sets: 3, reps: '12', rest: '60s', notes: '' }];
    setPlans(updated);
    setShowAddExercise(false);
  };

  const removeExercise = (index) => {
    const updated = [...plans];
    updated[selectedDay] = updated[selectedDay].filter((_, i) => i !== index);
    setPlans(updated);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏗️</span> {locale === 'ar' ? 'بناء برنامج تدريب' : 'Workout Plan Builder'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select className="form-select" style={{ maxWidth: 200 }}>
            <option>{locale === 'ar' ? 'أحمد محمد سعيد' : 'Ahmed Mohamed'}</option>
            <option>{locale === 'ar' ? 'عمر حسام الدين' : 'Omar Hossam'}</option>
            <option>{locale === 'ar' ? 'نور أحمد' : 'Nour Ahmed'}</option>
          </select>
          <button className="btn btn-primary btn-sm">💾 {locale === 'ar' ? 'حفظ البرنامج' : 'Save Plan'}</button>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {days.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)} className={`btn ${selectedDay === i ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            style={{ whiteSpace: 'nowrap', position: 'relative' }}>
            {day}
            {(plans[i]?.length || 0) > 0 && (
              <span style={{ position: 'absolute', top: -4, insetInlineEnd: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--pt-gold)', color: 'var(--pt-black)', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{plans[i].length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{exercises.length}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'تمرين' : 'Exercises'}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#4FC3F7' }}>{exercises.reduce((s, e) => s + e.sets, 0)}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'مجموعة' : 'Total Sets'}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#B388FF' }}>~{exercises.reduce((s, e) => s + e.sets * 2, 0)}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'دقيقة تقديرية' : 'Est. Minutes'}</div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3>📋 {days[selectedDay]}</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddExercise(true)}>+ {locale === 'ar' ? 'إضافة تمرين' : 'Add Exercise'}</button>
        </div>

        {exercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-600)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>🏋️</div>
            {locale === 'ar' ? 'لم تتم إضافة تمارين بعد. اضغط "إضافة تمرين" للبدء.' : 'No exercises yet. Click "Add Exercise" to start.'}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{locale === 'ar' ? 'التمرين' : 'Exercise'}</th>
                  <th>{locale === 'ar' ? 'مجموعات' : 'Sets'}</th>
                  <th>{locale === 'ar' ? 'تكرارات' : 'Reps'}</th>
                  <th>{locale === 'ar' ? 'راحة' : 'Rest'}</th>
                  <th>{locale === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>🏋️ {ex.name}</td>
                    <td>
                      <input type="number" className="form-input" value={ex.sets} style={{ width: 50, padding: '4px 8px', margin: 0, textAlign: 'center' }} readOnly />
                    </td>
                    <td>
                      <input className="form-input" value={ex.reps} style={{ width: 60, padding: '4px 8px', margin: 0, textAlign: 'center' }} readOnly dir="ltr" />
                    </td>
                    <td>
                      <input className="form-input" value={ex.rest} style={{ width: 50, padding: '4px 8px', margin: 0, textAlign: 'center' }} readOnly dir="ltr" />
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: ex.notes ? 'var(--pt-warning)' : 'var(--pt-gray-600)' }}>{ex.notes || '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-danger)' }} onClick={() => removeExercise(i)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="modal-overlay" onClick={() => setShowAddExercise(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>🏋️ {locale === 'ar' ? 'إضافة تمرين' : 'Add Exercise'}</h2>
              <button onClick={() => setShowAddExercise(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {availableExercises.map((ex, i) => (
                  <button key={i} onClick={() => addExercise(ex)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', cursor: 'pointer', textAlign: 'start', color: 'white', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏋️</span>
                    <span style={{ fontWeight: 600 }}>{ex}</span>
                    <span style={{ marginInlineStart: 'auto', color: 'var(--pt-gold)', fontSize: '1.2rem' }}>+</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
