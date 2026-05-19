'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';
import toast from 'react-hot-toast';

export default function ClientMeasurementsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '', shoulders: '', bodyFat: '' });

  useEffect(() => {
    async function load() {
      if (!tenantId || !memberData) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'measurements',
          [{ field: 'memberId', operator: '==', value: memberData.id }],
          { field: 'createdAt', direction: 'desc' });
        setMeasurements(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (!memberLoading) load();
  }, [tenantId, memberData, memberLoading]);

  const handleAdd = async () => {
    if (!tenantId || !memberData) return;
    try {
      await addTenantDocument(tenantId, 'measurements', { memberId: memberData.id, ...Object.fromEntries(Object.entries(newEntry).map(([k, v]) => [k, v ? Number(v) : null])) });
      toast.success(isAr ? 'تم تسجيل القياس' : 'Measurement saved');
      setShowAddModal(false);
      setNewEntry({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '', shoulders: '', bodyFat: '' });
      const { data } = await getTenantDocuments(tenantId, 'measurements', [{ field: 'memberId', operator: '==', value: memberData.id }], { field: 'createdAt', direction: 'desc' });
      setMeasurements(data || []);
    } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  const toDate = (ts) => { if (!ts) return '-'; if (ts.toDate) return ts.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US'); if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'); return ts; };

  const bodyParts = [
    { key: 'chest', label: isAr ? 'الصدر' : 'Chest', icon: '🫁', color: '#FF5252' },
    { key: 'waist', label: isAr ? 'الخصر' : 'Waist', icon: '📏', color: '#4FC3F7' },
    { key: 'hips', label: isAr ? 'الأرداف' : 'Hips', icon: '🍑', color: '#FFD740' },
    { key: 'arms', label: isAr ? 'الذراع' : 'Arms', icon: '💪', color: '#00C853' },
    { key: 'thighs', label: isAr ? 'الفخذ' : 'Thighs', icon: '🦵', color: '#7C4DFF' },
    { key: 'shoulders', label: isAr ? 'الأكتاف' : 'Shoulders', icon: '🏋️', color: '#FF9100' },
  ];

  if (loading || memberLoading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📐</span> {isAr ? 'قياسات الجسم' : 'Body Measurements'}</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ {isAr ? 'تسجيل قياس' : 'New Entry'}</button>
      </div>

      {measurements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📐</div>
          <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>{isAr ? 'لا توجد قياسات بعد' : 'No measurements yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'سجل أول قياس لبدء تتبع تقدمك' : 'Record your first measurement to start tracking'}</p>
        </div>
      ) : (<>
        <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
          {[
            { v: latest?.weight, l: isAr ? 'الوزن (kg)' : 'Weight (kg)', d: oldest && latest ? (latest.weight || 0) - (oldest.weight || 0) : 0, lb: true, icon: '⚖️' },
            { v: (latest?.bodyFat || '-') + '%', l: isAr ? 'نسبة الدهون' : 'Body Fat %', d: oldest && latest ? (latest.bodyFat || 0) - (oldest.bodyFat || 0) : 0, lb: true, icon: '🔥' },
            { v: latest?.waist, l: isAr ? 'الخصر (cm)' : 'Waist (cm)', d: oldest && latest ? (latest.waist || 0) - (oldest.waist || 0) : 0, lb: true, icon: '📏' },
            { v: latest?.arms, l: isAr ? 'الذراع (cm)' : 'Arms (cm)', d: oldest && latest ? (latest.arms || 0) - (oldest.arms || 0) : 0, lb: false, icon: '💪' },
          ].map((s, i) => (<div key={i} className="stat-card"><div className="stat-icon">{s.icon}</div><div className="stat-info"><div className="stat-value">{s.v || '-'}</div><div className="stat-label">{s.l}</div>{measurements.length > 1 && <span style={{ fontSize: 'var(--font-size-xs)', color: (s.lb ? s.d < 0 : s.d > 0) ? 'var(--pt-success)' : 'var(--pt-danger)' }}>{s.d > 0 ? '+' : ''}{s.d}</span>}</div></div>))}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {isAr ? 'سجل القياسات' : 'Measurement History'}</h3>
          <table className="data-table"><thead><tr><th>{isAr ? 'التاريخ' : 'Date'}</th><th style={{ textAlign: 'center' }}>⚖️</th><th style={{ textAlign: 'center' }}>📏</th><th style={{ textAlign: 'center' }}>💪</th><th style={{ textAlign: 'center' }}>🔥</th></tr></thead><tbody>
            {measurements.map((m, i) => (<tr key={i} style={{ opacity: i === 0 ? 1 : 0.7 }}><td style={{ fontWeight: i === 0 ? 700 : 400 }}>{toDate(m.createdAt)}</td><td style={{ textAlign: 'center' }}>{m.weight || '-'}</td><td style={{ textAlign: 'center' }}>{m.waist || '-'}</td><td style={{ textAlign: 'center' }}>{m.arms || '-'}</td><td style={{ textAlign: 'center' }}>{m.bodyFat ? m.bodyFat + '%' : '-'}</td></tr>))}
          </tbody></table>
        </div>
      </>)}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>📐 {isAr ? 'تسجيل قياس جديد' : 'New Measurement'}</h2>
            <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="form-group"><label className="form-label">⚖️ {isAr ? 'الوزن (kg)' : 'Weight (kg)'}</label><input className="form-input" type="number" dir="ltr" step="0.1" value={newEntry.weight} onChange={e => setNewEntry({...newEntry, weight: e.target.value})} /></div>
              {bodyParts.map((bp, i) => (<div key={i} className="form-group"><label className="form-label">{bp.icon} {bp.label} (cm)</label><input className="form-input" type="number" dir="ltr" step="0.5" value={newEntry[bp.key]} onChange={e => setNewEntry({...newEntry, [bp.key]: e.target.value})} /></div>))}
              <div className="form-group"><label className="form-label">🔥 {isAr ? 'نسبة الدهون' : 'Body Fat %'}</label><input className="form-input" type="number" dir="ltr" step="0.1" value={newEntry.bodyFat} onChange={e => setNewEntry({...newEntry, bodyFat: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleAdd}>✓ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
