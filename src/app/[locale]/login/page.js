'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage({ params }) {
  const locale = params?.locale || 'ar';
  const { signIn } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const { mode, resolvedTheme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Theme icon & label
  const themeConfig = {
    auto: { icon: '🔄', label: locale === 'ar' ? 'تلقائي' : 'Auto' },
    light: { icon: '☀️', label: locale === 'ar' ? 'نهاري' : 'Light' },
    dark: { icon: '🌙', label: locale === 'ar' ? 'ليلي' : 'Dark' },
  };
  const currentTheme = themeConfig[mode] || themeConfig.auto;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error[locale] || result.error.ar);
      } else {
        // Redirect based on role
        const { getUserRole, getUserData } = await import('@/lib/firebase/auth');
        const role = await getUserRole(result.user.uid);
        const { data: uData } = await getUserData(result.user.uid);
        
        if (role === 'superadmin' || uData?.superAdmin === true) {
          router.push(`/${locale}/super-admin/dashboard`);
        } else if (role === 'admin') {
          router.push(`/${locale}/admin/dashboard`);
        } else if (role === 'trainer') {
          router.push(`/${locale}/trainer/dashboard`);
        } else {
          router.push(`/${locale}/client/dashboard`);
        }
      }
    } catch (err) {
      setError(locale === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <div className={styles.loginPage}>
      {/* Background Effects */}
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />

      {/* Top Controls — Language & Theme */}
      <div className={styles.topControls}>
        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={locale === 'ar' ? 'تبديل الوضع' : 'Toggle theme'}
          title={currentTheme.label}
        >
          <span className={styles.themeIcon}>{currentTheme.icon}</span>
          <span className={styles.themeLabel}>{currentTheme.label}</span>
        </button>

        {/* Language Switcher */}
        <Link href={`/${switchLocale}/login`} className={styles.langSwitch}>
          {locale === 'ar' ? 'English' : 'عربي'}
        </Link>
      </div>

      {/* Login Card */}
      <div className={styles.loginCard}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div>
          <h1 className={styles.logoTitle}>Power Time</h1>
          <p className={styles.logoSubtitle}>{t('common.tagline')}</p>
        </div>

        {/* Welcome Text */}
        <div className={styles.welcome}>
          <h2>{t('auth.welcomeBack')}</h2>
          <p>{t('auth.loginSubtitle')}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBox} role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email" className="form-label">{t('auth.email')}</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@powertime.com"
              required
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">{t('auth.password')}</label>
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword 
                  ? (locale === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') 
                  : (locale === 'ar' ? 'إظهار كلمة المرور' : 'Show password')
                }
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className={styles.formActions}>
            <label className={styles.rememberMe}>
              <input type="checkbox" id="remember-me" />
              <span>{t('auth.rememberMe')}</span>
            </label>
            <Link href={`/${locale}/forgot-password`} className={styles.forgotLink}>
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                {t('auth.login')}
                <span className={styles.submitArrow}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p style={{ marginBottom: 'var(--space-2)' }}>
            {t('auth.noAccount')}{' '}
            <Link href={`/${locale}/register`} className={styles.registerLink}>
              {t('auth.register')}
            </Link>
          </p>
          <p>© 2026 Power Time. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
