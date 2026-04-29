'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = {
  rent: { ar: 'إيجار', en: 'Rent', icon: '🏢' },
  utilities: { ar: 'مرافق', en: 'Utilities', icon: '💡' },
  salaries: { ar: 'رواتب', en: 'Salaries', icon: '💼' },
  equipment: { ar: 'معدات', en: 'Equipment', icon: '🏋️' },
  maintenance: { ar: 'صيانة', en: 'Maintenance', icon: '🔧' },
  marketing: { ar: 'تسويق', en: 'Marketing', icon: '📢' },
  supplies: { ar: 'مستلزمات', en: 'Supplies', icon: '📦' },
  cleaning: { ar: 'نظافة', en: 'Cleaning', icon: '🧹' },
  insurance: { ar: 'تأمين', en: 'Insurance', icon: '🛡️' },
  other: { ar: 'أخرى', en: 'Other', icon: '📋' },
};

export default function ExpensesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ category: 'all', period: 'month' });
  const [form, setForm] = useState({
    category: 'supplies', description: '', amount: '', notes: '', date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'expenses', [],
        { field: 'createdAt', direction: 'desc' }, 200);
      setExpenses(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.description || !form.amount) return;
    try {
      await addTenantDocument(tenantId, 'expenses', {
        ...form,
        amount: Number(form.amount),
        date: Timestamp.fromDate(new Date(form.date)),
      });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ category: 'supplies', description: '', amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const deleteExpense = async (id) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'expenses', id);
    toast.success(t('common.success'));
    loadData();
  };

  // Calculate stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayTotal = expenses.filter(e => {
    const d = e.date?.toDate ? e.date.toDate() : (e.createdAt?.toDate ? e.createdAt.toDate() : null);
    return d && d >= todayStart;
  }).reduce((s, e) => s + (e.amount || 0), 0);

  const monthTotal = expenses.filter(e => {
    const d = e.date?.toDate ? e.date.toDate() : (e.createdAt?.toDate ? e.createdAt.toDate() : null);
    return d && d >= monthStart;
  }).reduce((s, e) => s + (e.amount || 0), 0);

  // By category
  const byCategory = {};
  expenses.forEach(e => {
    const cat = e.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
  });

  const filtered = expenses.filter(e => {
    if (filter.category !== 'all' && e.category !== filter.category) return false;
    const d = e.date?.toDate ? e.date.toDate() : (e.createdAt?.toDate ? e.createdAt.toDate() : null);
    if (!d) return true;
    if (filter.period === 'today') return d >= todayStart;
    if (filter.period === 'week') { const wk = new Date(now); wk.setDate(wk.getDate() - 7); return d >= wk; }
    if (filter.period === 'month') return d >= monthStart;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📊</span> {t('sidebar.expenses')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'إضافة مصروف' : 'Add Expense'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-danger)' }}>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--pt-danger)' }}>{todayTotal.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'مصروفات اليوم' : "Today's Expenses"}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-warning)' }}>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--pt-warning)' }}>{monthTotal.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'مصروفات الشهر' : 'Monthly Expenses'}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-gold)' }}>
          <div className="stat-info">
            <div className="stat-value">{Object.keys(byCategory).length}</div>
            <div className="stat-label">{isAr ? 'فئات' : 'Categories'}</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'المصروفات حسب الفئة' : 'Expenses by Category'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
            const info = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
            return (
              <div key={cat} style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>{info.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{info[locale]}</div>
                <div style={{ fontWeight: 800, color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)' }}>{amount.toLocaleString()} {t('common.egp')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 'auto' }} value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
          <option value="all">{t('common.all')} — {isAr ? 'الفئة' : 'Category'}</option>
          {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filter.period} onChange={e => setFilter(f => ({ ...f, period: e.target.value }))}>
          <option value="today">{t('common.today')}</option>
          <option value="week">{t('common.thisWeek')}</option>
          <option value="month">{t('common.thisMonth')}</option>
          <option value="all">{t('common.all')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>{isAr ? 'الفئة' : 'Category'}</th><th>{isAr ? 'الوصف' : 'Description'}</th>
            <th>{t('finance.amount')}</th><th>{t('common.date')}</th><th>{t('common.actions')}</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>📭 {t('common.noData')}</td></tr>
            ) : (
              filtered.map((exp, i) => {
                const cat = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;
                return (
                  <tr key={exp.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{cat.icon} {cat[locale]}</span></td>
                    <td style={{ fontWeight: 600 }}>{exp.description}</td>
                    <td style={{ fontWeight: 800, color: 'var(--pt-danger)' }}>{(exp.amount || 0).toLocaleString()} {t('common.egp')}</td>
                    <td>{exp.date?.toDate ? exp.date.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : (exp.createdAt?.toDate ? exp.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-')}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => deleteExpense(exp.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>📊 {isAr ? 'إضافة مصروف' : 'Add Expense'}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الفئة' : 'Category'} *</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('common.date')}</label>
                  <input className="form-input" type="date" dir="ltr" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الوصف' : 'Description'} *</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={isAr ? 'فاتورة كهرباء شهر أبريل' : 'April electricity bill'} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('finance.amount')} ({t('common.egp')}) *</label>
                <input className="form-input" type="number" dir="ltr" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.notes')}</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.description || !form.amount}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
