'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientWaterTrackerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [glasses, setGlasses] = useState(8);
  const target = 12;
  const mlPerGlass = 250;

  const weeklyData = [
    { day: locale === 'ar' ? 'سبت' : 'Sat', glasses: 10, target: 12 },
    { day: locale === 'ar' ? 'أحد' : 'Sun', glasses: 8, target: 12 },
    { day: locale === 'ar' ? 'إثنين' : 'Mon', glasses: 12, target: 12 },
    { day: locale === 'ar' ? 'ثلاثاء' : 'Tue', glasses: 9, target: 12 },
    { day: locale === 'ar' ? 'أربعاء' : 'Wed', glasses: 11, target: 12 },
    { day: locale === 'ar' ? 'خميس' : 'Thu', glasses: 7, target: 12 },
    { day: locale === 'ar' ? 'جمعة' : 'Fri', glasses: glasses, target: 12 },
  ];

  const calories = {
    consumed: 1850, target: 2200, protein: 145, carbs: 210, fat: 55,
    proteinTarget: 160, carbsTarget: 250, fatTarget: 65,
    meals: [
      { time: '07:30', name: locale === 'ar' ? 'فطار — بيض + شوفان + موز' : 'Breakfast — Eggs + Oats + Banana', cal: 450, icon: '🍳' },
      { time: '10:30', name: locale === 'ar' ? 'سناك — زبادي يوناني + مكسرات' : 'Snack — Greek Yogurt + Nuts', cal: 250, icon: '🥛' },
      { time: '13:30', name: locale === 'ar' ? 'غداء — صدور فراخ + أرز + سلطة' : 'Lunch — Chicken + Rice + Salad', cal: 650, icon: '🍗' },
      { time: '16:30', name: locale === 'ar' ? 'قبل التمرين — واي بروتين + موز' : 'Pre-Workout — Whey + Banana', cal: 280, icon: '🥤' },
      { time: '20:00', name: locale === 'ar' ? 'عشاء — سمك + خضار مشوي' : 'Dinner — Fish + Grilled Veggies', cal: 420, icon: '🐟' },
    ],
  };

  const pctWater = Math.round((glasses / target) * 100);
  const pctCal = Math.round((calories.consumed / calories.target) * 100);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💧</span> {locale === 'ar' ? 'متتبع المياه والسعرات' : 'Water & Calorie Tracker'}</h1>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Water Tracker */}
        <div className="card" style={{ borderTop: '3px solid #4FC3F7' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', textAlign: 'center' }}>💧 {locale === 'ar' ? 'متتبع المياه' : 'Water Tracker'}</h3>

          {/* Water Visual */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto', borderRadius: 'var(--radius-full)', border: '4px solid #4FC3F7', overflow: 'hidden', background: 'var(--pt-darker)' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${pctWater}%`, background: 'linear-gradient(180deg, #4FC3F7, #0288D1)', transition: 'height 0.5s', opacity: 0.3 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <div style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', color: '#4FC3F7' }}>{glasses}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>/ {target} {locale === 'ar' ? 'كوب' : 'glasses'}</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
              {glasses * mlPerGlass}ml / {target * mlPerGlass}ml
            </div>
          </div>

          {/* Add/Remove buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setGlasses(Math.max(0, glasses - 1))}>➖</button>
            <button className="btn btn-primary btn-sm" onClick={() => setGlasses(glasses + 1)}>💧 +1 {locale === 'ar' ? 'كوب' : 'Glass'}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setGlasses(glasses + 2)}>+2</button>
          </div>

          {/* Weekly Water */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: 80 }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: d.glasses >= d.target ? '#4FC3F7' : 'var(--pt-gray-600)' }}>{d.glasses}</span>
                <div style={{ width: '100%', height: `${(d.glasses / 14) * 60}px`, background: d.glasses >= d.target ? '#4FC3F7' : 'rgba(79,195,247,0.25)', borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '7px', color: 'var(--pt-gray-600)' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calorie Tracker */}
        <div className="card" style={{ borderTop: '3px solid #FF9100' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', textAlign: 'center' }}>🔥 {locale === 'ar' ? 'متتبع السعرات' : 'Calorie Tracker'}</h3>

          {/* Calorie Circle */}
          <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto var(--space-3)' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="var(--pt-darker)" strokeWidth="10" />
              <circle cx="65" cy="65" r="56" fill="none" stroke="#FF9100" strokeWidth="10"
                strokeDasharray={`${(pctCal / 100) * 352} 352`} strokeLinecap="round"
                transform="rotate(-90 65 65)" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: '#FF9100' }}>{calories.consumed}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>/ {calories.target} {locale === 'ar' ? 'سعرة' : 'kcal'}</div>
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-3" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {[
              { label: locale === 'ar' ? 'بروتين' : 'Protein', v: calories.protein, t: calories.proteinTarget, unit: 'g', color: '#FF5252' },
              { label: locale === 'ar' ? 'كارب' : 'Carbs', v: calories.carbs, t: calories.carbsTarget, unit: 'g', color: '#FFD740' },
              { label: locale === 'ar' ? 'دهون' : 'Fat', v: calories.fat, t: calories.fatTarget, unit: 'g', color: '#4FC3F7' },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{m.label}</div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)', color: m.color }}>{m.v}{m.unit}</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-full)', height: 3, overflow: 'hidden', marginTop: '3px' }}>
                  <div style={{ width: `${Math.min((m.v / m.t) * 100, 100)}%`, height: '100%', background: m.color, borderRadius: 'var(--radius-full)' }} />
                </div>
                <div style={{ fontSize: '8px', color: 'var(--pt-gray-600)' }}>/ {m.t}{m.unit}</div>
              </div>
            ))}
          </div>

          {/* Remaining */}
          <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'rgba(0,200,83,0.06)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' }}>
            {locale === 'ar' ? 'متبقي' : 'Remaining'}: <strong style={{ color: 'var(--pt-success)' }}>{calories.target - calories.consumed} {locale === 'ar' ? 'سعرة' : 'kcal'}</strong>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🍽️ {locale === 'ar' ? 'وجبات اليوم' : "Today's Meals"}</h3>
        {calories.meals.map((meal, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', marginBottom: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '10px', color: 'var(--pt-gray-600)', fontWeight: 600, minWidth: 40, fontFamily: 'monospace' }}>{meal.time}</span>
            <span style={{ fontSize: '1.3rem' }}>{meal.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{meal.name}</div>
            </div>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xs)', color: '#FF9100' }}>{meal.cal} {locale === 'ar' ? 'سعرة' : 'kcal'}</span>
          </div>
        ))}
        <button className="btn btn-outline" style={{ width: '100%', marginTop: 'var(--space-2)' }}>+ {locale === 'ar' ? 'إضافة وجبة' : 'Add Meal'}</button>
      </div>
    </div>
  );
}
