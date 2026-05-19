'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';

export default function ClientDietPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId || !memberData) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'diet-plans',
          [{ field: 'memberId', operator: '==', value: memberData.id }, { field: 'status', operator: '==', value: 'active' }],
          { field: 'createdAt', direction: 'desc' }, 1);
        setDietPlan(data?.[0] || null);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (!memberLoading) load();
  }, [tenantId, memberData, memberLoading]);

  if (loading || memberLoading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  if (!dietPlan) return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>🥗</span> {t('client.myDietPlan')}</h1></div>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🥗</div>
        <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>{isAr ? 'لا يوجد نظام غذائي حالياً' : 'No diet plan yet'}</h3>
        <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'سيقوم مدربك بإنشاء خطة غذائية مخصصة لك' : 'Your trainer will create a custom diet plan for you'}</p>
      </div>
    </div>
  );

  const meals = dietPlan.meals || [];
  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>🥗</span> {t('client.myDietPlan')}</h1></div>
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>{dietPlan.name || (isAr ? 'النظام الغذائي' : 'Diet Plan')}</h2>
        <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>👨‍🏫 {dietPlan.trainerName || '-'}</p>
        {dietPlan.calories && <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-4)' }}><span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>🔥 {dietPlan.calories} {isAr ? 'سعرة' : 'cal'}</span>{dietPlan.protein && <span>💪 {dietPlan.protein}g</span>}{dietPlan.carbs && <span>🍞 {dietPlan.carbs}g</span>}{dietPlan.fat && <span>🥑 {dietPlan.fat}g</span>}</div>}
      </div>
      {meals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {meals.map((meal, i) => (<div key={i} className="card"><h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--pt-gold)' }}>{meal.name || `${isAr ? 'وجبة' : 'Meal'} ${i+1}`}</h3>{meal.items?.map((item, j) => (<div key={j} style={{ padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'space-between' }}><span>{item.name}</span><span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>{item.quantity || ''}</span></div>))}</div>))}
        </div>
      ) : (<div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}><p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'لم تُضف وجبات بعد' : 'No meals added yet'}</p></div>)}
    </div>
  );
}
