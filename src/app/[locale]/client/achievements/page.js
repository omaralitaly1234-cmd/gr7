'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientGamificationPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const profile = {
    level: 7,
    title: locale === 'ar' ? 'محارب الحديد 🗡️' : 'Iron Warrior 🗡️',
    xp: 2350,
    xpNext: 3000,
    rank: 12,
    totalMembers: 245,
  };

  const badges = [
    { icon: '🔥', name: locale === 'ar' ? 'أسبوع ناري' : 'Fire Week', desc: locale === 'ar' ? '7 أيام متتالية' : '7 day streak', earned: true, date: '2026-03-20' },
    { icon: '💪', name: locale === 'ar' ? 'رافع أثقال' : 'Heavy Lifter', desc: locale === 'ar' ? 'رفع 100 كيلو بنش' : 'Bench press 100kg', earned: true, date: '2026-03-18' },
    { icon: '🏃', name: locale === 'ar' ? 'عداء ماراثون' : 'Marathon Runner', desc: locale === 'ar' ? '50 كيلو كارديو' : '50km cardio total', earned: true, date: '2026-03-10' },
    { icon: '⭐', name: locale === 'ar' ? 'نجم الشهر' : 'Star of Month', desc: locale === 'ar' ? 'أكثر حضور في الشهر' : 'Most visits this month', earned: true, date: '2026-02-28' },
    { icon: '🎯', name: locale === 'ar' ? 'محقق الأهداف' : 'Goal Crusher', desc: locale === 'ar' ? 'حقق هدف الوزن' : 'Reached weight goal', earned: false, progress: 65 },
    { icon: '🦁', name: locale === 'ar' ? 'أسد الجيم' : 'Gym Lion', desc: locale === 'ar' ? '100 حصة تدريب' : '100 training sessions', earned: false, progress: 52 },
    { icon: '🏆', name: locale === 'ar' ? 'البطل' : 'Champion', desc: locale === 'ar' ? 'المركز الأول في التحدي' : 'Win a challenge', earned: false, progress: 0 },
    { icon: '💎', name: locale === 'ar' ? 'الماسي' : 'Diamond Member', desc: locale === 'ar' ? 'سنة كاملة اشتراك' : '1 year membership', earned: false, progress: 25 },
  ];

  const leaderboard = [
    { rank: 1, name: 'عمر حسام الدين', xp: 4200, level: 12, badge: '🥇' },
    { rank: 2, name: 'سارة علي حسن', xp: 3800, level: 11, badge: '🥈' },
    { rank: 3, name: 'محمد صلاح', xp: 3500, level: 10, badge: '🥉' },
    { rank: 4, name: 'منة الله محمود', xp: 3100, level: 9, badge: '' },
    { rank: 5, name: 'خالد أحمد', xp: 2800, level: 8, badge: '' },
  ];

  const challenges = [
    { title: locale === 'ar' ? 'تحدي 30 يوم بدون غياب' : '30 Day No-Skip', reward: '500 XP', progress: 20, total: 30, icon: '🔥', endDate: '2026-04-15' },
    { title: locale === 'ar' ? 'تحدي خسارة 5 كيلو' : 'Lose 5kg Challenge', reward: '1000 XP + 🏆', progress: 3, total: 5, icon: '⚖️', endDate: '2026-04-30' },
    { title: locale === 'ar' ? 'تحدي 50 سكوات يومياً' : '50 Squats Daily', reward: '300 XP', progress: 12, total: 14, icon: '🦵', endDate: '2026-03-30' },
  ];

  const xpPercent = Math.round((profile.xp / profile.xpNext) * 100);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏆</span> {locale === 'ar' ? 'إنجازاتي' : 'My Achievements'}</h1>
      </div>

      {/* Profile Level Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-gold)', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-2)' }}>⚡</div>
        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>
          Level {profile.level}
        </div>
        <div style={{ fontSize: 'var(--font-size-lg)', color: 'var(--pt-gray-300)', marginBottom: 'var(--space-4)' }}>{profile.title}</div>

        {/* XP Bar */}
        <div style={{ maxWidth: 400, margin: '0 auto', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: '4px' }}>
            <span>{profile.xp} XP</span>
            <span>{profile.xpNext} XP</span>
          </div>
          <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 12, overflow: 'hidden' }}>
            <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--pt-gold), #FFD740)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
          </div>
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
          🏅 {locale === 'ar' ? `الترتيب: ${profile.rank} من ${profile.totalMembers}` : `Rank: ${profile.rank} of ${profile.totalMembers}`}
        </div>
      </div>

      {/* Active Challenges */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>🎯 {locale === 'ar' ? 'التحديات النشطة' : 'Active Challenges'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {challenges.map((ch, i) => {
            const prog = Math.round((ch.progress / ch.total) * 100);
            return (
              <div key={i} style={{ padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-lg)', borderInlineStart: '4px solid var(--pt-gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{ch.icon} {ch.title}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🎁 {locale === 'ar' ? 'المكافأة' : 'Reward'}: {ch.reward}</div>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>⏰ {ch.endDate}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: '2px' }}>
                    <span>{ch.progress}/{ch.total}</span>
                    <span>{prog}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${prog}%`, height: '100%', background: prog >= 80 ? 'var(--pt-success)' : 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Badges */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🎖 {locale === 'ar' ? 'الشارات' : 'Badges'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
            {badges.map((badge, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--pt-darker)', opacity: badge.earned ? 1 : 0.4, position: 'relative' }}>
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{badge.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 600 }}>{badge.name}</div>
                {!badge.earned && badge.progress > 0 && (
                  <div style={{ marginTop: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${badge.progress}%`, height: '100%', background: 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🏅 {locale === 'ar' ? 'المتصدرين' : 'Leaderboard'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {leaderboard.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: i < 3 ? 'rgba(245,197,24,0.05)' : 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ minWidth: 28, fontWeight: 800, fontSize: i < 3 ? 'var(--font-size-lg)' : 'var(--font-size-sm)', textAlign: 'center' }}>{p.badge || p.rank}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)', fontWeight: 700 }}>Lv.{p.level}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{p.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
