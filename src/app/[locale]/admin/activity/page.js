'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function AdminActivityLogPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const [filter, setFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocuments(tenantId, 'activity_log', [],
          { field: 'createdAt', direction: 'desc' }, 100);
        setLogs(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const filters = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'member', label: isAr ? 'الأعضاء' : 'Members' },
    { id: 'payment', label: isAr ? 'المالية' : 'Finance' },
    { id: 'trainer', label: isAr ? 'المدربين' : 'Trainers' },
    { id: 'system', label: isAr ? 'النظام' : 'System' },
  ];

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  const iconMap = {
    member: '👤',
    payment: '💰',
    trainer: '📋',
    system: '⚙️',
    attendance: '📱',
    spa: '🧖',
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group logs by date
  const groupedLogs = {};
  filtered.forEach(log => {
    const dateKey = log.createdAt?.toDate
      ? log.createdAt.toDate().toDateString()
      : log.createdAt ? new Date(log.createdAt).toDateString() : 'unknown';
    if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
    groupedLogs[dateKey].push(log);
  });

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📜</span> {isAr ? 'سجل النشاطات' : 'Activity Log'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`btn ${filter === f.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Today Summary */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { icon: '📌', value: logs.length, label: isAr ? 'إجمالي النشاطات' : 'Total Activities' },
          { icon: '👤', value: logs.filter(l => l.type === 'member').length, label: isAr ? 'عمليات أعضاء' : 'Member Actions' },
          { icon: '💰', value: logs.filter(l => l.type === 'payment').length, label: isAr ? 'عمليات مالية' : 'Financial' },
          { icon: '⚙️', value: logs.filter(l => l.type === 'system').length, label: isAr ? 'نظام' : 'System' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>{isAr ? 'لا توجد نشاطات مسجلة' : 'No activities recorded'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>
            {isAr ? 'سيتم تسجيل النشاطات تلقائياً عند إجراء أي عملية في النظام' : 'Activities will be logged automatically as you use the system'}
          </p>
        </div>
      ) : (
        Object.entries(groupedLogs).map(([dateKey, dateLogs]) => (
          <div key={dateKey} className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>📅 {formatDate(dateLogs[0]?.createdAt)}</h3>
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, insetInlineStart: 20, width: 2, background: 'rgba(245,197,24,0.15)' }} />

              {dateLogs.map((log, i) => (
                <div key={log.id || i} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) 0', position: 'relative', paddingInlineStart: 'var(--space-8)' }}>
                  {/* Timeline dot */}
                  <div style={{ position: 'absolute', insetInlineStart: 13, top: 18, width: 16, height: 16, borderRadius: 'var(--radius-full)', background: 'var(--pt-darker)', border: '2px solid var(--pt-gold)', zIndex: 1 }} />

                  <div style={{ flex: 1, padding: 'var(--space-3) var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: `3px solid ${log.type === 'payment' ? 'var(--pt-success)' : log.type === 'system' ? '#4FC3F7' : log.type === 'trainer' ? '#B388FF' : 'var(--pt-gold)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>{log.icon || iconMap[log.type] || '📋'} {log.action}</span>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginTop: '2px' }}>{log.target}</div>
                      </div>
                      <div style={{ textAlign: 'end', flexShrink: 0 }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)', fontWeight: 600 }}>{formatTime(log.createdAt)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{log.user || 'System'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
