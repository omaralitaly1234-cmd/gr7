'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerEvaluationPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClient, setSelectedClient] = useState(0);
  const [savedMsg, setSavedMsg] = useState('');

  const clients = [
    { id: 1, name: 'أحمد محمد سعيد', goal: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss' },
    { id: 2, name: 'عمر حسام الدين', goal: locale === 'ar' ? 'تضخيم' : 'Bulking' },
    { id: 3, name: 'نور أحمد', goal: locale === 'ar' ? 'لياقة عامة' : 'General Fitness' },
  ];

  const [evaluation, setEvaluation] = useState({
    consistency: 4,     // 1-5
    effort: 4,
    technique: 3,
    diet: 3,
    progress: 4,
    overallNotes: '',
    goals: '',
    nextStep: '',
    measurements: { weight: '', bodyFat: '', muscle: '', chest: '', waist: '', arm: '', thigh: '' },
  });

  const criteria = [
    { key: 'consistency', label: locale === 'ar' ? 'الالتزام بالحضور' : 'Attendance Consistency', icon: '📅' },
    { key: 'effort', label: locale === 'ar' ? 'المجهود في التمرين' : 'Training Effort', icon: '💪' },
    { key: 'technique', label: locale === 'ar' ? 'تقنية الأداء' : 'Exercise Technique', icon: '🎯' },
    { key: 'diet', label: locale === 'ar' ? 'الالتزام بالنظام الغذائي' : 'Diet Compliance', icon: '🥗' },
    { key: 'progress', label: locale === 'ar' ? 'التقدم العام' : 'Overall Progress', icon: '📈' },
  ];

  const measurementFields = [
    { key: 'weight', label: locale === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)', icon: '⚖️' },
    { key: 'bodyFat', label: locale === 'ar' ? 'نسبة الدهون %' : 'Body Fat %', icon: '🔥' },
    { key: 'muscle', label: locale === 'ar' ? 'الكتلة العضلية (كجم)' : 'Muscle Mass (kg)', icon: '💪' },
    { key: 'chest', label: locale === 'ar' ? 'الصدر (سم)' : 'Chest (cm)', icon: '📐' },
    { key: 'waist', label: locale === 'ar' ? 'الوسط (سم)' : 'Waist (cm)', icon: '📏' },
    { key: 'arm', label: locale === 'ar' ? 'الذراع (سم)' : 'Arm (cm)', icon: '💪' },
    { key: 'thigh', label: locale === 'ar' ? 'الفخذ (سم)' : 'Thigh (cm)', icon: '🦵' },
  ];

  const handleSave = () => {
    setSavedMsg(locale === 'ar' ? '✅ تم حفظ التقييم بنجاح!' : '✅ Evaluation saved!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const avg = Math.round(criteria.reduce((s, c) => s + evaluation[c.key], 0) / criteria.length * 10) / 10;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {locale === 'ar' ? 'تقييم العميل' : 'Client Evaluation'}</h1>
        <button className="btn btn-primary" onClick={handleSave}>💾 {locale === 'ar' ? 'حفظ التقييم' : 'Save Evaluation'}</button>
      </div>

      {savedMsg && (
        <div style={{ padding: 'var(--space-3)', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: 'var(--pt-success)', fontWeight: 600 }}>{savedMsg}</div>
      )}

      {/* Client Selector */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>👤 {locale === 'ar' ? 'اختر العميل' : 'Select Client'}</h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {clients.map((c, i) => (
            <div key={c.id} onClick={() => setSelectedClient(i)}
              style={{ flex: 1, padding: 'var(--space-3)', background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', border: selectedClient === i ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)' }}>{c.goal}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Performance Rating */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>⭐ {locale === 'ar' ? 'تقييم الأداء' : 'Performance Rating'}</h3>
          {criteria.map(c => (
            <div key={c.key} style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--font-size-sm)' }}>
                <span>{c.icon} {c.label}</span>
                <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{evaluation[c.key]}/5</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setEvaluation({ ...evaluation, [c.key]: star })}
                    style={{ flex: 1, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', transition: 'all 0.2s',
                      background: star <= evaluation[c.key] ? (evaluation[c.key] >= 4 ? 'var(--pt-gold)' : evaluation[c.key] >= 3 ? '#FFD740' : '#FF5252') : 'var(--pt-darker)',
                      color: star <= evaluation[c.key] ? 'var(--pt-black)' : 'var(--pt-gray-600)' }}>
                    {star}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(245,197,24,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'المتوسط العام' : 'Overall Average'}</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: avg >= 4 ? 'var(--pt-success)' : avg >= 3 ? 'var(--pt-gold)' : 'var(--pt-danger)' }}>{avg}/5</div>
          </div>
        </div>

        {/* Body Measurements */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📏 {locale === 'ar' ? 'القياسات الجسدية' : 'Body Measurements'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {measurementFields.map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ width: 150, fontSize: 'var(--font-size-sm)' }}>{f.icon} {f.label}</span>
                <input className="form-input" type="number" value={evaluation.measurements[f.key]}
                  onChange={e => setEvaluation({ ...evaluation, measurements: { ...evaluation.measurements, [f.key]: e.target.value }})}
                  style={{ flex: 1 }} dir="ltr" placeholder="—" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>📝 {locale === 'ar' ? 'الملاحظات' : 'Notes'}</h3>
        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">{locale === 'ar' ? 'ملاحظات عامة' : 'General Notes'}</label>
            <textarea className="form-input" rows={4} value={evaluation.overallNotes}
              onChange={e => setEvaluation({ ...evaluation, overallNotes: e.target.value })}
              placeholder={locale === 'ar' ? 'ملاحظات عن أداء العميل في الفترة الأخيرة...' : 'Notes about client performance...'} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">{locale === 'ar' ? 'الأهداف القادمة' : 'Next Goals'}</label>
            <textarea className="form-input" rows={4} value={evaluation.goals}
              onChange={e => setEvaluation({ ...evaluation, goals: e.target.value })}
              placeholder={locale === 'ar' ? 'الأهداف المراد تحقيقها في الفترة القادمة...' : 'Goals for the next period...'} style={{ resize: 'vertical' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
