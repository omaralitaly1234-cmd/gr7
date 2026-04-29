'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TrainerInjuryLogPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [showModal, setShowModal] = useState(false);

  const injuryLog = [
    { client: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', avatar: 'أ', injury: locale === 'ar' ? 'ألم كتف أيمن — التهاب rotator cuff خفيف' : 'Right shoulder pain — mild rotator cuff inflammation', date: '2026-03-22', severity: 'moderate', status: 'active',
      restrictions: [locale === 'ar' ? 'تجنب أوفرهيد بريس' : 'Avoid overhead press', locale === 'ar' ? 'تقليل وزن البنش 20%' : 'Reduce bench weight 20%', locale === 'ar' ? 'تمارين إحماء كتف إضافية' : 'Extra shoulder warm-up'],
      alternatives: [locale === 'ar' ? 'لاندماين بريس بدل أوفرهيد' : 'Landmine press instead of overhead', locale === 'ar' ? 'كابل فلاي بدل دمبل فلاي' : 'Cable fly instead of DB fly'],
      followUp: '2026-04-05' },
    { client: locale === 'ar' ? 'عمر حسام' : 'Omar H.', avatar: 'ع', injury: locale === 'ar' ? 'شد في أسفل الظهر — بعد ديدلفت ثقيل' : 'Lower back strain — after heavy deadlift', date: '2026-03-18', severity: 'mild', status: 'recovering',
      restrictions: [locale === 'ar' ? 'إيقاف ديدلفت أسبوعين' : 'Stop deadlift for 2 weeks', locale === 'ar' ? 'تجنب أي تمرين ضغط محوري' : 'Avoid axial loading'],
      alternatives: [locale === 'ar' ? 'تمارين ظهر بالكابل فقط' : 'Cable-only back exercises', locale === 'ar' ? 'سوبرمان + بيرد دوج' : 'Superman + Bird Dog'],
      followUp: '2026-04-01' },
    { client: locale === 'ar' ? 'سارة علي' : 'Sara A.', avatar: 'س', injury: locale === 'ar' ? 'آلام ركبة يسرى — الرباط الداخلي' : 'Left knee pain — MCL area', date: '2026-03-10', severity: 'moderate', status: 'recovered',
      restrictions: [locale === 'ar' ? 'سكوات بوزن خفيف فقط' : 'Light weight squat only', locale === 'ar' ? 'تجنب lunges' : 'Avoid lunges'],
      alternatives: [locale === 'ar' ? 'ليج بريس بزاوية 45' : '45° Leg Press', locale === 'ar' ? 'تمارين إطالة يومية' : 'Daily stretching'],
      followUp: '2026-03-25' },
  ];

  const sevColors = { mild: '#4FC3F7', moderate: '#FF9100', severe: '#FF5252' };
  const statusColors = { active: '#FF5252', recovering: '#FF9100', recovered: '#00C853' };
  const statusLabels = {
    active: locale === 'ar' ? '🔴 نشط' : '🔴 Active',
    recovering: locale === 'ar' ? '🟡 يتعافى' : '🟡 Recovering',
    recovered: locale === 'ar' ? '🟢 تعافى' : '🟢 Recovered',
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏥</span> {locale === 'ar' ? 'سجل الإصابات' : 'Injury Log'}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {locale === 'ar' ? 'إصابة جديدة' : 'Log Injury'}</button>
      </div>

      {/* Summary */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: injuryLog.filter(i => i.status === 'active').length, l: locale === 'ar' ? 'إصابات نشطة' : 'Active Injuries', color: '#FF5252', icon: '🔴' },
          { v: injuryLog.filter(i => i.status === 'recovering').length, l: locale === 'ar' ? 'في التعافي' : 'Recovering', color: '#FF9100', icon: '🟡' },
          { v: injuryLog.filter(i => i.status === 'recovered').length, l: locale === 'ar' ? 'تعافوا' : 'Recovered', color: '#00C853', icon: '🟢' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Injury Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {injuryLog.map((inj, i) => (
          <div key={i} className="card" style={{ borderInlineStart: `4px solid ${statusColors[inj.status]}` }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>{inj.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{inj.client}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>📅 {inj.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px' }}>
                <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${sevColors[inj.severity]}15`, color: sevColors[inj.severity], fontWeight: 700 }}>
                  {inj.severity === 'mild' ? '🟢' : inj.severity === 'moderate' ? '🟡' : '🔴'} {inj.severity}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${statusColors[inj.status]}15`, color: statusColors[inj.status], fontWeight: 700 }}>
                  {statusLabels[inj.status]}
                </span>
              </div>
            </div>

            {/* Injury Description */}
            <div style={{ padding: 'var(--space-2)', background: 'rgba(255,145,0,0.04)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
              🏥 {inj.injury}
            </div>

            <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
              {/* Restrictions */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '10px', color: '#FF5252', marginBottom: 'var(--space-1)' }}>⛔ {locale === 'ar' ? 'القيود' : 'Restrictions'}</div>
                {inj.restrictions.map((r, j) => (
                  <div key={j} style={{ fontSize: '11px', color: 'var(--pt-gray-400)', padding: '2px 0', display: 'flex', gap: '4px' }}>
                    <span>•</span> {r}
                  </div>
                ))}
              </div>
              {/* Alternatives */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '10px', color: 'var(--pt-success)', marginBottom: 'var(--space-1)' }}>✅ {locale === 'ar' ? 'البدائل' : 'Alternatives'}</div>
                {inj.alternatives.map((a, j) => (
                  <div key={j} style={{ fontSize: '11px', color: 'var(--pt-gray-400)', padding: '2px 0', display: 'flex', gap: '4px' }}>
                    <span>•</span> {a}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-2)', fontSize: '10px', color: 'var(--pt-gray-600)' }}>
              📋 {locale === 'ar' ? 'موعد المتابعة:' : 'Follow-up:'} <strong style={{ color: 'var(--pt-gold)' }}>{inj.followUp}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Add Injury Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>🏥 {locale === 'ar' ? 'تسجيل إصابة جديدة' : 'Log New Injury'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'العميل' : 'Client'}</label>
                <select className="form-select"><option>{locale === 'ar' ? 'اختر العميل' : 'Select Client'}</option></select>
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'وصف الإصابة' : 'Injury Description'}</label>
                <textarea className="form-input" rows={2} style={{ resize: 'none' }} />
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الشدة' : 'Severity'}</label>
                  <select className="form-select">
                    <option>🟢 {locale === 'ar' ? 'خفيفة' : 'Mild'}</option>
                    <option>🟡 {locale === 'ar' ? 'متوسطة' : 'Moderate'}</option>
                    <option>🔴 {locale === 'ar' ? 'شديدة' : 'Severe'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'موعد المتابعة' : 'Follow-up Date'}</label>
                  <input className="form-input" type="date" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'القيود والبدائل' : 'Restrictions & Alternatives'}</label>
                <textarea className="form-input" rows={3} style={{ resize: 'none' }} placeholder={locale === 'ar' ? 'سطر لكل قيد أو بديل...' : 'One restriction/alternative per line...'} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>🏥 {locale === 'ar' ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
