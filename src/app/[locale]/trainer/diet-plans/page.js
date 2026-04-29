'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const MEAL_TEMPLATES = {
  breakfast: { ar: 'الفطور', en: 'Breakfast', icon: '🍳', time: '07:00' },
  snack1: { ar: 'سناك 1', en: 'Snack 1', icon: '🍎', time: '10:00' },
  lunch: { ar: 'الغداء', en: 'Lunch', icon: '🥗', time: '13:00' },
  snack2: { ar: 'سناك 2', en: 'Snack 2', icon: '🥜', time: '16:00' },
  dinner: { ar: 'العشاء', en: 'Dinner', icon: '🍗', time: '19:00' },
  preworkout: { ar: 'قبل التمرين', en: 'Pre-Workout', icon: '⚡', time: '17:00' },
  postworkout: { ar: 'بعد التمرين', en: 'Post-Workout', icon: '💪', time: '19:30' },
};

export default function DietPlansPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [form, setForm] = useState({
    name: { ar: '', en: '' },
    clientId: '',
    goal: 'weight_loss',
    totalCalories: 2000,
    proteinGrams: 150,
    carbsGrams: 200,
    fatGrams: 70,
    meals: [
      { type: 'breakfast', items: [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }] },
      { type: 'lunch', items: [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }] },
      { type: 'dinner', items: [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }] },
    ],
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId || !user) { setLoading(false); return; }
    try {
      const { data: dietPlans } = await getTenantDocuments(tenantId, 'diet_plans',
        [{ field: 'trainerId', operator: '==', value: user.uid }],
        { field: 'createdAt', direction: 'desc' });
      setPlans(dietPlans || []);

      const { data: assignedClients } = await getTenantDocuments(tenantId, 'members',
        [{ field: 'assignedTrainer', operator: '==', value: user.uid }]);
      setClients(assignedClients || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addMeal = () => {
    setForm(f => ({ ...f, meals: [...f.meals, { type: 'snack1', items: [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }] }] }));
  };

  const addMealItem = (mealIndex) => {
    setForm(f => {
      const meals = [...f.meals];
      meals[mealIndex] = { ...meals[mealIndex], items: [...meals[mealIndex].items, { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }] };
      return { ...f, meals };
    });
  };

  const updateMealItem = (mealIndex, itemIndex, field, value) => {
    setForm(f => {
      const meals = [...f.meals];
      const items = [...meals[mealIndex].items];
      items[itemIndex] = { ...items[itemIndex], [field]: field === 'name' ? value : Number(value) };
      meals[mealIndex] = { ...meals[mealIndex], items };
      return { ...f, meals };
    });
  };

  const removeMeal = (mealIndex) => {
    setForm(f => ({ ...f, meals: f.meals.filter((_, i) => i !== mealIndex) }));
  };

  const handleSave = async () => {
    if (!tenantId || !user || !form.name.ar) return;
    try {
      const client = clients.find(c => c.id === form.clientId);
      await addTenantDocument(tenantId, 'diet_plans', {
        ...form,
        trainerId: user.uid,
        trainerName: user.displayName || '',
        clientName: client?.fullName?.[locale] || client?.fullName?.ar || '',
      });
      toast.success(t('common.success'));
      setShowBuilder(false);
      loadData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const deletePlan = async (planId) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'diet_plans', planId);
    toast.success(t('common.success'));
    loadData();
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🥗</span> {t('trainer.dietPlans')}</h1>
        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>+ {t('trainer.createDietPlan')}</button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🥗</div>
          <h3>{isAr ? 'لا توجد أنظمة غذائية' : 'No diet plans yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', marginBottom: 'var(--space-4)' }}>
            {isAr ? 'أنشئ نظاماً غذائياً مخصصاً لعملائك' : 'Create a customized diet plan for your clients'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {plans.map(plan => (
            <div key={plan.id} className="card" style={{ borderInlineStart: '3px solid var(--pt-success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)' }}>{plan.name?.[locale] || plan.name?.ar}</h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                    👤 {plan.clientName || '-'}
                  </p>
                </div>
                <span className={`badge ${plan.goal === 'weight_loss' ? 'badge-danger' : plan.goal === 'muscle_gain' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                  🎯 {t(`members.goals.${plan.goal}`)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {[
                  { l: isAr ? 'سعرات' : 'Cal', v: plan.totalCalories, c: 'var(--pt-gold)' },
                  { l: isAr ? 'بروتين' : 'Protein', v: `${plan.proteinGrams}g`, c: 'var(--pt-danger)' },
                  { l: isAr ? 'كاربس' : 'Carbs', v: `${plan.carbsGrams}g`, c: 'var(--pt-info)' },
                  { l: isAr ? 'دهون' : 'Fat', v: `${plan.fatGrams}g`, c: 'var(--pt-warning)' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '8px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, color: s.c, fontSize: 'var(--font-size-sm)' }}>{s.v}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
                🍽️ {plan.meals?.length || 0} {isAr ? 'وجبات' : 'meals'}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedPlan(plan); }}>👁️ {t('common.view')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => deletePlan(plan.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diet Plan Builder Modal */}
      {showBuilder && (
        <div className="modal-overlay" onClick={() => setShowBuilder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>🥗 {t('trainer.createDietPlan')}</h2>
              <button onClick={() => setShowBuilder(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Plan Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم الخطة' : 'Plan Name'} *</label>
                  <input className="form-input" value={form.name.ar} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ar: e.target.value } }))} placeholder={isAr ? 'خطة إنقاص وزن' : 'Weight Loss Plan'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('trainer.assignToClient')}</label>
                  <select className="form-select" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">{t('common.select')}...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName?.[locale] || c.fullName?.ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Macros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'سعرات' : 'Calories'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.totalCalories} onChange={e => setForm(f => ({ ...f, totalCalories: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'بروتين (جم)' : 'Protein (g)'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.proteinGrams} onChange={e => setForm(f => ({ ...f, proteinGrams: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'كاربس (جم)' : 'Carbs (g)'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.carbsGrams} onChange={e => setForm(f => ({ ...f, carbsGrams: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'دهون (جم)' : 'Fat (g)'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.fatGrams} onChange={e => setForm(f => ({ ...f, fatGrams: Number(e.target.value) }))} />
                </div>
              </div>

              {/* Meals */}
              <h4 style={{ marginBottom: 'var(--space-3)' }}>🍽️ {isAr ? 'الوجبات' : 'Meals'}</h4>
              {form.meals.map((meal, mi) => (
                <div key={mi} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <select className="form-select" value={meal.type} onChange={e => {
                        const meals = [...form.meals]; meals[mi] = { ...meals[mi], type: e.target.value };
                        setForm(f => ({ ...f, meals }));
                      }} style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}>
                        {Object.entries(MEAL_TEMPLATES).map(([key, m]) => (
                          <option key={key} value={key}>{m.icon} {m[locale]}</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeMeal(mi)} style={{ color: 'var(--pt-danger)' }}>✕</button>
                  </div>
                  {meal.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <input className="form-input" value={item.name} placeholder={isAr ? 'اسم الطعام' : 'Food name'} style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateMealItem(mi, ii, 'name', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={item.calories || ''} placeholder="cal" style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateMealItem(mi, ii, 'calories', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={item.protein || ''} placeholder="P" style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateMealItem(mi, ii, 'protein', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={item.carbs || ''} placeholder="C" style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateMealItem(mi, ii, 'carbs', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={item.fat || ''} placeholder="F" style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateMealItem(mi, ii, 'fat', e.target.value)} />
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={() => addMealItem(mi)} style={{ fontSize: '11px' }}>+ {isAr ? 'إضافة طعام' : 'Add Food'}</button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={addMeal}>+ {isAr ? 'إضافة وجبة' : 'Add Meal'}</button>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">{t('common.notes')}</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBuilder(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.ar}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Plan Modal */}
      {selectedPlan && (
        <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>🥗 {selectedPlan.name?.[locale] || selectedPlan.name?.ar}</h2>
              <button onClick={() => setSelectedPlan(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <span className="badge badge-gold">🎯 {t(`members.goals.${selectedPlan.goal}`)}</span>
                <span className="badge badge-info">👤 {selectedPlan.clientName || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                {[
                  { l: isAr ? 'سعرات' : 'Calories', v: selectedPlan.totalCalories, c: 'var(--pt-gold)' },
                  { l: isAr ? 'بروتين' : 'Protein', v: `${selectedPlan.proteinGrams}g`, c: 'var(--pt-danger)' },
                  { l: isAr ? 'كاربس' : 'Carbs', v: `${selectedPlan.carbsGrams}g`, c: 'var(--pt-info)' },
                  { l: isAr ? 'دهون' : 'Fat', v: `${selectedPlan.fatGrams}g`, c: 'var(--pt-warning)' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '10px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {(selectedPlan.meals || []).map((meal, i) => {
                const template = MEAL_TEMPLATES[meal.type] || MEAL_TEMPLATES.snack1;
                return (
                  <div key={i} style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                      {template.icon} {template[locale]} <span style={{ color: 'var(--pt-gray-500)', fontWeight: 400 }}>({template.time})</span>
                    </h4>
                    {(meal.items || []).map((item, j) => (
                      <div key={j} style={{ fontSize: 'var(--font-size-sm)', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.name}</span>
                        <span style={{ color: 'var(--pt-gray-500)', fontSize: '11px' }}>{item.calories} cal</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {selectedPlan.notes && (
                <div style={{ padding: 'var(--space-3)', background: 'rgba(245,197,24,0.05)', borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-3)' }}>
                  <strong>📝 {t('common.notes')}:</strong> {selectedPlan.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
