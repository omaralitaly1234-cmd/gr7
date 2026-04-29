'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientChallengesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [activeTab, setActiveTab] = useState('active');

  const activeChallenges = [
    {
      id: 1, icon: '🔥', name: locale === 'ar' ? 'تحدي الحضور — 30 يوم' : '30-Day Attendance Challenge',
      desc: locale === 'ar' ? 'سجل حضور 25 يوم من 30 يوم' : 'Check in 25 out of 30 days',
      reward: locale === 'ar' ? '500 XP + شهر مجاني سبا' : '500 XP + Free Spa Month',
      progress: 18, target: 25, daysLeft: 12,
      participants: 45, myRank: 8,
      startDate: '2026-03-01', endDate: '2026-03-31',
    },
    {
      id: 2, icon: '💪', name: locale === 'ar' ? 'تحدي البنش بريس' : 'Bench Press Challenge',
      desc: locale === 'ar' ? 'أوصل لـ 100 كيلو بنش بريس' : 'Reach 100kg Bench Press',
      reward: locale === 'ar' ? '300 XP + تيشيرت GR 7' : '300 XP + GR 7 T-Shirt',
      progress: 90, target: 100, daysLeft: 20,
      participants: 28, myRank: 3,
      startDate: '2026-03-10', endDate: '2026-04-10',
    },
    {
      id: 3, icon: '⚖️', name: locale === 'ar' ? 'تحدي خسارة الوزن' : 'Weight Loss Challenge',
      desc: locale === 'ar' ? 'خسارة 5 كيلو خلال 6 أسابيع' : 'Lose 5kg in 6 weeks',
      reward: locale === 'ar' ? '750 XP + خصم 25% على التجديد' : '750 XP + 25% Renewal Discount',
      progress: 3.2, target: 5, daysLeft: 28,
      participants: 32, myRank: 11,
      startDate: '2026-03-15', endDate: '2026-04-26',
    },
  ];

  const completedChallenges = [
    { icon: '🏃', name: locale === 'ar' ? 'تحدي الكارديو 10K' : '10K Cardio Challenge', result: locale === 'ar' ? '✅ أكملت 12.5K!' : '✅ Completed 12.5K!', xp: 400, date: '2026-02-28', badge: '🏅' },
    { icon: '🎯', name: locale === 'ar' ? 'تحدي 7 أيام متتالية' : '7-Day Streak Challenge', result: locale === 'ar' ? '✅ 9 أيام متتالية!' : '✅ 9 day streak!', xp: 200, date: '2026-02-15', badge: '🔥' },
  ];

  const upcomingChallenges = [
    { icon: '🏋️', name: locale === 'ar' ? 'تحدي رمضان — أقوى نسخة' : 'Ramadan Challenge — Strongest Version', start: '2026-04-01', reward: locale === 'ar' ? '1000 XP + ميدالية ذهبية' : '1000 XP + Gold Medal', participants: 0 },
    { icon: '🤝', name: locale === 'ar' ? 'تحدي الفريق — 2 ضد 2' : 'Team Challenge — 2v2', start: '2026-04-15', reward: locale === 'ar' ? '600 XP + شهر مجاني' : '600 XP + Free Month', participants: 0 },
  ];

  const tabs = [
    { id: 'active', label: locale === 'ar' ? 'التحديات النشطة' : 'Active', icon: '🔥', count: activeChallenges.length },
    { id: 'completed', label: locale === 'ar' ? 'مُكتملة' : 'Completed', icon: '✅', count: completedChallenges.length },
    { id: 'upcoming', label: locale === 'ar' ? 'قادمة' : 'Upcoming', icon: '📅', count: upcomingChallenges.length },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏅</span> {locale === 'ar' ? 'التحديات' : 'Challenges'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(245,197,24,0.1)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--pt-gold)' }}>
            ⭐ 2,350 XP
          </div>
        </div>
      </div>

      {/* My Challenge Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: 5, l: locale === 'ar' ? 'تحديات مكتملة' : 'Completed', icon: '✅', color: 'var(--pt-success)' },
          { v: 3, l: locale === 'ar' ? 'تحديات نشطة' : 'Active', icon: '🔥', color: 'var(--pt-gold)' },
          { v: '1,400', l: locale === 'ar' ? 'XP من التحديات' : 'XP from Challenges', icon: '⭐', color: '#FFD740' },
          { v: 2, l: locale === 'ar' ? 'شارات فُزت بها' : 'Badges Won', icon: '🏅', color: '#7C4DFF' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-2)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Active Challenges */}
      {activeTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {activeChallenges.map(ch => {
            const pct = Math.round((ch.progress / ch.target) * 100);
            return (
              <div key={ch.id} className="card" style={{ borderInlineStart: `4px solid ${pct >= 90 ? 'var(--pt-success)' : pct >= 50 ? 'var(--pt-gold)' : '#4FC3F7'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(245,197,24,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{ch.icon}</div>
                    <div>
                      <h3 style={{ marginBottom: '2px' }}>{ch.name}</h3>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{ch.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(245,197,24,0.1)', borderRadius: 'var(--radius-full)', color: 'var(--pt-gold)', fontWeight: 600 }}>
                      ⏰ {ch.daysLeft} {locale === 'ar' ? 'يوم متبقي' : 'days left'}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span>{locale === 'ar' ? 'التقدم' : 'Progress'}: <strong>{ch.progress}</strong> / {ch.target}</span>
                    <span style={{ fontWeight: 800, color: pct >= 90 ? 'var(--pt-success)' : 'var(--pt-gold)' }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${pct >= 90 ? 'var(--pt-success)' : 'var(--pt-gold)'}, ${pct >= 90 ? '#00E676' : '#FFC107'})`, borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Footer Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>👥 {ch.participants} {locale === 'ar' ? 'مشارك' : 'joined'}</span>
                    <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>🏆 #{ch.myRank}</span>
                  </div>
                  <div style={{ padding: '4px 10px', background: 'rgba(0,200,83,0.08)', borderRadius: 'var(--radius-sm)', color: 'var(--pt-success)', fontWeight: 600 }}>
                    🎁 {ch.reward}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Challenges */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {completedChallenges.map((ch, i) => (
            <div key={i} className="card" style={{ borderInlineStart: '4px solid var(--pt-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{ch.badge}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{ch.icon} {ch.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-success)' }}>{ch.result}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>📅 {ch.date}</div>
                </div>
              </div>
              <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(245,197,24,0.1)', borderRadius: 'var(--radius-md)', fontWeight: 800, color: 'var(--pt-gold)' }}>
                +{ch.xp} XP
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Challenges */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {upcomingChallenges.map((ch, i) => (
            <div key={i} className="card" style={{ borderInlineStart: '4px solid #4FC3F7', opacity: 0.85 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{ch.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ch.name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>📅 {locale === 'ar' ? 'يبدأ' : 'Starts'}: {ch.start}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-success)', marginTop: '2px' }}>🎁 {ch.reward}</div>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">🔔 {locale === 'ar' ? 'ذكّرني' : 'Remind Me'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
