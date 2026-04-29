'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClientPRsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [filter, setFilter] = useState('all');

  const categories = [
    { id: 'all', label: locale === 'ar' ? 'الكل' : 'All', icon: '🏆' },
    { id: 'chest', label: locale === 'ar' ? 'صدر' : 'Chest', icon: '💪' },
    { id: 'back', label: locale === 'ar' ? 'ظهر' : 'Back', icon: '🔙' },
    { id: 'legs', label: locale === 'ar' ? 'أرجل' : 'Legs', icon: '🦵' },
    { id: 'shoulders', label: locale === 'ar' ? 'أكتاف' : 'Shoulders', icon: '🏋️' },
    { id: 'cardio', label: locale === 'ar' ? 'كارديو' : 'Cardio', icon: '🏃' },
  ];

  const records = [
    { exercise: locale === 'ar' ? 'بنش بريس' : 'Bench Press', category: 'chest', pr: '105kg', prev: '100kg', date: '2026-03-27', improvement: '+5kg', streak: 3, icon: '🏋️', history: [80, 85, 90, 95, 100, 105] },
    { exercise: locale === 'ar' ? 'سكوات' : 'Squat', category: 'legs', pr: '140kg', prev: '130kg', date: '2026-03-25', improvement: '+10kg', streak: 2, icon: '🦵', history: [100, 110, 120, 125, 130, 140] },
    { exercise: locale === 'ar' ? 'ديدلفت' : 'Deadlift', category: 'back', pr: '160kg', prev: '155kg', date: '2026-03-22', improvement: '+5kg', streak: 4, icon: '💀', history: [120, 130, 140, 145, 155, 160] },
    { exercise: locale === 'ar' ? 'أوفرهيد بريس' : 'Overhead Press', category: 'shoulders', pr: '65kg', prev: '62.5kg', date: '2026-03-20', improvement: '+2.5kg', streak: 1, icon: '🤸', history: [45, 50, 55, 57.5, 62.5, 65] },
    { exercise: locale === 'ar' ? 'إنكلاين بنش' : 'Incline Bench', category: 'chest', pr: '85kg', prev: '82.5kg', date: '2026-03-18', improvement: '+2.5kg', streak: 2, icon: '📐', history: [60, 65, 70, 75, 82.5, 85] },
    { exercise: locale === 'ar' ? 'بار رو' : 'Barbell Row', category: 'back', pr: '90kg', prev: '85kg', date: '2026-03-17', improvement: '+5kg', streak: 3, icon: '🚣', history: [60, 65, 70, 80, 85, 90] },
    { exercise: locale === 'ar' ? 'ليج بريس' : 'Leg Press', category: 'legs', pr: '220kg', prev: '200kg', date: '2026-03-15', improvement: '+20kg', streak: 5, icon: '🦿', history: [150, 165, 180, 190, 200, 220] },
    { exercise: locale === 'ar' ? 'جري 5K' : '5K Run', category: 'cardio', pr: '26:30', prev: '28:00', date: '2026-03-12', improvement: '-1:30', streak: 2, icon: '🏃', history: [35, 32, 30, 29, 28, 26.5] },
  ];

  const filtered = filter === 'all' ? records : records.filter(r => r.category === filter);
  const totalPRs = records.length;
  const recentPRs = records.filter(r => new Date(r.date) >= new Date('2026-03-20')).length;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏆</span> {locale === 'ar' ? 'أرقامي القياسية' : 'Personal Records'}</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: totalPRs, l: locale === 'ar' ? 'إجمالي الأرقام' : 'Total PRs', icon: '🏆', color: 'var(--pt-gold)' },
          { v: recentPRs, l: locale === 'ar' ? 'هذا الأسبوع' : 'This Week', icon: '🔥', color: 'var(--pt-success)' },
          { v: '470kg', l: locale === 'ar' ? 'Big 3 Total' : 'Big 3 Total', icon: '💎', color: '#7C4DFF' },
          { v: '🔥 5', l: locale === 'ar' ? 'أطول سلسلة PR' : 'Longest PR Streak', icon: '📈', color: '#FF9100' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {categories.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} className={`btn ${filter === c.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* PR Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map((r, i) => {
          const maxH = Math.max(...r.history);
          return (
            <div key={i} className="card" style={{ borderInlineStart: `4px solid ${i === 0 ? 'var(--pt-gold)' : 'var(--glass-border)'}` }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>{r.exercise}</h3>
                    {i === 0 && <span style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>{locale === 'ar' ? 'أحدث' : 'LATEST'}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}>
                    <div>
                      <div style={{ color: 'var(--pt-gray-600)', fontSize: '9px' }}>{locale === 'ar' ? 'الرقم القياسي' : 'PR'}</div>
                      <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: 'var(--pt-gold)' }}>{r.pr}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--pt-gray-600)', fontSize: '9px' }}>{locale === 'ar' ? 'السابق' : 'Previous'}</div>
                      <div style={{ fontWeight: 600, color: 'var(--pt-gray-400)' }}>{r.prev}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--pt-gray-600)', fontSize: '9px' }}>{locale === 'ar' ? 'التحسن' : 'Gain'}</div>
                      <div style={{ fontWeight: 700, color: 'var(--pt-success)' }}>{r.improvement}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', fontSize: '10px', color: 'var(--pt-gray-600)' }}>
                    <span>📅 {r.date}</span>
                    <span>🔥 {r.streak} {locale === 'ar' ? 'سلسلة' : 'streak'}</span>
                  </div>
                </div>

                {/* Mini Chart */}
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: 50, minWidth: 100 }}>
                  {r.history.map((v, j) => (
                    <div key={j} style={{ flex: 1, height: `${(v / maxH) * 45}px`, background: j === r.history.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.2)', borderRadius: '2px 2px 0 0' }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
