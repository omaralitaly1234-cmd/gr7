'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import TrialBanner from '@/components/TrialBanner';
import AIChatWidget from '@/components/ai/AIChatWidget';
import { TenantProvider } from '@/context/TenantContext';

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth Guard — redirect to login if not admin
  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isSuperAdmin))) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, isAdmin, isSuperAdmin, router, locale]);

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pt-black)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚡</div>
          <p style={{ color: 'var(--pt-gray-500)', marginTop: '1rem', fontSize: '0.9rem' }}>
            {locale === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || (!isAdmin && !isSuperAdmin)) return null;

  return (
    <TenantProvider>
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
    </TenantProvider>
  );
}
