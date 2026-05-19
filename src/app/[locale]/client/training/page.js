'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';

export default function ClientTraining() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    async function load() {
      if (!tenantId || !memberData) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'training-programs',
          [{ field: 'memberId', operator: '==', value: memberData.id }, { field: 'status', operator: '==', value: 'active' }],
          { field: 'createdAt', direction: 'desc' }, 1);
        setProgram(data?.[0] || null);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (!memberLoading) load();
  }, [tenantId, memberData, memberLoading]);

  if (loading || memberLoading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  if (!program) return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>🏋️</span> {isAr ? 'برنامج التدريب' : 'Training Program'}</h1></div>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏋️</div>
        <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>{isAr ? 'لا يوجد برنامج تدريب حالياً' : 'No training program yet'}</h3>
        <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'سيقوم مدربك بإنشاء برنامج تدريب مخصص لك' : 'Your trainer will create a custom training program for you'}</p>
      </div>
    </div>
  );

  const days = program.days || [];
  const completedDays = days.filter(d => d.done).length;

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>🏋️</span> {isAr ? 'برنامج التدريب' : 'Training Program'}</h1></div>
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>{program.name || (isAr ? 'برنامج التدريب' : 'Training Program')}</h2>
            <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>👨‍🏫 {program.trainerName || '-'}</p>
          </div>
          {program.currentWeek && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{isAr ? `الأسبوع ${program.currentWeek}` : `Week ${program.currentWeek}`}</div>{program.totalWeeks && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? `من ${program.totalWeeks}` : `of ${program.totalWeeks}`}</div>}</div>}
        </div>
        {days.length > 0 && <div style={{ marginTop: 'var(--space-3)' }}><div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}><div style={{ width: `${(completedDays / days.length) * 100}%`, height: '100%', background: 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} /></div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginTop: '4px' }}>{completedDays}/{days.length} {isAr ? 'أيام مكتملة' : 'days completed'}</div></div>}
      </div>
      {days.length > 0 && (<>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
          {days.map((day, i) => (<button key={i} onClick={() => setSelectedDay(i)} className={`btn ${selectedDay === i ? 'btn-primary' : day.done ? 'btn-secondary' : 'btn-ghost'} btn-sm`} style={{ minWidth: 80, position: 'relative' }}>{day.done && <span style={{ position: 'absolute', top: -4, insetInlineEnd: -4, fontSize: '12px' }}>✅</span>}<div>{day.name || `${isAr ? 'يوم' : 'Day'} ${i+1}`}</div><div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>{day.focus || ''}</div></button>))}
        </div>
        {days[selectedDay]?.exercises?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {days[selectedDay].exercises.map((ex, i) => (<div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', opacity: ex.done ? 0.7 : 1 }}><div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: ex.done ? 'rgba(0,200,83,0.15)' : 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, color: ex.done ? 'var(--pt-success)' : 'var(--pt-gold)' }}>{ex.done ? '✓' : i + 1}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, marginBottom: '2px', textDecoration: ex.done ? 'line-through' : 'none' }}>{ex.name}</div><div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}><span>📊 {ex.sets} × {ex.reps}</span>{ex.weight && <span>🏋️ {ex.weight}</span>}</div></div></div>))}
          </div>
        ) : (<div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💪</div><p style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'لم تُضف تمارين لهذا اليوم بعد' : 'No exercises added for this day yet'}</p></div>)}
      </>)}
    </div>
  );
}
