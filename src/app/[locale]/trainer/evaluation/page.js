'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function TrainerEvaluationPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useTrainerClients();
  const [selectedClient, setSelectedClient] = useState(0);
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState({
    consistency: 3, effort: 3, technique: 3, diet: 3, progress: 3,
    overallNotes: '', goals: '',
    measurements: { weight: '', bodyFat: '', muscle: '', chest: '', waist: '', arm: '', thigh: '' },
  });

  const client = clients[selectedClient];

  const criteria = [
    { key: 'consistency', label: isAr ? 'الالتزام بالحضور' : 'Attendance Consistency', icon: '📅' },
    { key: 'effort', label: isAr ? 'المجهود في التمرين' : 'Training Effort', icon: '💪' },
    { key: 'technique', label: isAr ? 'تقنية الأداء' : 'Exercise Technique', icon: '🎯' },
    { key: 'diet', label: isAr ? 'الالتزام بالنظام الغذائي' : 'Diet Compliance', icon: '🥗' },
    { key: 'progress', label: isAr ? 'التقدم العام' : 'Overall Progress', icon: '📈' },
  ];

  const measurementFields = [
    { key: 'weight', label: isAr ? 'الوزن (كجم)' : 'Weight (kg)', icon: '⚖️' },
    { key: 'bodyFat', label: isAr ? 'نسبة الدهون %' : 'Body Fat %', icon: '🔥' },
    { key: 'muscle', label: isAr ? 'الكتلة العضلية (كجم)' : 'Muscle Mass (kg)', icon: '💪' },
    { key: 'chest', label: isAr ? 'الصدر (سم)' : 'Chest (cm)', icon: '📐' },
    { key: 'waist', label: isAr ? 'الوسط (سم)' : 'Waist (cm)', icon: '📏' },
    { key: 'arm', label: isAr ? 'الذراع (سم)' : 'Arm (cm)', icon: '💪' },
    { key: 'thigh', label: isAr ? 'الفخذ (سم)' : 'Thigh (cm)', icon: '🦵' },
  ];

  const handleSave = async () => {
    if (!tenantId || !client) return;
    setSaving(true);
    try {
      await addTenantDocument(tenantId, 'evaluations', {
        memberId: client.id,
        memberName: client.fullName,
        trainerId: user?.uid,
        ...evaluation,
      });
      toast.success(isAr ? '✅ تم حفظ التقييم بنجاح!' : '✅ Evaluation saved!');
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Error saving');
    }
    setSaving(false);
  };

  const avg = Math.round(criteria.reduce((s, c) => s + evaluation[c.key], 0) / criteria.length * 10) / 10;

  if (clientsLoading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {isAr ? 'تقييم العميل' : 'Client Evaluation'}</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !client}>
          {saving ? '⏳' : '💾'} {isAr ? 'حفظ التقييم' : 'Save Evaluation'}
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📋</div>
          <h3>{isAr ? 'لا يوجد عملاء مخصصين لك بعد' : 'No clients assigned yet'}</h3>
        </div>
      ) : (
        <>
          {/* Client Selector */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>👤 {isAr ? 'اختر العميل' : 'Select Client'}</h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {clients.map((c, i) => {
                const name = c.fullName?.[locale] || c.fullName?.ar || '';
                return (
                  <div key={c.id} onClick={() => setSelectedClient(i)}
                    style={{ flex: '1 1 150px', padding: 'var(--space-3)', background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', border: selectedClient === i ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)' }}>🎯 {c.fitnessGoal ? t(`members.goals.${c.fitnessGoal}`) : '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Performance Rating */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)' }}>⭐ {isAr ? 'تقييم الأداء' : 'Performance Rating'}</h3>
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
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'المتوسط العام' : 'Overall Average'}</div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: avg >= 4 ? 'var(--pt-success)' : avg >= 3 ? 'var(--pt-gold)' : 'var(--pt-danger)' }}>{avg}/5</div>
              </div>
            </div>

            {/* Body Measurements */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)' }}>📏 {isAr ? 'القياسات الجسدية' : 'Body Measurements'}</h3>
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

          {/* Notes */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>📝 {isAr ? 'الملاحظات' : 'Notes'}</h3>
            <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">{isAr ? 'ملاحظات عامة' : 'General Notes'}</label>
                <textarea className="form-input" rows={4} value={evaluation.overallNotes}
                  onChange={e => setEvaluation({ ...evaluation, overallNotes: e.target.value })}
                  placeholder={isAr ? 'ملاحظات عن أداء العميل...' : 'Notes about client performance...'} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الأهداف القادمة' : 'Next Goals'}</label>
                <textarea className="form-input" rows={4} value={evaluation.goals}
                  onChange={e => setEvaluation({ ...evaluation, goals: e.target.value })}
                  placeholder={isAr ? 'الأهداف المراد تحقيقها...' : 'Goals for the next period...'} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
