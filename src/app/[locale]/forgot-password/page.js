'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/firebase/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await resetPassword(email);
    if (result.error) {
      setError(result.error[locale] || result.error.ar || result.error);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🔐</div>
          <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>{t('auth.resetPassword')}</h1>
          <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{t('auth.resetInstructions')}</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
            <p style={{ color: 'var(--pt-success)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>{t('auth.resetSent')}</p>
            <Link href={`/${locale}/login`} className="btn btn-primary">{t('auth.login')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ padding: 'var(--space-3)', background: 'var(--pt-danger-bg)', border: '1px solid rgba(255,23,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>⚠️ {error}</div>}
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : t('auth.resetPassword')}
            </button>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <Link href={`/${locale}/login`} className="btn btn-ghost">{t('common.back')} ← {t('auth.login')}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
