'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ClientMessagesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (!tenantId || !memberData) { setLoading(false); return; }
      try {
        // Load all messages, then filter for this member client-side
        const { data } = await getTenantDocuments(tenantId, 'messages');
        const myMessages = (data || []).filter(m => m.memberId === memberData.id);
        // Sort by time ascending
        myMessages.sort((a, b) => {
          const ta = a.sentAt?.toDate ? a.sentAt.toDate().getTime() : a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.sentAt?.toDate ? b.sentAt.toDate().getTime() : b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return ta - tb;
        });
        setMessages(myMessages);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (!memberLoading) load();
  }, [tenantId, memberData, memberLoading]);

  const handleSend = async () => {
    if (!newMsg.trim() || !tenantId || !memberData) return;
    setSending(true);
    try {
      const now = Timestamp.fromDate(new Date());
      const msgDoc = {
        senderId: memberData.uid || memberData.id,
        senderName: memberData.fullName?.[locale] || memberData.fullName?.ar || '',
        receiverId: memberData.assignedTrainer || null,
        memberId: memberData.id,
        text: newMsg,
        from: 'member',
        participants: [memberData.uid || memberData.id, memberData.assignedTrainer].filter(Boolean),
        sentAt: now,
        createdAt: now,
        read: false,
      };
      await addTenantDocument(tenantId, 'messages', msgDoc);
      setMessages(prev => [...prev, { ...msgDoc }]);
      setNewMsg('');
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Error sending');
    }
    setSending(false);
  };

  if (loading || memberLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  const rawTrainerName = memberData?.assignedTrainerName;
  const trainerName = typeof rawTrainerName === 'object' && rawTrainerName ? (rawTrainerName[locale] || rawTrainerName.ar || rawTrainerName.en || '') : (rawTrainerName || (isAr ? 'المدرب' : 'Trainer'));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💬</span> {isAr ? 'الرسائل' : 'Messages'}</h1>
        {memberData?.assignedTrainer && (
          <span className="badge badge-gold">👨‍🏫 {trainerName}</span>
        )}
      </div>

      {!memberData?.assignedTrainer ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>💬</div>
          <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>{isAr ? 'لا يوجد مدرب مخصص لك' : 'No trainer assigned yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'تواصل مع إدارة النادي لتخصيص مدرب' : 'Contact gym admin to get a trainer assigned'}</p>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold-glow)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>👨‍🏫</div>
            <div>
              <div style={{ fontWeight: 700 }}>{trainerName}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'مدربك الخاص' : 'Your Personal Trainer'}</div>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--pt-gray-600)', padding: 'var(--space-8)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💬</div>
                {isAr ? 'لا توجد رسائل بعد — ابدأ محادثة مع مدربك' : 'No messages yet — start a conversation with your trainer'}
              </div>
            ) : messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'member' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)',
                  background: msg.from === 'member' ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)',
                  borderBottomInlineEnd: msg.from === 'member' ? '3px solid var(--pt-gold)' : 'none',
                  borderBottomInlineStart: msg.from !== 'member' ? '3px solid var(--pt-gray-600)' : 'none',
                }}>
                  <div style={{ fontSize: '10px', color: msg.from === 'member' ? 'var(--pt-gold)' : 'var(--pt-gray-500)', marginBottom: '4px', fontWeight: 600 }}>
                    {msg.from === 'member' ? (isAr ? 'أنت' : 'You') : (typeof msg.senderName === 'object' ? (msg.senderName?.[locale] || msg.senderName?.ar || '') : (msg.senderName || trainerName))}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>{msg.text}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginTop: '4px', textAlign: 'end' }}>
                    {(msg.sentAt?.toDate || msg.createdAt?.toDate) ? (msg.sentAt?.toDate ? msg.sentAt.toDate() : msg.createdAt.toDate()).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 'var(--space-2)' }}>
            <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)}
              placeholder={isAr ? 'اكتب رسالة لمدربك...' : 'Message your trainer...'}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !newMsg.trim()}>📤</button>
          </div>
        </div>
      )}
    </div>
  );
}
