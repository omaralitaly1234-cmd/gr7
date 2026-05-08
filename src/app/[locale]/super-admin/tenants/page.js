'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';
import toast from 'react-hot-toast';

export default function TenantsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { loadTenants(); }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await getDocuments('tenants', [], { field: 'createdAt', direction: 'desc' });
      if (error) {
        console.error('[Tenants] Load error:', error);
        toast.error(isAr ? 'فشل تحميل العملاء' : 'Failed to load tenants');
      }
      setTenants(data || []);
    } catch (err) {
      console.error('[Tenants] Error:', err);
    }
    setLoading(false);
  };

  // Change tenant status
  const changeStatus = async (tenantId, newStatus) => {
    setActionLoading(tenantId);
    try {
      const { error } = await updateDocument('tenants', tenantId, { status: newStatus });
      if (error) throw new Error(error);
      toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
      loadTenants();
    } catch (err) {
      console.error('[Tenants] Status change error:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ' : 'Error'));
    }
    setActionLoading(null);
  };

  const filtered = tenants.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(s) ||
        t.nameAr?.toLowerCase().includes(s) ||
        t.nameEn?.toLowerCase().includes(s) ||
        t.ownerEmail?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const statusBadge = (status) => {
    const map = {
      active: { cls: 'badge-success', text: isAr ? 'فعال' : 'Active' },
      trial: { cls: 'badge-info', text: isAr ? 'تجريبي' : 'Trial' },
      expired: { cls: 'badge-danger', text: isAr ? 'منتهي' : 'Expired' },
      suspended: { cls: 'badge-warning', text: isAr ? 'معلّق' : 'Suspended' },
      pending_payment: { cls: 'badge-warning', text: isAr ? 'بانتظار الدفع' : 'Pending Payment' },
    };
    const s = map[status] || { cls: 'badge-danger', text: status || '—' };
    return <span className={`badge ${s.cls}`}>{s.text}</span>;
  };

  const planLabel = (plan) => {
    const p = PLAN_DEFINITIONS[plan];
    return p ? (p.name?.[locale] || p.name?.ar || plan) : plan || '—';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp?.seconds ? timestamp.seconds * 1000 : timestamp);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  const countByStatus = (status) => tenants.filter(t => t.status === status).length;

  const filters = [
    { key: 'all', label: isAr ? 'الكل' : 'All', count: tenants.length },
    { key: 'active', label: isAr ? 'فعال' : 'Active', count: countByStatus('active') },
    { key: 'trial', label: isAr ? 'تجريبي' : 'Trial', count: countByStatus('trial') },
    { key: 'expired', label: isAr ? 'منتهي' : 'Expired', count: countByStatus('expired') },
    { key: 'suspended', label: isAr ? 'معلّق' : 'Suspended', count: countByStatus('suspended') },
    { key: 'pending_payment', label: isAr ? 'بانتظار الدفع' : 'Pending', count: countByStatus('pending_payment') },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏢</span> {isAr ? 'إدارة العملاء (الجيمات)' : 'Manage Tenants (Gyms)'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
          {isAr ? `${tenants.length} عميل مسجّل` : `${tenants.length} registered clients`}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-icon info">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{tenants.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الجيمات' : 'Total Gyms'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{countByStatus('active')}</div>
            <div className="stat-label">{isAr ? 'فعال' : 'Active'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{countByStatus('trial')}</div>
            <div className="stat-label">{isAr ? 'تجريبي' : 'Trial'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">🚫</div>
          <div className="stat-info">
            <div className="stat-value">{countByStatus('expired') + countByStatus('suspended')}</div>
            <div className="stat-label">{isAr ? 'منتهي/معلّق' : 'Expired/Suspended'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <input
          className="form-input"
          placeholder={isAr ? '🔍 ابحث بالاسم أو الإيميل...' : '🔍 Search by name or email...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
          <p style={{ color: 'var(--pt-gray-500)', marginTop: 'var(--space-3)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏢</div>
          <h3>{isAr ? 'لا يوجد عملاء' : 'No tenants found'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'لم يتم العثور على أي جيمات' : 'No gyms match your search'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'الجيم' : 'Gym'}</th>
                  <th>{isAr ? 'الخطة' : 'Plan'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'تاريخ الإنشاء' : 'Created'}</th>
                  <th>{isAr ? 'تاريخ الانتهاء' : 'End Date'}</th>
                  <th>{isAr ? 'الحدود' : 'Limits'}</th>
                  <th>{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={{ opacity: actionLoading === t.id ? 0.5 : 1 }}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{isAr ? (t.nameAr || t.name) : (t.nameEn || t.name)}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                          📧 {t.ownerEmail || '—'}
                        </div>
                        {t.phone && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                            📞 <span dir="ltr">{t.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold">{planLabel(t.subscription?.plan)}</span>
                    </td>
                    <td>{statusBadge(t.status)}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>
                      {formatDate(t.subscription?.endDate || t.subscription?.trialEndDate)}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)' }}>
                      {t.limits?.maxMembers === -1
                        ? '♾'
                        : `👥 ${t.limits?.maxMembers || '—'} / 🏋️ ${t.limits?.maxTrainers || '—'}`
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {/* Activate */}
                        {(t.status === 'trial' || t.status === 'pending_payment' || t.status === 'expired') && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => changeStatus(t.id, 'active')}
                            disabled={actionLoading === t.id}
                          >
                            ✅ {isAr ? 'تفعيل' : 'Activate'}
                          </button>
                        )}
                        {/* Suspend */}
                        {(t.status === 'active' || t.status === 'trial') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--pt-warning)' }}
                            onClick={() => changeStatus(t.id, 'suspended')}
                            disabled={actionLoading === t.id}
                          >
                            ⏸️ {isAr ? 'تعليق' : 'Suspend'}
                          </button>
                        )}
                        {/* Reactivate */}
                        {t.status === 'suspended' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--pt-success)' }}
                            onClick={() => changeStatus(t.id, 'active')}
                            disabled={actionLoading === t.id}
                          >
                            ▶️ {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
