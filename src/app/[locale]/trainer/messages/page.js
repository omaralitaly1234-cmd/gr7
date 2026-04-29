'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerMessagesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedClient, setSelectedClient] = useState(0);
  const [newMsg, setNewMsg] = useState('');

  const clients = [
    { name: 'أحمد محمد سعيد', lastMsg: locale === 'ar' ? 'تمام يا كابتن' : 'OK captain', time: '2:30 PM', unread: 2, online: true },
    { name: 'عمر حسام الدين', lastMsg: locale === 'ar' ? 'هل أزود الكارديو؟' : 'Should I add cardio?', time: '1:15 PM', unread: 0, online: true },
    { name: 'نور أحمد', lastMsg: locale === 'ar' ? 'شكراً على الخطة' : 'Thanks for the plan', time: '11:00 AM', unread: 0, online: false },
    { name: 'سارة حسن', lastMsg: locale === 'ar' ? 'هل ممكن أغير موعد الحصة؟' : 'Can I change session time?', time: locale === 'ar' ? 'أمس' : 'Yesterday', unread: 1, online: false },
  ];

  const messages = [
    [
      { from: 'trainer', text: locale === 'ar' ? 'صباح الخير يا أحمد! كيف حالك مع الدايت؟' : 'Good morning Ahmed! How is the diet going?', time: '09:00 AM' },
      { from: 'client', text: locale === 'ar' ? 'صباح النور يا كابتن! ملتزم الحمد لله بس بعاني مع وجبة العشا' : 'Good morning captain! Following well but struggling with dinner', time: '09:15 AM' },
      { from: 'trainer', text: locale === 'ar' ? 'جرب تبدل العشا بـ زبادي + شوفان + موزة. هتساعدك تحس بالشبع وكمان صحية.' : 'Try replacing dinner with yogurt + oats + banana. Filling and healthy.', time: '09:20 AM' },
      { from: 'trainer', text: locale === 'ar' ? 'وممكن تضيف بيضة مسلوقة لو حاسس بجوع.' : 'You can add a boiled egg if still hungry.', time: '09:21 AM' },
      { from: 'client', text: locale === 'ar' ? 'تمام يا كابتن هجرب كده من النهارده' : 'OK captain, I will try that from today', time: '09:30 AM' },
      { from: 'trainer', text: locale === 'ar' ? '💪 ممتاز! وبلاش تنسى تشرب على الأقل 3 لتر مية في اليوم' : '💪 Great! And don\'t forget at least 3L of water daily', time: '10:00 AM' },
      { from: 'client', text: locale === 'ar' ? 'تمام يا كابتن' : 'OK captain', time: '02:30 PM' },
    ],
    [], [], []
  ];

  const handleSend = () => {
    if (!newMsg.trim()) return;
    setNewMsg('');
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💬</span> {locale === 'ar' ? 'المحادثات' : 'Messages'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-4)', height: 'calc(100vh - 180px)' }}>
        {/* Client List */}
        <div className="card" style={{ overflow: 'auto', padding: 'var(--space-3)' }}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <input className="form-input" placeholder={`🔍 ${locale === 'ar' ? 'بحث...' : 'Search...'}`} style={{ fontSize: 'var(--font-size-sm)' }} />
          </div>
          {clients.map((c, i) => (
            <div key={i} onClick={() => setSelectedClient(i)}
              style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 'var(--space-1)', background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'transparent', border: selectedClient === i? '1px solid rgba(245,197,24,0.2)' : '1px solid transparent', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{c.name.charAt(0)}</div>
                  {c.online && <div style={{ position: 'absolute', bottom: 0, insetInlineEnd: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--pt-success)', border: '2px solid var(--pt-dark)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: c.unread > 0 ? 700 : 500, fontSize: 'var(--font-size-sm)' }}>{c.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{c.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMsg}</span>
                    {c.unread > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: '50%', background: 'var(--pt-gold)', color: 'var(--pt-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>{c.unread}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{clients[selectedClient].name.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{clients[selectedClient].name}</div>
              <div style={{ fontSize: '10px', color: clients[selectedClient].online ? 'var(--pt-success)' : 'var(--pt-gray-600)' }}>
                {clients[selectedClient].online ? (locale === 'ar' ? '🟢 متصل' : '🟢 Online') : (locale === 'ar' ? '⚪ آخر ظهور ' + clients[selectedClient].time : '⚪ Last seen ' + clients[selectedClient].time)}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {(messages[selectedClient] || []).map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'trainer' ? 'flex-start' : 'flex-end' }}>
                <div style={{ maxWidth: '70%', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', background: msg.from === 'trainer' ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', borderBottomInlineStart: msg.from === 'trainer' ? '3px solid var(--pt-gold)' : 'none', borderBottomInlineEnd: msg.from !== 'trainer' ? '3px solid var(--pt-gray-600)' : 'none' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>{msg.text}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginTop: '4px', textAlign: msg.from === 'trainer' ? 'start' : 'end' }}>{msg.time}</div>
                </div>
              </div>
            ))}
            {(messages[selectedClient] || []).length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--pt-gray-600)', padding: 'var(--space-8)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💬</div>
                {locale === 'ar' ? 'ابدأ محادثة جديدة' : 'Start a new conversation'}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-ghost btn-sm">📎</button>
            <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)}
              placeholder={locale === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-primary btn-sm" onClick={handleSend}>📤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
