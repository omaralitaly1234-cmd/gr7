'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientRecoveryPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [activeTab, setActiveTab] = useState('today');

  const todayData = {
    sleepHours: 7.5, sleepQuality: 85,
    hydration: 2.8, hydrationTarget: 3.5,
    steps: 8400, stepsTarget: 10000,
    heartRate: 62, stress: 35,
    muscleRecovery: 78, readiness: 82,
  };

  const weeklyLog = [
    { day: locale === 'ar' ? 'السبت' : 'Sat', sleep: 7.5, quality: 85, hydration: 2.8, steps: 8400, recovery: 78, mood: '😊' },
    { day: locale === 'ar' ? 'الجمعة' : 'Fri', sleep: 8.0, quality: 90, hydration: 3.2, steps: 5200, recovery: 92, mood: '😄' },
    { day: locale === 'ar' ? 'الخميس' : 'Thu', sleep: 6.5, quality: 65, hydration: 2.5, steps: 9800, recovery: 55, mood: '😐' },
    { day: locale === 'ar' ? 'الأربعاء' : 'Wed', sleep: 7.0, quality: 75, hydration: 3.0, steps: 7600, recovery: 70, mood: '🙂' },
    { day: locale === 'ar' ? 'الثلاثاء' : 'Tue', sleep: 7.5, quality: 80, hydration: 2.9, steps: 10200, recovery: 65, mood: '😊' },
    { day: locale === 'ar' ? 'الإثنين' : 'Mon', sleep: 6.0, quality: 55, hydration: 2.2, steps: 6800, recovery: 45, mood: '😴' },
    { day: locale === 'ar' ? 'الأحد' : 'Sun', sleep: 8.5, quality: 95, hydration: 3.4, steps: 4500, recovery: 95, mood: '😄' },
  ];

  const tips = [
    { icon: '💧', text: locale === 'ar' ? 'اشرب 700ml كمان للوصول لهدفك اليوم' : 'Drink 700ml more to reach your goal' },
    { icon: '😴', text: locale === 'ar' ? 'نومك ممتاز! حافظ على 7-8 ساعات يومياً' : 'Sleep is great! Maintain 7-8 hours daily' },
    { icon: '🏃', text: locale === 'ar' ? 'محتاج 1,600 خطوة كمان للهدف اليومي' : 'Need 1,600 more steps for daily goal' },
  ];

  const getColor = (val) => val >= 80 ? 'var(--pt-success)' : val >= 60 ? 'var(--pt-gold)' : 'var(--pt-danger)';

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💤</span> {locale === 'ar' ? 'الاستشفاء والنوم' : 'Recovery & Sleep'}</h1>
      </div>

      {/* Readiness Score */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', borderTop: `3px solid ${getColor(todayData.readiness)}` }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
          {locale === 'ar' ? 'مؤشر الجاهزية اليوم' : "Today's Readiness Score"}
        </div>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto var(--space-3)' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--pt-darker)" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={getColor(todayData.readiness)} strokeWidth="8"
              strokeDasharray={`${(todayData.readiness / 100) * 327} 327`} strokeLinecap="round"
              transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1s' }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 900, fontSize: 'var(--font-size-2xl)', color: getColor(todayData.readiness) }}>
            {todayData.readiness}%
          </div>
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: getColor(todayData.readiness) }}>
          {todayData.readiness >= 80 ? (locale === 'ar' ? '✅ جاهز للتدريب المكثف!' : '✅ Ready for intense training!') :
           todayData.readiness >= 60 ? (locale === 'ar' ? '⚠️ تدريب متوسط مناسب' : '⚠️ Moderate training recommended') :
           (locale === 'ar' ? '🔴 جسمك محتاج راحة' : '🔴 Your body needs rest')}
        </div>
      </div>

      {/* Today's Metrics */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { icon: '😴', label: locale === 'ar' ? 'ساعات النوم' : 'Sleep', value: `${todayData.sleepHours}h`, sub: `${todayData.sleepQuality}% ${locale === 'ar' ? 'جودة' : 'quality'}`, color: '#7C4DFF', pct: todayData.sleepQuality },
          { icon: '💧', label: locale === 'ar' ? 'الترطيب' : 'Hydration', value: `${todayData.hydration}L`, sub: `${locale === 'ar' ? 'هدف' : 'goal'}: ${todayData.hydrationTarget}L`, color: '#4FC3F7', pct: Math.round((todayData.hydration / todayData.hydrationTarget) * 100) },
          { icon: '🏃', label: locale === 'ar' ? 'الخطوات' : 'Steps', value: todayData.steps.toLocaleString(), sub: `${locale === 'ar' ? 'هدف' : 'goal'}: ${todayData.stepsTarget.toLocaleString()}`, color: '#00C853', pct: Math.round((todayData.steps / todayData.stepsTarget) * 100) },
          { icon: '❤️', label: locale === 'ar' ? 'نبض القلب' : 'Heart Rate', value: `${todayData.heartRate} bpm`, sub: locale === 'ar' ? 'أثناء الراحة' : 'Resting', color: '#FF5252', pct: 100 - Math.round(((todayData.heartRate - 50) / 50) * 100) },
          { icon: '🧠', label: locale === 'ar' ? 'التوتر' : 'Stress', value: `${todayData.stress}%`, sub: todayData.stress < 40 ? (locale === 'ar' ? 'منخفض ✅' : 'Low ✅') : (locale === 'ar' ? 'متوسط' : 'Medium'), color: '#FFD740', pct: 100 - todayData.stress },
          { icon: '💪', label: locale === 'ar' ? 'استشفاء عضلي' : 'Muscle Recovery', value: `${todayData.muscleRecovery}%`, sub: todayData.muscleRecovery >= 75 ? (locale === 'ar' ? 'جاهز' : 'Ready') : (locale === 'ar' ? 'يحتاج وقت' : 'Needs time'), color: '#FF9100', pct: todayData.muscleRecovery },
        ].map((m, i) => (
          <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${m.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
              <span style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{m.label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', marginBottom: '2px' }}>{m.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>{m.sub}</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(m.pct, 100)}%`, height: '100%', background: m.color, borderRadius: 'var(--radius-full)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Smart Tips */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', borderInlineStart: '3px solid var(--pt-gold)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>🤖 {locale === 'ar' ? 'نصائح ذكية' : 'Smart Tips'}</h3>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-2)', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
            <span>{tip.icon}</span>
            <span style={{ color: 'var(--pt-gray-400)' }}>{tip.text}</span>
          </div>
        ))}
      </div>

      {/* Weekly History */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'سجل الأسبوع' : 'Weekly Log'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'اليوم' : 'Day'}</th>
              <th style={{ textAlign: 'center' }}>😴</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'جودة' : 'Quality'}</th>
              <th style={{ textAlign: 'center' }}>💧</th>
              <th style={{ textAlign: 'center' }}>🏃</th>
              <th style={{ textAlign: 'center' }}>💪 {locale === 'ar' ? 'استشفاء' : 'Recovery'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'مزاج' : 'Mood'}</th>
            </tr>
          </thead>
          <tbody>
            {weeklyLog.map((d, i) => (
              <tr key={i} style={{ opacity: i === 0 ? 1 : 0.8 }}>
                <td style={{ fontWeight: i === 0 ? 700 : 400 }}>{d.day}</td>
                <td style={{ textAlign: 'center' }}>{d.sleep}h</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: getColor(d.quality) }}>{d.quality}%</td>
                <td style={{ textAlign: 'center' }}>{d.hydration}L</td>
                <td style={{ textAlign: 'center' }}>{d.steps.toLocaleString()}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: getColor(d.recovery) }}>{d.recovery}%</td>
                <td style={{ textAlign: 'center', fontSize: '1.2rem' }}>{d.mood}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
