'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Header({ locale = 'ar', onMenuToggle }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { mode, resolvedTheme, toggleTheme } = useTheme();
  const { user, userData, signOut, role } = useAuth();
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  
  // Build the language switch URL by replacing the locale in the current path
  const switchPath = pathname.replace(`/${locale}`, `/${switchLocale}`);

  const themeIcon = mode === 'auto' ? '🌗' : mode === 'light' ? '☀️' : '🌙';
  const themeLabel = mode === 'auto'
    ? (locale === 'ar' ? 'تلقائي' : 'Auto')
    : mode === 'light'
    ? (locale === 'ar' ? 'نهاري' : 'Light')
    : (locale === 'ar' ? 'ليلي' : 'Dark');

  const displayName = userData?.displayName || user?.displayName || (locale === 'ar' ? 'مستخدم' : 'User');
  const displayRole = role === 'admin'
    ? (locale === 'ar' ? 'مدير النظام' : 'System Admin')
    : role === 'trainer'
    ? (locale === 'ar' ? 'مدرب' : 'Trainer')
    : (locale === 'ar' ? 'عضو' : 'Member');

  const handleLogout = async () => {
    await signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerStart}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          ☰
        </button>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder={t('common.search')}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.headerEnd}>
        {/* Theme Toggle */}
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          title={themeLabel}
          style={{ position: 'relative' }}
        >
          <span style={{ fontSize: '1.1rem' }}>{themeIcon}</span>
          <span style={{
            position: 'absolute',
            bottom: -2,
            insetInlineEnd: -2,
            fontSize: '7px',
            fontWeight: 800,
            background: mode === 'auto' ? 'var(--pt-gold)' : mode === 'light' ? '#FFD740' : '#4FC3F7',
            color: '#000',
            borderRadius: 'var(--radius-full)',
            padding: '1px 4px',
            lineHeight: 1.2,
          }}>
            {mode === 'auto' ? 'A' : mode === 'light' ? 'L' : 'D'}
          </span>
        </button>

        {/* Language Switcher */}
        <Link href={switchPath} className={styles.langBtn}>
          {locale === 'ar' ? 'EN' : 'عربي'}
        </Link>

        {/* Notifications */}
        <button className={styles.iconBtn}>
          <span>🔔</span>
        </button>

        {/* User Menu */}
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>{displayName.charAt(0)}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{displayRole}</span>
          </div>
          <button className={styles.logoutBtn} title={t('auth.logout')} onClick={handleLogout}>
            🚪
          </button>
        </div>
      </div>
    </header>
  );
}
