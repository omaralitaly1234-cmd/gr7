'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function HRPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [employees, setEmployees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const DEPARTMENTS = {
    management: { ar: 'إدارة', en: 'Management', icon: '👔', color: '#F5C518' },
    reception: { ar: 'استقبال', en: 'Reception', icon: '🏢', color: '#4FC3F7' },
    trainers: { ar: 'تدريب', en: 'Training', icon: '💪', color: '#FF5252' },
    cleaning: { ar: 'نظافة', en: 'Cleaning', icon: '🧹', color: '#00C853' },
    maintenance: { ar: 'صيانة', en: 'Maintenance', icon: '🔧', color: '#7C4DFF' },
    spa: { ar: 'سبا', en: 'Spa', icon: '🧖', color: '#EC407A' },
    security: { ar: 'أمن', en: 'Security', icon: '🛡️', color: '#FF9100' },
  };

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data: emps } = await getTenantDocuments(tenantId, 'employees');
        const { data: trs } = await getTenantDocuments(tenantId, 'trainers');
        setEmployees(emps || []);
        setTrainers(trs || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const allStaff = [
    ...employees.map(e => ({ ...e, source: 'employee' })),
    ...trainers.map(tr => ({ ...tr, department: 'trainers', source: 'trainer' })),
  ];

  const activeStaff = allStaff.filter(s => s.status === 'active');
  const totalSalaries = activeStaff.reduce((s, e) => s + (e.salary || 0), 0);

  // Department breakdown
  const deptCounts = {};
  allStaff.forEach(s => {
    const dept = s.department || 'management';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  // Gender breakdown
  const genders = { male: 0, female: 0 };
  allStaff.forEach(s => { genders[s.gender || 'male'] = (genders[s.gender || 'male'] || 0) + 1; });

  const tabs = [
    { id: 'overview', label: isAr ? '📊 نظرة عامة' : '📊 Overview' },
    { id: 'departments', label: isAr ? '🏢 الأقسام' : '🏢 Departments' },
    { id: 'payroll', label: isAr ? '💰 الرواتب' : '💰 Payroll' },
  ];

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👔</span> {t('sidebar.hr')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">👥</div>
          <div className="stat-info">
            <div className="stat-value">{allStaff.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الطاقم' : 'Total Staff'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{activeStaff.length}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{Object.keys(deptCounts).length}</div>
            <div className="stat-label">{isAr ? 'أقسام' : 'Departments'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">💰</div>
          <div className="stat-info">
            <div className="stat-value">{totalSalaries.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'إجمالي الرواتب' : 'Total Payroll'} ({t('common.egp')})</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-1)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: 'var(--space-2) var(--space-4)', background: activeTab === tab.id ? 'var(--pt-gold-glow)' : 'transparent',
            color: activeTab === tab.id ? 'var(--pt-gold)' : 'var(--pt-gray-500)', fontWeight: activeTab === tab.id ? 700 : 400,
            border: 'none', cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid var(--pt-gold)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', fontSize: 'var(--font-size-sm)',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
          {/* Department Chart */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>🏢 {isAr ? 'توزيع الأقسام' : 'Department Distribution'}</h3>
            {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => {
              const info = DEPARTMENTS[dept] || { ar: dept, en: dept, icon: '📋', color: '#888' };
              return (
                <div key={dept} style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-size-sm)' }}>
                    <span>{info.icon} {info[locale]}</span>
                    <span style={{ fontWeight: 700 }}>{count} {isAr ? 'موظف' : 'staff'}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: info.color, width: `${allStaff.length > 0 ? (count / allStaff.length) * 100 : 0}%`, borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gender & Status */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>👥 {isAr ? 'إحصائيات الفريق' : 'Team Stats'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem' }}>♂️</div>
                <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: 'var(--pt-info)' }}>{genders.male}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{t('common.male')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem' }}>♀️</div>
                <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: '#EC407A' }}>{genders.female}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{t('common.female')}</div>
              </div>
            </div>
            <div style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-2)' }}>
                {isAr ? 'النشطين مقابل المعطلين' : 'Active vs Inactive'}
              </div>
              <div style={{ height: 12, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', background: 'var(--pt-success)', width: `${allStaff.length > 0 ? (activeStaff.length / allStaff.length) * 100 : 0}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: 4 }}>
                <span style={{ color: 'var(--pt-success)' }}>✅ {activeStaff.length} {t('common.active')}</span>
                <span style={{ color: 'var(--pt-danger)' }}>❌ {allStaff.length - activeStaff.length} {t('common.inactive')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
          {Object.entries(DEPARTMENTS).map(([key, info]) => {
            const deptStaff = allStaff.filter(s => s.department === key);
            return (
              <div key={key} className="card" style={{ borderTop: `3px solid ${info.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                  <h3 style={{ fontSize: 'var(--font-size-md)' }}>{info[locale]}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, color: info.color }}>{deptStaff.length}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>{isAr ? 'موظفين' : 'Staff'}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{deptStaff.reduce((s, e) => s + (e.salary || 0), 0).toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)' }}>{t('common.egp')}</div>
                  </div>
                </div>
                {deptStaff.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-2)' }}>
                    {deptStaff.slice(0, 3).map(s => (
                      <div key={s.id} style={{ fontSize: 'var(--font-size-xs)', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{s.name?.[locale] || s.name?.ar}</span>
                        <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '8px' }}>●</span>
                      </div>
                    ))}
                    {deptStaff.length > 3 && <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: 4 }}>+{deptStaff.length - 3} {isAr ? 'آخرين' : 'more'}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>💰 {isAr ? 'كشف الرواتب' : 'Payroll Summary'}</h3>
          <div className="table-container">
            <table className="data-table">
              <thead><tr>
                <th>#</th><th>{t('members.fullName')}</th><th>{isAr ? 'القسم' : 'Dept'}</th>
                <th>{isAr ? 'المنصب' : 'Position'}</th><th>{isAr ? 'الراتب' : 'Salary'}</th>
                <th>{t('common.status')}</th>
              </tr></thead>
              <tbody>
                {activeStaff.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>{t('common.noData')}</td></tr>
                ) : activeStaff.sort((a, b) => (b.salary || 0) - (a.salary || 0)).map((s, i) => {
                  const dept = DEPARTMENTS[s.department] || { ar: '-', en: '-', icon: '📋' };
                  return (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name?.[locale] || s.name?.ar}</td>
                      <td><span className="badge badge-info" style={{ fontSize: '9px' }}>{dept.icon} {dept[locale]}</span></td>
                      <td style={{ fontSize: 'var(--font-size-sm)' }}>{s.position || (s.source === 'trainer' ? (isAr ? 'مدرب' : 'Trainer') : '-')}</td>
                      <td style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{(s.salary || 0).toLocaleString()} {t('common.egp')}</td>
                      <td><span className="badge badge-success" style={{ fontSize: '10px' }}>● {t('common.active')}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              {activeStaff.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--pt-gold)' }}>
                    <td colSpan={4} style={{ fontWeight: 800, textAlign: 'end' }}>{isAr ? 'الإجمالي' : 'Total'}</td>
                    <td style={{ fontWeight: 900, color: 'var(--pt-gold)', fontSize: 'var(--font-size-lg)' }}>{totalSalaries.toLocaleString()} {t('common.egp')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
