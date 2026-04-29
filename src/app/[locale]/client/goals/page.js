'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientGoalsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [showModal, setShowModal] = useState(false);

  const goals = [
    {
      id: 1, icon: '⚖️', title: locale === 'ar' ? 'الوصول لـ 85 كيلو' : 'Reach 85kg',
      category: locale === 'ar' ? 'وزن' : 'Weight', priority: 'high',
      startValue: 95, currentValue: 89, targetValue: 85, unit: 'kg',
      startDate: '2026-01-15', targetDate: '2026-04-15',
      milestones: [
        { label: '93kg', done: true }, { label: '90kg', done: true },
        { label: '87kg', done: false }, { label: '85kg', done: false },
      ],
      notes: locale === 'ar' ? 'التزام بالنظام الغذائي + كارديو 3 مرات أسبوعياً' : 'Follow diet + cardio 3x/week',
      status: 'on-track',
    },
    {
      id: 2, icon: '🏋️', title: locale === 'ar' ? 'بنش بريس 120 كيلو' : 'Bench Press 120kg',
      category: locale === 'ar' ? 'قوة' : 'Strength', priority: 'high',
      startValue: 80, currentValue: 105, targetValue: 120, unit: 'kg',
      startDate: '2026-01-01', targetDate: '2026-06-01',
      milestones: [
        { label: '90kg', done: true }, { label: '100kg', done: true },
        { label: '110kg', done: false }, { label: '120kg', done: false },
      ],
      notes: locale === 'ar' ? 'زيادة 2.5 كيلو كل أسبوعين' : 'Increase 2.5kg every 2 weeks',
      status: 'on-track',
    },
    {
      id: 3, icon: '🏃', title: locale === 'ar' ? 'جري 5 كيلو في 25 دقيقة' : 'Run 5K in 25 min',
      category: locale === 'ar' ? 'كارديو' : 'Cardio', priority: 'medium',
      startValue: 35, currentValue: 28, targetValue: 25, unit: locale === 'ar' ? 'دقيقة' : 'min',
      startDate: '2026-02-01', targetDate: '2026-05-01',
      milestones: [
        { label: locale === 'ar' ? '32 دقيقة' : '32 min', done: true },
        { label: locale === 'ar' ? '28 دقيقة' : '28 min', done: true },
        { label: locale === 'ar' ? '25 دقيقة' : '25 min', done: false },
      ],
      notes: locale === 'ar' ? 'تدريب interval 3 مرات في الأسبوع' : 'Interval training 3x/week',
      status: 'on-track',
    },
    {
      id: 4, icon: '💪', title: locale === 'ar' ? 'نسبة دهون 15%' : 'Body Fat 15%',
      category: locale === 'ar' ? 'تكوين جسم' : 'Body Comp', priority: 'high',
      startValue: 25, currentValue: 19, targetValue: 15, unit: '%',
      startDate: '2026-01-01', targetDate: '2026-05-30',
      milestones: [
        { label: '22%', done: true }, { label: '19%', done: true },
        { label: '17%', done: false }, { label: '15%', done: false },
      ],
      notes: locale === 'ar' ? 'تنشيف تدريجي مع الحفاظ على الكتلة العضلية' : 'Gradual cut while maintaining muscle',
      status: 'behind',
    },
    {
      id: 5, icon: '🧘', title: locale === 'ar' ? 'التزام 5 أيام/أسبوع' : 'Train 5 days/week',
      category: locale === 'ar' ? 'التزام' : 'Consistency', priority: 'medium',
      startValue: 3, currentValue: 4.2, targetValue: 5, unit: locale === 'ar' ? 'يوم/أسبوع' : 'days/week',
      startDate: '2026-03-01', targetDate: '2026-04-30',
      milestones: [
        { label: locale === 'ar' ? '4 أيام' : '4 days', done: true },
        { label: locale === 'ar' ? '5 أيام' : '5 days', done: false },
      ],
      notes: locale === 'ar' ? 'تقسيم التدريب: صدر/ظهر/أرجل/أكتاف/ذراع' : 'Split: Chest/Back/Legs/Shoulders/Arms',
      status: 'on-track',
    },
  ];

  const getProgress = (g) => {
    const isReverse = g.targetValue < g.startValue;
    const total = Math.abs(g.targetValue - g.startValue);
    const done = Math.abs(g.currentValue - g.startValue);
    return Math.min(Math.round((done / total) * 100), 100);
  };

  const statusConfig = {
    'on-track': { label: locale === 'ar' ? 'على المسار ✅' : 'On Track ✅', color: 'var(--pt-success)' },
    'behind': { label: locale === 'ar' ? 'متأخر ⚠️' : 'Behind ⚠️', color: 'var(--pt-warning)' },
    'completed': { label: locale === 'ar' ? 'مكتمل 🏆' : 'Completed 🏆', color: 'var(--pt-gold)' },
  };

  const totalProgress = Math.round(goals.reduce((a, g) => a + getProgress(g), 0) / goals.length);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🎯</span> {locale === 'ar' ? 'أهدافي' : 'My Goals'}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {locale === 'ar' ? 'هدف جديد' : 'New Goal'}</button>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', borderTop: '3px solid var(--pt-gold)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
          {locale === 'ar' ? 'التقدم العام نحو أهدافك' : 'Overall Progress Toward Goals'}
        </div>
        <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto var(--space-3)' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="56" fill="none" stroke="var(--pt-darker)" strokeWidth="10" />
            <circle cx="65" cy="65" r="56" fill="none" stroke="var(--pt-gold)" strokeWidth="10"
              strokeDasharray={`${(totalProgress / 100) * 352} 352`} strokeLinecap="round"
              transform="rotate(-90 65 65)" style={{ transition: 'stroke-dasharray 1s' }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', color: 'var(--pt-gold)' }}>{totalProgress}%</div>
          </div>
        </div>
        <div className="grid grid-3" style={{ maxWidth: 400, margin: '0 auto' }}>
          <div><div style={{ fontWeight: 900, color: 'var(--pt-success)' }}>{goals.filter(g => g.status === 'on-track').length}</div><div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'على المسار' : 'On Track'}</div></div>
          <div><div style={{ fontWeight: 900, color: 'var(--pt-warning)' }}>{goals.filter(g => g.status === 'behind').length}</div><div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'متأخر' : 'Behind'}</div></div>
          <div><div style={{ fontWeight: 900, color: 'var(--pt-gold)' }}>{goals.length}</div><div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'إجمالي' : 'Total'}</div></div>
        </div>
      </div>

      {/* Goals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {goals.map(g => {
          const pct = getProgress(g);
          const sc = statusConfig[g.status];
          return (
            <div key={g.id} className="card" style={{ borderInlineStart: `4px solid ${sc.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(245,197,24,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{g.icon}</div>
                  <div>
                    <h3 style={{ marginBottom: '2px' }}>{g.title}</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px' }}>
                      <span className="badge badge-info" style={{ fontSize: '9px' }}>{g.category}</span>
                      <span style={{ color: 'var(--pt-gray-600)' }}>📅 {g.targetDate}</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${sc.color}15`, color: sc.color, fontWeight: 700 }}>{sc.label}</span>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>{locale === 'ar' ? 'البداية' : 'Start'}: <strong>{g.startValue}</strong></span>
                  <span style={{ color: 'var(--pt-gold)', fontWeight: 800 }}>{locale === 'ar' ? 'الحالي' : 'Current'}: {g.currentValue} {g.unit}</span>
                  <span>{locale === 'ar' ? 'الهدف' : 'Target'}: <strong>{g.targetValue}</strong></span>
                </div>
                <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${sc.color}, var(--pt-gold))`, borderRadius: 'var(--radius-full)', transition: 'width 0.6s' }} />
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 800, color: sc.color, marginTop: '2px' }}>{pct}%</div>
              </div>

              {/* Milestones */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                {g.milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: m.done ? 'rgba(0,200,83,0.08)' : 'var(--pt-darker)', borderRadius: 'var(--radius-full)', fontSize: '10px', border: `1px solid ${m.done ? 'rgba(0,200,83,0.2)' : 'transparent'}` }}>
                    <span>{m.done ? '✅' : '⬜'}</span>
                    <span style={{ color: m.done ? 'var(--pt-success)' : 'var(--pt-gray-500)', textDecoration: m.done ? 'line-through' : 'none' }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div style={{ fontSize: '11px', color: 'var(--pt-gray-500)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                📝 {g.notes}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>🎯 {locale === 'ar' ? 'هدف جديد' : 'New Goal'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'عنوان الهدف' : 'Goal Title'}</label>
                <input className="form-input" placeholder={locale === 'ar' ? 'مثال: الوصول لـ 80 كيلو' : 'e.g. Reach 80kg'} />
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الفئة' : 'Category'}</label>
                  <select className="form-select">
                    <option>{locale === 'ar' ? 'وزن' : 'Weight'}</option>
                    <option>{locale === 'ar' ? 'قوة' : 'Strength'}</option>
                    <option>{locale === 'ar' ? 'كارديو' : 'Cardio'}</option>
                    <option>{locale === 'ar' ? 'تكوين جسم' : 'Body Comp'}</option>
                    <option>{locale === 'ar' ? 'التزام' : 'Consistency'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الأولوية' : 'Priority'}</label>
                  <select className="form-select">
                    <option>{locale === 'ar' ? 'عالية 🔴' : 'High 🔴'}</option>
                    <option>{locale === 'ar' ? 'متوسطة 🟡' : 'Medium 🟡'}</option>
                    <option>{locale === 'ar' ? 'منخفضة 🟢' : 'Low 🟢'}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'القيمة الحالية' : 'Current'}</label>
                  <input className="form-input" type="number" dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'القيمة المستهدفة' : 'Target'}</label>
                  <input className="form-input" type="number" dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الوحدة' : 'Unit'}</label>
                  <input className="form-input" placeholder="kg / % / min" dir="ltr" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'التاريخ المستهدف' : 'Target Date'}</label>
                <input className="form-input" type="date" dir="ltr" />
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                <textarea className="form-input" rows={2} style={{ resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>🎯 {locale === 'ar' ? 'حفظ الهدف' : 'Save Goal'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
