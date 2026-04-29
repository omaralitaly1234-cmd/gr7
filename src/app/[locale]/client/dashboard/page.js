'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocument, getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ClientDashboardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user, userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        // Get member profile by auth UID
        const { data: members } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'userId', operator: '==', value: user.uid }]);
        const member = members?.[0];
        setMemberData(member || null);

        if (member) {
          // Active subscription
          const { data: subs } = await getTenantDocuments(tenantId, 'subscriptions',
            [{ field: 'memberId', operator: '==', value: member.id },
              { field: 'status', operator: '==', value: 'active' }]);
          setSubscription(subs?.[0] || null);

          // Recent attendance
          const { data: att } = await getTenantDocuments(tenantId, 'attendance',
            [{ field: 'memberId', operator: '==', value: member.id }],
            { field: 'checkIn', direction: 'desc' }, 5);
          setRecentAttendance(att || []);
        }
      } catch (err) {
        console.error('Error loading client data:', err);
      }
      setLoading(false);
    }
    loadData();
  }, [tenantId, user]);

  const getDaysLeft = () => {
    if (!subscription?.endDate) return 0;
    const end = subscription.endDate?.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
    return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();
  const daysTotal = subscription?.planSnapshot?.duration || 30;
  const progressPercent = Math.max(0, Math.min(100, ((daysTotal - daysLeft) / daysTotal) * 100));

  const quickLinks = [
    { icon: '🥗', label: t('client.myDietPlan'), href: `/${locale}/client/diet` },
    { icon: '🏋️', label: t('client.myTrainingPlan'), href: `/${locale}/client/training` },
    { icon: '🧖', label: t('client.bookSpa'), href: `/${locale}/client/bookings/spa` },
    { icon: '📈', label: t('client.myProgress'), href: `/${locale}/client/progress` },
    { icon: '🏆', label: t('client.achievements'), href: `/${locale}/client/achievements` },
    { icon: '📅', label: t('client.bookClass'), href: `/${locale}/client/bookings/classes` },
  ];

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👋</span> {isAr ? `مرحباً، ${memberData?.fullName?.ar || userData?.displayName || 'عضو'}` : `Welcome, ${memberData?.fullName?.en || userData?.displayName || 'Member'}`}</h1>
      </div>

      {/* Subscription Status Card */}
      <div className="card" style={{
        marginBottom: 'var(--space-6)',
        background: subscription ? 'linear-gradient(135deg, rgba(245,197,24,0.05), rgba(245,197,24,0.02))' : 'var(--pt-dark)',
        border: subscription ? '1px solid rgba(245,197,24,0.2)' : '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className={`badge ${subscription?.planSnapshot?.type === 'diamond' ? 'badge-diamond' : 'badge-gold'}`}>
                {subscription?.planSnapshot?.type === 'diamond' ? '💎' : '🥇'} {subscription?.planSnapshot?.name?.[locale] || (isAr ? 'لا اشتراك' : 'No subscription')}
              </span>
              <span className={`badge ${memberData?.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                ● {memberData?.status ? t(`common.${memberData.status}`) : '-'}
              </span>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
              {t('client.mySubscription')}
            </h3>
            {subscription && (
              <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                {isAr ? 'ينتهي' : 'Expires'}: {subscription.endDate?.toDate ? subscription.endDate.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}
              </p>
            )}
          </div>

          {subscription && (
            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={daysLeft <= 7 ? 'var(--pt-danger)' : 'var(--pt-gold)'} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={`${(1 - progressPercent / 100) * 264} 264`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: daysLeft <= 7 ? 'var(--pt-danger)' : 'var(--pt-gold)' }}>{daysLeft}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{t('common.day')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session counter for session-based plans */}
        {subscription?.totalSessions && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
              <span>{t('subscriptions.remainingSessions')}</span>
              <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>
                {subscription.remainingSessions || 0} / {subscription.totalSessions}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 'var(--radius-full)',
                background: 'var(--pt-gold)',
                width: `${((subscription.remainingSessions || 0) / subscription.totalSessions) * 100}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📊</div>
          <div className="stat-info">
            <div className="stat-value">{memberData?.totalVisits || 0}</div>
            <div className="stat-label">{t('members.totalVisits')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">⚖️</div>
          <div className="stat-info">
            <div className="stat-value">{memberData?.weight || '-'} <span style={{ fontSize: 'var(--font-size-xs)' }}>kg</span></div>
            <div className="stat-label">{isAr ? 'الوزن' : 'Weight'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">🎯</div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-md)' }}>
              {memberData?.fitnessGoal ? t(`members.goals.${memberData.fitnessGoal}`) : '-'}
            </div>
            <div className="stat-label">{t('members.fitnessGoal')}</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>⚡ {isAr ? 'وصول سريع' : 'Quick Access'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
          {quickLinks.map((link, i) => (
            <Link key={i} href={link.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--pt-darker)',
              border: '1px solid var(--glass-border)', textDecoration: 'none', transition: 'all 0.3s',
            }}>
              <span style={{ fontSize: '1.6rem' }}>{link.icon}</span>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textAlign: 'center' }}>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'آخر الزيارات' : 'Recent Visits'}</h3>
        {recentAttendance.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>
            📭 {isAr ? 'لا توجد زيارات بعد' : 'No visits yet'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentAttendance.map((att, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--pt-success)' }}>✅</span>
                  <span style={{ fontSize: 'var(--font-size-sm)' }}>
                    {att.checkIn?.toDate ? att.checkIn.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-'}
                  </span>
                </div>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }} dir="ltr">
                  {att.checkIn?.toDate ? att.checkIn.toDate().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
