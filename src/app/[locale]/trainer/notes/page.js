'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerSessionNotesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClient, setSelectedClient] = useState(0);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const clients = [
    { name: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', avatar: 'أ', goal: locale === 'ar' ? 'تضخيم' : 'Bulking' },
    { name: locale === 'ar' ? 'سارة علي' : 'Sara A.', avatar: 'س', goal: locale === 'ar' ? 'تنشيف' : 'Cutting' },
    { name: locale === 'ar' ? 'عمر حسام' : 'Omar H.', avatar: 'ع', goal: locale === 'ar' ? 'تضخيم' : 'Bulking' },
    { name: locale === 'ar' ? 'خالد أحمد' : 'Khaled A.', avatar: 'خ', goal: locale === 'ar' ? 'قوة' : 'Strength' },
  ];

  const sessionNotes = [
    [
      { date: '2026-03-27', type: 'session', muscle: locale === 'ar' ? 'صدر + ترايسبس' : 'Chest + Triceps', duration: 55, energy: 9, mood: '🔥',
        exercises: [
          { name: locale === 'ar' ? 'بنش بريس' : 'Bench Press', sets: '4×8', weight: '90kg', note: locale === 'ar' ? 'أداء ممتاز — PR جديد!' : 'Excellent — New PR!' },
          { name: locale === 'ar' ? 'إنكلاين دمبلز' : 'Incline DB Press', sets: '3×10', weight: '32kg', note: '' },
          { name: locale === 'ar' ? 'كابل فلاي' : 'Cable Fly', sets: '3×12', weight: '15kg', note: locale === 'ar' ? 'شكل ممتاز' : 'Great form' },
        ],
        trainerNote: locale === 'ar' ? 'أحمد في أفضل حالاته. PR جديد في البنش! لازم نزود الوزن الأسبوع الجاي. التزام 100%.' : 'Ahmed at his best. New Bench PR! Need to increase weight next week. 100% commitment.',
      },
      { date: '2026-03-25', type: 'session', muscle: locale === 'ar' ? 'ظهر + بايسبس' : 'Back + Biceps', duration: 50, energy: 8, mood: '😊',
        exercises: [
          { name: locale === 'ar' ? 'ديدلفت' : 'Deadlift', sets: '4×6', weight: '120kg', note: '' },
          { name: locale === 'ar' ? 'بار رو' : 'Barbell Row', sets: '3×10', weight: '70kg', note: '' },
        ],
        trainerNote: locale === 'ar' ? 'أداء جيد. الديدلفت محتاج شغل على الفورم. نراجع التقنية الحصة الجاية.' : 'Good performance. Deadlift form needs work. Review technique next session.',
      },
      { date: '2026-03-22', type: 'note', trainerNote: locale === 'ar' ? '⚠️ أحمد ذكر ألم خفيف في الكتف الأيمن. مراقبة وتقليل تمارين الضغط العلوي مؤقتاً.' : '⚠️ Ahmed mentioned mild right shoulder pain. Monitor and reduce overhead pressing temporarily.' },
    ],
    [
      { date: '2026-03-27', type: 'session', muscle: locale === 'ar' ? 'أرجل' : 'Legs', duration: 45, energy: 7, mood: '💪',
        exercises: [
          { name: locale === 'ar' ? 'سكوات' : 'Squat', sets: '4×8', weight: '60kg', note: locale === 'ar' ? 'عمق ممتاز' : 'Great depth' },
          { name: locale === 'ar' ? 'لانج' : 'Lunges', sets: '3×12', weight: '20kg', note: '' },
        ],
        trainerNote: locale === 'ar' ? 'سارة بتتحسن بسرعة. السكوات أحسن كتير عن الشهر اللي فات. نبدأ نزود الأوزان.' : 'Sara improving fast. Squat much better than last month. Start increasing weights.',
      },
    ],
  ];

  const currentNotes = sessionNotes[selectedClient] || [];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📝</span> {locale === 'ar' ? 'ملاحظات الحصص' : 'Session Notes'}</h1>
        <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}>+ {locale === 'ar' ? 'ملاحظة جديدة' : 'New Note'}</button>
      </div>

      {/* Client Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {clients.map((c, i) => (
          <button key={i} onClick={() => setSelectedClient(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
              background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)',
              border: selectedClient === i ? '2px solid var(--pt-gold)' : '2px solid transparent',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>{c.avatar}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>{c.goal}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Session Notes Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {currentNotes.map((note, i) => (
          <div key={i} className="card" style={{ borderInlineStart: `4px solid ${note.type === 'note' ? '#FF9100' : 'var(--pt-gold)'}` }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>{note.type === 'session' ? '🏋️' : '📝'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                    {note.type === 'session' ? note.muscle : (locale === 'ar' ? 'ملاحظة' : 'Note')}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>📅 {note.date}</div>
                </div>
              </div>
              {note.type === 'session' && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px' }}>
                  <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>⏱️ {note.duration}{locale === 'ar' ? 'د' : 'm'}</span>
                  <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>⚡ {note.energy}/10</span>
                  <span style={{ fontSize: '1rem' }}>{note.mood}</span>
                </div>
              )}
            </div>

            {/* Exercises */}
            {note.exercises && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                {note.exercises.map((ex, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', marginBottom: '4px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ fontWeight: 700, flex: 1 }}>{ex.name}</span>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{ex.sets}</span>
                    <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{ex.weight}</span>
                    {ex.note && <span style={{ fontSize: '9px', color: 'var(--pt-success)' }}>✓ {ex.note}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Trainer Note */}
            <div style={{ padding: 'var(--space-3)', background: 'rgba(245,197,24,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,197,24,0.1)', fontSize: 'var(--font-size-xs)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>💬 {locale === 'ar' ? 'ملاحظة المدرب:' : 'Trainer Note:'} </span>
              {note.trainerNote}
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>📝 {locale === 'ar' ? 'ملاحظة حصة جديدة' : 'New Session Note'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'العميل' : 'Client'}</label>
                <select className="form-select">{clients.map((c, i) => <option key={i}>{c.name}</option>)}</select>
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'العضلات' : 'Muscles'}</label>
                  <input className="form-input" placeholder={locale === 'ar' ? 'صدر + ترايسبس' : 'Chest + Triceps'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                  <input className="form-input" type="number" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'مستوى الطاقة (1-10)' : 'Energy (1-10)'}</label>
                  <input className="form-input" type="number" min="1" max="10" dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'المزاج' : 'Mood'}</label>
                  <select className="form-select">
                    <option>🔥 {locale === 'ar' ? 'ممتاز' : 'Excellent'}</option>
                    <option>💪 {locale === 'ar' ? 'جيد جداً' : 'Very Good'}</option>
                    <option>😊 {locale === 'ar' ? 'جيد' : 'Good'}</option>
                    <option>😐 {locale === 'ar' ? 'متوسط' : 'Average'}</option>
                    <option>😴 {locale === 'ar' ? 'منخفض' : 'Low'}</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'ملاحظات المدرب' : 'Trainer Notes'}</label>
                <textarea className="form-input" rows={3} style={{ resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={() => setShowNoteModal(false)}>📝 {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
