'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const superAdminMenu = [
  { key: 'dashboard', icon: '📊', path: '/super-admin/dashboard', label: { ar: 'لوحة التحكم', en: 'Dashboard' } },
  { key: 'tenants', icon: '🏢', path: '/super-admin/tenants', label: { ar: 'العملاء (الجيمات)', en: 'Tenants (Gyms)' } },
  { key: 'plans', icon: '💎', path: '/super-admin/plans', label: { ar: 'خطط الأسعار', en: 'Pricing Plans' } },
  { key: 'payments', icon: '💰', path: '/super-admin/payments', label: { ar: 'المدفوعات', en: 'Payments' } },
  { key: 'analytics', icon: '📈', path: '/super-admin/analytics', label: { ar: 'تحليلات المنصة', en: 'Platform Analytics' } },
  { key: 'settings', icon: '⚙️', path: '/super-admin/settings', label: { ar: 'إعدادات المنصة', en: 'Platform Settings' } },
];

export default function SuperAdminLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, isSuperAdmin } = useAuth();

  // Auth Guard — ONLY super admins can access
  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin)) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, isSuperAdmin, router, locale]);

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pt-black)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚡</div>
          <p style={{ color: 'var(--pt-gray-500)', marginTop: '1rem', fontSize: '0.9rem' }}>
            {locale === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // Not authorized — don't render anything
  if (!user || !isSuperAdmin) return null;

  const isActive = (path) => {
    const fullPath = `/${locale}${path}`;
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 72 : 260,
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)',
          borderInlineEnd: '1px solid rgba(245,197,24,0.1)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          position: 'fixed',
          top: 0,
          bottom: 0,
          zIndex: 50,
          [locale === 'ar' ? 'right' : 'left']: 0,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: 'var(--space-5) var(--space-4)',
          borderBottom: '1px solid rgba(245,197,24,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--pt-gold), var(--pt-gold-dim))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0,
          }}>
            👑
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--pt-gold)', letterSpacing: '0.05em' }}>
                Power Time
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                {locale === 'ar' ? 'إدارة المنصة' : 'Platform Admin'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {superAdminMenu.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.path}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: collapsed ? 'var(--space-3)' : 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isActive(item.path) ? 600 : 400,
                color: isActive(item.path) ? 'var(--pt-gold)' : 'var(--pt-gray-400)',
                background: isActive(item.path) ? 'rgba(245,197,24,0.08)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              title={collapsed ? (item.label[locale] || item.label.ar) : undefined}
            >
              <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
              {!collapsed && <span>{item.label[locale] || item.label.ar}</span>}
              {isActive(item.path) && (
                <span style={{
                  position: 'absolute',
                  [locale === 'ar' ? 'left' : 'right']: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--pt-gold)',
                }} />
              )}
            </Link>
          ))}
        </nav>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid rgba(245,197,24,0.08)',
            color: 'var(--pt-gray-500)',
            fontSize: 'var(--font-size-sm)',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {collapsed
            ? (locale === 'ar' ? '←' : '→')
            : (locale === 'ar' ? '→' : '←')
          }
        </button>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        [locale === 'ar' ? 'marginRight' : 'marginLeft']: collapsed ? 72 : 260,
        minHeight: '100vh',
        transition: 'margin 0.25s ease',
      }}>
        {/* Top Bar */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(13,13,13,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: 'var(--space-3) var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{
              background: 'linear-gradient(135deg, var(--pt-gold), var(--pt-gold-dim))',
              color: 'var(--pt-black)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
            }}>
              👑 SUPER ADMIN
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
              {locale === 'ar' ? 'مدير المنصة' : 'Platform Manager'}
            </span>
          </div>
        </header>

        <div className="page-container" style={{ paddingTop: 'var(--space-6)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
