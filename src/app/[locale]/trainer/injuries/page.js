'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';
import toast from 'react-hot-toast';

export default function TrainerInjuryLogPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useTrainerClients();
  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ memberId: '', injury: '', severity: 'mild', followUp: '', restrictions: '' });

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) return;
      setLoading(true);
      try {
        const { data } = await getTenantDocuments(tenantId, 'injuries',
          [{ field: 'trainerId', operator: '==', value: user.uid }],
          { field: 'createdAt', direction: 'desc' });
        setInjuries(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

  const handleSave = async () => {
    if (!tenantId || !form.memberId || !form.injury) return;
    setSaving(true);
    try {
      const client = clients.find(c => c.id === form.memberId);
      await addTenantDocument(tenantId, 'injuries', {
        memberId: form.memberId,
        memberName: client?.fullName || {},
        trainerId: user?.uid,
        injury: form.injury,
        severity: form.severity,
        status: 'active',
        followUp: form.followUp,
        restrictions: form.restrictions.split('\n').filter(Boolean),
      });
      toast.success(isAr ? 'تم التسجيل ✅' : 'Injury logged ✅');
      setShowModal(false);
      setForm({ memberId: '', injury: '', severity: 'mild', followUp: '', restrictions: '' });
      // Reload
      const { data } = await getTenantDocuments(tenantId, 'injuries',
        [{ field: 'trainerId', operator: '==', value: user.uid }],
        { field: 'createdAt', direction: 'desc' });
      setInjuries(data || []);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Error');
    }
    setSaving(false);
  };

  const sevColors = { mild: '#4FC3F7', moderate: '#FF9100', severe: '#FF5252' };
  const statusColors = { active: '#FF5252', recovering: '#FF9100', recovered: '#00C853' };
  const statusLabels = {
    active: isAr ? '🔴 نشط' : '🔴 Active',
    recovering: isAr ? '🟡 يتعافى' : '🟡 Recovering',
    recovered: isAr ? '🟢 تعافى' : '🟢 Recovered',
  };

  if (clientsLoading || loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏥</span> {isAr ? 'سجل الإصابات' : 'Injury Log'}</h1>
        {clients.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {isAr ? 'إصابة جديدة' : 'Log Injury'}</button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: injuries.filter(i => i.status === 'active').length, l: isAr ? 'إصابات نشطة' : 'Active', color: '#FF5252', icon: '🔴' },
          { v: injuries.filter(i => i.status === 'recovering').length, l: isAr ? 'في التعافي' : 'Recovering', color: '#FF9100', icon: '🟡' },
          { v: injuries.filter(i => i.status === 'recovered').length, l: isAr ? 'تعافوا' : 'Recovered', color: '#00C853', icon: '🟢' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {injuries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏥</div>
          <h3>{isAr ? 'لا توجد إصابات مسجلة' : 'No injuries logged'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'سجل الإصابات فارغ — هذا شيء جيد!' : 'Injury log is empty — that\'s a good thing!'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {injuries.map((inj, i) => {
            const name = inj.memberName?.[locale] || inj.memberName?.ar || '';
            return (
              <div key={inj.id || i} className="card" style={{ borderInlineStart: `4px solid ${statusColors[inj.status] || '#FF5252'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>{name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>📅 {inj.createdAt?.toDate ? inj.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${sevColors[inj.severity] || '#4FC3F7'}15`, color: sevColors[inj.severity] || '#4FC3F7', fontWeight: 700 }}>
                      {inj.severity || 'mild'}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${statusColors[inj.status] || '#FF5252'}15`, color: statusColors[inj.status] || '#FF5252', fontWeight: 700 }}>
                      {statusLabels[inj.status] || statusLabels.active}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 'var(--space-2)', background: 'rgba(255,145,0,0.04)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                  🏥 {inj.injury}
                </div>
                {inj.restrictions?.length > 0 && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 700, fontSize: '10px', color: '#FF5252', marginBottom: 'var(--space-1)' }}>⛔ {isAr ? 'القيود' : 'Restrictions'}</div>
                    {inj.restrictions.map((r, j) => (
                      <div key={j} style={{ fontSize: '11px', color: 'var(--pt-gray-400)', padding: '2px 0', display: 'flex', gap: '4px' }}>
                        <span>•</span> {r}
                      </div>
                    ))}
                  </div>
                )}
                {inj.followUp && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: '10px', color: 'var(--pt-gray-600)' }}>
                    📋 {isAr ? 'موعد المتابعة:' : 'Follow-up:'} <strong style={{ color: 'var(--pt-gold)' }}>{inj.followUp}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Injury Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>🏥 {isAr ? 'تسجيل إصابة جديدة' : 'Log New Injury'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">{isAr ? 'العميل' : 'Client'} *</label>
                <select className="form-select" value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}>
                  <option value="">{isAr ? 'اختر العميل' : 'Select Client'}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName?.[locale] || c.fullName?.ar}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'وصف الإصابة' : 'Injury Description'} *</label>
                <textarea className="form-input" rows={2} value={form.injury} onChange={e => setForm(f => ({ ...f, injury: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الشدة' : 'Severity'}</label>
                  <select className="form-select" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    <option value="mild">🟢 {isAr ? 'خفيفة' : 'Mild'}</option>
                    <option value="moderate">🟡 {isAr ? 'متوسطة' : 'Moderate'}</option>
                    <option value="severe">🔴 {isAr ? 'شديدة' : 'Severe'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'موعد المتابعة' : 'Follow-up Date'}</label>
                  <input className="form-input" type="date" value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'القيود (سطر لكل قيد)' : 'Restrictions (one per line)'}</label>
                <textarea className="form-input" rows={3} value={form.restrictions} onChange={e => setForm(f => ({ ...f, restrictions: e.target.value }))} style={{ resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.memberId || !form.injury}>
                {saving ? '⏳' : '🏥'} {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
