'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const MUSCLE_GROUPS = {
  chest: { ar: 'صدر', en: 'Chest', icon: '🫁' },
  back: { ar: 'ظهر', en: 'Back', icon: '🔙' },
  shoulders: { ar: 'أكتاف', en: 'Shoulders', icon: '💪' },
  biceps: { ar: 'باي', en: 'Biceps', icon: '💪' },
  triceps: { ar: 'تراي', en: 'Triceps', icon: '💪' },
  legs: { ar: 'أرجل', en: 'Legs', icon: '🦵' },
  abs: { ar: 'بطن', en: 'Abs', icon: '🎯' },
  cardio: { ar: 'كارديو', en: 'Cardio', icon: '🏃' },
  full_body: { ar: 'جسم كامل', en: 'Full Body', icon: '🏋️' },
};

export default function TrainingProgramsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const [programs, setPrograms] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [form, setForm] = useState({
    name: { ar: '', en: '' },
    clientId: '',
    goal: 'muscle_gain',
    level: 'intermediate',
    daysPerWeek: 4,
    duration: 4,
    days: [
      { dayName: isAr ? 'يوم 1' : 'Day 1', muscleGroup: 'chest', exercises: [{ name: '', sets: 3, reps: 12, rest: 60, notes: '' }] },
    ],
    notes: '',
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId || !user) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'training_programs',
        [{ field: 'trainerId', operator: '==', value: user.uid }],
        { field: 'createdAt', direction: 'desc' });
      setPrograms(data || []);
      const { data: cls } = await getTenantDocuments(tenantId, 'members',
        [{ field: 'assignedTrainer', operator: '==', value: user.uid }]);
      setClients(cls || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addDay = () => {
    setForm(f => ({ ...f, days: [...f.days, { dayName: `${isAr ? 'يوم' : 'Day'} ${f.days.length + 1}`, muscleGroup: 'back', exercises: [{ name: '', sets: 3, reps: 12, rest: 60, notes: '' }] }] }));
  };

  const addExercise = (dayIndex) => {
    setForm(f => {
      const days = [...f.days];
      days[dayIndex] = { ...days[dayIndex], exercises: [...days[dayIndex].exercises, { name: '', sets: 3, reps: 12, rest: 60, notes: '' }] };
      return { ...f, days };
    });
  };

  const updateExercise = (dayIndex, exIndex, field, value) => {
    setForm(f => {
      const days = [...f.days];
      const exercises = [...days[dayIndex].exercises];
      exercises[exIndex] = { ...exercises[exIndex], [field]: ['name', 'notes'].includes(field) ? value : Number(value) };
      days[dayIndex] = { ...days[dayIndex], exercises };
      return { ...f, days };
    });
  };

  const removeDay = (dayIndex) => {
    setForm(f => ({ ...f, days: f.days.filter((_, i) => i !== dayIndex) }));
  };

  const handleSave = async () => {
    if (!tenantId || !user || !form.name.ar) return;
    try {
      const client = clients.find(c => c.id === form.clientId);
      await addTenantDocument(tenantId, 'training_programs', {
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

  const deleteProgram = async (id) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'training_programs', id);
    toast.success(t('common.success'));
    loadData();
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏋️</span> {t('trainer.trainingPrograms')}</h1>
        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>+ {t('trainer.createProgram')}</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : programs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏋️</div>
          <h3>{isAr ? 'لا توجد برامج تدريب' : 'No training programs yet'}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {programs.map(prog => (
            <div key={prog.id} className="card" style={{ borderInlineStart: '3px solid var(--pt-info)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)' }}>{prog.name?.[locale] || prog.name?.ar}</h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>👤 {prog.clientName || '-'}</p>
                </div>
                <span className="badge badge-gold" style={{ fontSize: '10px' }}>🎯 {t(`members.goals.${prog.goal}`)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{prog.daysPerWeek}</div>
                  <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>{isAr ? 'أيام/أسبوع' : 'days/week'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--pt-info)' }}>{prog.days?.length || 0}</div>
                  <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>{isAr ? 'أيام تدريب' : 'workout days'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--pt-success)' }}>{prog.duration}</div>
                  <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>{isAr ? 'أسابيع' : 'weeks'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                {(prog.days || []).map((d, i) => {
                  const mg = MUSCLE_GROUPS[d.muscleGroup] || MUSCLE_GROUPS.full_body;
                  return <span key={i} className="badge badge-info" style={{ fontSize: '9px' }}>{mg.icon} {mg[locale]}</span>;
                })}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProgram(prog)}>👁️ {t('common.view')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteProgram(prog.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Program Builder Modal */}
      {showBuilder && (
        <div className="modal-overlay" onClick={() => setShowBuilder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>🏋️ {t('trainer.createProgram')}</h2>
              <button onClick={() => setShowBuilder(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم البرنامج' : 'Program Name'} *</label>
                  <input className="form-input" value={form.name.ar} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ar: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('trainer.assignToClient')}</label>
                  <select className="form-select" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">{t('common.select')}...</option>
                    {clients.map(c => (<option key={c.id} value={c.id}>{c.fullName?.[locale] || c.fullName?.ar}</option>))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المستوى' : 'Level'}</label>
                  <select className="form-select" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                    <option value="beginner">{isAr ? 'مبتدئ' : 'Beginner'}</option>
                    <option value="intermediate">{isAr ? 'متوسط' : 'Intermediate'}</option>
                    <option value="advanced">{isAr ? 'متقدم' : 'Advanced'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'أيام/أسبوع' : 'Days/Week'}</label>
                  <input className="form-input" type="number" dir="ltr" min={1} max={7} value={form.daysPerWeek} onChange={e => setForm(f => ({ ...f, daysPerWeek: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'مدة (أسابيع)' : 'Duration (weeks)'}</label>
                  <input className="form-input" type="number" dir="ltr" min={1} max={52} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
                </div>
              </div>

              {/* Workout Days */}
              <h4 style={{ marginBottom: 'var(--space-3)' }}>📅 {isAr ? 'أيام التمرين' : 'Workout Days'}</h4>
              {form.days.map((day, di) => (
                <div key={di} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input className="form-input" value={day.dayName} style={{ width: 120, padding: '4px 8px', fontSize: '12px' }}
                        onChange={e => { const days = [...form.days]; days[di] = { ...days[di], dayName: e.target.value }; setForm(f => ({ ...f, days })); }} />
                      <select className="form-select" value={day.muscleGroup} style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                        onChange={e => { const days = [...form.days]; days[di] = { ...days[di], muscleGroup: e.target.value }; setForm(f => ({ ...f, days })); }}>
                        {Object.entries(MUSCLE_GROUPS).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
                      </select>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeDay(di)} style={{ color: 'var(--pt-danger)' }}>✕</button>
                  </div>
                  {/* Exercises Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--pt-gray-500)', fontWeight: 600 }}>{isAr ? 'التمرين' : 'Exercise'}</span>
                    <span style={{ fontSize: '10px', color: 'var(--pt-gray-500)', fontWeight: 600 }}>{isAr ? 'مجموعات' : 'Sets'}</span>
                    <span style={{ fontSize: '10px', color: 'var(--pt-gray-500)', fontWeight: 600 }}>{isAr ? 'تكرارات' : 'Reps'}</span>
                    <span style={{ fontSize: '10px', color: 'var(--pt-gray-500)', fontWeight: 600 }}>{isAr ? 'راحة (ث)' : 'Rest (s)'}</span>
                  </div>
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <input className="form-input" value={ex.name} placeholder={isAr ? 'بنش بريس' : 'Bench Press'} style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateExercise(di, ei, 'name', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={ex.sets} style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateExercise(di, ei, 'sets', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={ex.reps} style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateExercise(di, ei, 'reps', e.target.value)} />
                      <input className="form-input" type="number" dir="ltr" value={ex.rest} style={{ padding: '6px 8px', fontSize: '12px' }}
                        onChange={e => updateExercise(di, ei, 'rest', e.target.value)} />
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={() => addExercise(di)} style={{ fontSize: '11px', marginTop: 'var(--space-1)' }}>+ {isAr ? 'إضافة تمرين' : 'Add Exercise'}</button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={addDay}>+ {isAr ? 'إضافة يوم' : 'Add Day'}</button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBuilder(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.ar}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Program Modal */}
      {selectedProgram && (
        <div className="modal-overlay" onClick={() => setSelectedProgram(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>🏋️ {selectedProgram.name?.[locale] || selectedProgram.name?.ar}</h2>
              <button onClick={() => setSelectedProgram(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <span className="badge badge-gold">🎯 {t(`members.goals.${selectedProgram.goal}`)}</span>
                <span className="badge badge-info">👤 {selectedProgram.clientName || '-'}</span>
                <span className="badge badge-success">{selectedProgram.daysPerWeek} {isAr ? 'أيام/أسبوع' : 'days/week'}</span>
                <span className="badge badge-warning">{selectedProgram.duration} {isAr ? 'أسابيع' : 'weeks'}</span>
              </div>
              {(selectedProgram.days || []).map((day, di) => {
                const mg = MUSCLE_GROUPS[day.muscleGroup] || MUSCLE_GROUPS.full_body;
                return (
                  <div key={di} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ background: 'var(--pt-gold-glow)', width: 28, height: 28, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--pt-gold)' }}>{di + 1}</span>
                      {day.dayName} — {mg.icon} {mg[locale]}
                    </h4>
                    <div className="table-container">
                      <table className="data-table" style={{ fontSize: 'var(--font-size-sm)' }}>
                        <thead><tr>
                          <th>{isAr ? 'التمرين' : 'Exercise'}</th>
                          <th>{isAr ? 'مجموعات' : 'Sets'}</th>
                          <th>{isAr ? 'تكرارات' : 'Reps'}</th>
                          <th>{isAr ? 'راحة' : 'Rest'}</th>
                        </tr></thead>
                        <tbody>
                          {(day.exercises || []).map((ex, ei) => (
                            <tr key={ei}>
                              <td style={{ fontWeight: 600 }}>{ex.name || '-'}</td>
                              <td style={{ color: 'var(--pt-gold)' }}>{ex.sets}</td>
                              <td>{ex.reps}</td>
                              <td style={{ color: 'var(--pt-gray-500)' }}>{ex.rest}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
