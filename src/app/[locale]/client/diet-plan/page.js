'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientDietPlan() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const plan = {
    goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss',
    calories: 2200, protein: 180, carbs: 200, fat: 70,
    trainerName: 'كابتن أحمد حسن',
    lastUpdated: '2026-03-15',
    meals: [
      { name: locale === 'ar' ? 'الفطور' : 'Breakfast', time: '07:00 AM', icon: '🌅', items: [
        { name: locale === 'ar' ? '4 بيض مسلوق' : '4 boiled eggs', cal: 280, protein: 24 },
        { name: locale === 'ar' ? 'شوفان بالحليب' : 'Oatmeal with milk', cal: 150, protein: 8 },
        { name: locale === 'ar' ? 'موز' : 'Banana', cal: 20, protein: 0 },
      ]},
      { name: locale === 'ar' ? 'سناك صباحي' : 'Morning Snack', time: '10:00 AM', icon: '🥤', items: [
        { name: locale === 'ar' ? 'زبادي يوناني' : 'Greek yogurt', cal: 150, protein: 15 },
        { name: locale === 'ar' ? 'مكسرات (30 جم)' : 'Nuts (30g)', cal: 100, protein: 5 },
      ]},
      { name: locale === 'ar' ? 'الغداء' : 'Lunch', time: '01:00 PM', icon: '🍽️', items: [
        { name: locale === 'ar' ? 'صدر فراخ مشوي (200 جم)' : 'Grilled chicken breast (200g)', cal: 330, protein: 62 },
        { name: locale === 'ar' ? 'أرز بني (كوب)' : 'Brown rice (1 cup)', cal: 220, protein: 5 },
        { name: locale === 'ar' ? 'سلطة خضراء' : 'Green salad', cal: 50, protein: 2 },
      ]},
      { name: locale === 'ar' ? 'سناك بعد التمرين' : 'Post-Workout Snack', time: '04:00 PM', icon: '💪', items: [
        { name: locale === 'ar' ? 'واي بروتين (سكوب)' : 'Whey protein (1 scoop)', cal: 120, protein: 24 },
        { name: locale === 'ar' ? 'تفاحة' : 'Apple', cal: 80, protein: 0 },
      ]},
      { name: locale === 'ar' ? 'العشاء' : 'Dinner', time: '07:00 PM', icon: '🌙', items: [
        { name: locale === 'ar' ? 'سمك مشوي (200 جم)' : 'Grilled fish (200g)', cal: 300, protein: 40 },
        { name: locale === 'ar' ? 'خضار مشوية' : 'Grilled vegetables', cal: 100, protein: 3 },
      ]},
    ]
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🥗</span> {locale === 'ar' ? 'خطتي الغذائية' : 'My Diet Plan'}</h1>
      </div>

      {/* Macros Summary */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3>🎯 {plan.goal}</h3>
            <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>👨‍🏫 {plan.trainerName} — {locale === 'ar' ? 'آخر تحديث' : 'Last updated'}: {plan.lastUpdated}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid var(--pt-gold)' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{plan.calories}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🔥 {locale === 'ar' ? 'سعرات' : 'Calories'}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid #FF5252' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FF5252' }}>{plan.protein}g</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🥩 {locale === 'ar' ? 'بروتين' : 'Protein'}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid #4FC3F7' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#4FC3F7' }}>{plan.carbs}g</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🍞 {locale === 'ar' ? 'كربوهيدرات' : 'Carbs'}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid #FFD740' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FFD740' }}>{plan.fat}g</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🥑 {locale === 'ar' ? 'دهون' : 'Fat'}</div>
          </div>
        </div>
      </div>

      {/* Meals Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {plan.meals.map((meal, i) => (
          <div key={i} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{meal.icon}</div>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{meal.name}</h3>
                <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>⏰ {meal.time}</span>
              </div>
              <div style={{ marginInlineStart: 'auto', textAlign: 'end' }}>
                <div style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{meal.items.reduce((s, it) => s + it.cal, 0)} {locale === 'ar' ? 'سعرة' : 'cal'}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{meal.items.reduce((s, it) => s + it.protein, 0)}g {locale === 'ar' ? 'بروتين' : 'protein'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {meal.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                  <span>{item.name}</span>
                  <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                    {item.cal} cal | {item.protein}g protein
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
