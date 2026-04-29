'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAI } from '@/lib/hooks/useAI';
import AIUsageWidget from '@/components/ai/AIUsageWidget';
import AIUpgradeModal from '@/components/ai/AIUpgradeModal';
import AILoadingAnimation from '@/components/ai/AILoadingAnimation';

export default function AINutritionPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { callAI, loading, usage, showUpgrade, setShowUpgrade, upgradeToPremium } = useAI();

  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    weight: '', height: '', age: '', gender: 'male',
    goal: isAr ? 'بناء عضلات' : 'Muscle building',
    allergies: '', dietType: '', activityLevel: isAr ? 'متوسط (3-5 حصص/أسبوع)' : 'Moderate (3-5 sessions/week)',
  });

  const goals = isAr
    ? ['بناء عضلات', 'خسارة دهون', 'زيادة وزن', 'الحفاظ على الوزن', 'لياقة عامة']
    : ['Muscle building', 'Fat loss', 'Weight gain', 'Maintain weight', 'General fitness'];

  const diets = isAr
    ? ['متوازن', 'كيتو', 'نباتي', 'عالي البروتين', 'منخفض الكربوهيدرات']
    : ['Balanced', 'Keto', 'Vegetarian', 'High Protein', 'Low Carb'];

  const levels = isAr
    ? ['خفيف (1-2 حصص/أسبوع)', 'متوسط (3-5 حصص/أسبوع)', 'مكثف (6-7 حصص/أسبوع)']
    : ['Light (1-2 sessions/week)', 'Moderate (3-5 sessions/week)', 'Intense (6-7 sessions/week)'];

  const handleGenerate = async () => {
    if (!form.weight || !form.height || !form.age) return;
    const result = await callAI('nutrition', { ...form, locale });
    if (result.success && result.data.plan) {
      setPlan(typeof result.data.plan === 'string' ? JSON.parse(result.data.plan) : result.data.plan);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🥗</span> {isAr ? 'مساعد التغذية الذكي' : 'AI Nutrition Assistant'}</h1>
        <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', padding: 'var(--space-2) var(--space-3)' }}>
          🤖 {isAr ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
        </span>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)', gridTemplateColumns: '1fr 1fr 340px' }}>
        {/* Form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            📝 {isAr ? 'بياناتك' : 'Your Details'}
          </h3>

          <div className="grid grid-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
              <input type="number" className="form-input" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="80" dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الطول (سم)' : 'Height (cm)'}</label>
              <input type="number" className="form-input" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="175" dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'العمر' : 'Age'}</label>
              <input type="number" className="form-input" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="25" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الجنس' : 'Gender'}</label>
              <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الهدف' : 'Goal'}</label>
              <select className="form-select" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
                {goals.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'نوع النظام الغذائي' : 'Diet Type'}</label>
              <select className="form-select" value={form.dietType} onChange={e => setForm({ ...form, dietType: e.target.value })}>
                <option value="">{isAr ? 'اختياري' : 'Optional'}</option>
                {diets.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'مستوى النشاط' : 'Activity Level'}</label>
              <select className="form-select" value={form.activityLevel} onChange={e => setForm({ ...form, activityLevel: e.target.value })}>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label">{isAr ? 'حساسية غذائية / قيود' : 'Allergies / Restrictions'}</label>
            <input type="text" className="form-input" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder={isAr ? 'مثال: لاكتوز، جلوتين...' : 'e.g., Lactose, Gluten...'} />
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={loading || !form.weight || !form.height || !form.age}
            style={{ width: '100%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', fontSize: 'var(--font-size-md)' }}
          >
            {loading ? (isAr ? '⏳ جاري التوليد...' : '⏳ Generating...') : (isAr ? '🤖 توليد خطة تغذية بالذكاء الاصطناعي' : '🤖 Generate AI Nutrition Plan')}
          </button>
        </div>

        {/* Sidebar - Usage */}
        <div>
          <AIUsageWidget usage={usage} locale={locale} onUpgrade={() => setShowUpgrade(true)} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <AILoadingAnimation locale={locale} message={isAr ? 'الذكاء الاصطناعي يُعد خطة تغذية مخصصة لك...' : 'AI is creating your custom nutrition plan...'} />
        </div>
      )}

      {/* Generated Plan */}
      {plan && !loading && (
        <div className="card" style={{ borderTop: '3px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              🤖 {plan.planName || (isAr ? 'خطتك الغذائية' : 'Your Nutrition Plan')}
            </h2>
            <span className="badge badge-success">{isAr ? 'تم التوليد' : 'Generated'} ✓</span>
          </div>

          {/* Macros Overview */}
          <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card">
              <div className="stat-icon gold">🔥</div>
              <div className="stat-info">
                <div className="stat-value">{plan.dailyCalories}</div>
                <div className="stat-label">{isAr ? 'سعرات/يوم' : 'kcal/day'}</div>
              </div>
            </div>
            {plan.macros && (
              <>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(255,82,82,0.1)' }}>🥩</div>
                  <div className="stat-info">
                    <div className="stat-value">{plan.macros.protein}g</div>
                    <div className="stat-label">{isAr ? 'بروتين' : 'Protein'}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(255,167,38,0.1)' }}>🍞</div>
                  <div className="stat-info">
                    <div className="stat-value">{plan.macros.carbs}g</div>
                    <div className="stat-label">{isAr ? 'كربوهيدرات' : 'Carbs'}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(102,187,106,0.1)' }}>🥑</div>
                  <div className="stat-info">
                    <div className="stat-value">{plan.macros.fat}g</div>
                    <div className="stat-label">{isAr ? 'دهون' : 'Fat'}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Meals */}
          {plan.meals && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>🍽️ {isAr ? 'الوجبات' : 'Meals'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {plan.meals.map((meal, i) => (
                  <div key={i} style={{
                    background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)', borderInlineStart: '3px solid #8B5CF6',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <div style={{ fontWeight: 700 }}>{meal.name}</div>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                        <span>🕐 {meal.time}</span>
                        <span>🔥 {meal.calories} kcal</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {meal.items?.map((item, j) => (
                        <span key={j} style={{
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                          padding: '2px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {plan.tips && (
            <div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>💡 {isAr ? 'نصائح' : 'Tips'}</h3>
              <div className="grid grid-3">
                {plan.tips.map((tip, i) => (
                  <div key={i} style={{
                    background: 'var(--pt-darker)', padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
                    display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
                  }}>
                    <span style={{ color: 'var(--pt-success)' }}>✓</span> {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AIUpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={upgradeToPremium} locale={locale} usage={usage} />
    </div>
  );
}
