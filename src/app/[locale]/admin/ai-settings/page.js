'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminAISettingsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState({
    aiEnabled: true,
    nutritionEnabled: true,
    workoutEnabled: true,
    chatEnabled: true,
    freePlanLimit: 1.0,
    premiumPlanLimit: 5.0,
    premiumPriceEGP: 500,
    maxRequestsPerDayFree: 10,
    maxRequestsPerDayPremium: 100,
    model: 'gemini-2.0-flash-lite',
    temperature: 0.7,
    demoMode: true,
    trainerAccess: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Toggle = ({ value, onChange, label, desc }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--glass-border)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{label}</div>
        {desc && <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: '2px' }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 48, height: 26, borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
        background: value ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'var(--pt-gray-700)',
        position: 'relative', transition: 'all var(--transition-fast)',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3,
          ...(value ? { insetInlineEnd: 3 } : { insetInlineStart: 3 }),
          transition: 'all var(--transition-fast)',
        }} />
      </button>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⚙️</span> {isAr ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}</h1>
        <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ background: saved ? 'var(--pt-success)' : '' }}>
          {saved ? (isAr ? '✅ تم الحفظ' : '✅ Saved') : (isAr ? '💾 حفظ الإعدادات' : '💾 Save Settings')}
        </button>
      </div>

      <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
        {/* Feature Toggles */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🎛️ {isAr ? 'تفعيل الميزات' : 'Feature Toggles'}</h3>
          <Toggle value={settings.aiEnabled} onChange={v => setSettings(p => ({ ...p, aiEnabled: v }))}
            label={isAr ? 'تفعيل الذكاء الاصطناعي' : 'Enable AI System'}
            desc={isAr ? 'تفعيل أو تعطيل كل ميزات AI في النظام' : 'Enable or disable all AI features'} />
          <Toggle value={settings.nutritionEnabled} onChange={v => setSettings(p => ({ ...p, nutritionEnabled: v }))}
            label={isAr ? '🥗 مساعد التغذية' : '🥗 Nutrition Assistant'}
            desc={isAr ? 'توليد خطط غذائية مخصصة' : 'Generate custom meal plans'} />
          <Toggle value={settings.workoutEnabled} onChange={v => setSettings(p => ({ ...p, workoutEnabled: v }))}
            label={isAr ? '🏋️ مولّد التمارين' : '🏋️ Workout Generator'}
            desc={isAr ? 'توليد برامج تدريبية ذكية' : 'Generate smart training programs'} />
          <Toggle value={settings.chatEnabled} onChange={v => setSettings(p => ({ ...p, chatEnabled: v }))}
            label={isAr ? '🤖 المساعد الذكي' : '🤖 AI Chat Assistant'}
            desc={isAr ? 'فقاعة المحادثة العائمة على كل الصفحات' : 'Floating chat widget on all pages'} />
          <Toggle value={settings.trainerAccess} onChange={v => setSettings(p => ({ ...p, trainerAccess: v }))}
            label={isAr ? '👨‍🏫 وصول المدربين' : '👨‍🏫 Trainer Access'}
            desc={isAr ? 'السماح للمدربين باستخدام أدوات AI' : 'Allow trainers to use AI tools'} />
          <Toggle value={settings.demoMode} onChange={v => setSettings(p => ({ ...p, demoMode: v }))}
            label={isAr ? '🧪 وضع العرض (Demo)' : '🧪 Demo Mode'}
            desc={isAr ? 'استخدام بيانات تجريبية بدلاً من API الفعلي' : 'Use demo data instead of real API'} />
        </div>

        {/* Pricing Configuration */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>💰 {isAr ? 'إعدادات الأسعار والحدود' : 'Pricing & Limits'}</h3>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)' }}>
              🆓 {isAr ? 'الخطة المجانية' : 'Free Plan'}
            </h4>
            <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'الحد الشهري ($)' : 'Monthly Limit ($)'}</label>
                <input className="form-input" type="number" step="0.1" value={settings.freePlanLimit} onChange={e => setSettings(p => ({ ...p, freePlanLimit: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'طلبات/يوم' : 'Requests/Day'}</label>
                <input className="form-input" type="number" value={settings.maxRequestsPerDayFree} onChange={e => setSettings(p => ({ ...p, maxRequestsPerDayFree: parseInt(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: '#8B5CF6', marginBottom: 'var(--space-3)' }}>
              ⭐ {isAr ? 'الخطة الكاملة' : 'Premium Plan'}
            </h4>
            <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'الحد الشهري ($)' : 'Monthly Limit ($)'}</label>
                <input className="form-input" type="number" step="0.1" value={settings.premiumPlanLimit} onChange={e => setSettings(p => ({ ...p, premiumPlanLimit: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'سعر الاشتراك (ج.م)' : 'Price (EGP)'}</label>
                <input className="form-input" type="number" value={settings.premiumPriceEGP} onChange={e => setSettings(p => ({ ...p, premiumPriceEGP: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'طلبات/يوم' : 'Requests/Day'}</label>
                <input className="form-input" type="number" value={settings.maxRequestsPerDayPremium} onChange={e => setSettings(p => ({ ...p, maxRequestsPerDayPremium: parseInt(e.target.value) }))} />
              </div>
            </div>
          </div>

          {/* Profit Preview */}
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <h4 style={{ color: 'var(--pt-success)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              📊 {isAr ? 'محاكاة الربحية' : 'Profitability Preview'}
            </h4>
            <div className="grid grid-3" style={{ gap: 'var(--space-3)', textAlign: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--pt-success)' }}>{settings.premiumPriceEGP} {isAr ? 'ج.م' : 'EGP'}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'إيراد/مشترك' : 'Revenue/sub'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: '#EF4444' }}>${settings.premiumPlanLimit}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'أقصى تكلفة API' : 'Max API cost'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--pt-gold)' }}>
                  {Math.round((1 - (settings.premiumPlanLimit * 50 / settings.premiumPriceEGP)) * 100)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{isAr ? 'هامش ربح' : 'Profit margin'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Configuration */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🧠 {isAr ? 'إعدادات النموذج' : 'Model Configuration'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'النموذج' : 'Model'}</label>
              <select className="form-input" value={settings.model} onChange={e => setSettings(p => ({ ...p, model: e.target.value }))}>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash Latest</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'الإبداعية' : 'Temperature'} ({settings.temperature})</label>
              <input type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e => setSettings(p => ({ ...p, temperature: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#8B5CF6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--pt-gray-600)' }}>
                <span>{isAr ? 'دقيق' : 'Precise'}</span>
                <span>{isAr ? 'إبداعي' : 'Creative'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Status */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🔑 {isAr ? 'حالة API' : 'API Status'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pt-success)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>Gemini API Key</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>AIza...Gi4M</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: settings.demoMode ? 'var(--pt-gold)' : 'var(--pt-success)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{isAr ? 'الوضع' : 'Mode'}</span>
              </div>
              <span className="badge" style={{ background: settings.demoMode ? 'rgba(217,177,75,0.15)' : 'rgba(34,197,94,0.15)', color: settings.demoMode ? 'var(--pt-gold)' : 'var(--pt-success)', fontSize: '10px' }}>
                {settings.demoMode ? 'DEMO' : 'LIVE'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pt-success)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{isAr ? 'النموذج النشط' : 'Active Model'}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: '#8B5CF6' }}>{settings.model}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
