'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function NutritionTrackerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedMeal, setSelectedMeal] = useState(null);

  const dailyGoals = { calories: 2200, protein: 160, carbs: 250, fats: 65 };

  const meals = [
    { id: 'breakfast', icon: '🌅', name: locale === 'ar' ? 'فطار' : 'Breakfast', time: '08:00', items: [
      { name: locale === 'ar' ? '4 بيضات (2 كامل + 2 بياض)' : '4 Eggs (2 whole + 2 whites)', cal: 280, p: 24, c: 2, f: 18 },
      { name: locale === 'ar' ? 'شوفان بالحليب' : 'Oats with milk', cal: 300, p: 12, c: 50, f: 8 },
      { name: locale === 'ar' ? 'موزة' : 'Banana', cal: 105, p: 1, c: 27, f: 0 },
    ]},
    { id: 'snack1', icon: '🥤', name: locale === 'ar' ? 'سناك 1' : 'Snack 1', time: '11:00', items: [
      { name: locale === 'ar' ? 'واي بروتين سكوب' : 'Whey Protein Scoop', cal: 120, p: 24, c: 3, f: 1 },
      { name: locale === 'ar' ? 'تفاحة' : 'Apple', cal: 95, p: 0, c: 25, f: 0 },
    ]},
    { id: 'lunch', icon: '🍽️', name: locale === 'ar' ? 'غداء' : 'Lunch', time: '14:00', items: [
      { name: locale === 'ar' ? '200 جم صدور فراخ مشوية' : '200g Grilled Chicken Breast', cal: 330, p: 62, c: 0, f: 7 },
      { name: locale === 'ar' ? 'أرز بني (كوب)' : 'Brown Rice (1 cup)', cal: 220, p: 5, c: 45, f: 2 },
      { name: locale === 'ar' ? 'سلطة خضراء' : 'Green Salad', cal: 45, p: 2, c: 8, f: 1 },
    ]},
    { id: 'snack2', icon: '🥜', name: locale === 'ar' ? 'سناك 2' : 'Snack 2', time: '17:00', items: [
      { name: locale === 'ar' ? 'زبادي يوناني' : 'Greek Yogurt', cal: 130, p: 15, c: 8, f: 5 },
      { name: locale === 'ar' ? 'لوز (15 حبة)' : 'Almonds (15 pcs)', cal: 105, p: 4, c: 4, f: 9 },
    ]},
    { id: 'dinner', icon: '🌙', name: locale === 'ar' ? 'عشاء' : 'Dinner', time: '20:00', items: [
      { name: locale === 'ar' ? '150 جم سمك مشوي' : '150g Grilled Fish', cal: 200, p: 35, c: 0, f: 6 },
      { name: locale === 'ar' ? 'خضار سوتيه' : 'Sautéed Vegetables', cal: 80, p: 3, c: 12, f: 3 },
      { name: locale === 'ar' ? 'بطاطس مسلوقة (حبة)' : 'Boiled Potato (1)', cal: 160, p: 4, c: 36, f: 0 },
    ]},
  ];

  const totals = meals.reduce((acc, meal) => {
    meal.items.forEach(item => { acc.cal += item.cal; acc.p += item.p; acc.c += item.c; acc.f += item.f; });
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  const pctCal = Math.round((totals.cal / dailyGoals.calories) * 100);
  const pctP = Math.round((totals.p / dailyGoals.protein) * 100);
  const pctC = Math.round((totals.c / dailyGoals.carbs) * 100);
  const pctF = Math.round((totals.f / dailyGoals.fats) * 100);

  const CircleProgress = ({ pct, color, label, value, unit }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto var(--space-2)' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--pt-gray-800)" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${Math.min(pct, 100) * 2.136} 213.6`}
            strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontWeight: 800, fontSize: 'var(--font-size-sm)', color }}>{pct}%</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{value} <span style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{unit}</span></div>
      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{label}</div>
    </div>
  );

  const waterGlasses = 6;
  const waterGoal = 8;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🥗</span> {locale === 'ar' ? 'متتبع التغذية اليومي' : 'Daily Nutrition Tracker'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm">← {locale === 'ar' ? 'أمس' : 'Yesterday'}</button>
          <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>📅 {locale === 'ar' ? 'اليوم' : 'Today'} — 24 مارس</span>
          <button className="btn btn-ghost btn-sm">{locale === 'ar' ? 'غداً' : 'Tomorrow'} →</button>
        </div>
      </div>

      {/* Macro Overview */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <CircleProgress pct={pctCal} color="var(--pt-gold)" label={locale === 'ar' ? 'سعرات' : 'Calories'} value={totals.cal} unit="kcal" />
          <CircleProgress pct={pctP} color="#FF5252" label={locale === 'ar' ? 'بروتين' : 'Protein'} value={totals.p} unit="g" />
          <CircleProgress pct={pctC} color="#FFD740" label={locale === 'ar' ? 'كربوهيدرات' : 'Carbs'} value={totals.c} unit="g" />
          <CircleProgress pct={pctF} color="#4FC3F7" label={locale === 'ar' ? 'دهون' : 'Fats'} value={totals.f} unit="g" />

          {/* Water Tracker */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-2)' }}>
              {Array.from({ length: waterGoal }).map((_, i) => (
                <div key={i} style={{ width: 20, height: 28, borderRadius: '4px', border: '2px solid rgba(79,195,247,0.3)', background: i < waterGlasses ? 'rgba(79,195,247,0.3)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                  {i < waterGlasses ? '💧' : ''}
                </div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{waterGlasses}/{waterGoal}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'أكواب ماء' : 'Glasses'}</div>
          </div>
        </div>

        {/* Remaining Summary */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ color: 'var(--pt-gray-400)' }}>{locale === 'ar' ? 'متبقي' : 'Remaining'}:</span>
          <span style={{ color: totals.cal < dailyGoals.calories ? 'var(--pt-success)' : 'var(--pt-danger)' }}>{dailyGoals.calories - totals.cal} kcal</span>
          <span style={{ color: '#FF5252' }}>{dailyGoals.protein - totals.p}g {locale === 'ar' ? 'بروتين' : 'protein'}</span>
          <span style={{ color: '#FFD740' }}>{dailyGoals.carbs - totals.c}g {locale === 'ar' ? 'كارب' : 'carbs'}</span>
          <span style={{ color: '#4FC3F7' }}>{dailyGoals.fats - totals.f}g {locale === 'ar' ? 'دهون' : 'fats'}</span>
        </div>
      </div>

      {/* Meals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {meals.map(meal => {
          const mealCal = meal.items.reduce((s, i) => s + i.cal, 0);
          const mealP = meal.items.reduce((s, i) => s + i.p, 0);
          const isOpen = selectedMeal === meal.id;
          return (
            <div key={meal.id} className="card" style={{ cursor: 'pointer', borderInlineStart: `4px solid ${meal.id === 'lunch' ? 'var(--pt-gold)' : meal.id.includes('snack') ? 'var(--pt-info)' : 'var(--pt-success)'}` }}
              onClick={() => setSelectedMeal(isOpen ? null : meal.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{meal.icon}</span>
                  <div>
                    <h3 style={{ marginBottom: '2px' }}>{meal.name}</h3>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">🕐 {meal.time}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{mealCal}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>kcal</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#FF5252' }}>{mealP}g</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'بروتين' : 'protein'}</div>
                  </div>
                  <span style={{ color: 'var(--pt-gray-500)', fontSize: '1.2rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-3)' }} onClick={e => e.stopPropagation()}>
                  <table className="data-table" style={{ background: 'transparent' }}>
                    <thead>
                      <tr>
                        <th>{locale === 'ar' ? 'الصنف' : 'Item'}</th>
                        <th style={{ textAlign: 'center' }}>Kcal</th>
                        <th style={{ textAlign: 'center', color: '#FF5252' }}>P</th>
                        <th style={{ textAlign: 'center', color: '#FFD740' }}>C</th>
                        <th style={{ textAlign: 'center', color: '#4FC3F7' }}>F</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meal.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.cal}</td>
                          <td style={{ textAlign: 'center', color: '#FF5252' }}>{item.p}</td>
                          <td style={{ textAlign: 'center', color: '#FFD740' }}>{item.c}</td>
                          <td style={{ textAlign: 'center', color: '#4FC3F7' }}>{item.f}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-sm">+ {locale === 'ar' ? 'إضافة صنف' : 'Add Item'}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Meal button */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
        <button className="btn btn-primary">+ {locale === 'ar' ? 'إضافة وجبة' : 'Add Meal'}</button>
      </div>
    </div>
  );
}
