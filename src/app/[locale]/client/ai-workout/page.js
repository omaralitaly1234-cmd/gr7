'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAI } from '@/lib/hooks/useAI';
import AIUsageWidget from '@/components/ai/AIUsageWidget';
import AIUpgradeModal from '@/components/ai/AIUpgradeModal';
import AILoadingAnimation from '@/components/ai/AILoadingAnimation';

export default function AIWorkoutPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { callAI, loading, usage, showUpgrade, setShowUpgrade, upgradeToPremium } = useAI();

  const [program, setProgram] = useState(null);
  const [form, setForm] = useState({
    level: isAr ? 'متوسط' : 'Intermediate',
    goal: isAr ? 'بناء عضلات' : 'Muscle Building',
    daysPerWeek: '5',
    duration: isAr ? '4 أسابيع' : '4 weeks',
    injuries: '',
    equipment: isAr ? 'جميع المعدات متاحة' : 'Full gym equipment',
  });

  const levels = isAr ? ['مبتدئ', 'متوسط', 'متقدم'] : ['Beginner', 'Intermediate', 'Advanced'];
  const goals = isAr
    ? ['بناء عضلات', 'خسارة دهون', 'قوة', 'تحمل', 'لياقة عامة']
    : ['Muscle Building', 'Fat Loss', 'Strength', 'Endurance', 'General Fitness'];
  const durations = isAr
    ? ['4 أسابيع', '8 أسابيع', '12 أسبوع']
    : ['4 weeks', '8 weeks', '12 weeks'];

  const handleGenerate = async () => {
    const result = await callAI('workout', { ...form, locale });
    if (result.success && result.data.program) {
      setProgram(typeof result.data.program === 'string' ? JSON.parse(result.data.program) : result.data.program);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏋️</span> {isAr ? 'مولّد التمارين الذكي' : 'AI Workout Generator'}</h1>
        <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', padding: 'var(--space-2) var(--space-3)' }}>
          🤖 {isAr ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
        </span>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)', gridTemplateColumns: '1fr 1fr 340px' }}>
        {/* Form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>⚙️ {isAr ? 'إعدادات البرنامج' : 'Program Settings'}</h3>

          <div className="grid grid-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'المستوى' : 'Level'}</label>
              <select className="form-select" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الهدف' : 'Goal'}</label>
              <select className="form-select" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
                {goals.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'أيام التمرين/أسبوع' : 'Days/Week'}</label>
              <select className="form-select" value={form.daysPerWeek} onChange={e => setForm({ ...form, daysPerWeek: e.target.value })}>
                {[3, 4, 5, 6].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'مدة البرنامج' : 'Duration'}</label>
              <select className="form-select" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
                {durations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'المعدات المتاحة' : 'Equipment'}</label>
              <input type="text" className="form-input" value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label">{isAr ? 'إصابات / قيود' : 'Injuries / Limitations'}</label>
            <input type="text" className="form-input" value={form.injuries} onChange={e => setForm({ ...form, injuries: e.target.value })} placeholder={isAr ? 'مثال: إصابة في الركبة...' : 'e.g., Knee injury...'} />
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={loading}
            style={{ width: '100%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', fontSize: 'var(--font-size-md)' }}
          >
            {loading ? (isAr ? '⏳ جاري التوليد...' : '⏳ Generating...') : (isAr ? '🤖 توليد برنامج تمارين بالذكاء الاصطناعي' : '🤖 Generate AI Workout Program')}
          </button>
        </div>

        {/* Sidebar */}
        <div>
          <AIUsageWidget usage={usage} locale={locale} onUpgrade={() => setShowUpgrade(true)} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <AILoadingAnimation locale={locale} message={isAr ? 'الذكاء الاصطناعي يصمم برنامج تمارين مخصص...' : 'AI is designing your custom workout...'} />
        </div>
      )}

      {/* Generated Program */}
      {program && !loading && (
        <div className="card" style={{ borderTop: '3px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              🤖 {program.programName || (isAr ? 'برنامجك التدريبي' : 'Your Training Program')}
            </h2>
            <span className="badge badge-success">{isAr ? 'تم التوليد' : 'Generated'} ✓</span>
          </div>

          {/* Program Stats */}
          <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card">
              <div className="stat-icon gold">📅</div>
              <div className="stat-info">
                <div className="stat-value">{program.duration}</div>
                <div className="stat-label">{isAr ? 'المدة' : 'Duration'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info">💪</div>
              <div className="stat-info">
                <div className="stat-value">{program.daysPerWeek}</div>
                <div className="stat-label">{isAr ? 'أيام/أسبوع' : 'Days/Week'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">📊</div>
              <div className="stat-info">
                <div className="stat-value">{program.level}</div>
                <div className="stat-label">{isAr ? 'المستوى' : 'Level'}</div>
              </div>
            </div>
          </div>

          {/* Training Days */}
          {program.days && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              {program.days.map((day, di) => (
                <details key={di} style={{ marginBottom: 'var(--space-3)' }} open={di === 0}>
                  <summary style={{
                    cursor: 'pointer', fontWeight: 700, padding: 'var(--space-4)',
                    background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
                    borderInlineStart: '3px solid #8B5CF6',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  }}>
                    <span style={{ color: '#8B5CF6' }}>💪</span> {day.day}
                    <span style={{ marginInlineStart: 'auto', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {day.exercises?.length} {isAr ? 'تمارين' : 'exercises'}
                    </span>
                  </summary>
                  <div style={{ padding: 'var(--space-3)', paddingTop: 'var(--space-4)' }}>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>{isAr ? 'التمرين' : 'Exercise'}</th>
                            <th>{isAr ? 'مجموعات' : 'Sets'}</th>
                            <th>{isAr ? 'تكرارات' : 'Reps'}</th>
                            <th>{isAr ? 'راحة' : 'Rest'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises?.map((ex, ei) => (
                            <tr key={ei}>
                              <td style={{ color: 'var(--pt-gray-500)' }}>{ei + 1}</td>
                              <td style={{ fontWeight: 600 }}>{ex.name}</td>
                              <td><span className="badge badge-gold">{ex.sets}</span></td>
                              <td>{ex.reps}</td>
                              <td style={{ color: 'var(--pt-gray-500)' }}>{ex.rest}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* Tips */}
          {program.tips && (
            <div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>💡 {isAr ? 'نصائح' : 'Tips'}</h3>
              <div className="grid grid-3">
                {program.tips.map((tip, i) => (
                  <div key={i} style={{
                    background: 'var(--pt-darker)', padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
                    display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
                  }}>
                    <span style={{ color: 'var(--pt-success)' }}>✓</span> {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AIUpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={upgradeToPremium} locale={locale} usage={usage} />
    </div>
  );
}
