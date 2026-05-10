'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function TrainerProgressPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({ weight: '', bodyFat: '', muscle: '', chest: '', waist: '', arms: '', thighs: '' });

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'assignedTrainer', operator: '==', value: user.uid }],
          { field: 'fullName.ar', direction: 'asc' });
        setClients(data || []);
        if (data?.length > 0) setSelectedClient(data[0].id);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

  useEffect(() => {
    async function loadMeasurements() {
      if (!tenantId || !selectedClient) { setMeasurements([]); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'measurements',
          [{ field: 'memberId', operator: '==', value: selectedClient }],
          { field: 'date', direction: 'asc' });
        setMeasurements(data || []);
      } catch (err) { console.error(err); }
    }
    loadMeasurements();
  }, [tenantId, selectedClient]);

  const handleAddMeasurement = async () => {
    if (!tenantId || !selectedClient) return;
    setSaving(true);
    try {
      const entry = {
        memberId: selectedClient,
        trainerId: user.uid,
        date: Timestamp.fromDate(new Date()),
        weight: Number(newMeasurement.weight) || 0,
        bodyFat: Number(newMeasurement.bodyFat) || 0,
        muscle: Number(newMeasurement.muscle) || 0,
        chest: Number(newMeasurement.chest) || 0,
        waist: Number(newMeasurement.waist) || 0,
        arms: Number(newMeasurement.arms) || 0,
        thighs: Number(newMeasurement.thighs) || 0,
      };
      await addTenantDocument(tenantId, 'measurements', entry);
      setMeasurements(prev => [...prev, { ...entry, id: Date.now().toString() }]);
      setShowAddForm(false);
      setNewMeasurement({ weight: '', bodyFat: '', muscle: '', chest: '', waist: '', arms: '', thighs: '' });
      toast.success(isAr ? 'تم حفظ القياس ✅' : 'Measurement saved ✅');
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ' : 'Error saving');
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  const first = measurements[0];
  const last = measurements[measurements.length - 1];
  const changes = first && last ? {
    weight: (last.weight || 0) - (first.weight || 0),
    bodyFat: (last.bodyFat || 0) - (first.bodyFat || 0),
    muscle: (last.muscle || 0) - (first.muscle || 0),
  } : { weight: 0, bodyFat: 0, muscle: 0 };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {t('trainer.progress')}</h1>
        {clients.length > 0 && (
          <select className="form-select" value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ width: 'auto' }}>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.fullName?.[locale] || c.fullName?.ar}</option>
            ))}
          </select>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📊</div>
          <h3>{isAr ? 'لا يوجد عملاء' : 'No clients'}</h3>
        </div>
      ) : (
        <>
          {last && (
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="stat-card" style={{ borderTop: `3px solid ${changes.weight <= 0 ? 'var(--pt-success)' : 'var(--pt-gold)'}` }}>
                <div className="stat-icon gold">⚖️</div>
                <div className="stat-info">
                  <div className="stat-value">{last.weight} <span style={{ fontSize: 'var(--font-size-sm)' }}>kg</span></div>
                  <div className="stat-label">{isAr ? 'الوزن الحالي' : 'Current Weight'}</div>
                  {changes.weight !== 0 && <span className={`stat-change ${changes.weight <= 0 ? 'up' : 'down'}`}>{changes.weight > 0 ? '+' : ''}{changes.weight} kg</span>}
                </div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #FF5252' }}>
                <div className="stat-icon danger">🔥</div>
                <div className="stat-info">
                  <div className="stat-value">{last.bodyFat}%</div>
                  <div className="stat-label">{isAr ? 'نسبة الدهون' : 'Body Fat'}</div>
                </div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #4FC3F7' }}>
                <div className="stat-icon info">💪</div>
                <div className="stat-info">
                  <div className="stat-value">{last.muscle} <span style={{ fontSize: 'var(--font-size-sm)' }}>kg</span></div>
                  <div className="stat-label">{isAr ? 'الكتلة العضلية' : 'Muscle Mass'}</div>
                </div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid var(--pt-gold)' }}>
                <div className="stat-icon gold">📅</div>
                <div className="stat-info">
                  <div className="stat-value">{measurements.length}</div>
                  <div className="stat-label">{isAr ? 'عدد القياسات' : 'Measurements'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Weight Chart */}
          {measurements.length > 1 && (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-5)' }}>📈 {isAr ? 'تطور الوزن' : 'Weight Progress'}</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 200, padding: 'var(--space-4) 0' }}>
                {measurements.map((m, i) => {
                  const minW = Math.min(...measurements.map(x => x.weight || 0));
                  const maxW = Math.max(...measurements.map(x => x.weight || 0));
                  const range = maxW - minW || 1;
                  const heightPercent = (((m.weight || 0) - minW) / range) * 80 + 20;
                  const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700 }}>{m.weight}</span>
                      <div style={{ width: '100%', maxWidth: 48, height: `${heightPercent}%`, background: i === measurements.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.3)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'height 0.5s ease' }} />
                      <span style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Measurements Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3>📋 {isAr ? 'سجل القياسات' : 'Measurement Log'}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>+ {isAr ? 'قياس جديد' : 'New Measurement'}</button>
            </div>
            {measurements.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>📭 {isAr ? 'لا توجد قياسات بعد' : 'No measurements yet'}</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                    <th>{isAr ? 'الوزن' : 'Weight'} (kg)</th>
                    <th>{isAr ? 'دهون' : 'Fat'} %</th>
                    <th>{isAr ? 'عضلات' : 'Muscle'} (kg)</th>
                    <th>{isAr ? 'صدر' : 'Chest'}</th>
                    <th>{isAr ? 'وسط' : 'Waist'}</th>
                    <th>{isAr ? 'ذراع' : 'Arms'}</th>
                    <th>{isAr ? 'فخذ' : 'Thighs'}</th>
                  </tr></thead>
                  <tbody>
                    {[...measurements].reverse().map((m, i) => {
                      const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
                      return (
                        <tr key={m.id || i}>
                          <td style={{ fontWeight: 600 }}>{d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</td>
                          <td>{m.weight || '-'}</td>
                          <td style={{ color: 'var(--pt-danger)' }}>{m.bodyFat ? `${m.bodyFat}%` : '-'}</td>
                          <td style={{ color: '#4FC3F7' }}>{m.muscle || '-'}</td>
                          <td>{m.chest || '-'}</td>
                          <td>{m.waist || '-'}</td>
                          <td>{m.arms || '-'}</td>
                          <td>{m.thighs || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Measurement Modal */}
          {showAddForm && (
            <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                  <h2>📏 {isAr ? 'قياس جديد' : 'New Measurement'}</h2>
                  <button onClick={() => setShowAddForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                    {[
                      { key: 'weight', label: isAr ? 'الوزن (kg)' : 'Weight (kg)' },
                      { key: 'bodyFat', label: isAr ? 'دهون %' : 'Fat %' },
                      { key: 'muscle', label: isAr ? 'عضلات (kg)' : 'Muscle (kg)' },
                      { key: 'chest', label: isAr ? 'صدر (cm)' : 'Chest (cm)' },
                      { key: 'waist', label: isAr ? 'وسط (cm)' : 'Waist (cm)' },
                      { key: 'arms', label: isAr ? 'ذراع (cm)' : 'Arms (cm)' },
                      { key: 'thighs', label: isAr ? 'فخذ (cm)' : 'Thighs (cm)' },
                    ].map(f => (
                      <div key={f.key} className="form-group">
                        <label className="form-label" style={{ fontSize: '10px' }}>{f.label}</label>
                        <input className="form-input" type="number" dir="ltr" value={newMeasurement[f.key]}
                          onChange={e => setNewMeasurement(p => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>{t('common.cancel')}</button>
                  <button className="btn btn-primary" onClick={handleAddMeasurement} disabled={saving || !newMeasurement.weight}>
                    {saving ? '⏳' : '✅'} {t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
