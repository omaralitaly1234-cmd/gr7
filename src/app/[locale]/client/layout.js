'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import TrialBanner from '@/components/TrialBanner';
import FeatureGate from '@/components/FeatureGate';
import NotificationPopup from '@/components/NotificationPopup';
import { TenantProvider } from '@/context/TenantContext';

// Lazy-safe AIChatWidget wrapper — only renders if component exists
function AIChatWidgetSafe({ locale, role }) {
  try {
    const AIChatWidget = require('@/components/ai/AIChatWidget').default;
    return (
      <FeatureGate feature="ai_chatbot">
        <AIChatWidget locale={locale} role={role} />
      </FeatureGate>
    );
  } catch {
    return null;
  }
}

export default function ClientLayout({ children }) {
  const { user, loading, isMember, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth Guard — allow members and admins
  useEffect(() => {
    if (!loading && (!user || !(isMember || isAdmin || isSuperAdmin))) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, isMember, isAdmin, isSuperAdmin, router, locale]);

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

  if (!user || !(isMember || isAdmin || isSuperAdmin)) return null;

  return (
    <TenantProvider>
      <div className="app-layout">
        <Sidebar
          role="client"
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
        <AIChatWidgetSafe locale={locale} role="client" />
        <NotificationPopup />
      </div>
    </TenantProvider>
  );
}
