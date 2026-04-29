'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAI } from '@/lib/hooks/useAI';
import AIUsageWidget from '@/components/ai/AIUsageWidget';
import AIUpgradeModal from '@/components/ai/AIUpgradeModal';
import AILoadingAnimation from '@/components/ai/AILoadingAnimation';

export default function TrainerAIToolsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { callAI, loading, usage, showUpgrade, setShowUpgrade, upgradeToPremium } = useAI();

  const [selectedClient, setSelectedClient] = useState('');
  const [analysisType, setAnalysisType] = useState('assessment');
  const [clientData, setClientData] = useState({
    name: '', age: '25', weight: '80', height: '175', goal: isAr ? 'بناء عضلات' : 'Muscle building',
    level: isAr ? 'مبتدئ' : 'Beginner', injuries: '', notes: '',
  });
  const [result, setResult] = useState(null);

  const demoClients = [
    { id: 'c1', name: isAr ? 'أحمد محمد' : 'Ahmed Mohamed', age: 25, weight: 82, goal: isAr ? 'بناء عضلات' : 'Build muscle' },
    { id: 'c2', name: isAr ? 'سارة علي' : 'Sara Ali', age: 30, weight: 65, goal: isAr ? 'خسارة وزن' : 'Weight loss' },
    { id: 'c3', name: isAr ? 'عمر حسام' : 'Omar Hossam', age: 22, weight: 70, goal: isAr ? 'لياقة عامة' : 'General fitness' },
  ];

  const analysisTypes = [
    { id: 'assessment', icon: '📊', label: isAr ? 'تقييم شامل' : 'Full Assessment', desc: isAr ? 'تقييم مستوى المتدرب وتحديد نقاط القوة والضعف' : 'Assess client level, strengths & weaknesses' },
    { id: 'program', icon: '📋', label: isAr ? 'تصميم برنامج' : 'Program Design', desc: isAr ? 'تصميم برنامج تدريبي مخصص للمتدرب' : 'Design a custom training program' },
    { id: 'nutrition', icon: '🥗', label: isAr ? 'خطة غذائية' : 'Nutrition Plan', desc: isAr ? 'إنشاء خطة غذائية بناءً على أهداف المتدرب' : 'Create a meal plan based on goals' },
    { id: 'progress', icon: '📈', label: isAr ? 'تحليل التقدم' : 'Progress Analysis', desc: isAr ? 'تحليل تقدم المتدرب واقتراح تعديلات' : 'Analyze progress & suggest adjustments' },
  ];

  const handleGenerate = async () => {
    if (loading) return;
    const data = selectedClient
      ? demoClients.find(c => c.id === selectedClient) || clientData
      : clientData;

    const endpoint = analysisType === 'nutrition' ? 'nutrition' : analysisType === 'program' ? 'workout' : 'chat';
    const payload = endpoint === 'chat'
      ? {
          message: `${isAr ? 'أنا مدرب شخصي. أريد' : 'I am a personal trainer. I need a'} ${analysisTypes.find(t => t.id === analysisType)?.label} ${isAr ? 'لمتدرب:' : 'for client:'}\n${isAr ? 'الاسم' : 'Name'}: ${data.name || 'Client'}\n${isAr ? 'العمر' : 'Age'}: ${data.age || clientData.age}\n${isAr ? 'الوزن' : 'Weight'}: ${data.weight || clientData.weight} kg\n${isAr ? 'الطول' : 'Height'}: ${clientData.height} cm\n${isAr ? 'الهدف' : 'Goal'}: ${data.goal || clientData.goal}\n${isAr ? 'المستوى' : 'Level'}: ${clientData.level}\n${clientData.injuries ? `${isAr ? 'إصابات' : 'Injuries'}: ${clientData.injuries}` : ''}\n${clientData.notes ? `${isAr ? 'ملاحظات' : 'Notes'}: ${clientData.notes}` : ''}`,
          role: 'trainer',
          locale,
        }
      : endpoint === 'nutrition'
      ? { weight: data.weight || clientData.weight, height: clientData.height, age: data.age || clientData.age, gender: 'male', goal: data.goal || clientData.goal, locale }
      : { level: clientData.level, goal: data.goal || clientData.goal, daysPerWeek: 5, locale };

    const res = await callAI(endpoint, payload);
    if (res.success) {
      setResult({ type: analysisType, data: res.data, client: data });
    }
  };

  const selectClient = (client) => {
    setSelectedClient(client.id);
    setClientData(prev => ({ ...prev, name: client.name, age: String(client.age), weight: String(client.weight), goal: client.goal }));
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1><span>🤖</span> {isAr ? 'أدوات AI للمدرب' : 'Trainer AI Tools'}</h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', marginTop: '2px' }}>
            {isAr ? 'استخدم الذكاء الاصطناعي لتحسين تجربة متدربيك' : 'Use AI to enhance your clients experience'}
          </p>
        </div>
        <span className="badge badge-ai" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
          🤖 {isAr ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
        <div>
          {/* Select Client */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>👤 {isAr ? 'اختر المتدرب' : 'Select Client'}</h3>
            <div className="grid grid-3" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {demoClients.map(client => (
                <button key={client.id} onClick={() => selectClient(client)} style={{
                  padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                  background: selectedClient === client.id ? 'rgba(139,92,246,0.12)' : 'var(--pt-darker)',
                  border: selectedClient === client.id ? '2px solid #8B5CF6' : '1px solid var(--glass-border)',
                  cursor: 'pointer', textAlign: 'start', transition: 'all var(--transition-fast)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{client.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: '2px' }}>
                    {client.age} {isAr ? 'سنة' : 'yrs'} • {client.weight}kg • {client.goal}
                  </div>
                </button>
              ))}
            </div>
            {!selectedClient && (
              <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'العمر' : 'Age'}</label>
                  <input className="form-input" value={clientData.age} onChange={e => setClientData(p => ({ ...p, age: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
                  <input className="form-input" value={clientData.weight} onChange={e => setClientData(p => ({ ...p, weight: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'الهدف' : 'Goal'}</label>
                  <input className="form-input" value={clientData.goal} onChange={e => setClientData(p => ({ ...p, goal: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {/* Analysis Type */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>⚡ {isAr ? 'نوع التحليل' : 'Analysis Type'}</h3>
            <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
              {analysisTypes.map(type => (
                <button key={type.id} onClick={() => setAnalysisType(type.id)} style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
                  background: analysisType === type.id ? 'rgba(139,92,246,0.12)' : 'var(--pt-darker)',
                  border: analysisType === type.id ? '2px solid #8B5CF6' : '1px solid var(--glass-border)',
                  cursor: 'pointer', textAlign: 'start', transition: 'all var(--transition-fast)',
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{type.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: '2px' }}>{type.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Extra Notes */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="grid grid-2" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'إصابات / قيود' : 'Injuries / Limitations'}</label>
                <input className="form-input" value={clientData.injuries} onChange={e => setClientData(p => ({ ...p, injuries: e.target.value }))} placeholder={isAr ? 'مثال: إصابة في الركبة' : 'e.g. Knee injury'} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <input className="form-input" value={clientData.notes} onChange={e => setClientData(p => ({ ...p, notes: e.target.value }))} placeholder={isAr ? 'أي ملاحظات خاصة...' : 'Any special notes...'} />
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading} className="btn btn-lg" style={{
              width: '100%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: 'white', border: 'none', fontSize: 'var(--font-size-md)',
            }}>
              {loading ? (isAr ? '⏳ جاري التحليل...' : '⏳ Analyzing...') : `🤖 ${isAr ? 'بدء التحليل بالذكاء الاصطناعي' : 'Start AI Analysis'}`}
            </button>
          </div>

          {/* Loading */}
          {loading && <AILoadingAnimation locale={locale} />}

          {/* Results */}
          {result && !loading && (
            <div className="card" style={{ borderTop: '3px solid #8B5CF6', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3>✅ {isAr ? 'نتائج التحليل' : 'Analysis Results'}</h3>
                <span className="badge badge-ai">{analysisTypes.find(t => t.id === result.type)?.icon} {analysisTypes.find(t => t.id === result.type)?.label}</span>
              </div>
              {result.type === 'assessment' || result.type === 'progress' ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 'var(--font-size-sm)' }}
                  dangerouslySetInnerHTML={{
                    __html: (result.data.response || '')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              ) : result.type === 'nutrition' && result.data.plan ? (
                <div>
                  <h4 style={{ color: '#8B5CF6', marginBottom: 'var(--space-3)' }}>{result.data.plan.planName}</h4>
                  <div className="grid grid-3" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{result.data.plan.dailyCalories}</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'سعرات/يوم' : 'kcal/day'}</div>
                    </div>
                    <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{result.data.plan.macros?.protein}g</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'بروتين' : 'Protein'}</div>
                    </div>
                    <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{result.data.plan.macros?.carbs}g</div>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'كربوهيدرات' : 'Carbs'}</div>
                    </div>
                  </div>
                  {result.data.plan.meals?.map((meal, i) => (
                    <div key={i} style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{meal.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{meal.items?.join(' • ')}</div>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)' }}>{meal.calories} kcal</span>
                    </div>
                  ))}
                </div>
              ) : result.type === 'program' && result.data.program ? (
                <div>
                  <h4 style={{ color: '#8B5CF6', marginBottom: 'var(--space-3)' }}>{result.data.program.programName}</h4>
                  {result.data.program.days?.map((day, i) => (
                    <details key={i} style={{ marginBottom: 'var(--space-2)' }}>
                      <summary style={{ fontWeight: 700, cursor: 'pointer', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>{day.day}</summary>
                      <div style={{ padding: 'var(--space-2) var(--space-4)' }}>
                        {day.exercises?.map((ex, j) => (
                          <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', borderBottom: '1px solid var(--glass-border)', fontSize: 'var(--font-size-xs)' }}>
                            <span>{ex.name}</span>
                            <span style={{ color: '#8B5CF6' }}>{ex.sets}×{ex.reps}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 'var(--font-size-sm)' }}>
                  {JSON.stringify(result.data, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <AIUsageWidget usage={usage} locale={locale} onUpgrade={() => setShowUpgrade(true)} />
          <div className="card">
            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>💡 {isAr ? 'نصائح للمدرب' : 'Trainer Tips'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
              <div>• {isAr ? 'اختر المتدرب أولاً ثم نوع التحليل' : 'Select client first, then analysis type'}</div>
              <div>• {isAr ? 'أضف الإصابات للحصول على برنامج أكثر أماناً' : 'Add injuries for safer programs'}</div>
              <div>• {isAr ? 'استخدم تحليل التقدم كل أسبوعين' : 'Use progress analysis every 2 weeks'}</div>
              <div>• {isAr ? 'يمكنك تعديل النتائج بعد التوليد' : 'You can edit results after generation'}</div>
            </div>
          </div>
        </div>
      </div>

      <AIUpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={upgradeToPremium} locale={locale} usage={usage} />
    </div>
  );
}
