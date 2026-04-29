'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

const ACTION_TYPES = {
  login: { ar: 'تسجيل دخول', en: 'Login', icon: '🔑', color: 'var(--pt-info)' },
  logout: { ar: 'تسجيل خروج', en: 'Logout', icon: '🚪', color: 'var(--pt-gray-500)' },
  create_member: { ar: 'إنشاء عضو', en: 'Create Member', icon: '👤', color: 'var(--pt-success)' },
  update_member: { ar: 'تعديل عضو', en: 'Update Member', icon: '✏️', color: 'var(--pt-warning)' },
  delete_member: { ar: 'حذف عضو', en: 'Delete Member', icon: '🗑️', color: 'var(--pt-danger)' },
  create_subscription: { ar: 'إنشاء اشتراك', en: 'Create Subscription', icon: '💳', color: 'var(--pt-gold)' },
  freeze_subscription: { ar: 'تجميد اشتراك', en: 'Freeze Subscription', icon: '❄️', color: 'var(--pt-frozen)' },
  record_payment: { ar: 'تسجيل دفعة', en: 'Record Payment', icon: '💰', color: 'var(--pt-success)' },
  check_in: { ar: 'تسجيل حضور', en: 'Check In', icon: '📋', color: 'var(--pt-info)' },
  settings_change: { ar: 'تعديل إعدادات', en: 'Settings Change', icon: '⚙️', color: 'var(--pt-gray-400)' },
  export_data: { ar: 'تصدير بيانات', en: 'Export Data', icon: '📤', color: 'var(--pt-info)' },
};

export default function AuditPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'audit_logs', [],
          { field: 'createdAt', direction: 'desc' }, 200);
        setLogs(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const filters = [
    { id: 'all', label: isAr ? '📋 الكل' : '📋 All' },
    { id: 'login', label: isAr ? '🔑 دخول/خروج' : '🔑 Auth' },
    { id: 'member', label: isAr ? '👤 أعضاء' : '👤 Members' },
    { id: 'payment', label: isAr ? '💰 مالي' : '💰 Finance' },
    { id: 'settings', label: isAr ? '⚙️ إعدادات' : '⚙️ Settings' },
  ];

  const filtered = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'login') return ['login', 'logout'].includes(log.action);
    if (filter === 'member') return ['create_member', 'update_member', 'delete_member'].includes(log.action);
    if (filter === 'payment') return ['record_payment', 'create_subscription', 'freeze_subscription'].includes(log.action);
    if (filter === 'settings') return ['settings_change', 'export_data'].includes(log.action);
    return true;
  }).filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (log.userName || '').toLowerCase().includes(q) || (log.details || '').toLowerCase().includes(q);
  });

  // Stats
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(l => { const d = l.createdAt?.toDate ? l.createdAt.toDate() : null; return d && d >= todayStart; });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🛡️</span> {t('sidebar.audit')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">🛡️</div>
          <div className="stat-info">
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي السجلات' : 'Total Logs'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">📅</div>
          <div className="stat-info">
            <div className="stat-value">{todayLogs.length}</div>
            <div className="stat-label">{isAr ? 'سجلات اليوم' : "Today's Logs"}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">👥</div>
          <div className="stat-info">
            <div className="stat-value">{new Set(logs.map(l => l.userId)).size}</div>
            <div className="stat-label">{isAr ? 'مستخدمين نشطين' : 'Active Users'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{logs.filter(l => ['delete_member', 'settings_change'].includes(l.action)).length}</div>
            <div className="stat-label">{isAr ? 'إجراءات حساسة' : 'Sensitive Actions'}</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12 }}>🔍</span>
          <input className="form-input" style={{ paddingInlineStart: 36 }} placeholder={isAr ? 'بحث...' : 'Search...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        {filters.map(f => (
          <button key={f.id} className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🛡️</div>
          <h3>{t('common.noData')}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'لا توجد سجلات مراجعة بعد' : 'No audit logs recorded yet'}</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingInlineStart: 'var(--space-6)' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', insetInlineStart: 11, top: 0, bottom: 0, width: 2, background: 'var(--glass-border)' }} />

          {filtered.map((log, i) => {
            const actionInfo = ACTION_TYPES[log.action] || { ar: log.action, en: log.action, icon: '📋', color: 'var(--pt-gray-500)' };
            const date = log.createdAt?.toDate ? log.createdAt.toDate() : null;
            return (
              <div key={log.id || i} style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', insetInlineStart: -20, top: 12, width: 20, height: 20,
                  borderRadius: 'var(--radius-full)', background: 'var(--pt-dark)',
                  border: `2px solid ${actionInfo.color}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '10px', zIndex: 1,
                }}>
                  {actionInfo.icon}
                </div>

                <div className="card" style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderInlineStart: `3px solid ${actionInfo.color}`,
                  marginInlineStart: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                        <span className="badge" style={{ fontSize: '9px', background: `${actionInfo.color}20`, color: actionInfo.color }}>
                          {actionInfo.icon} {actionInfo[locale]}
                        </span>
                        {['delete_member', 'settings_change'].includes(log.action) && (
                          <span className="badge badge-danger" style={{ fontSize: '8px' }}>⚠️ {isAr ? 'حساس' : 'Sensitive'}</span>
                        )}
                      </div>
                      {log.details && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', margin: 0 }}>{log.details}</p>}
                    </div>
                    <div style={{ textAlign: 'end', flexShrink: 0, marginInlineStart: 'var(--space-4)' }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                        {date ? date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>
                        {date ? date.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: 2 }}>
                        👤 {log.userName || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
