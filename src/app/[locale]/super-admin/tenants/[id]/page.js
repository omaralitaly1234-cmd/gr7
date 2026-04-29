'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PLAN_DEFINITIONS, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';

export default function TenantDetailPage({ params: routeParams }) {
  const params = useParams();
  const locale = params?.locale || 'ar';

  // Demo tenant data
  const [tenant] = useState({
    id: routeParams?.id || 'gym-001',
    name: 'GR 7 - المعادي',
    nameAr: 'GR 7 - المعادي',
    nameEn: 'GR 7 - Maadi',
    ownerEmail: 'maadi@gym.com',
    phone: '01012345678',
    status: 'trial',
    createdAt: { toDate: () => new Date('2026-03-15') },
    address: { ar: 'المعادي - القاهرة', en: 'Maadi - Cairo' },
    subscription: {
      plan: 'trial',
      trialStartDate: { toDate: () => new Date('2026-03-15') },
      trialEndDate: { toDate: () => new Date('2026-06-15') },
    },
    features: { ...PLAN_DEFINITIONS.trial.features },
    limits: { maxMembers: 100, maxTrainers: 3 },
  });

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const statusBadge = (status) => {
    const map = {
      active: { cls: 'badge-success', text: locale === 'ar' ? 'فعال' : 'Active' },
      trial: { cls: 'badge-info', text: locale === 'ar' ? 'تجريبي' : 'Trial' },
      expired: { cls: 'badge-danger', text: locale === 'ar' ? 'منتهي' : 'Expired' },
      suspended: { cls: 'badge-warning', text: locale === 'ar' ? 'معلّق' : 'Suspended' },
    };
    const s = map[status] || map.expired;
    return <span className={`badge ${s.cls}`} style={{ fontSize: 'var(--font-size-sm)', padding: '4px 14px' }}>{s.text}</span>;
  };

  const now = new Date();
  const trialEnd = tenant.subscription?.trialEndDate?.toDate ? tenant.subscription.trialEndDate.toDate() : new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏢</span> {locale === 'ar' ? (tenant.nameAr || tenant.name) : (tenant.nameEn || tenant.name)}</h1>
        {statusBadge(tenant.status)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main Info */}
        <div>
          {/* Gym Info Card */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              📋 {locale === 'ar' ? 'بيانات الجيم' : 'Gym Info'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {[
                { label: locale === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)', value: tenant.nameAr },
                { label: locale === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)', value: tenant.nameEn },
                { label: locale === 'ar' ? 'البريد الإلكتروني' : 'Email', value: tenant.ownerEmail },
                { label: locale === 'ar' ? 'الهاتف' : 'Phone', value: tenant.phone },
                { label: locale === 'ar' ? 'العنوان' : 'Address', value: tenant.address?.[locale] || '—' },
                { label: locale === 'ar' ? 'تاريخ التسجيل' : 'Registration Date', value: formatDate(tenant.createdAt) },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              🎛️ {locale === 'ar' ? 'الميزات المفعّلة' : 'Active Features'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {Object.entries(AI_FEATURE_LABELS).map(([key, info]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                  background: tenant.features?.[key] ? 'var(--pt-success-bg)' : 'var(--pt-darker)',
                  opacity: tenant.features?.[key] ? 1 : 0.5,
                  fontSize: 'var(--font-size-sm)',
                }}>
                  <span>{tenant.features?.[key] ? '✅' : '🔒'}</span>
                  <span>{info.icon} {info[locale] || info.ar}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Subscription Card */}
          <div className="card" style={{
            marginBottom: 'var(--space-5)',
            border: '1px solid rgba(245,197,24,0.15)',
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              💳 {locale === 'ar' ? 'الاشتراك' : 'Subscription'}
            </h3>
            <div style={{ fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'الخطة' : 'Plan'}</span>
                <span className="badge badge-gold">{PLAN_DEFINITIONS[tenant.subscription?.plan]?.name?.[locale] || '—'}</span>
              </div>
              {tenant.status === 'trial' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'الأيام المتبقية' : 'Days Remaining'}</span>
                    <span style={{ fontWeight: 700, color: daysRemaining <= 7 ? 'var(--pt-danger)' : 'var(--pt-info)' }}>
                      {daysRemaining} {locale === 'ar' ? 'يوم' : 'days'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'تنتهي في' : 'Ends on'}</span>
                    <span>{formatDate(tenant.subscription?.trialEndDate)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'حد الأعضاء' : 'Max Members'}</span>
                <span>{tenant.limits.maxMembers === -1 ? '♾' : tenant.limits.maxMembers}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              ⚡ {locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                💎 {locale === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
              </button>
              {tenant.status !== 'suspended' && (
                <button className="btn btn-secondary" style={{ width: '100%' }}>
                  ⏸️ {locale === 'ar' ? 'تعليق مؤقت' : 'Suspend'}
                </button>
              )}
              {tenant.status === 'suspended' && (
                <button className="btn btn-outline" style={{ width: '100%' }}>
                  ▶️ {locale === 'ar' ? 'إعادة تفعيل' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
