'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, getTenantDocumentsByIds } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

const PAGE_SIZE = 50;

export default function DebtsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // balanceDue > 0, biggest debt first. Served by the composite index on
        // (balanceDue desc, createdAt desc).
        const { data } = await getTenantDocuments(tenantId, 'subscriptions',
          [{ field: 'balanceDue', operator: '>', value: 0 }],
          { field: 'balanceDue', direction: 'desc' }, PAGE_SIZE);
        const subs = data || [];
        if (cancelled) return;
        setRows(subs);
        const map = await getTenantDocumentsByIds(tenantId, 'members', subs.map(s => s.memberId));
        if (!cancelled) setMembers(map);
      } catch (err) {
        console.error('Failed to load debts:', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const nowMs = Date.now();

  const withMeta = rows.map(sub => {
    const insts = sub.installments || [];
    const overdue = insts.filter(i => {
      if (i.status === 'paid') return false;
      const due = i.dueDate?.toMillis ? i.dueDate.toMillis() : Number(i.dueDate) || 0;
      return due > 0 && due <= nowMs;
    });
    const nextDue = insts
      .filter(i => i.status !== 'paid')
      .map(i => (i.dueDate?.toMillis ? i.dueDate.toMillis() : Number(i.dueDate) || 0))
      .filter(Boolean)
      .sort((a, b) => a - b)[0] || null;
    return { ...sub, overdueCount: overdue.length, nextDue };
  });

  const visible = onlyOverdue ? withMeta.filter(r => r.overdueCount > 0) : withMeta;
  const totalOwed = withMeta.reduce((s, r) => s + (r.balanceDue || 0), 0);
  const overdueTotal = withMeta.filter(r => r.overdueCount > 0).reduce((s, r) => s + (r.balanceDue || 0), 0);

  const fmtDate = (ms) => ms ? new Date(ms).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '—';

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💰</span> {isAr ? 'المديونيات والأقساط' : 'Outstanding Balances'}</h1>
        <Link href={`/${locale}/admin/finance/payments`} className="btn btn-primary">
          + {isAr ? 'تسجيل دفعة' : 'Record payment'}
        </Link>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon warning">💰</div>
          <div className="stat-info">
            <div className="stat-value" dir="ltr">{totalOwed.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'إجمالي المتبقي' : 'Total owed'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">⏰</div>
          <div className="stat-info">
            <div className="stat-value" dir="ltr">{overdueTotal.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'أقساط متأخرة' : 'Overdue'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">👥</div>
          <div className="stat-info">
            <div className="stat-value">{withMeta.length}</div>
            <div className="stat-label">{isAr ? 'عدد المديونين' : 'Members owing'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📋</div>
          <div className="stat-info">
            <div className="stat-value">{withMeta.filter(r => r.overdueCount > 0).length}</div>
            <div className="stat-label">{isAr ? 'متأخرون' : 'Late'}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyOverdue} onChange={e => setOnlyOverdue(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--pt-gold)' }} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>
            {isAr ? 'عرض المتأخرين فقط' : 'Show only overdue'}
          </span>
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('members.fullName')}</th>
              <th>{t('members.phone')}</th>
              <th>{isAr ? 'الخطة' : 'Plan'}</th>
              <th>{isAr ? 'الإجمالي' : 'Total'}</th>
              <th>{isAr ? 'المدفوع' : 'Paid'}</th>
              <th>{isAr ? 'المتبقي' : 'Balance'}</th>
              <th>{isAr ? 'القسط القادم' : 'Next due'}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
              </td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>✅</div>
                {isAr ? 'لا توجد مديونيات' : 'No outstanding balances'}
              </td></tr>
            ) : visible.map((row, i) => {
              const m = members.get(row.memberId);
              return (
                <tr key={row.id}>
                  <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m?.fullName?.[locale] || m?.fullName?.ar || '—'}</td>
                  <td dir="ltr">{m?.phone || '—'}</td>
                  <td>{row.planSnapshot?.name?.[locale] || row.planSnapshot?.name?.ar || '—'}</td>
                  <td dir="ltr">{(row.totalAmount || 0).toLocaleString()}</td>
                  <td dir="ltr" style={{ color: 'var(--pt-success)' }}>{(row.amountPaid || 0).toLocaleString()}</td>
                  <td dir="ltr" style={{ color: 'var(--pt-warning)', fontWeight: 800 }}>
                    {(row.balanceDue || 0).toLocaleString()}
                  </td>
                  <td>
                    {row.overdueCount > 0 ? (
                      <span className="badge badge-danger">
                        ⏰ {isAr ? `${row.overdueCount} متأخر` : `${row.overdueCount} overdue`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>{fmtDate(row.nextDue)}</span>
                    )}
                  </td>
                  <td>
                    {m && (
                      <Link href={`/${locale}/admin/members/${row.memberId}`} className="btn btn-ghost btn-sm">
                        👁️
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
