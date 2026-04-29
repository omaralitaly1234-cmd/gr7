'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

const DEMO_TENANTS = [
  {
    id: 'gym-001', name: 'Power Time - المعادي', nameAr: 'Power Time - المعادي', status: 'trial',
    ownerEmail: 'maadi@gym.com', phone: '01012345678', createdAt: { toDate: () => new Date('2026-03-15') },
    subscription: { plan: 'trial', trialEndDate: { toDate: () => new Date('2026-06-15') } },
    limits: { maxMembers: 100, maxTrainers: 3 },
  },
  {
    id: 'gym-002', name: 'FitZone - مدينة نصر', nameAr: 'فيت زون - مدينة نصر', status: 'active',
    ownerEmail: 'nasr@fitzone.com', phone: '01098765432', createdAt: { toDate: () => new Date('2026-01-10') },
    subscription: { plan: 'quarterly', endDate: { toDate: () => new Date('2026-07-10') } },
    limits: { maxMembers: 500, maxTrainers: 10 },
  },
  {
    id: 'gym-003', name: 'Iron Gym - التجمع', nameAr: 'أيرون جيم - التجمع', status: 'active',
    ownerEmail: 'tagamoa@iron.com', phone: '01155566677', createdAt: { toDate: () => new Date('2025-11-01') },
    subscription: { plan: 'annual', endDate: { toDate: () => new Date('2026-11-01') } },
    limits: { maxMembers: -1, maxTrainers: -1 },
  },
  {
    id: 'gym-004', name: 'Champions Gym', nameAr: 'تشامبيونز جيم', status: 'expired',
    ownerEmail: 'champ@gym.com', phone: '01234567890', createdAt: { toDate: () => new Date('2025-09-01') },
    subscription: { plan: 'trial', trialEndDate: { toDate: () => new Date('2025-12-01') } },
    limits: {},
  },
  {
    id: 'gym-005', name: 'Flex Fitness', nameAr: 'فليكس فيتنس', status: 'trial',
    ownerEmail: 'flex@fitness.com', phone: '01112233445', createdAt: { toDate: () => new Date('2026-03-28') },
    subscription: { plan: 'trial', trialEndDate: { toDate: () => new Date('2026-06-28') } },
    limits: { maxMembers: 100, maxTrainers: 3 },
  },
  {
    id: 'gym-006', name: 'Royal Gym - الدقي', nameAr: 'رويال جيم - الدقي', status: 'suspended',
    ownerEmail: 'royal@gym.com', phone: '01009988776', createdAt: { toDate: () => new Date('2026-02-01') },
    subscription: { plan: 'monthly', endDate: { toDate: () => new Date('2026-04-01') } },
    limits: { maxMembers: 300, maxTrainers: 5 },
  },
];

export default function TenantsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tenants] = useState(DEMO_TENANTS);

  const filtered = tenants.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.name?.toLowerCase().includes(s) || t.nameAr?.includes(s) || t.ownerEmail?.toLowerCase().includes(s));
    }
    return true;
  });

  const statusBadge = (status) => {
    const map = {
      active: { cls: 'badge-success', text: locale === 'ar' ? 'فعال' : 'Active' },
      trial: { cls: 'badge-info', text: locale === 'ar' ? 'تجريبي' : 'Trial' },
      expired: { cls: 'badge-danger', text: locale === 'ar' ? 'منتهي' : 'Expired' },
      suspended: { cls: 'badge-warning', text: locale === 'ar' ? 'معلّق' : 'Suspended' },
    };
    const s = map[status] || map.expired;
    return <span className={`badge ${s.cls}`}>{s.text}</span>;
  };

  const planLabel = (plan) => {
    const p = PLAN_DEFINITIONS[plan];
    return p ? (p.name[locale] || p.name.ar) : plan;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filters = [
    { key: 'all', label: locale === 'ar' ? 'الكل' : 'All', count: tenants.length },
    { key: 'active', label: locale === 'ar' ? 'فعال' : 'Active', count: tenants.filter(t => t.status === 'active').length },
    { key: 'trial', label: locale === 'ar' ? 'تجريبي' : 'Trial', count: tenants.filter(t => t.status === 'trial').length },
    { key: 'expired', label: locale === 'ar' ? 'منتهي' : 'Expired', count: tenants.filter(t => t.status === 'expired').length },
    { key: 'suspended', label: locale === 'ar' ? 'معلّق' : 'Suspended', count: tenants.filter(t => t.status === 'suspended').length },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏢</span> {locale === 'ar' ? 'إدارة العملاء' : 'Manage Tenants'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
          {locale === 'ar' ? `${totalCount()} عميل مسجّل` : `${totalCount()} registered clients`}
        </span>
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
          placeholder={locale === 'ar' ? '🔍 ابحث بالاسم أو الإيميل...' : '🔍 Search by name or email...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الجيم' : 'Gym'}</th>
                <th>{locale === 'ar' ? 'الخطة' : 'Plan'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                <th>{locale === 'ar' ? 'الحدود' : 'Limits'}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{locale === 'ar' ? (t.nameAr || t.name) : t.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{t.ownerEmail}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gold">{planLabel(t.subscription?.plan)}</span>
                  </td>
                  <td>{statusBadge(t.status)}</td>
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
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Link href={`/${locale}/super-admin/tenants/${t.id}`} className="btn btn-ghost btn-sm">
                        👁️
                      </Link>
                      {t.status === 'trial' && (
                        <button className="btn btn-primary btn-sm">
                          {locale === 'ar' ? 'تفعيل' : 'Activate'}
                        </button>
                      )}
                      {t.status === 'active' && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-warning)' }}>
                          ⏸️
                        </button>
                      )}
                      {t.status === 'suspended' && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-success)' }}>
                          ▶️
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
    </div>
  );

  function totalCount() { return tenants.length; }
}
