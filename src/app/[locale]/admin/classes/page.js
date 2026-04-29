'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

const CLASS_CATEGORIES = {
  strength: { ar: 'قوة', en: 'Strength', icon: '🏋️' },
  cardio: { ar: 'كارديو', en: 'Cardio', icon: '🏃' },
  dance: { ar: 'رقص', en: 'Dance', icon: '💃' },
  combat: { ar: 'قتال', en: 'Combat', icon: '🥊' },
  wellness: { ar: 'عافية', en: 'Wellness', icon: '🧘' },
  functional: { ar: 'وظيفي', en: 'Functional', icon: '⚡' },
};

export default function ClassesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: { ar: '', en: '' }, category: 'strength', trainerId: '',
    days: '', time: '', capacity: 20, price: 150, gender: 'mixed',
    icon: '🏋️', color: '#F5C518', isActive: true,
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'classes', [],
        { field: 'createdAt', direction: 'desc' });
      setClasses(data || []);
      const { data: trs } = await getTenantDocuments(tenantId, 'trainers',
        [{ field: 'status', operator: '==', value: 'active' }]);
      setTrainers(trs || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.name.ar) return;
    setSaving(true);
    try {
      const trainer = trainers.find(tr => tr.id === form.trainerId);
      await addTenantDocument(tenantId, 'classes', {
        ...form,
        trainerName: trainer?.name?.[locale] || trainer?.name?.ar || '',
        enrolled: 0, rating: 0, totalRatings: 0,
      });
      toast.success(t('common.success'));
      setShowModal(false);
      setForm({ name: { ar: '', en: '' }, category: 'strength', trainerId: '', days: '', time: '', capacity: 20, price: 150, gender: 'mixed', icon: '🏋️', color: '#F5C518', isActive: true });
      loadData();
    } catch (err) {
      toast.error(t('common.error'));
    }
    setSaving(false);
  };

  const toggleClass = async (cls) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'classes', cls.id, { isActive: !cls.isActive });
    loadData();
  };

  const deleteClass = async (classId) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'classes', classId);
    toast.success(t('common.success'));
    loadData();
  };

  const filters = [
    { id: 'all', label: isAr ? 'الكل' : 'All', icon: '📋' },
    ...Object.entries(CLASS_CATEGORIES).map(([k, v]) => ({ id: k, label: v[locale], icon: v.icon })),
  ];

  const filtered = activeFilter === 'all' ? classes : classes.filter(c => c.category === activeFilter);
  const totalEnrolled = classes.reduce((a, c) => a + (c.enrolled || 0), 0);
  const totalCapacity = classes.reduce((a, c) => a + (c.capacity || 0), 0);
  const avgRating = classes.length > 0 ? (classes.reduce((a, c) => a + (c.rating || 0), 0) / classes.length).toFixed(1) : '0.0';

  const iconOptions = ['🏋️', '💃', '🧘', '🥊', '🏃', '🚴', '⚡', '🤸', '🩰', '💪', '🥗', '🧖'];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏋️</span> {t('sidebar.classes')}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {isAr ? 'حصة جديدة' : 'Add Class'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📚</div>
          <div className="stat-info">
            <div className="stat-value">{classes.length}</div>
            <div className="stat-label">{isAr ? 'حصص متاحة' : 'Available Classes'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">👥</div>
          <div className="stat-info">
            <div className="stat-value">{totalEnrolled}</div>
            <div className="stat-label">{isAr ? 'إجمالي المسجلين' : 'Total Enrolled'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📊</div>
          <div className="stat-info">
            <div className="stat-value">{totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0}%</div>
            <div className="stat-label">{isAr ? 'نسبة الإشغال' : 'Occupancy Rate'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">⭐</div>
          <div className="stat-info">
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">{isAr ? 'متوسط التقييم' : 'Avg Rating'}</div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)}
            className={`btn ${activeFilter === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ whiteSpace: 'nowrap' }}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏋️</div>
          <h3>{isAr ? 'لا توجد حصص' : 'No classes yet'}</h3>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowModal(true)}>+ {isAr ? 'حصة جديدة' : 'Add Class'}</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(cls => {
            const pct = cls.capacity > 0 ? Math.round(((cls.enrolled || 0) / cls.capacity) * 100) : 0;
            const isFull = (cls.enrolled || 0) >= cls.capacity;
            const catInfo = CLASS_CATEGORIES[cls.category] || CLASS_CATEGORIES.strength;
            return (
              <div key={cls.id} className="card" style={{
                position: 'relative',
                borderTop: `3px solid ${cls.color || 'var(--pt-gold)'}`,
                opacity: cls.isActive === false ? 0.5 : 1,
              }}>
                <span className={`badge ${cls.gender === 'female' ? 'badge-info' : cls.gender === 'male' ? 'badge-gold' : 'badge-success'}`}
                  style={{ position: 'absolute', top: 'var(--space-4)', insetInlineEnd: 'var(--space-4)', fontSize: '10px' }}>
                  {cls.gender === 'female' ? '♀' : cls.gender === 'male' ? '♂' : '♂♀'} {cls.gender === 'mixed' ? (isAr ? 'مختلط' : 'Mixed') : t(`common.${cls.gender}`)}
                </span>

                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${cls.color || 'var(--pt-gold)'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                    {cls.icon || catInfo.icon}
                  </div>
                  <div>
                    <h3>{cls.name?.[locale] || cls.name?.ar}</h3>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {cls.trainerName || '-'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--pt-gray-400)' }}>📅 {cls.days || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--pt-gray-400)' }}>⏰ {cls.time || '-'}</span>
                    <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{cls.price || 0} {t('common.egp')}</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                    <span>👥 {cls.enrolled || 0}/{cls.capacity} {isAr ? 'مسجل' : 'enrolled'}</span>
                    <span style={{ fontWeight: 700, color: isFull ? 'var(--pt-danger)' : pct >= 80 ? 'var(--pt-warning)' : 'var(--pt-success)' }}>
                      {isFull ? (isAr ? '🔴 مكتمل' : '🔴 Full') : `${pct}%`}
                    </span>
                  </div>
                  <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: isFull ? 'var(--pt-danger)' : cls.color || 'var(--pt-gold)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                    ⭐ {(cls.rating || 0).toFixed(1)}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleClass(cls)}>
                      {cls.isActive !== false ? '⏸️' : '▶️'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteClass(cls.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Class Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h2>🏋️ {isAr ? 'حصة جديدة' : 'New Class'}</h2>
              <button onClick={() => setShowModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم الحصة (عربي)' : 'Class Name (Arabic)'} *</label>
                  <input className="form-input" value={form.name.ar} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ar: e.target.value } }))} placeholder={isAr ? 'زومبا' : 'Zumba'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم الحصة (إنجليزي)' : 'Class Name (English)'}</label>
                  <input className="form-input" dir="ltr" value={form.name.en} onChange={e => setForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} placeholder="Zumba" />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الفئة' : 'Category'}</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(CLASS_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v[locale]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المدرب' : 'Trainer'}</label>
                  <select className="form-select" value={form.trainerId} onChange={e => setForm(f => ({ ...f, trainerId: e.target.value }))}>
                    <option value="">{t('common.select')}...</option>
                    {trainers.map(tr => (
                      <option key={tr.id} value={tr.id}>{tr.name?.[locale] || tr.name?.ar}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الأيام' : 'Days'}</label>
                  <input className="form-input" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} placeholder={isAr ? 'السبت والثلاثاء' : 'Sat & Tue'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الوقت' : 'Time'}</label>
                  <input className="form-input" dir="ltr" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="16:00 - 17:00" />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'السعة' : 'Capacity'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'السعر' : 'Price'} ({t('common.egp')})</label>
                  <input className="form-input" type="number" dir="ltr" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الأيقونة' : 'Icon'}</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {iconOptions.map(ic => (
                      <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: form.icon === ic ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)',
                        background: form.icon === ic ? 'var(--pt-gold-glow)' : 'var(--pt-darker)', cursor: 'pointer', fontSize: '1rem',
                      }}>{ic}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الجنس' : 'Gender'}</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="mixed">♂♀ {isAr ? 'مختلط' : 'Mixed'}</option>
                    <option value="male">♂ {t('common.male')}</option>
                    <option value="female">♀ {t('common.female')}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.name.ar}>
                {saving ? '⏳' : '✅'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
