'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

export default function AdminContractsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const t = useTranslations();
  const { tenantId } = useTenant();

  const [contracts, setContracts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberId: '', memberName: '', type: '', startDate: '', endDate: '',
    value: 0, signed: false, autoRenew: false,
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const [contractsRes, membersRes] = await Promise.all([
        getTenantDocuments(tenantId, 'contracts', [], { field: 'createdAt', direction: 'desc' }),
        getTenantDocuments(tenantId, 'members'),
      ]);
      setContracts(contractsRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Calculate status based on dates
  const getStatus = (contract) => {
    if (contract.status) return contract.status;
    const now = new Date();
    const end = new Date(contract.endDate);
    const daysToExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 0) return 'expired';
    if (daysToExpiry <= 30) return 'expiring';
    return 'active';
  };

  const enrichedContracts = contracts.map(c => ({
    ...c,
    computedStatus: getStatus(c),
  }));

  const handleSubmit = async () => {
    if (!tenantId || !form.memberName || !form.type || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await addTenantDocument(tenantId, 'contracts', {
        memberId: form.memberId || '',
        member: form.memberName,
        avatar: form.memberName.charAt(0),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        value: Number(form.value) || 0,
        signed: form.signed,
        autoRenew: form.autoRenew,
        status: 'active',
      });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ memberId: '', memberName: '', type: '', startDate: '', endDate: '', value: 0, signed: false, autoRenew: false });
      loadData();
    } catch (err) { toast.error(t('common.error')); }
    setSaving(false);
  };

  const toggleSigned = async (contract) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'contracts', contract.id, { signed: !contract.signed });
    loadData();
  };

  const toggleAutoRenew = async (contract) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'contracts', contract.id, { autoRenew: !contract.autoRenew });
    loadData();
  };

  const deleteContract = async (id) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'contracts', id);
    toast.success(t('common.success'));
    loadData();
  };

  const statusConfig = {
    active: { color: '#00C853', label: isAr ? '✅ نشط' : '✅ Active' },
    expiring: { color: '#FF9100', label: isAr ? '⏰ ينتهي قريباً' : '⏰ Expiring' },
    expired: { color: '#FF5252', label: isAr ? '❌ منتهي' : '❌ Expired' },
  };

  const filtered = filter === 'all' ? enrichedContracts : enrichedContracts.filter(c => c.computedStatus === filter);

  // Stats from real data
  const activeCount = enrichedContracts.filter(c => c.computedStatus === 'active').length;
  const expiringCount = enrichedContracts.filter(c => c.computedStatus === 'expiring').length;
  const expiredCount = enrichedContracts.filter(c => c.computedStatus === 'expired').length;
  const signedCount = contracts.filter(c => c.signed).length;
  const signRate = contracts.length > 0 ? Math.round((signedCount / contracts.length) * 100) : 0;

  const stats = [
    { v: activeCount, l: isAr ? 'عقود نشطة' : 'Active Contracts', icon: '📄', color: 'var(--pt-success)' },
    { v: expiringCount, l: isAr ? 'تنتهي قريباً' : 'Expiring Soon', icon: '⏰', color: '#FF9100' },
    { v: expiredCount, l: isAr ? 'منتهية' : 'Expired', icon: '🔄', color: '#FF5252' },
    { v: `${signRate}%`, l: isAr ? 'نسبة التوقيع' : 'Sign Rate', icon: '✍️', color: 'var(--pt-gold)' },
  ];

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {isAr ? 'العقود والاتفاقيات' : 'Contracts & Agreements'}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'عقد جديد' : 'New Contract'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'all', label: isAr ? 'الكل' : 'All' },
          { id: 'active', label: isAr ? 'نشط' : 'Active' },
          { id: 'expiring', label: isAr ? 'ينتهي' : 'Expiring' },
          { id: 'expired', label: isAr ? 'منتهي' : 'Expired' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`btn ${filter === f.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{f.label}</button>
        ))}
      </div>

      {/* Contracts Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>{isAr ? 'لا توجد عقود' : 'No contracts'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', marginBottom: 'var(--space-4)' }}>
            {isAr ? 'أضف أول عقد لإدارة الاتفاقيات' : 'Add your first contract'}
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'عقد جديد' : 'New Contract'}</button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: 'var(--space-2)', textAlign: isAr ? 'right' : 'left', fontWeight: 700 }}>{isAr ? 'العضو' : 'Member'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'نوع العقد' : 'Plan'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{isAr ? 'من' : 'Start'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{isAr ? 'إلى' : 'End'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{isAr ? 'القيمة' : 'Value'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{isAr ? 'الحالة' : 'Status'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{isAr ? 'توقيع' : 'Signed'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{isAr ? 'تجديد' : 'Auto'}</th>
                <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const status = statusConfig[c.computedStatus] || statusConfig.active;
                return (
                  <tr key={c.id || i} style={{ borderBottom: '1px solid var(--glass-border)', opacity: c.computedStatus === 'expired' ? 0.6 : 1 }}>
                    <td style={{ padding: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>{c.avatar || (c.member || '?').charAt(0)}</div>
                      <span style={{ fontWeight: 600 }}>{c.member}</span>
                    </td>
                    <td style={{ padding: 'var(--space-2)' }}>{c.type}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>{c.startDate}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>{c.endDate}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center', fontWeight: 700, color: 'var(--pt-gold)' }}>{Number(c.value || 0).toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${status.color}15`, color: status.color, fontWeight: 700, fontSize: '10px' }}>{status.label}</span>
                    </td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                      <button onClick={() => toggleSigned(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{c.signed ? '✅' : '⏳'}</button>
                    </td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                      <button onClick={() => toggleAutoRenew(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{c.autoRenew ? '🔄' : '—'}</button>
                    </td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteContract(c.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Contract Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>📋 {isAr ? 'عقد جديد' : 'New Contract'}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{isAr ? 'العضو' : 'Member'} *</label>
                {members.length > 0 ? (
                  <select className="form-select" value={form.memberId} onChange={e => {
                    const member = members.find(m => m.id === e.target.value);
                    setForm(f => ({ ...f, memberId: e.target.value, memberName: member?.name?.[locale] || member?.name?.ar || '' }));
                  }}>
                    <option value="">{isAr ? '— اختر عضو —' : '— Select Member —'}</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name?.[locale] || m.name?.ar}</option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} placeholder={isAr ? 'اسم العضو' : 'Member name'} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'نوع العقد' : 'Contract Type'} *</label>
                <input className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder={isAr ? 'اشتراك سنوي VIP' : 'Annual VIP'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'تاريخ البداية' : 'Start Date'} *</label>
                  <input className="form-input" type="date" dir="ltr" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'تاريخ النهاية' : 'End Date'} *</label>
                  <input className="form-input" type="date" dir="ltr" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'القيمة (ج.م)' : 'Value (EGP)'}</label>
                <input className="form-input" type="number" dir="ltr" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
                  <input type="checkbox" checked={form.signed} onChange={e => setForm(f => ({ ...f, signed: e.target.checked }))} />
                  {isAr ? 'موقع' : 'Signed'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
                  <input type="checkbox" checked={form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))} />
                  {isAr ? 'تجديد تلقائي' : 'Auto Renew'}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.memberName || !form.type || !form.startDate || !form.endDate}>
                {saving ? '⏳' : '✅'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
