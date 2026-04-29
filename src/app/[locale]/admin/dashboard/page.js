'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, getTenantCollectionCount } from '@/lib/firebase/firestore';
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

      // 1) Members stats
      const { data: allMembers } = await getTenantDocuments(tenantId, 'members');
      const members = allMembers || [];
      const activeCount = members.filter(m => m.status === 'active').length;
      const expiredCount = members.filter(m => m.status === 'expired').length;
      const frozenCount = members.filter(m => m.status === 'frozen').length;
      const maleCount = members.filter(m => m.gender === 'male').length;
      const femaleCount = members.filter(m => m.gender === 'female').length;

      // 2) Today's attendance
      const { data: todayAtt } = await getTenantDocuments(tenantId, 'attendance',
        [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(todayStart) }],
        { field: 'checkIn', direction: 'desc' });
      setTodayAttendance(todayAtt?.slice(0, 10) || []);

      // 3) Payments — recent + revenue calculations
      const { data: allPayments } = await getTenantDocuments(tenantId, 'payments', [],
        { field: 'createdAt', direction: 'desc' }, 200);
      const pays = allPayments || [];
      setRecentPayments(pays.slice(0, 5));

      let todayRev = 0, monthRev = 0;
      pays.forEach(p => {
        const amount = p.netAmount || p.amount || 0;
        const date = p.createdAt?.toDate ? p.createdAt.toDate() : null;
        if (date && date >= todayStart) todayRev += amount;
        if (date && date >= monthStart) monthRev += amount;
      });

      // 4) Expiring subscriptions (next 7 days)
      const { data: activeSubs } = await getTenantDocuments(tenantId, 'subscriptions',
        [{ field: 'status', operator: '==', value: 'active' }]);
      const expiring = (activeSubs || []).filter(sub => {
        const endDate = sub.endDate?.toDate ? sub.endDate.toDate() : null;
        return endDate && endDate <= sevenDaysLater && endDate >= todayStart;
      });

      // Map expiring subs to member info
      const expiringWithNames = expiring.map(sub => {
        const member = members.find(m => m.id === sub.memberId);
        return { ...sub, memberName: member?.fullName?.[locale] || member?.fullName?.ar || '—', phone: member?.phone || '' };
      });
      setExpiringMembers(expiringWithNames.slice(0, 5));

      setStats({
        totalMembers: members.length,
        activeMembers: activeCount,
        expiredMembers: expiredCount,
        frozenMembers: frozenCount,
        maleMembers: maleCount,
        femaleMembers: femaleCount,
        todayVisits: todayAtt?.length || 0,
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
