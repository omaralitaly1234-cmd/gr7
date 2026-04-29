'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAllTenants, getAllPayments, confirmPayment, checkTrialStatus, PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

export default function SuperAdminDashboard() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [tenantsRes, paymentsRes] = await Promise.all([getAllTenants(), getAllPayments()]);
      setTenants(tenantsRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  // Handle payment confirmation
  const handleConfirmPayment = async (paymentId) => {
    const { error } = await confirmPayment(paymentId, 'super-admin');
    if (!error) {
      // Refresh data
      const [tenantsRes, paymentsRes] = await Promise.all([getAllTenants(), getAllPayments()]);
      setTenants(tenantsRes.data || []);
      setPayments(paymentsRes.data || []);
    }
  };

  // Calculate stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;
  const expiredTenants = tenants.filter(t => t.status === 'expired').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const totalRevenue = payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyRevenue = payments.filter(p => {
    if (p.status !== 'confirmed') return false;
    const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    { icon: '🏢', label: locale === 'ar' ? 'إجمالي العملاء' : 'Total Clients', value: totalTenants, color: 'gold' },
    { icon: '✅', label: locale === 'ar' ? 'اشتراكات فعالة' : 'Active Subscriptions', value: activeTenants, color: 'success' },
    { icon: '🎁', label: locale === 'ar' ? 'فترة تجريبية' : 'On Trial', value: trialTenants, color: 'info' },
    { icon: '⛔', label: locale === 'ar' ? 'منتهي' : 'Expired', value: expiredTenants, color: 'danger' },
    { icon: '💰', label: locale === 'ar' ? 'إيرادات الشهر' : 'Monthly Revenue', value: `${monthlyRevenue.toLocaleString()} ${locale === 'ar' ? 'ج.م' : 'EGP'}`, color: 'gold' },
    { icon: '⏳', label: locale === 'ar' ? 'مدفوعات معلّقة' : 'Pending Payments', value: pendingPayments, color: 'warning' },
  ];

  const statusBadge = (status) => {
    const map = {
      active: { bg: 'var(--pt-success-bg)', color: 'var(--pt-success)', text: locale === 'ar' ? 'فعال' : 'Active' },
      trial: { bg: 'var(--pt-info-bg)', color: 'var(--pt-info)', text: locale === 'ar' ? 'تجريبي' : 'Trial' },
      expired: { bg: 'var(--pt-danger-bg)', color: 'var(--pt-danger)', text: locale === 'ar' ? 'منتهي' : 'Expired' },
      suspended: { bg: 'var(--pt-warning-bg)', color: 'var(--pt-warning)', text: locale === 'ar' ? 'معلّق' : 'Suspended' },
    };
    const s = map[status] || map.expired;
    return (
      <span className="badge" style={{ background: s.bg, color: s.color }}>{s.text}</span>
    );
  };

  const planLabel = (plan) => {
    const p = PLAN_DEFINITIONS[plan];
    return p ? (p.name[locale] || p.name.ar) : plan;
  };

  if (loading) {
    return (
      <div className="animate-fadeIn" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-400)', marginTop: 'var(--space-4)' }}>
          {locale === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <h1><span>👑</span> {locale === 'ar' ? 'لوحة تحكم المنصة' : 'Platform Dashboard'}</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-6)',
      }}>
        {/* Recent Tenants */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700 }}>🏢 {locale === 'ar' ? 'آخر العملاء' : 'Recent Clients'}</h3>
            <Link href={`/${locale}/super-admin/tenants`} className="btn btn-ghost btn-sm">
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {tenants.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>
                {locale === 'ar' ? 'لا يوجد عملاء بعد' : 'No clients yet'}
              </p>
            ) : (
              tenants.slice(0, 4).map((tenant) => (
                <div key={tenant.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--pt-darker)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {locale === 'ar' ? (tenant.nameAr || tenant.name) : (tenant.nameEn || tenant.name)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {tenant.ownerEmail}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {statusBadge(tenant.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700 }}>💰 {locale === 'ar' ? 'المدفوعات المعلّقة' : 'Pending Payments'}</h3>
            <Link href={`/${locale}/super-admin/payments`} className="btn btn-ghost btn-sm">
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {payments.filter(p => p.status === 'pending').length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>
                ✅ {locale === 'ar' ? 'لا توجد مدفوعات معلّقة' : 'No pending payments'}
              </p>
            ) : (
              payments.filter(p => p.status === 'pending').slice(0, 4).map((payment) => (
                <div key={payment.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--pt-darker)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--pt-warning-bg)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {payment.tenantName || payment.tenantId}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {planLabel(payment.planId)} — {payment.method}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>
                      {payment.amount?.toLocaleString()} {locale === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleConfirmPayment(payment.id)}>
                      ✓ {locale === 'ar' ? 'تأكيد' : 'Confirm'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
          📊 {locale === 'ar' ? 'ملخص الإيرادات' : 'Revenue Summary'}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          <div style={{
            padding: 'var(--space-5)',
            background: 'var(--pt-darker)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
              {locale === 'ar' ? 'إيرادات هذا الشهر' : 'This Month'}
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--pt-gold)' }}>
              {monthlyRevenue.toLocaleString()} <span style={{ fontSize: 'var(--font-size-sm)' }}>{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>
          <div style={{
            padding: 'var(--space-5)',
            background: 'var(--pt-darker)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
              {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--pt-success)' }}>
              {totalRevenue.toLocaleString()} <span style={{ fontSize: 'var(--font-size-sm)' }}>{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>
          <div style={{
            padding: 'var(--space-5)',
            background: 'var(--pt-darker)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
              {locale === 'ar' ? 'متوسط لكل عميل' : 'Avg per Client'}
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--pt-info)' }}>
              {activeTenants > 0 ? Math.round(totalRevenue / activeTenants).toLocaleString() : 0} <span style={{ fontSize: 'var(--font-size-sm)' }}>{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
