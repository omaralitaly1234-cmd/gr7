'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientDietPage() {
  // Redirect-like: reuse the diet-plan page content
  const params = useParams();
  const locale = params?.locale || 'ar';

  // This is a duplicate route (/client/diet vs /client/diet-plan)
  // Just import and render the diet plan content inline
  const plan = {
    goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss',
    calories: 2200, protein: 180, carbs: 200, fat: 70,
    trainerName: 'كابتن أحمد حسن',
    meals: [
      { name: locale === 'ar' ? 'الفطور' : 'Breakfast', time: '07:00 AM', icon: '🌅', items: [
        { name: locale === 'ar' ? '4 بيض مسلوق' : '4 boiled eggs', cal: 280, protein: 24 },
        { name: locale === 'ar' ? 'شوفان بالحليب' : 'Oatmeal with milk', cal: 150, protein: 8 },
        { name: locale === 'ar' ? 'موز' : 'Banana', cal: 20, protein: 0 },
      ]},
      { name: locale === 'ar' ? 'الغداء' : 'Lunch', time: '01:00 PM', icon: '🍽️', items: [
        { name: locale === 'ar' ? 'صدر فراخ مشوي (200 جم)' : 'Grilled chicken (200g)', cal: 330, protein: 62 },
        { name: locale === 'ar' ? 'أرز بني (كوب)' : 'Brown rice (1 cup)', cal: 220, protein: 5 },
        { name: locale === 'ar' ? 'سلطة خضراء' : 'Green salad', cal: 50, protein: 2 },
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

      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <h3>🎯 {plan.goal}</h3>
            <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>👨‍🏫 {plan.trainerName}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid var(--pt-gold)' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{plan.calories}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🔥 {locale === 'ar' ? 'سعرات' : 'Cal'}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid #FF5252' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FF5252' }}>{plan.protein}g</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🥩 {locale === 'ar' ? 'بروتين' : 'Protein'}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid #4FC3F7' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#4FC3F7' }}>{plan.carbs}g</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🍞 {locale === 'ar' ? 'كارب' : 'Carbs'}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderBottom: '3px solid #FFD740' }}>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: '#FFD740' }}>{plan.fat}g</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🥑 {locale === 'ar' ? 'دهون' : 'Fat'}</div>
          </div>
        </div>
      </div>

      {plan.meals.map((meal, i) => (
        <div key={i} className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: '1.5rem' }}>{meal.icon}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{meal.name}</h3>
              <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>⏰ {meal.time}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{meal.items.reduce((s, it) => s + it.cal, 0)} cal</span>
          </div>
          {meal.items.map((item, j) => (
            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
              <span>{item.name}</span>
              <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>{item.cal} cal</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
