'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import TrialBanner from '@/components/TrialBanner';
import AIChatWidget from '@/components/ai/AIChatWidget';
import { TenantProvider, useTenant } from '@/context/TenantContext';

export default function AdminLayout({ children }) {
  return (
    <TenantProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </TenantProvider>
  );
}

function AdminLayoutInner({ children }) {
  const { user, loading, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { isSuspended, isExpired, tenantData, loading: tenantLoading } = useTenant();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth Guard — redirect to login if not admin
  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isSuperAdmin))) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, isAdmin, isSuperAdmin, router, locale]);

  // Loading state
  if (loading || tenantLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pt-black)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚡</div>
          <p style={{ color: 'var(--pt-gray-500)', marginTop: '1rem', fontSize: '0.9rem' }}>
            {isAr ? 'جاري التحقق...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || (!isAdmin && !isSuperAdmin)) return null;

  // 🔴 SUSPENDED — Show full-screen suspension notice
  if (isSuspended) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10) var(--space-8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(239,68,68,0.08)',
        }}>
          {/* Warning Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-6)',
            fontSize: '2.5rem',
          }}>
            ⚠️
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 800,
            color: '#ef4444',
            marginBottom: 'var(--space-3)',
          }}>
            {isAr ? 'تم تعليق اشتراكك' : 'Your Subscription is Suspended'}
          </h1>

          {/* Gym Name */}
          {tenantData?.name && (
            <p style={{
              color: 'var(--pt-gray-400)',
              fontSize: 'var(--font-size-md)',
              marginBottom: 'var(--space-4)',
              fontWeight: 600,
            }}>
              🏢 {isAr ? (tenantData.nameAr || tenantData.name) : (tenantData.nameEn || tenantData.name)}
            </p>
          )}

          {/* Message */}
          <p style={{
            color: 'var(--pt-gray-400)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 1.8,
            marginBottom: 'var(--space-6)',
          }}>
            {isAr
              ? 'تم تعليق اشتراكك في النظام. لن تتمكن من الوصول إلى لوحة التحكم أو أي من الخدمات حتى يتم إعادة تفعيل حسابك.'
              : 'Your system subscription has been suspended. You will not be able to access the dashboard or any services until your account is reactivated.'
            }
          </p>

          {/* Contact Box */}
          <div style={{
            background: 'rgba(245,197,24,0.05)',
            border: '1px solid rgba(245,197,24,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-6)',
          }}>
            <p style={{
              color: 'var(--pt-gold)',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-3)',
            }}>
              📞 {isAr ? 'يرجى التواصل مع GR7' : 'Please contact GR7'}
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--pt-gray-300)',
            }}>
              <a href="mailto:gr7.fit@gmail.com" style={{
                color: 'var(--pt-info)',
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                📧 gr7.fit@gmail.com
              </a>
              <a href="https://wa.me/201032034773" target="_blank" rel="noopener" style={{
                color: '#25D366',
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={async () => { await signOut(); router.push(`/${locale}/login`); }}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-6)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--pt-gray-300)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            🚪 {isAr ? 'تسجيل الخروج' : 'Sign Out'}
          </button>

          {/* Footer */}
          <p style={{
            marginTop: 'var(--space-5)',
            fontSize: '11px',
            color: 'var(--pt-gray-600)',
          }}>
            © 2026 GR7 System — Power Time Management
          </p>
        </div>
      </div>
    );
  }

  // 🟡 EXPIRED — Show expiry notice (similar but less severe)
  if (isExpired) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1000 50%, #0a0a0a 100%)',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(245,197,24,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10) var(--space-8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(245,197,24,0.05)',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(245,197,24,0.1)',
            border: '2px solid rgba(245,197,24,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-6)',
            fontSize: '2.5rem',
          }}>
            ⏰
          </div>

          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--pt-gold)', marginBottom: 'var(--space-3)' }}>
            {isAr ? 'انتهى اشتراكك' : 'Your Subscription Has Expired'}
          </h1>

          <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>
            {isAr
              ? 'انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للاستمرار في استخدام النظام.'
              : 'Your subscription has expired. Please renew to continue using the system.'
            }
          </p>

          <div style={{
            background: 'rgba(245,197,24,0.05)',
            border: '1px solid rgba(245,197,24,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-6)',
          }}>
            <p style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
              📞 {isAr ? 'يرجى التواصل مع GR7 لتجديد الاشتراك' : 'Contact GR7 to renew'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
              <a href="mailto:gr7.fit@gmail.com" style={{ color: 'var(--pt-info)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                📧 gr7.fit@gmail.com
              </a>
              <a href="https://wa.me/201032034773" target="_blank" rel="noopener" style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                💬 WhatsApp
              </a>
            </div>
          </div>

          <button
            onClick={async () => { await signOut(); router.push(`/${locale}/login`); }}
            style={{
              width: '100%', padding: 'var(--space-3) var(--space-6)',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-md)', color: 'var(--pt-gray-300)',
              fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer',
            }}
          >
            🚪 {isAr ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        role="admin"
        locale={locale}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <TrialBanner />
        <Header
          locale={locale}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="page-container">
          {children}
        </div>
      </main>
      <AIChatWidget locale={locale} role="admin" />
    </div>
  );
}
