'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

export default function TrainersPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: { ar: '', en: '' }, phone: '', email: '', specialization: '',
    commission: 10, status: 'active', gender: 'male',
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'trainers', [],
        { field: 'createdAt', direction: 'desc' });
      
      // Enrich with client counts
      const { data: members } = await getTenantDocuments(tenantId, 'members');
      const enriched = (data || []).map(tr => {
        const clientCount = (members || []).filter(m => m.assignedTrainer === tr.id).length;
        return { ...tr, clientCount };
      });
      setTrainers(enriched);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.name.ar) return;
    setSaving(true);
    try {
      const result = await addTenantDocument(tenantId, 'trainers', {
        ...form, rating: 0, totalSessions: 0, monthlyEarnings: 0,
      });
      if (result.error) {
        console.error('[Trainers] Add failed:', result.error);
        throw new Error(result.error);
      }
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ name: { ar: '', en: '' }, phone: '', email: '', specialization: '', commission: 10, status: 'active', gender: 'male' });
      loadData();
    } catch (err) {
      console.error('[Trainers] Error:', err);
      toast.error(t('common.error'));
    }
    setSaving(false);
  };

  const toggleStatus = async (trainer) => {
    if (!tenantId) return;
    const newStatus = trainer.status === 'active' ? 'inactive' : 'active';
    await updateTenantDocument(tenantId, 'trainers', trainer.id, { status: newStatus });
    toast.success(t('common.success'));
    loadData();
  };

  const handleDelete = async () => {
    if (!tenantId || !showDeleteModal) return;
    await deleteTenantDocument(tenantId, 'trainers', showDeleteModal);
    toast.success(t('common.success'));
    setShowDeleteModal(null);
    loadData();
  };

  const totalClients = trainers.reduce((s, tr) => s + (tr.clientCount || 0), 0);
  const avgRating = trainers.length > 0 ? (trainers.reduce((s, tr) => s + (tr.rating || 0), 0) / trainers.length).toFixed(1) : '0.0';

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👨‍🏫</span> {t('sidebar.trainers')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'إضافة مدرب' : 'Add Trainer'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">👨‍🏫</div>
          <div className="stat-info">
            <div className="stat-value">{trainers.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي المدربين' : 'Total Trainers'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{trainers.filter(tr => tr.status === 'active').length}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">👥</div>
          <div className="stat-info">
            <div className="stat-value">{totalClients}</div>
            <div className="stat-label">{isAr ? 'إجمالي العملاء' : 'Total Clients'}</div>
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

      {/* Trainers Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : trainers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>👨‍🏫</div>
          <h3>{isAr ? 'لا يوجد مدربين بعد' : 'No trainers yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', marginBottom: 'var(--space-4)' }}>
            {isAr ? 'أضف أول مدرب لبدء إدارة فريقك' : 'Add your first trainer to start managing your team'}
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'إضافة مدرب' : 'Add Trainer'}</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {trainers.map(trainer => (
            <div key={trainer.id} className="card" style={{ display: 'flex', gap: 'var(--space-5)', opacity: trainer.status === 'active' ? 1 : 0.6 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius-full)',
                background: 'var(--pt-gold-glow)', color: 'var(--pt-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, flexShrink: 0,
                border: '2px solid rgba(245,197,24,0.3)',
              }}>
                {(trainer.name?.[locale] || trainer.name?.ar || '?').charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{trainer.name?.[locale] || trainer.name?.ar}</h3>
                  <span className={`badge ${trainer.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {trainer.status === 'active' ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
                  🎯 {trainer.specialization || '-'} &nbsp;|&nbsp; 📞 <span dir="ltr">{trainer.phone}</span>
                  {trainer.email && <>&nbsp;|&nbsp; 📧 {trainer.email}</>}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>👥 </span>
                    <span style={{ fontWeight: 700 }}>{trainer.clientCount || 0}</span>
                    <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}> {isAr ? 'عميل' : 'clients'}</span>
                  </div>
                  <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>⭐ {(trainer.rating || 0).toFixed(1)}</span>
                  </div>
                  <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>💰 </span>
                    <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{trainer.commission || 0}%</span>
                  </div>
                  <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                      {trainer.gender === 'male' ? '♂' : '♀'} {t(`common.${trainer.gender}`)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(trainer)}>
                    {trainer.status === 'active' ? '⏸️' : '▶️'} {trainer.status === 'active' ? (isAr ? 'تعطيل' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(trainer.id)} style={{ color: 'var(--pt-danger)' }}>
                    🗑️ {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>👨‍🏫 {isAr ? 'إضافة مدرب' : 'Add Trainer'}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                  <input className="form-input" value={form.name.ar} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ar: e.target.value } }))} placeholder={isAr ? 'كابتن أحمد' : 'Captain Ahmed'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                  <input className="form-input" dir="ltr" value={form.name.en} onChange={e => setForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} placeholder="Coach Ahmed" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('members.phone')}</label>
                  <input className="form-input" dir="ltr" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01012345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input className="form-input" dir="ltr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'التخصص' : 'Specialization'}</label>
                  <input className="form-input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder={isAr ? 'كمال أجسام' : 'Bodybuilding'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'العمولة %' : 'Commission %'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} min={0} max={100} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('members.gender')}</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="male">{t('common.male')}</option>
                    <option value="female">{t('common.female')}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.name.ar}>
                {saving ? '⏳' : '✅'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>⚠️ {t('common.confirm')}</h2>
              <button onClick={() => setShowDeleteModal(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🗑️</div>
              <p>{isAr ? 'هل أنت متأكد من حذف هذا المدرب؟' : 'Delete this trainer?'}</p>
              <p style={{ color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'لا يمكن التراجع' : 'This cannot be undone'}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
