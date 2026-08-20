'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, getTenantDocument, getTenantCollectionCount, getTenantFieldSum } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0, activeMembers: 0, expiredMembers: 0, frozenMembers: 0,
    maleMembers: 0, femaleMembers: 0,
    todayVisits: 0, todayRevenue: 0, monthRevenue: 0,
    expiringSoon: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    if (!tenantId) { setLoading(false); return; }

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysLater = new Date(now);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      // Everything the dashboard needs, in ONE round trip. These four groups do
      // not depend on each other, but they used to be awaited one after the
      // other, so opening the dashboard cost five sequential round trips and
      // felt slow on anything but a fast connection.
      const todayTs = Timestamp.fromDate(todayStart);
      const monthTs = Timestamp.fromDate(monthStart);

      const [
        [totalC, activeC, expiredC, frozenC, maleC, femaleC],
        [{ data: todayAtt }, todayAttCount],
        [todaySum, monthSum, { data: latestPayments }],
        { data: expiringSubs },
      ] = await Promise.all([
        // 1) Member stats — count() aggregations. These used to load every member
        // document (6+ MB at 5k members) just to compute six numbers.
        Promise.all([
          getTenantCollectionCount(tenantId, 'members'),
          getTenantCollectionCount(tenantId, 'members', [{ field: 'status', operator: '==', value: 'active' }]),
          getTenantCollectionCount(tenantId, 'members', [{ field: 'status', operator: '==', value: 'expired' }]),
          getTenantCollectionCount(tenantId, 'members', [{ field: 'status', operator: '==', value: 'frozen' }]),
          getTenantCollectionCount(tenantId, 'members', [{ field: 'gender', operator: '==', value: 'male' }]),
          getTenantCollectionCount(tenantId, 'members', [{ field: 'gender', operator: '==', value: 'female' }]),
        ]),

        // 2) Today's attendance — the list shows 10, the count is an aggregation.
        Promise.all([
          getTenantDocuments(tenantId, 'attendance',
            [{ field: 'checkIn', operator: '>=', value: todayTs }],
            { field: 'checkIn', direction: 'desc' }, 10),
          getTenantCollectionCount(tenantId, 'attendance',
            [{ field: 'checkIn', operator: '>=', value: todayTs }]),
        ]),

        // 3) Revenue — summed on the server over the actual date range. This was
        // computed in JS from "the most recent 200 payments", so once a month
        // held more than 200 the month's revenue was silently under-reported.
        Promise.all([
          getTenantFieldSum(tenantId, 'payments', 'netAmount',
            [{ field: 'createdAt', operator: '>=', value: todayTs }]),
          getTenantFieldSum(tenantId, 'payments', 'netAmount',
            [{ field: 'createdAt', operator: '>=', value: monthTs }]),
          getTenantDocuments(tenantId, 'payments', [], { field: 'createdAt', direction: 'desc' }, 5),
        ]),

        // 4) Expiring subscriptions (next 7 days) — filtered by date range on the
        // SERVER. Previously this pulled every active subscription (~5k docs) and
        // threw almost all of them away in JS.
        getTenantDocuments(tenantId, 'subscriptions', [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'endDate', operator: '>=', value: todayTs },
          { field: 'endDate', operator: '<=', value: Timestamp.fromDate(sevenDaysLater) },
        ], { field: 'endDate', direction: 'asc' }),
      ]);

      const totalCount = totalC.count || 0;
      const activeCount = activeC.count || 0;
      const expiredCount = expiredC.count || 0;
      const frozenCount = frozenC.count || 0;
      const maleCount = maleC.count || 0;
      const femaleCount = femaleC.count || 0;

      setTodayAttendance(todayAtt || []);
      setRecentPayments(latestPayments || []);

      const todayRev = todaySum.total || 0;
      const monthRev = monthSum.total || 0;

      const expiring = expiringSubs || [];

      // Resolve names for the handful we actually display, one read each,
      // instead of loading the whole members collection to build a lookup map.
      const top = expiring.slice(0, 5);
      const expiringWithNames = await Promise.all(top.map(async (sub) => {
        const { data: member } = await getTenantDocument(tenantId, 'members', sub.memberId);
        return {
          ...sub,
          memberName: member?.fullName?.[locale] || member?.fullName?.ar || '—',
          phone: member?.phone || '',
        };
      }));
      setExpiringMembers(expiringWithNames);

      setStats({
        totalMembers: totalCount,
        activeMembers: activeCount,
        expiredMembers: expiredCount,
        frozenMembers: frozenCount,
        maleMembers: maleCount,
        femaleMembers: femaleCount,
        todayVisits: todayAttCount.count || 0,
        todayRevenue: todayRev,
        monthRevenue: monthRev,
        expiringSoon: expiring.length,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    }

    setLoading(false);
  };

  // Quick actions
  const quickActions = [
    { icon: '👤', label: t('dashboard.addMember'), href: `/${locale}/admin/members/new`, color: 'var(--pt-gold)' },
    { icon: '💳', label: t('dashboard.newSubscription'), href: `/${locale}/admin/subscriptions`, color: 'var(--pt-info)' },
    { icon: '💰', label: t('dashboard.recordPayment'), href: `/${locale}/admin/finance/payments`, color: 'var(--pt-success)' },
    { icon: '📱', label: t('dashboard.scanQR'), href: `/${locale}/admin/attendance/scanner`, color: 'var(--pt-warning)' },
  ];

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h1><span>📊</span> {t('dashboard.title')}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
            📅 {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadDashboardData} title={t('common.refresh')}>🔄</button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeMembers}</div>
            <div className="stat-label">{t('dashboard.activeMembers')}</div>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginTop: 'var(--space-1)' }}>
            {isAr ? `من ${stats.totalMembers} عضو` : `of ${stats.totalMembers} total`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.todayVisits}</div>
            <div className="stat-label">{t('dashboard.todayVisits')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">💰</div>
          <div className="stat-info">
            <div className="stat-value">{stats.todayRevenue.toLocaleString()}</div>
            <div className="stat-label">{t('dashboard.todayRevenue')}</div>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginTop: 'var(--space-1)' }}>
            {t('common.egp')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.expiringSoon}</div>
            <div className="stat-label">{t('dashboard.expiringSoon')}</div>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-warning)', marginTop: 'var(--space-1)' }}>
            {isAr ? 'خلال 7 أيام' : 'within 7 days'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>
          ⚡ {t('dashboard.quickActions')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
              background: 'var(--pt-darker)', border: '1px solid var(--glass-border)',
              textDecoration: 'none', transition: 'all 0.3s',
            }}>
              <span style={{ fontSize: '1.8rem' }}>{action.icon}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, textAlign: 'center' }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-success)' }}>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--pt-success)' }}>{stats.monthRevenue.toLocaleString()}</div>
            <div className="stat-label">{t('dashboard.monthRevenue')}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-danger)' }}>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--pt-danger)' }}>{stats.expiredMembers}</div>
            <div className="stat-label">{isAr ? 'منتهي' : 'Expired'}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-frozen)' }}>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--pt-frozen)' }}>{stats.frozenMembers}</div>
            <div className="stat-label">{t('dashboard.frozenMembers')}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderInlineStart: '3px solid var(--pt-gold)' }}>
          <div className="stat-info">
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <span>♂ <strong>{stats.maleMembers}</strong></span>
              <span>♀ <strong>{stats.femaleMembers}</strong></span>
            </div>
            <div className="stat-label">{t('dashboard.genderSplit')}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
        {/* Expiring Subscriptions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>⚠️ {t('dashboard.expiringSubscriptions')}</h3>
            <Link href={`/${locale}/admin/subscriptions`} className="btn btn-ghost btn-sm">{t('common.viewAll')} →</Link>
          </div>
          {expiringMembers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
              ✅ {isAr ? 'لا توجد اشتراكات تنتهي قريباً' : 'No subscriptions expiring soon'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {expiringMembers.map((sub, i) => {
                const endDate = sub.endDate?.toDate ? sub.endDate.toDate() : null;
                const daysLeft = endDate ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                    borderInlineStart: `3px solid ${daysLeft <= 2 ? 'var(--pt-danger)' : 'var(--pt-warning)'}`,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{sub.memberName}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{sub.phone}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <span className={`badge ${daysLeft <= 2 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                        {daysLeft} {isAr ? 'يوم' : 'days'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>💰 {t('dashboard.recentPayments')}</h3>
            <Link href={`/${locale}/admin/finance/payments`} className="btn btn-ghost btn-sm">{t('common.viewAll')} →</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
              📭 {t('common.noData')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recentPayments.map((pay, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{pay.memberName || '-'}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {pay.method === 'cash' ? '💵' : pay.method === 'visa' ? '💳' : '🏦'} {pay.type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ fontWeight: 800, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>
                      {(pay.netAmount || pay.amount || 0).toLocaleString()} {t('common.egp')}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)' }}>
            ✅ {t('dashboard.todayActivity')}
            <span className="badge badge-gold" style={{ marginInlineStart: 'var(--space-2)' }}>{stats.todayVisits}</span>
          </h3>
          <Link href={`/${locale}/admin/attendance`} className="btn btn-ghost btn-sm">{t('common.viewAll')} →</Link>
        </div>
        {todayAttendance.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
            {isAr ? 'لا توجد زيارات اليوم بعد' : 'No visits today yet'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
            {todayAttendance.map((att, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-full)',
                  background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)', flexShrink: 0,
                }}>
                  {(att.memberName || '?').charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.memberName}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">
                    {att.checkIn?.toDate ? att.checkIn.toDate().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                <span style={{ color: 'var(--pt-success)', fontSize: '0.8rem' }}>✓</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
