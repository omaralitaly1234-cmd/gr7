'use client';

import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/lib/hooks/useAI';
import AILoadingAnimation from './AILoadingAnimation';
import AIUpgradeModal from './AIUpgradeModal';

// Simple markdown-like renderer for chat messages
function renderMessage(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/• /g, '<span style="display:inline-block;width:16px">•</span> ')
    .replace(/(\d+)\. /g, '<span style="display:inline-block;width:20px;color:#8B5CF6;font-weight:700">$1.</span> ');
}

export default function AIChatWidget({ locale, role = 'client' }) {
  const isAr = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isAr
        ? 'مرحباً! أنا مساعد GR 7 الذكي 🤖\nكيف يمكنني مساعدتك اليوم؟'
        : "Hi! I'm GR 7 AI Assistant 🤖\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { callAI, loading, usage, showUpgrade, setShowUpgrade, upgradeToPremium } = useAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    const result = await callAI('chat', { message: msg, role, locale });

    if (result.success) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.data.response,
        cost: result.data.costUSD,
      }]);
    } else if (result.limitReached) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAr
          ? '⚠️ لقد استنفذت رصيدك الشهري. قم بالترقية للخطة الكاملة للاستمرار!'
          : '⚠️ Monthly quota exceeded. Upgrade to continue!',
        isError: true,
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAr ? '❌ حدث خطأ. حاول مرة أخرى.' : '❌ An error occurred. Try again.',
        isError: true,
      }]);
    }
  };

  const quickActions = role === 'trainer' ? [
    { icon: '📊', label: isAr ? 'تقييم متدرب' : 'Assess client', msg: isAr ? 'كيف أقيم مستوى متدرب جديد؟' : 'How to assess a new client?' },
    { icon: '📝', label: isAr ? 'خطة تدريب' : 'Training plan', msg: isAr ? 'ساعدني في تصميم خطة تدريب لمتدرب مبتدئ' : 'Help me design a plan for a beginner client' },
    { icon: '🩺', label: isAr ? 'إصابات' : 'Injuries', msg: isAr ? 'كيف أتعامل مع متدرب لديه إصابة في الركبة؟' : 'How to handle a client with a knee injury?' },
  ] : role === 'admin' ? [
    { icon: '📈', label: isAr ? 'تحليل' : 'Analytics', msg: isAr ? 'كيف أزيد معدل الاحتفاظ بالأعضاء؟' : 'How to improve member retention?' },
    { icon: '💰', label: isAr ? 'إيرادات' : 'Revenue', msg: isAr ? 'اقتراحات لزيادة إيرادات الجيم' : 'Suggestions to increase gym revenue' },
    { icon: '🎯', label: isAr ? 'تسويق' : 'Marketing', msg: isAr ? 'أفكار تسويقية للجيم' : 'Marketing ideas for the gym' },
  ] : [
    { icon: '🥗', label: isAr ? 'نصيحة تغذية' : 'Nutrition tip', msg: isAr ? 'أعطني نصيحة تغذية لبناء العضلات' : 'Give me a nutrition tip for muscle building' },
    { icon: '🏋️', label: isAr ? 'نصيحة تمرين' : 'Workout tip', msg: isAr ? 'أعطني نصيحة لتحسين تمرين الصدر' : 'Give me a tip to improve chest workout' },
    { icon: '💡', label: isAr ? 'تحفيز' : 'Motivate me', msg: isAr ? 'أحتاج بعض التحفيز للتمرين' : 'I need some workout motivation' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-chat-fab"
        style={{
          position: 'fixed', bottom: 24, insetInlineEnd: 24, zIndex: 1050,
          width: 56, height: 56, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          color: 'white', fontSize: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
          transition: 'all var(--transition-normal)',
          border: 'none', cursor: 'pointer',
        }}
        title={isAr ? 'المساعد الذكي' : 'AI Assistant'}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 92, insetInlineEnd: 24, zIndex: 1050,
          width: 400, maxHeight: '75vh',
          background: 'var(--pt-dark)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>GR 7 AI</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-success)' }}>● {isAr ? 'متصل' : 'Online'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {usage && (
                <div style={{
                  fontSize: '10px', color: 'var(--pt-gray-500)',
                  background: 'var(--pt-darker)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                }}>
                  ${usage.remainingUSD?.toFixed(3)} {isAr ? 'متبقي' : 'left'}
                </div>
              )}
              <button onClick={() => { setMessages([messages[0]]); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px',
                color: 'var(--pt-gray-500)', padding: '2px',
              }} title={isAr ? 'محادثة جديدة' : 'New chat'}>🔄</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 'var(--space-4)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            maxHeight: 380, minHeight: 200,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{
                  padding: 'var(--space-3)',
                  borderRadius: msg.role === 'user'
                    ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                    : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : msg.isError ? 'rgba(239,68,68,0.1)' : 'var(--pt-darker)',
                  color: msg.role === 'user' ? 'white' : msg.isError ? '#EF4444' : 'inherit',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 1.6,
                }}
                  dangerouslySetInnerHTML={{ __html: msg.role === 'user' ? msg.content : renderMessage(msg.content) }}
                />
                {msg.cost && (
                  <div style={{ fontSize: '9px', color: 'var(--pt-gray-700)', marginTop: '2px', textAlign: msg.role === 'user' ? 'end' : 'start' }}>
                    ~${msg.cost.toFixed(5)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div className="ai-typing" style={{
                  background: 'var(--pt-darker)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                }}>
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div style={{
              padding: '0 var(--space-4) var(--space-2)',
              display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap',
            }}>
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(qa.msg); }}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--pt-darker)', border: '1px solid var(--glass-border)',
                    fontSize: '10px', cursor: 'pointer', color: 'var(--pt-gray-300)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {qa.icon} {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: 'var(--space-3)', borderTop: '1px solid var(--glass-border)',
            display: 'flex', gap: 'var(--space-2)',
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isAr ? 'اكتب رسالتك...' : 'Type a message...'}
              className="form-input"
              style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 'var(--radius-md)',
                background: input.trim() ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'var(--pt-gray-800)',
                color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                border: 'none', transition: 'all var(--transition-fast)',
              }}
            >
              {isAr ? '↩' : '→'}
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <AIUpgradeModal
        show={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={upgradeToPremium}
        locale={locale}
        usage={usage}
      />
    </>
  );
}
