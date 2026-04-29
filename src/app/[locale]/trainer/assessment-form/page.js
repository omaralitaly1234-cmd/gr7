'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TrainerAssessmentFormPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClient, setSelectedClient] = useState(0);

  const clients = [
    { name: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', avatar: 'أ', age: 28, joined: '2025-11-01' },
    { name: locale === 'ar' ? 'سارة علي' : 'Sara A.', avatar: 'س', age: 24, joined: '2025-12-15' },
  ];

  const assessments = [
    {
      date: '2026-03-27', trainer: locale === 'ar' ? 'كابتن أحمد حسن' : 'Coach Ahmed',
      physical: {
        posture: { score: 7, note: locale === 'ar' ? 'انحناء خفيف في أعلى الظهر — تمارين تصحيحية مطلوبة' : 'Slight upper back rounding — corrective exercises needed' },
        mobility: { score: 8, note: locale === 'ar' ? 'مرونة جيدة في hip hinge — الكتف محتاج تحسين' : 'Good hip hinge mobility — shoulder needs improvement' },
        balance: { score: 6, note: locale === 'ar' ? 'فرق واضح بين الجانب الأيمن والأيسر — تمارين unilateral مطلوبة' : 'Clear imbalance between sides — unilateral work needed' },
        endurance: { score: 8, note: locale === 'ar' ? 'لياقة قلبية ممتازة — VO2 max في المعدل الطبيعي' : 'Great cardio fitness — VO2 max within normal range' },
      },
      strength: {
        upper: { score: 7, bench: '90kg', ohp: '55kg' },
        lower: { score: 9, squat: '130kg', deadlift: '155kg' },
        core: { score: 6, plank: '90s', note: locale === 'ar' ? 'محتاج تقوية core — خصوصاً obliques' : 'Core needs strengthening — especially obliques' },
      },
      body: { weight: 89, fat: 19, muscle: 38, bmi: 27.2 },
      recommendations: [
        { icon: '🎯', text: locale === 'ar' ? 'زيادة تمارين core 3 مرات/أسبوع' : 'Increase core work 3x/week' },
        { icon: '🏃', text: locale === 'ar' ? 'إضافة HIIT كارديو يومين/أسبوع' : 'Add HIIT cardio 2x/week' },
        { icon: '🧘', text: locale === 'ar' ? 'تمارين إطالة يومية 10 دقائق' : 'Daily 10-min stretching routine' },
        { icon: '⚖️', text: locale === 'ar' ? 'ضبط النظام الغذائي لخفض دهون 3%' : 'Adjust diet to drop 3% body fat' },
        { icon: '💪', text: locale === 'ar' ? 'تمارين unilateral لتصحيح عدم التوازن' : 'Unilateral exercises to fix imbalance' },
      ],
      overallScore: 7.4,
    }
  ];

  const getScoreColor = (s) => s >= 8 ? 'var(--pt-success)' : s >= 6 ? 'var(--pt-gold)' : 'var(--pt-danger)';

  const ScoreBar = ({ label, score, note }) => (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: '3px' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 800, color: getScoreColor(score) }}>{score}/10</span>
      </div>
      <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: `linear-gradient(90deg, ${getScoreColor(score)}, var(--pt-gold))`, borderRadius: 'var(--radius-full)', transition: 'width 0.6s' }} />
      </div>
      {note && <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: '3px' }}>💬 {note}</div>}
    </div>
  );

  const a = assessments[0];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {locale === 'ar' ? 'تقييم العميل' : 'Client Assessment'}</h1>
        <button className="btn btn-primary">+ {locale === 'ar' ? 'تقييم جديد' : 'New Assessment'}</button>
      </div>

      {/* Client Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {clients.map((c, i) => (
          <button key={i} onClick={() => setSelectedClient(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
              background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)',
              border: selectedClient === i ? '2px solid var(--pt-gold)' : '2px solid transparent',
              borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{c.avatar}</div>
            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{c.name}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{c.age} {locale === 'ar' ? 'سنة' : 'yrs'} • {locale === 'ar' ? 'منذ' : 'Since'} {c.joined}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Overall Score */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', borderTop: `3px solid ${getScoreColor(a.overallScore)}` }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
          📋 {locale === 'ar' ? 'التقييم الشامل' : 'Overall Assessment'} — {a.date}
        </div>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto var(--space-2)' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--pt-darker)" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={getScoreColor(a.overallScore)} strokeWidth="10"
              strokeDasharray={`${(a.overallScore / 10) * 327} 327`} strokeLinecap="round"
              transform="rotate(-90 60 60)" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', color: getScoreColor(a.overallScore) }}>{a.overallScore}</div>
            <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>/10</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'بواسطة' : 'By'}: {a.trainer}</div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Physical Assessment */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🏃 {locale === 'ar' ? 'التقييم البدني' : 'Physical Assessment'}</h3>
          <ScoreBar label={locale === 'ar' ? 'القوام والوقفة' : 'Posture'} score={a.physical.posture.score} note={a.physical.posture.note} />
          <ScoreBar label={locale === 'ar' ? 'المرونة والحركة' : 'Mobility'} score={a.physical.mobility.score} note={a.physical.mobility.note} />
          <ScoreBar label={locale === 'ar' ? 'التوازن' : 'Balance'} score={a.physical.balance.score} note={a.physical.balance.note} />
          <ScoreBar label={locale === 'ar' ? 'التحمل القلبي' : 'Cardio Endurance'} score={a.physical.endurance.score} note={a.physical.endurance.note} />
        </div>

        {/* Strength Assessment */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>💪 {locale === 'ar' ? 'تقييم القوة' : 'Strength Assessment'}</h3>
          <ScoreBar label={`${locale === 'ar' ? 'الجزء العلوي' : 'Upper Body'} (${locale === 'ar' ? 'بنش' : 'Bench'}: ${a.strength.upper.bench} | ${locale === 'ar' ? 'أوفرهيد' : 'OHP'}: ${a.strength.upper.ohp})`} score={a.strength.upper.score} />
          <ScoreBar label={`${locale === 'ar' ? 'الجزء السفلي' : 'Lower Body'} (${locale === 'ar' ? 'سكوات' : 'Squat'}: ${a.strength.lower.squat} | ${locale === 'ar' ? 'ديدلفت' : 'DL'}: ${a.strength.lower.deadlift})`} score={a.strength.lower.score} />
          <ScoreBar label={`${locale === 'ar' ? 'عضلات الجذع' : 'Core'} (${locale === 'ar' ? 'بلانك' : 'Plank'}: ${a.strength.core.plank})`} score={a.strength.core.score} note={a.strength.core.note} />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Body Composition */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>⚖️ {locale === 'ar' ? 'تكوين الجسم' : 'Body Composition'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-2)' }}>
            {[
              { label: locale === 'ar' ? 'الوزن' : 'Weight', value: `${a.body.weight}kg`, color: 'var(--pt-gold)' },
              { label: locale === 'ar' ? 'نسبة الدهون' : 'Body Fat', value: `${a.body.fat}%`, color: '#FF5252' },
              { label: locale === 'ar' ? 'كتلة عضلية' : 'Muscle Mass', value: `${a.body.muscle}kg`, color: 'var(--pt-success)' },
              { label: 'BMI', value: a.body.bmi, color: '#4FC3F7' },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderTop: `2px solid ${m.color}` }}>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{m.label}</div>
                <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card" style={{ borderInlineStart: '3px solid var(--pt-gold)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📝 {locale === 'ar' ? 'التوصيات' : 'Recommendations'}</h3>
          {a.recommendations.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-2)', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>
              <span>{r.icon}</span>
              <span style={{ color: 'var(--pt-gray-400)' }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
