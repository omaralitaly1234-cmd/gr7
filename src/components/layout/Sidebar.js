'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import styles from './Sidebar.module.css';

const adminMenuItems = [
  { key: 'dashboard', icon: '📊', path: '/admin/dashboard' },
  { key: 'members', icon: '👥', path: '/admin/members' },
  { key: 'subscriptions', icon: '💳', path: '/admin/subscriptions' },
  { key: 'spa', icon: '🧖', path: '/admin/spa' },
  { key: 'trainers', icon: '👨‍🏫', path: '/admin/trainers' },
  { key: 'classes', icon: '🏋️', path: '/admin/classes' },
  { key: 'employees', icon: '👔', path: '/admin/employees' },
  { key: 'shifts', icon: '⏰', path: '/admin/employees/shifts', translationKey: 'sidebar.shifts' },
  { key: 'payments', icon: '💰', path: '/admin/finance/payments' },
  { key: 'invoices', icon: '🧾', path: '/admin/finance/invoices' },
  { key: 'reports', icon: '📈', path: '/admin/finance/reports' },
  { key: 'scanner', icon: '📱', path: '/admin/attendance/scanner' },
  { key: 'attendance', icon: '✅', path: '/admin/attendance' },
  { key: 'schedule', icon: '📅', path: '/admin/schedule' },
  { key: 'analytics', icon: '🤖', path: '/admin/analytics', translationKey: 'sidebar.analytics' },
  { key: 'offers', icon: '🏷️', path: '/admin/offers' },
  { key: 'notifications', icon: '🔔', path: '/admin/notifications' },
  { key: 'ratings', icon: '⭐', path: '/admin/ratings' },
  { key: 'settings', icon: '⚙️', path: '/admin/settings' },
  { key: 'activity', icon: '📜', path: '/admin/activity', translationKey: 'sidebar.activity' },
  { key: 'backup', icon: '💾', path: '/admin/backup', translationKey: 'sidebar.backup' },
  { key: 'campaigns', icon: '📣', path: '/admin/campaigns', translationKey: 'sidebar.campaigns' },
  { key: 'inventory', icon: '🏗️', path: '/admin/inventory', translationKey: 'sidebar.inventory' },
  { key: 'expenses', icon: '💸', path: '/admin/expenses', translationKey: 'sidebar.expenses' },
  { key: 'hr', icon: '👥', path: '/admin/hr', translationKey: 'sidebar.hr' },
  { key: 'insights', icon: '🧠', path: '/admin/insights', translationKey: 'sidebar.insights' },
  { key: 'audit', icon: '📜', path: '/admin/audit', translationKey: 'sidebar.audit' },
  { key: 'forecast', icon: '🔮', path: '/admin/forecast', translationKey: 'sidebar.forecast' },
  { key: 'engagement', icon: '📊', path: '/admin/engagement', translationKey: 'sidebar.engagement' },
  { key: 'feedback', icon: '⭐', path: '/admin/feedback', translationKey: 'sidebar.feedback' },
  { key: 'contracts', icon: '📝', path: '/admin/contracts', translationKey: 'sidebar.contracts' },
  { key: 'aiDashboard', icon: '🤖', path: '/admin/ai-dashboard', translationKey: 'sidebar.aiDashboard' },
  { key: 'aiSettings', icon: '⚙️', path: '/admin/ai-settings', translationKey: 'sidebar.aiSettings' },
];

const trainerMenuItems = [
  { key: 'dashboard', icon: '📊', path: '/trainer/dashboard' },
  { key: 'myClients', icon: '👥', path: '/trainer/clients', translationKey: 'trainer.myClients' },
  { key: 'dietPlans', icon: '🥗', path: '/trainer/diet-plans', translationKey: 'trainer.dietPlans' },
  { key: 'trainingPrograms', icon: '🏋️', path: '/trainer/programs', translationKey: 'trainer.trainingPrograms' },
  { key: 'progress', icon: '📊', path: '/trainer/progress', translationKey: 'trainer.progress' },
  { key: 'schedule', icon: '📅', path: '/trainer/schedule' },
  { key: 'earnings', icon: '💰', path: '/trainer/earnings', translationKey: 'trainer.earnings' },
  { key: 'evaluation', icon: '📋', path: '/trainer/evaluation', translationKey: 'trainer.evaluation' },
  { key: 'assessment', icon: '📏', path: '/trainer/assessment', translationKey: 'trainer.assessment' },
  { key: 'planBuilder', icon: '🏗️', path: '/trainer/plan-builder', translationKey: 'trainer.planBuilder' },
  { key: 'messages', icon: '💬', path: '/trainer/messages', translationKey: 'trainer.messages' },
  { key: 'comparison', icon: '📊', path: '/trainer/comparison', translationKey: 'trainer.comparison' },
  { key: 'planner', icon: '📅', path: '/trainer/planner', translationKey: 'trainer.planner' },
  { key: 'analytics', icon: '📈', path: '/trainer/analytics', translationKey: 'trainer.analytics' },
  { key: 'notes', icon: '📝', path: '/trainer/notes', translationKey: 'trainer.notes' },
  { key: 'assessForm', icon: '📋', path: '/trainer/assessment-form', translationKey: 'trainer.assessForm' },
  { key: 'injuries', icon: '🏥', path: '/trainer/injuries', translationKey: 'trainer.injuries' },
  { key: 'templates', icon: '📚', path: '/trainer/templates', translationKey: 'trainer.templates' },
  { key: 'aiTools', icon: '🤖', path: '/trainer/ai-tools', translationKey: 'trainer.aiTools' },
];

const clientMenuItems = [
  { key: 'dashboard', icon: '📊', path: '/client/dashboard' },
  { key: 'mySubscription', icon: '💳', path: '/client/subscription', translationKey: 'client.mySubscription' },
  { key: 'myDietPlan', icon: '🥗', path: '/client/diet', translationKey: 'client.myDietPlan' },
  { key: 'myTrainingPlan', icon: '🏋️', path: '/client/training', translationKey: 'client.myTrainingPlan' },
  { key: 'myProgress', icon: '📈', path: '/client/progress', translationKey: 'client.myProgress' },
  { key: 'achievements', icon: '🏆', path: '/client/achievements', translationKey: 'client.achievements' },
  { key: 'challenges', icon: '🏅', path: '/client/challenges', translationKey: 'client.challenges' },
  { key: 'community', icon: '📱', path: '/client/community', translationKey: 'client.community' },
  { key: 'goals', icon: '🎯', path: '/client/goals', translationKey: 'client.goals' },
  { key: 'tracker', icon: '💧', path: '/client/tracker', translationKey: 'client.tracker' },
  { key: 'records', icon: '🏆', path: '/client/records', translationKey: 'client.records' },
  { key: 'streaks', icon: '🔥', path: '/client/streaks', translationKey: 'client.streaks' },
  { key: 'supplements', icon: '💊', path: '/client/supplements', translationKey: 'client.supplements' },
  { key: 'sleep', icon: '😴', path: '/client/sleep', translationKey: 'client.sleep' },
  { key: 'bookSpa', icon: '🧖', path: '/client/bookings/spa', translationKey: 'client.bookSpa' },
  { key: 'bookClass', icon: '📅', path: '/client/bookings/classes', translationKey: 'client.bookClass' },
  { key: 'workout', icon: '📓', path: '/client/workout', translationKey: 'client.workout' },
  { key: 'rateTrainer', icon: '⭐', path: '/client/rate-trainer', translationKey: 'client.rateTrainer' },
  { key: 'transformation', icon: '🔄', path: '/client/transformation', translationKey: 'client.transformation' },
  { key: 'exercises', icon: '📚', path: '/client/exercises', translationKey: 'client.exercises' },
  { key: 'nutrition', icon: '🥗', path: '/client/nutrition', translationKey: 'client.nutrition' },
  { key: 'checkin', icon: '📋', path: '/client/checkin', translationKey: 'client.checkin' },
  { key: 'messages', icon: '💬', path: '/client/messages', translationKey: 'client.messages' },
  { key: 'workoutStats', icon: '📊', path: '/client/workout-stats', translationKey: 'client.workoutStats' },
  { key: 'leaderboard', icon: '🏆', path: '/client/leaderboard', translationKey: 'client.leaderboard' },
  { key: 'measurements', icon: '📏', path: '/client/measurements', translationKey: 'client.measurements' },
  { key: 'recovery', icon: '💤', path: '/client/recovery', translationKey: 'client.recovery' },
  { key: 'notifications', icon: '🔔', path: '/client/notifications' },
  { key: 'profile', icon: '👤', path: '/client/profile', translationKey: 'client.profile' },
  { key: 'aiNutrition', icon: '🥗', path: '/client/ai-nutrition', translationKey: 'client.aiNutrition' },
  { key: 'aiWorkout', icon: '🏋️', path: '/client/ai-workout', translationKey: 'client.aiWorkout' },
  { key: 'aiAssistant', icon: '🤖', path: '/client/ai-assistant', translationKey: 'client.aiAssistant' },
  { key: 'aiSubscription', icon: '⭐', path: '/client/ai-subscription', translationKey: 'client.aiSubscription' },
];

export default function Sidebar({ role = 'admin', locale = 'ar', collapsed = false, onToggle }) {
  const t = useTranslations();
  const pathname = usePathname();

  const menuItems = role === 'admin' ? adminMenuItems
    : role === 'trainer' ? trainerMenuItems
    : clientMenuItems;

  const getLabel = (item) => {
    if (item.translationKey) {
      return t(item.translationKey);
    }
    return t(`sidebar.${item.key}`);
  };

  const isActive = (path) => {
    const fullPath = `/${locale}${path}`;
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>⚡</div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Power Time</span>
            <span className={styles.logoSubtitle}>
              {locale === 'ar' ? 'أكتر من مجرد جيم' : 'More than a Gym'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.key}
            href={`/${locale}${item.path}`}
            className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
            title={collapsed ? getLabel(item) : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{getLabel(item)}</span>}
            {isActive(item.path) && <span className={styles.activeIndicator} />}
          </Link>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button className={styles.collapseBtn} onClick={onToggle}>
        {collapsed
          ? (locale === 'ar' ? '←' : '→')
          : (locale === 'ar' ? '→' : '←')
        }
      </button>
    </aside>
  );
}
