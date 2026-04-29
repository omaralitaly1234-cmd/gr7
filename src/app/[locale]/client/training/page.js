'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientTraining() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedDay, setSelectedDay] = useState(0);

  const program = {
    name: locale === 'ar' ? 'برنامج خسارة وزن + بناء عضلات' : 'Weight Loss + Muscle Building',
    trainer: 'كابتن أحمد حسن',
    week: 3,
    totalWeeks: 8,
    days: [
      { name: locale === 'ar' ? 'السبت' : 'Sat', focus: locale === 'ar' ? 'صدر + ترايسيبس' : 'Chest + Triceps', done: true, exercises: [
        { name: locale === 'ar' ? 'بنش بريس' : 'Bench Press', sets: 4, reps: '10-12', weight: '60 kg', done: true },
        { name: locale === 'ar' ? 'بنش عالي' : 'Incline Press', sets: 3, reps: '10-12', weight: '50 kg', done: true },
        { name: locale === 'ar' ? 'فلاي ماشين' : 'Cable Fly', sets: 3, reps: '12-15', weight: '20 kg', done: true },
        { name: locale === 'ar' ? 'ضغط ضيق' : 'Close Grip Press', sets: 3, reps: '10-12', weight: '40 kg', done: true },
        { name: locale === 'ar' ? 'بوش داون' : 'Tricep Pushdown', sets: 3, reps: '12-15', weight: '25 kg', done: true },
      ]},
      { name: locale === 'ar' ? 'الأحد' : 'Sun', focus: locale === 'ar' ? 'ظهر + بايسيبس' : 'Back + Biceps', done: true, exercises: [
        { name: locale === 'ar' ? 'ديد ليفت' : 'Deadlift', sets: 4, reps: '8-10', weight: '80 kg', done: true },
        { name: locale === 'ar' ? 'سحب أمامي' : 'Lat Pulldown', sets: 4, reps: '10-12', weight: '50 kg', done: true },
        { name: locale === 'ar' ? 'بار كيرل' : 'Barbell Curl', sets: 3, reps: '10-12', weight: '25 kg', done: true },
      ]},
      { name: locale === 'ar' ? 'الإثنين' : 'Mon', focus: locale === 'ar' ? 'أرجل' : 'Legs', done: false, exercises: [
        { name: locale === 'ar' ? 'سكوات' : 'Squat', sets: 4, reps: '8-10', weight: '70 kg', done: false },
        { name: locale === 'ar' ? 'ليج بريس' : 'Leg Press', sets: 4, reps: '10-12', weight: '120 kg', done: false },
        { name: locale === 'ar' ? 'ليج كيرل' : 'Leg Curl', sets: 3, reps: '12-15', weight: '30 kg', done: false },
        { name: locale === 'ar' ? 'ليج إكستنشن' : 'Leg Extension', sets: 3, reps: '12-15', weight: '35 kg', done: false },
      ]},
      { name: locale === 'ar' ? 'الثلاثاء' : 'Tue', focus: locale === 'ar' ? 'كتف' : 'Shoulders', done: false, exercises: [] },
      { name: locale === 'ar' ? 'الأربعاء' : 'Wed', focus: locale === 'ar' ? 'كارديو + بطن' : 'Cardio + Abs', done: false, exercises: [] },
    ]
  };

  const completedDays = program.days.filter(d => d.done).length;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏋️</span> {locale === 'ar' ? 'برنامج التدريب' : 'Training Program'}</h1>
      </div>

      {/* Program Info */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>{program.name}</h2>
            <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>👨‍🏫 {program.trainer}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{locale === 'ar' ? `الأسبوع ${program.week}` : `Week ${program.week}`}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? `من ${program.totalWeeks}` : `of ${program.totalWeeks}`}</div>
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(completedDays / program.days.length) * 100}%`, height: '100%', background: 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} />
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginTop: '4px' }}>
            {completedDays}/{program.days.length} {locale === 'ar' ? 'أيام مكتملة هذا الأسبوع' : 'days completed this week'}
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
        {program.days.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            className={`btn ${selectedDay === i ? 'btn-primary' : day.done ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
            style={{ minWidth: 80, position: 'relative' }}>
            {day.done && <span style={{ position: 'absolute', top: -4, insetInlineEnd: -4, fontSize: '12px' }}>✅</span>}
            <div>{day.name}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>{day.focus}</div>
          </button>
        ))}
      </div>

      {/* Selected Day Exercises */}
      {program.days[selectedDay]?.exercises.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {program.days[selectedDay].exercises.map((ex, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', opacity: ex.done ? 0.7 : 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: ex.done ? 'rgba(0,200,83,0.15)' : 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, color: ex.done ? 'var(--pt-success)' : 'var(--pt-gold)' }}>
                {ex.done ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '2px', textDecoration: ex.done ? 'line-through' : 'none' }}>{ex.name}</div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                  <span>📊 {ex.sets} × {ex.reps}</span>
                  <span>🏋️ {ex.weight}</span>
                </div>
              </div>
              <button className={`btn ${ex.done ? 'btn-ghost' : 'btn-outline'} btn-sm`} style={{ minWidth: 80 }}>
                {ex.done ? '✅ ' + (locale === 'ar' ? 'تم' : 'Done') : '▶ ' + (locale === 'ar' ? 'ابدأ' : 'Start')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💪</div>
          <p style={{ color: 'var(--pt-gray-400)' }}>{locale === 'ar' ? 'لم تُضف تمارين لهذا اليوم بعد' : 'No exercises added for this day yet'}</p>
        </div>
      )}
    </div>
  );
}
