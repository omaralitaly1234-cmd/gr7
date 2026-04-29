'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAI } from '@/lib/hooks/useAI';
import AIUsageWidget from '@/components/ai/AIUsageWidget';
import AIUpgradeModal from '@/components/ai/AIUpgradeModal';

export default function AIAssistantPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { callAI, loading, usage, showUpgrade, setShowUpgrade, upgradeToPremium } = useAI();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isAr
        ? 'مرحباً! أنا مساعد Power Time الذكي 🤖\n\nيمكنني مساعدتك في:\n• 🥗 نصائح التغذية والوجبات\n• 🏋️ نصائح التمارين والتقنيات\n• 💡 معلومات اللياقة البدنية\n• 📊 تحليل تقدمك\n\nكيف يمكنني مساعدتك اليوم؟'
        : "Hello! I'm Power Time AI Assistant 🤖\n\nI can help with:\n• 🥗 Nutrition tips & meals\n• 🏋️ Exercise tips & techniques\n• 💡 Fitness information\n• 📊 Progress analysis\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    const result = await callAI('chat', { message: msg, role: 'client', locale });

    if (result.success) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.data.response,
        cost: result.data.costUSD,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } else if (result.limitReached) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAr ? '⚠️ لقد استنفذت رصيدك الشهري المجاني.\n\nللاستمرار في استخدام الذكاء الاصطناعي، قم بالترقية للخطة الكاملة بـ 500 ج.م/شهر فقط!' : '⚠️ Monthly quota exceeded.\n\nTo continue using AI features, upgrade to the Full Plan for just 500 EGP/month!',
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  };

  const quickQuestions = isAr ? [
    '🥗 اقترح لي وجبة قبل التمرين',
    '🏋️ كيف أحسن تمرين السكوات؟',
    '💪 كم بروتين أحتاج يومياً؟',
    '🔥 أفضل تمارين حرق الدهون',
    '😴 كم ساعة نوم يحتاجها الرياضي؟',
    '💧 كم لتر ماء أشرب يومياً؟',
  ] : [
    '🥗 Suggest a pre-workout meal',
    '🏋️ How to improve my squat?',
    '💪 How much protein daily?',
    '🔥 Best fat burning exercises',
    '😴 How much sleep for athletes?',
    '💧 How much water daily?',
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🤖</span> {isAr ? 'المساعد الذكي' : 'AI Assistant'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
        {/* Chat Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '70vh', padding: 0, overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.06))',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700 }}>Power Time AI</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pt-success)', display: 'inline-block' }} />
                {isAr ? 'متصل وجاهز للمساعدة' : 'Online & ready to help'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%',
                  padding: 'var(--space-4)',
                  borderRadius: msg.role === 'user'
                    ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
                    : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : msg.isError ? 'var(--pt-danger-bg)' : 'var(--pt-darker)',
                  color: msg.role === 'user' ? 'white' : msg.isError ? 'var(--pt-danger)' : 'inherit',
                  fontSize: 'var(--font-size-sm)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-700)', marginTop: '4px', display: 'flex', gap: 'var(--space-2)' }}>
                  {msg.time && <span>{msg.time}</span>}
                  {msg.cost && <span>~${msg.cost.toFixed(5)}</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  padding: 'var(--space-4)', background: 'var(--pt-darker)',
                  borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
                    {isAr ? 'يفكر' : 'Thinking'}
                  </span>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6',
                      animation: `aiDotBounce 1.2s ease-in-out ${j * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div style={{
              padding: 'var(--space-3) var(--space-5)',
              display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap',
            }}>
              {quickQuestions.map((q, i) => (
                <button key={i} onClick={() => setInput(q)} style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  background: 'var(--pt-darker)', border: '1px solid var(--glass-border)',
                  fontSize: 'var(--font-size-xs)', cursor: 'pointer', color: 'var(--pt-gray-300)',
                  transition: 'all var(--transition-fast)',
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex', gap: 'var(--space-3)', alignItems: 'center',
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isAr ? 'اكتب سؤالك هنا...' : 'Type your question...'}
              className="form-input"
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'var(--pt-gray-800)',
                color: 'white', minWidth: 50, height: 44,
              }}
            >
              {isAr ? '↩' : '→'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <AIUsageWidget usage={usage} locale={locale} onUpgrade={() => setShowUpgrade(true)} />

          {/* Quick Links */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              ⚡ {isAr ? 'أدوات AI أخرى' : 'Other AI Tools'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <a href={`/${locale}/client/ai-nutrition`} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                🥗 {isAr ? 'مساعد التغذية الذكي' : 'AI Nutrition Assistant'}
              </a>
              <a href={`/${locale}/client/ai-workout`} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                🏋️ {isAr ? 'مولّد التمارين الذكي' : 'AI Workout Generator'}
              </a>
            </div>
          </div>
        </div>
      </div>

      <AIUpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={upgradeToPremium} locale={locale} usage={usage} />
    </div>
  );
}
