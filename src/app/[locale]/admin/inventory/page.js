'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

const CATEGORIES = {
  equipment: { ar: 'معدات', en: 'Equipment', icon: '🏋️' },
  supplements: { ar: 'مكملات', en: 'Supplements', icon: '💊' },
  cleaning: { ar: 'تنظيف', en: 'Cleaning', icon: '🧹' },
  towels: { ar: 'مناشف', en: 'Towels', icon: '🧺' },
  drinks: { ar: 'مشروبات', en: 'Drinks', icon: '🥤' },
  maintenance: { ar: 'صيانة', en: 'Maintenance', icon: '🔧' },
  other: { ar: 'أخرى', en: 'Other', icon: '📦' },
};

export default function InventoryPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    name: { ar: '', en: '' }, category: 'equipment', quantity: 1,
    minQuantity: 5, unit: 'piece', purchasePrice: 0, notes: '',
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'inventory', [],
        { field: 'createdAt', direction: 'desc' });
      setItems(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.name.ar) return;
    try {
      await addTenantDocument(tenantId, 'inventory', { ...form, purchasePrice: Number(form.purchasePrice) });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ name: { ar: '', en: '' }, category: 'equipment', quantity: 1, minQuantity: 5, unit: 'piece', purchasePrice: 0, notes: '' });
      loadData();
    } catch (err) { toast.error(t('common.error')); }
  };

  const updateQuantity = async (item, delta) => {
    if (!tenantId) return;
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    await updateTenantDocument(tenantId, 'inventory', item.id, { quantity: newQty });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
  };

  const deleteItem = async (id) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'inventory', id);
    toast.success(t('common.success'));
    loadData();
  };

  const lowStock = items.filter(i => (i.quantity || 0) <= (i.minQuantity || 5));
  const filtered = filter === 'all' ? items : filter === 'low' ? lowStock : items.filter(i => i.category === filter);
  const totalValue = items.reduce((s, i) => s + ((i.purchasePrice || 0) * (i.quantity || 0)), 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📦</span> {t('sidebar.inventory')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'إضافة صنف' : 'Add Item'}</button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📦</div>
          <div className="stat-info">
            <div className="stat-value">{items.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الأصناف' : 'Total Items'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">⚠️</div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--pt-danger)' }}>{lowStock.length}</div>
            <div className="stat-label">{isAr ? 'مخزون منخفض' : 'Low Stock'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">💰</div>
          <div className="stat-info">
            <div className="stat-value">{totalValue.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'قيمة المخزون' : 'Stock Value'} ({t('common.egp')})</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📊</div>
          <div className="stat-info">
            <div className="stat-value">{Object.keys(CATEGORIES).filter(k => items.some(i => i.category === k)).length}</div>
            <div className="stat-label">{isAr ? 'فئات نشطة' : 'Active Categories'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>📋 {t('common.all')}</button>
        <button className={`btn btn-sm ${filter === 'low' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('low')}>⚠️ {isAr ? 'منخفض' : 'Low'}</button>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(k)}>
            {v.icon} {v[locale]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>{isAr ? 'الصنف' : 'Item'}</th><th>{isAr ? 'الفئة' : 'Category'}</th>
            <th>{isAr ? 'الكمية' : 'Qty'}</th><th>{isAr ? 'الحد الأدنى' : 'Min'}</th>
            <th>{isAr ? 'الحالة' : 'Status'}</th><th>{isAr ? 'السعر' : 'Price'}</th><th>{t('common.actions')}</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>📭 {t('common.noData')}</td></tr>
            ) : (
              filtered.map((item, i) => {
                const cat = CATEGORIES[item.category] || CATEGORIES.other;
                const isLow = (item.quantity || 0) <= (item.minQuantity || 5);
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name?.[locale] || item.name?.ar}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{cat.icon} {cat[locale]}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(item, -1)} style={{ padding: '2px 8px' }}>−</button>
                        <span style={{ fontWeight: 800, color: isLow ? 'var(--pt-danger)' : 'var(--pt-gold)', minWidth: 30, textAlign: 'center' }}>{item.quantity || 0}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(item, 1)} style={{ padding: '2px 8px' }}>+</button>
                      </div>
                    </td>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{item.minQuantity || 5}</td>
                    <td>
                      <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                        {isLow ? (isAr ? '⚠️ منخفض' : '⚠️ Low') : (isAr ? '✅ متوفر' : '✅ OK')}
                      </span>
                    </td>
                    <td>{(item.purchasePrice || 0).toLocaleString()} {t('common.egp')}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteItem(item.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>📦 {isAr ? 'إضافة صنف' : 'Add Item'}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                  <input className="form-input" value={form.name.ar} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ar: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                  <input className="form-input" dir="ltr" value={form.name.en} onChange={e => setForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الفئة' : 'Category'}</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(CATEGORIES).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'سعر الشراء' : 'Purchase Price'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الكمية' : 'Quantity'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الحد الأدنى' : 'Min Quantity'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.notes')}</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name.ar}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
