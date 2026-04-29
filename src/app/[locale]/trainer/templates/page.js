'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TrainerWorkoutTemplatesPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    { id: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
    { id: 'bulking', label: locale === 'ar' ? 'تضخيم' : 'Bulking' },
    { id: 'cutting', label: locale === 'ar' ? 'تنشيف' : 'Cutting' },
    { id: 'strength', label: locale === 'ar' ? 'قوة' : 'Strength' },
    { id: 'cardio', label: locale === 'ar' ? 'كارديو' : 'Cardio' },
    { id: 'beginner', label: locale === 'ar' ? 'مبتدئين' : 'Beginner' },
  ];

  const templates = [
    { name: locale === 'ar' ? 'Push/Pull/Legs — تضخيم' : 'Push/Pull/Legs — Bulk', category: 'bulking', level: locale === 'ar' ? 'متوسط-متقدم' : 'Intermediate-Advanced', duration: '60-75', frequency: '6', icon: '💪', color: 'var(--pt-gold)', usedBy: 28,
      days: [
        { day: locale === 'ar' ? 'A — دفع' : 'A — Push', exercises: locale === 'ar' ? 'بنش بريس 4×8 | أوفرهيد 3×10 | إنكلاين DB 3×10 | ليترال رايز 3×12 | تراي بشداون 3×12' : 'Bench 4×8 | OHP 3×10 | Incline DB 3×10 | Lateral Raise 3×12 | Tri Pushdown 3×12' },
        { day: locale === 'ar' ? 'B — سحب' : 'B — Pull', exercises: locale === 'ar' ? 'ديدلفت 4×5 | بار رو 3×8 | بول داون 3×10 | فيس بول 3×15 | بايسبس كيرل 3×12' : 'Deadlift 4×5 | Row 3×8 | Pulldown 3×10 | Face Pull 3×15 | Curl 3×12' },
        { day: locale === 'ar' ? 'C — أرجل' : 'C — Legs', exercises: locale === 'ar' ? 'سكوات 4×6 | ليج بريس 3×10 | رومانيان DL 3×10 | ليج كيرل 3×12 | كاف رايز 4×15' : 'Squat 4×6 | Leg Press 3×10 | RDL 3×10 | Leg Curl 3×12 | Calf 4×15' },
      ]},
    { name: locale === 'ar' ? 'Upper/Lower — تنشيف' : 'Upper/Lower — Cut', category: 'cutting', level: locale === 'ar' ? 'متوسط' : 'Intermediate', duration: '50-60', frequency: '4', icon: '🔥', color: '#FF5252', usedBy: 22,
      days: [
        { day: locale === 'ar' ? 'A — علوي' : 'A — Upper', exercises: locale === 'ar' ? 'بنش 3×8 | رو 3×8 | OHP 3×10 | بول أب 3×8 | سوبرسيت باي+تراي' : 'Bench 3×8 | Row 3×8 | OHP 3×10 | Pull Up 3×8 | Bi+Tri Superset' },
        { day: locale === 'ar' ? 'B — سفلي' : 'B — Lower', exercises: locale === 'ar' ? 'سكوات 3×8 | RDL 3×8 | ليج بريس 3×10 | لانجز 3×10 | HIIT 15 دقيقة' : 'Squat 3×8 | RDL 3×8 | Leg Press 3×10 | Lunges 3×10 | 15min HIIT' },
      ]},
    { name: locale === 'ar' ? '5×5 StrongLifts — قوة' : '5×5 StrongLifts — Strength', category: 'strength', level: locale === 'ar' ? 'مبتدئ-متوسط' : 'Beginner-Intermediate', duration: '45-55', frequency: '3', icon: '🏋️', color: '#7C4DFF', usedBy: 15,
      days: [
        { day: locale === 'ar' ? 'A' : 'A', exercises: locale === 'ar' ? 'سكوات 5×5 | بنش بريس 5×5 | بار رو 5×5' : 'Squat 5×5 | Bench 5×5 | Row 5×5' },
        { day: locale === 'ar' ? 'B' : 'B', exercises: locale === 'ar' ? 'سكوات 5×5 | أوفرهيد بريس 5×5 | ديدلفت 1×5' : 'Squat 5×5 | OHP 5×5 | Deadlift 1×5' },
      ]},
    { name: locale === 'ar' ? 'HIIT + كارديو — فقدان وزن' : 'HIIT + Cardio — Fat Loss', category: 'cardio', level: locale === 'ar' ? 'جميع المستويات' : 'All Levels', duration: '30-40', frequency: '4-5', icon: '🏃', color: '#00C853', usedBy: 35,
      days: [
        { day: locale === 'ar' ? 'A — HIIT' : 'A — HIIT', exercises: locale === 'ar' ? 'بيربيز 30ث | ماونتن كلايمبر 30ث | جامب سكوات 30ث | بلانك 45ث | راحة 15ث × 5 جولات' : 'Burpees 30s | Mt Climber 30s | Jump Squat 30s | Plank 45s | 15s Rest × 5 Rounds' },
        { day: locale === 'ar' ? 'B — كارديو مستمر' : 'B — Steady State', exercises: locale === 'ar' ? 'تريدميل 20د (Zone 2) + دراجة 15د + تمارين إطالة 10د' : 'Treadmill 20m (Zone 2) + Bike 15m + Stretching 10m' },
      ]},
    { name: locale === 'ar' ? 'برنامج المبتدئين الشامل' : 'Complete Beginner Program', category: 'beginner', level: locale === 'ar' ? 'مبتدئ' : 'Beginner', duration: '40-50', frequency: '3', icon: '🌟', color: '#FFD740', usedBy: 42,
      days: [
        { day: locale === 'ar' ? 'A — جسم علوي' : 'A — Upper', exercises: locale === 'ar' ? 'تشيست بريس ماكينة 3×12 | لات بولداون 3×12 | شولدر بريس ماكينة 3×12 | باي+تراي' : 'Chest Press 3×12 | Lat Pull 3×12 | Shoulder Press 3×12 | Bi+Tri' },
        { day: locale === 'ar' ? 'B — جسم سفلي' : 'B — Lower', exercises: locale === 'ar' ? 'جوبلت سكوات 3×12 | ليج بريس 3×12 | ليج كيرل 3×12 | كاف + core' : 'Goblet Squat 3×12 | Leg Press 3×12 | Leg Curl 3×12 | Calf + Core' },
      ]},
  ];

  const filtered = categoryFilter === 'all' ? templates : templates.filter(t => t.category === categoryFilter);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📚</span> {locale === 'ar' ? 'قوالب التمرين' : 'Workout Templates'}</h1>
        <button className="btn btn-primary">+ {locale === 'ar' ? 'قالب جديد' : 'New Template'}</button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {categories.map(c => (
          <button key={c.id} onClick={() => setCategoryFilter(c.id)} className={`btn ${categoryFilter === c.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{c.label}</button>
        ))}
      </div>

      {/* Template Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filtered.map((t, i) => (
          <div key={i} className="card" style={{ borderTop: `3px solid ${t.color}` }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>{t.name}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--pt-gray-600)', marginTop: '2px' }}>
                    <span>📊 {t.level}</span>
                    <span>⏱️ {t.duration} {locale === 'ar' ? 'دقيقة' : 'min'}</span>
                    <span>📅 {t.frequency}×/{locale === 'ar' ? 'أسبوع' : 'week'}</span>
                    <span>👥 {t.usedBy} {locale === 'ar' ? 'عميل' : 'clients'}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm">{locale === 'ar' ? 'تطبيق' : 'Apply'}</button>
            </div>

            {/* Days */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {t.days.map((d, j) => (
                <div key={j} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: `3px solid ${t.color}` }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: t.color, marginBottom: '2px' }}>{d.day}</div>
                  <div style={{ fontSize: '11px', color: 'var(--pt-gray-400)', lineHeight: 1.5 }}>{d.exercises}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
