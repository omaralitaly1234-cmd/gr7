'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function RateTrainerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [submitted, setSubmitted] = useState(false);

  const trainer = { name: locale === 'ar' ? 'كابتن أحمد حسن' : 'Captain Ahmed Hassan', spec: locale === 'ar' ? 'تدريب قوة + تخسيس' : 'Strength + Weight Loss' };

  const [ratings, setRatings] = useState({
    overall: 0, knowledge: 0, punctuality: 0, motivation: 0, technique: 0, communication: 0,
  });
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const criteria = [
    { key: 'overall', label: locale === 'ar' ? 'التقييم العام' : 'Overall Rating', icon: '⭐' },
    { key: 'knowledge', label: locale === 'ar' ? 'المعرفة والخبرة' : 'Knowledge & Experience', icon: '🧠' },
    { key: 'punctuality', label: locale === 'ar' ? 'الالتزام بالمواعيد' : 'Punctuality', icon: '⏰' },
    { key: 'motivation', label: locale === 'ar' ? 'التحفيز والدعم' : 'Motivation & Support', icon: '🔥' },
    { key: 'technique', label: locale === 'ar' ? 'تصحيح الأداء' : 'Technique Correction', icon: '🎯' },
    { key: 'communication', label: locale === 'ar' ? 'التواصل' : 'Communication', icon: '💬' },
  ];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400, padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-3)' }}>🎉</div>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>{locale === 'ar' ? 'شكراً لتقييمك!' : 'Thank You!'}</h2>
          <p style={{ color: 'var(--pt-gray-400)', marginBottom: 'var(--space-4)' }}>
            {locale === 'ar' ? 'تقييمك يساعدنا في تحسين جودة الخدمة.' : 'Your feedback helps us improve service quality.'}
          </p>
          <button className="btn btn-primary" onClick={() => { setSubmitted(false); setRatings({ overall: 0, knowledge: 0, punctuality: 0, motivation: 0, technique: 0, communication: 0 }); setComment(''); }}>
            {locale === 'ar' ? 'تقييم آخر' : 'Rate Again'}
          </button>
        </div>
      </div>
    );
  }

  const avg = Object.values(ratings).filter(v => v > 0);
  const avgRating = avg.length > 0 ? (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(1) : '—';

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⭐</span> {locale === 'ar' ? 'تقييم المدرب' : 'Rate Your Trainer'}</h1>
      </div>

      {/* Trainer Card */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: 70, height: 70, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900 }}>أ</div>
        <div>
          <h2>{trainer.name}</h2>
          <div style={{ color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>{trainer.spec}</div>
        </div>
        <div style={{ marginInlineStart: 'auto', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: avgRating !== '—' ? 'var(--pt-gold)' : 'var(--pt-gray-600)' }}>{avgRating}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'متوسط تقييمك' : 'Your Average'}</div>
        </div>
      </div>

      {/* Rating Criteria */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>🌟 {locale === 'ar' ? 'قيّم الأداء' : 'Rate Performance'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {criteria.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ width: 180, fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{c.icon} {c.label}</span>
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRatings({ ...ratings, [c.key]: star })}
                    style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s', transform: star <= ratings[c.key] ? 'scale(1.2)' : 'scale(1)', filter: star <= ratings[c.key] ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                    ⭐
                  </button>
                ))}
              </div>
              <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 700, color: ratings[c.key] >= 4 ? 'var(--pt-success)' : ratings[c.key] >= 3 ? 'var(--pt-gold)' : ratings[c.key] > 0 ? 'var(--pt-danger)' : 'var(--pt-gray-600)' }}>
                {ratings[c.key] || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Comment + Submit */}
      <div className="card">
        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label">💬 {locale === 'ar' ? 'تعليقك (اختياري)' : 'Your Comment (optional)'}</label>
          <textarea className="form-input" rows={4} value={comment} onChange={e => setComment(e.target.value)}
            placeholder={locale === 'ar' ? 'اكتب تعليقك هنا... ما الذي تحبه في تدريب الكابتن؟ هل هناك شيء يمكن تحسينه؟' : 'Write your comment here... What do you like about the training? Any improvement suggestions?'}
            style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} style={{ accentColor: 'var(--pt-gold)' }} />
            🕵️ {locale === 'ar' ? 'تقييم مجهول' : 'Anonymous review'}
          </label>
          <button className="btn btn-primary" onClick={handleSubmit} style={{ padding: 'var(--space-3) var(--space-6)' }}>
            ✨ {locale === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
