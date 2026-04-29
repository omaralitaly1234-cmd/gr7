'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, getTenantCollectionCount } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';

export default function TrainerDashboardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user, userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalClients: 0, todaySessions: 0, rating: 0 });
  const [clients, setClients] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        // Get trainer's assigned clients
        const { data: assignedMembers } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'assignedTrainer', operator: '==', value: user.uid }],
          { field: 'fullName.ar', direction: 'asc' });
        setClients(assignedMembers || []);

        // Today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: sessions } = await getTenantDocuments(tenantId, 'trainer_sessions',
          [
            { field: 'trainerId', operator: '==', value: user.uid },
            { field: 'date', operator: '>=', value: Timestamp.fromDate(today) },
          ]);
        setTodaySessions(sessions || []);

        setStats({
          totalClients: assignedMembers?.length || 0,
          todaySessions: sessions?.length || 0,
          rating: userData?.rating || 4.5,
        });
      } catch (err) {
        console.error('Error loading trainer data:', err);
      }
      setLoading(false);
    }
    loadData();
  }, [tenantId, user]);

  const quickActions = [
    { icon: '🥗', label: t('trainer.createDietPlan'), href: `/${locale}/trainer/diet-plans` },
    { icon: '🏋️', label: t('trainer.createProgram'), href: `/${locale}/trainer/programs` },
    { icon: '📊', label: t('trainer.progress'), href: `/${locale}/trainer/progress` },
    { icon: '📅', label: t('trainer.schedule'), href: `/${locale}/trainer/schedule` },
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
        <h1><span>💪</span> {isAr ? `مرحباً، ${userData?.displayName || 'مدرب'}` : `Welcome, ${userData?.displayName || 'Trainer'}`}</h1>
        <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
          📅 {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalClients}</div>
            <div className="stat-label">{t('trainer.totalClients')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.todaySessions}</div>
            <div className="stat-label">{t('trainer.todaySessions')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">⭐</div>
          <div className="stat-info">
            <div className="stat-value">{stats.rating.toFixed(1)}</div>
            <div className="stat-label">{t('trainer.rating')}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>⚡ {t('dashboard.quickActions')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--pt-darker)',
              border: '1px solid var(--glass-border)', textDecoration: 'none', transition: 'all 0.3s',
            }}>
              <span style={{ fontSize: '1.8rem' }}>{a.icon}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, textAlign: 'center' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* My Clients */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)' }}>👥 {t('trainer.myClients')}</h3>
          <Link href={`/${locale}/trainer/clients`} className="btn btn-ghost btn-sm">{t('common.viewAll')} →</Link>
        </div>
        {clients.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>
            📭 {isAr ? 'لا يوجد عملاء مخصصين لك بعد' : 'No clients assigned yet'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
            {clients.slice(0, 6).map((client) => (
              <div key={client.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-full)',
                  background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'var(--pt-gold)', flexShrink: 0,
                }}>
                  {(client.fullName?.[locale] || client.fullName?.ar || '?').charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client.fullName?.[locale] || client.fullName?.ar}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                    {client.fitnessGoal ? t(`members.goals.${client.fitnessGoal}`) : ''} • {t(`common.${client.gender}`)}
                  </div>
                </div>
                <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                  {t(`common.${client.status}`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
