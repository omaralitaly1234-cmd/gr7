'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

const DEPARTMENTS = {
  management: { ar: 'إدارة', en: 'Management', icon: '👔' },
  reception: { ar: 'استقبال', en: 'Reception', icon: '🏢' },
  trainers: { ar: 'تدريب', en: 'Training', icon: '💪' },
  cleaning: { ar: 'نظافة', en: 'Cleaning', icon: '🧹' },
  maintenance: { ar: 'صيانة', en: 'Maintenance', icon: '🔧' },
  spa: { ar: 'سبا', en: 'Spa', icon: '🧖' },
  security: { ar: 'أمن', en: 'Security', icon: '🛡️' },
};

export default function EmployeesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    name: { ar: '', en: '' }, phone: '', department: 'reception',
    position: '', salary: 0, status: 'active', gender: 'male', joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'employees', [],
        { field: 'createdAt', direction: 'desc' });
      setEmployees(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.name.ar) return;
    try {
      await addTenantDocument(tenantId, 'employees', { ...form, salary: Number(form.salary) });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ name: { ar: '', en: '' }, phone: '', department: 'reception', position: '', salary: 0, status: 'active', gender: 'male', joinDate: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) { toast.error(t('common.error')); }
  };

  const toggleStatus = async (emp) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'employees', emp.id, { status: emp.status === 'active' ? 'inactive' : 'active' });
    loadData();
  };

  const deleteEmployee = async (id) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'employees', id);
    toast.success(t('common.success'));
    loadData();
  };

  const filtered = filter === 'all' ? employees : employees.filter(e => e.department === filter);
  const totalSalaries = employees.filter(e => e.status === 'active').reduce((s, e) => s + (e.salary || 0), 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👥</span> {t('sidebar.employees')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'إضافة موظف' : 'Add Employee'}</button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">👥</div>
          <div className="stat-info">
            <div className="stat-value">{employees.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الموظفين' : 'Total'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{employees.filter(e => e.status === 'active').length}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{new Set(employees.map(e => e.department)).size}</div>
            <div className="stat-label">{isAr ? 'أقسام' : 'Departments'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">💰</div>
          <div className="stat-info">
            <div className="stat-value">{totalSalaries.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'إجمالي الرواتب' : 'Total Salaries'} ({t('common.egp')})</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>📋 {t('common.all')}</button>
        {Object.entries(DEPARTMENTS).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(k)}>
            {v.icon} {v[locale]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>{t('members.fullName')}</th><th>{isAr ? 'القسم' : 'Department'}</th>
            <th>{isAr ? 'المنصب' : 'Position'}</th><th>{t('members.phone')}</th>
            <th>{isAr ? 'الراتب' : 'Salary'}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>📭 {t('common.noData')}</td></tr>
            ) : (
              filtered.map((emp, i) => {
                const dept = DEPARTMENTS[emp.department] || DEPARTMENTS.management;
                return (
                  <tr key={emp.id} style={{ opacity: emp.status === 'active' ? 1 : 0.5 }}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-xs)' }}>
                          {(emp.name?.[locale] || emp.name?.ar || '?').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.name?.[locale] || emp.name?.ar}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{emp.gender === 'male' ? '♂' : '♀'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{dept.icon} {dept[locale]}</span></td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>{emp.position || '-'}</td>
                    <td dir="ltr" style={{ fontFamily: 'var(--font-en)', fontSize: 'var(--font-size-sm)' }}>{emp.phone || '-'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{(emp.salary || 0).toLocaleString()} {t('common.egp')}</td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                        ● {emp.status === 'active' ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(emp)}>{emp.status === 'active' ? '⏸️' : '▶️'}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteEmployee(emp.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>👥 {isAr ? 'إضافة موظف' : 'Add Employee'}</h2>
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
                  <label className="form-label">{isAr ? 'القسم' : 'Department'}</label>
                  <select className="form-select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {Object.entries(DEPARTMENTS).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المنصب' : 'Position'}</label>
                  <input className="form-input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder={isAr ? 'موظف استقبال' : 'Receptionist'} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('members.phone')}</label>
                  <input className="form-input" dir="ltr" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الراتب' : 'Salary'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
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
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name.ar}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
