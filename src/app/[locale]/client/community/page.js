'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientSocialFeedPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [newPost, setNewPost] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const posts = [
    {
      id: 1, user: { name: locale === 'ar' ? 'خالد أحمد حسين' : 'Khaled Ahmed', avatar: 'خ', level: 12, badge: '🥇' },
      type: 'achievement', time: locale === 'ar' ? 'منذ 20 دقيقة' : '20 min ago',
      content: locale === 'ar' ? 'رقم شخصي جديد! 🎉 بنش بريس 120 كيلو! الحمد لله 💪' : 'New PR! 🎉 Bench Press 120kg! 💪',
      achievement: { icon: '🏆', label: locale === 'ar' ? 'رقم شخصي — بنش بريس' : 'PR — Bench Press', value: '120 kg' },
      likes: 24, comments: 8, liked: true,
    },
    {
      id: 2, user: { name: locale === 'ar' ? 'سارة محمد عبدالله' : 'Sara Mohamed', avatar: 'س', level: 8, badge: '🔥' },
      type: 'streak', time: locale === 'ar' ? 'منذ ساعة' : '1 hr ago',
      content: locale === 'ar' ? '20 يوم متتالي في الجيم! 🔥🔥🔥 مش هوقف!' : '20 day gym streak! 🔥🔥🔥 Not stopping!',
      streak: 20,
      likes: 32, comments: 12, liked: false,
    },
    {
      id: 3, user: { name: locale === 'ar' ? 'محمد علي سعيد' : 'Mohamed Ali', avatar: 'م', level: 10, badge: '⭐' },
      type: 'transformation', time: locale === 'ar' ? 'منذ 3 ساعات' : '3 hrs ago',
      content: locale === 'ar' ? 'شهرين في GR 7 والنتيجة واضحة! من 95 كيلو لـ 82 كيلو 💪 شكراً كابتن أحمد!' : '2 months at GR 7 and the results speak! From 95kg to 82kg 💪 Thanks Coach Ahmed!',
      transformation: { before: 95, after: 82, unit: 'kg', months: 2 },
      likes: 56, comments: 18, liked: true,
    },
    {
      id: 4, user: { name: locale === 'ar' ? 'يوسف حسام' : 'Youssef Hossam', avatar: 'ي', level: 9, badge: '💪' },
      type: 'workout', time: locale === 'ar' ? 'منذ 5 ساعات' : '5 hrs ago',
      content: locale === 'ar' ? 'حصة أرجل خرافية النهاردة! سكوات 130 كيلو × 5 🦵' : 'Insane leg day today! Squat 130kg × 5 🦵',
      workout: { exercise: locale === 'ar' ? 'سكوات' : 'Squat', weight: '130kg', reps: '5×5', muscle: '🦵' },
      likes: 18, comments: 5, liked: false,
    },
    {
      id: 5, user: { name: 'GR 7 GYM', avatar: '⚡', level: 99, badge: '✅', isOfficial: true },
      type: 'announcement', time: locale === 'ar' ? 'منذ 6 ساعات' : '6 hrs ago',
      content: locale === 'ar' ? '🏆 تحدي رمضان يبدأ 1 أبريل! سجّل الآن واكسب 1000 XP + ميدالية ذهبية! 💪🔥' : '🏆 Ramadan Challenge starts April 1st! Register now and earn 1000 XP + Gold Medal! 💪🔥',
      likes: 89, comments: 34, liked: true,
    },
    {
      id: 6, user: { name: locale === 'ar' ? 'نور أحمد' : 'Nour Ahmed', avatar: 'ن', level: 7, badge: '🎯' },
      type: 'challenge', time: locale === 'ar' ? 'أمس' : 'Yesterday',
      content: locale === 'ar' ? 'أكملت تحدي الكارديو 10K! 🏃‍♀️ 12.5 كيلو في أسبوعين! المثابرة مفتاح النجاح 🔑' : 'Completed the 10K Cardio Challenge! 🏃‍♀️ 12.5K in 2 weeks! Consistency is key 🔑',
      challengeComplete: { name: locale === 'ar' ? 'تحدي الكارديو 10K' : '10K Cardio Challenge', xp: 400 },
      likes: 27, comments: 9, liked: false,
    },
  ];

  const filters = [
    { id: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
    { id: 'achievement', label: locale === 'ar' ? 'إنجازات' : 'Achievements' },
    { id: 'transformation', label: locale === 'ar' ? 'تحولات' : 'Transformations' },
    { id: 'workout', label: locale === 'ar' ? 'تمارين' : 'Workouts' },
    { id: 'announcement', label: locale === 'ar' ? 'إعلانات' : 'Announcements' },
  ];

  const filtered = activeFilter === 'all' ? posts : posts.filter(p => p.type === activeFilter);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📱</span> {locale === 'ar' ? 'مجتمع GR 7' : 'GR 7 Community'}</h1>
      </div>

      {/* New Post */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.15)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>أ</div>
          <div style={{ flex: 1 }}>
            <textarea className="form-input" rows={2} placeholder={locale === 'ar' ? 'شارك إنجازك مع الأعضاء... 💪' : 'Share your achievement with members... 💪'} value={newPost} onChange={(e) => setNewPost(e.target.value)} style={{ resize: 'none', marginBottom: 'var(--space-2)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-ghost btn-sm">📷</button>
                <button className="btn btn-ghost btn-sm">🏆</button>
                <button className="btn btn-ghost btn-sm">💪</button>
              </div>
              <button className="btn btn-primary btn-sm">{locale === 'ar' ? 'نشر' : 'Post'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`btn ${activeFilter === f.id ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ whiteSpace: 'nowrap' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filtered.map(post => (
          <div key={post.id} className="card" style={{ borderInlineStart: post.user.isOfficial ? '3px solid var(--pt-gold)' : 'none' }}>
            {/* Post Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-full)', background: post.user.isOfficial ? 'rgba(245,197,24,0.2)' : 'rgba(255,255,255,0.05)', color: post.user.isOfficial ? 'var(--pt-gold)' : 'var(--pt-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: post.user.isOfficial ? '1.2rem' : '1rem', border: post.user.isOfficial ? '2px solid var(--pt-gold)' : 'none' }}>{post.user.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {post.user.name}
                    {post.user.isOfficial && <span style={{ fontSize: '10px', color: 'var(--pt-gold)' }}>✅</span>}
                    <span style={{ fontSize: '10px' }}>{post.user.badge}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>
                    Lv.{post.user.level} • {post.time}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px' }}>⋯</button>
            </div>

            {/* Post Content */}
            <p style={{ marginBottom: 'var(--space-3)', lineHeight: 1.7, fontSize: 'var(--font-size-sm)' }}>{post.content}</p>

            {/* Achievement Card */}
            {post.achievement && (
              <div style={{ padding: 'var(--space-3)', background: 'rgba(245,197,24,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,197,24,0.15)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '2rem' }}>{post.achievement.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{post.achievement.label}</div>
                  <div style={{ fontWeight: 900, color: 'var(--pt-gold)', fontSize: 'var(--font-size-lg)' }}>{post.achievement.value}</div>
                </div>
              </div>
            )}

            {/* Streak Badge */}
            {post.streak && (
              <div style={{ padding: 'var(--space-3)', background: 'rgba(255,82,82,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,82,82,0.15)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>🔥</span>
                <div style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', color: '#FF5252' }}>{post.streak}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'يوم متتالي' : 'Day Streak'}</div>
              </div>
            )}

            {/* Transformation Card */}
            {post.transformation && (
              <div style={{ padding: 'var(--space-3)', background: 'rgba(0,200,83,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,200,83,0.15)', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'center', gap: 'var(--space-5)', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'قبل' : 'Before'}</div>
                  <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: 'var(--pt-danger)' }}>{post.transformation.before} {post.transformation.unit}</div>
                </div>
                <span style={{ fontSize: '1.5rem' }}>→</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'بعد' : 'After'}</div>
                  <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: 'var(--pt-success)' }}>{post.transformation.after} {post.transformation.unit}</div>
                </div>
                <div style={{ textAlign: 'center', opacity: 0.7 }}>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'الفترة' : 'Period'}</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{post.transformation.months} {locale === 'ar' ? 'شهور' : 'months'}</div>
                </div>
              </div>
            )}

            {/* Workout Card */}
            {post.workout && (
              <div style={{ padding: 'var(--space-3)', background: 'rgba(79,195,247,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79,195,247,0.15)', marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{post.workout.muscle}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{post.workout.exercise}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{post.workout.weight} × {post.workout.reps}</div>
                </div>
              </div>
            )}

            {/* Challenge Complete Card */}
            {post.challengeComplete && (
              <div style={{ padding: 'var(--space-3)', background: 'rgba(124,77,255,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,77,255,0.15)', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏅</span>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{post.challengeComplete.name}</span>
                </div>
                <span style={{ fontWeight: 900, color: 'var(--pt-gold)' }}>+{post.challengeComplete.xp} XP</span>
              </div>
            )}

            {/* Post Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <button className="btn btn-ghost btn-sm" style={{ color: post.liked ? '#FF5252' : 'var(--pt-gray-500)' }}>
                  {post.liked ? '❤️' : '🤍'} {post.likes}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-gray-500)' }}>
                  💬 {post.comments}
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pt-gray-500)' }}>🔗 {locale === 'ar' ? 'مشاركة' : 'Share'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
