'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientMessagesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [newMsg, setNewMsg] = useState('');

  const trainer = { name: locale === 'ar' ? 'كابتن أحمد حسن' : 'Captain Ahmed Hassan', spec: locale === 'ar' ? 'تدريب قوة + تخسيس' : 'Strength + Weight Loss', online: true };

  const messages = [
    { from: 'trainer', text: locale === 'ar' ? 'صباح الخير! كيف حال الدايت؟' : 'Good morning! How is the diet?', time: '09:00 AM' },
    { from: 'me', text: locale === 'ar' ? 'صباح النور! ملتزم بس بعاني مع وجبة العشا' : 'Morning! Following well but struggling with dinner', time: '09:15 AM' },
    { from: 'trainer', text: locale === 'ar' ? 'جرب زبادي + شوفان + موزة. هتساعدك تحس بالشبع.' : 'Try yogurt + oats + banana. Filling and healthy.', time: '09:20 AM' },
    { from: 'trainer', text: locale === 'ar' ? 'وممكن تضيف بيضة مسلوقة لو جعان.' : 'Add a boiled egg if still hungry.', time: '09:21 AM' },
    { from: 'me', text: locale === 'ar' ? 'تمام يا كابتن 👍' : 'OK captain 👍', time: '09:30 AM' },
    { from: 'trainer', text: locale === 'ar' ? '💪 وبلاش تنسى 3 لتر مية في اليوم' : '💪 Don\'t forget 3L water daily', time: '10:00 AM' },
    { from: 'trainer', text: locale === 'ar' ? 'بالنسبة لحصة بكرة — هنركز على الأرجل. جهز نفسك 🦵🔥' : 'Tomorrow\'s session — Legs day. Get ready 🦵🔥', time: '02:00 PM' },
    { from: 'me', text: locale === 'ar' ? 'إن شاء الله جاهز! 💪' : 'Ready! 💪', time: '02:15 PM' },
  ];

  const quickReplies = locale === 'ar'
    ? ['تمام يا كابتن 👍', 'إن شاء الله', 'شكراً 🙏', 'هل ممكن نغير الموعد؟']
    : ['OK captain 👍', 'Sure thing', 'Thanks 🙏', 'Can we reschedule?'];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💬</span> {locale === 'ar' ? 'المحادثة مع المدرب' : 'Chat with Trainer'}</h1>
      </div>

      <div className="card" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>أ</div>
            <div style={{ position: 'absolute', bottom: 0, insetInlineEnd: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--pt-success)', border: '2px solid var(--pt-dark)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{trainer.name}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)' }}>{trainer.spec}</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-ghost btn-sm">📞</button>
            <button className="btn btn-ghost btn-sm">📹</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Date separator */}
          <div style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>
            <span style={{ background: 'var(--pt-darker)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '10px', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'اليوم' : 'Today'}</span>
          </div>

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', padding: 'var(--space-3) var(--space-4)', borderRadius: msg.from === 'me' ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                background: msg.from === 'me' ? 'rgba(245,197,24,0.15)' : 'var(--pt-darker)',
                borderInlineStart: msg.from === 'me' ? 'none' : '3px solid var(--pt-gold)' }}>
                {msg.from !== 'me' && <div style={{ fontSize: '10px', color: 'var(--pt-gold)', fontWeight: 700, marginBottom: '2px' }}>{trainer.name}</div>}
                <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>{msg.text}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginTop: '4px', textAlign: 'end' }}>
                  {msg.time} {msg.from === 'me' && '✓✓'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Replies */}
        <div style={{ padding: 'var(--space-2) var(--space-4)', display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', borderTop: '1px solid var(--glass-border)' }}>
          {quickReplies.map((reply, i) => (
            <button key={i} onClick={() => setNewMsg(reply)} className="btn btn-ghost btn-sm"
              style={{ whiteSpace: 'nowrap', fontSize: '11px', border: '1px solid var(--glass-border)' }}>
              {reply}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm">📷</button>
          <button className="btn btn-ghost btn-sm">📎</button>
          <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder={locale === 'ar' ? 'اكتب رسالة...' : 'Type a message...'} style={{ flex: 1, margin: 0 }} />
          <button className="btn btn-primary btn-sm">📤</button>
        </div>
      </div>
    </div>
  );
}
