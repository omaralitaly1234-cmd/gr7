'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function TrainerMessagesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        const { data: members } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'assignedTrainer', operator: '==', value: user.uid }],
          { field: 'fullName.ar', direction: 'asc' });
        setClients(members || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

  useEffect(() => {
    async function loadMessages() {
      if (!tenantId || !user || clients.length === 0) return;
      const client = clients[selectedClient];
      if (!client) return;
      try {
        const { data } = await getTenantDocuments(tenantId, 'messages',
          [{ field: 'participants', operator: 'array-contains', value: user.uid }],
          { field: 'sentAt', direction: 'asc' });
        const filtered = (data || []).filter(m =>
          (m.senderId === user.uid && m.receiverId === client.uid) ||
          (m.senderId === client.uid && m.receiverId === user.uid) ||
          (m.senderId === user.uid && m.memberId === client.id) ||
          (m.memberId === client.id)
        );
        setMessages(filtered);
      } catch (err) { console.error(err); }
    }
    loadMessages();
  }, [tenantId, user, clients, selectedClient]);

  const handleSend = async () => {
    if (!newMsg.trim() || !tenantId || !user || clients.length === 0) return;
    const client = clients[selectedClient];
    setSending(true);
    try {
      await addTenantDocument(tenantId, 'messages', {
        senderId: user.uid,
        receiverId: client.uid || null,
        memberId: client.id,
        senderName: user.displayName || 'Trainer',
        receiverName: client.fullName?.[locale] || client.fullName?.ar || '',
        text: newMsg,
        from: 'trainer',
        participants: [user.uid, client.uid || client.id],
        sentAt: Timestamp.fromDate(new Date()),
        read: false,
      });
      setMessages(prev => [...prev, { text: newMsg, from: 'trainer', sentAt: Timestamp.fromDate(new Date()) }]);
      setNewMsg('');
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ' : 'Error sending');
    }
    setSending(false);
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💬</span> {isAr ? 'المحادثات' : 'Messages'}</h1>
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>💬</div>
          <h3>{isAr ? 'لا يوجد عملاء بعد' : 'No clients yet'}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-4)', height: 'calc(100vh - 180px)' }}>
          {/* Client List */}
          <div className="card" style={{ overflow: 'auto', padding: 'var(--space-3)' }}>
            {clients.map((c, i) => {
              const name = c.fullName?.[locale] || c.fullName?.ar || '';
              return (
                <div key={c.id} onClick={() => setSelectedClient(i)}
                  style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 'var(--space-1)', background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'transparent', border: selectedClient === i ? '1px solid rgba(245,197,24,0.2)' : '1px solid transparent', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{name.charAt(0)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: selectedClient === i ? 700 : 500, fontSize: 'var(--font-size-sm)' }}>{name}</span>
                      {c.phone && <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }} dir="ltr">{c.phone}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Area */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {(clients[selectedClient]?.fullName?.[locale] || clients[selectedClient]?.fullName?.ar || '?').charAt(0)}
              </div>
              <div style={{ fontWeight: 700 }}>{clients[selectedClient]?.fullName?.[locale] || clients[selectedClient]?.fullName?.ar}</div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--pt-gray-600)', padding: 'var(--space-8)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💬</div>
                  {isAr ? 'ابدأ محادثة جديدة' : 'Start a new conversation'}
                </div>
              ) : messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'trainer' ? 'flex-start' : 'flex-end' }}>
                  <div style={{ maxWidth: '70%', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', background: msg.from === 'trainer' ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', borderBottomInlineStart: msg.from === 'trainer' ? '3px solid var(--pt-gold)' : 'none', borderBottomInlineEnd: msg.from !== 'trainer' ? '3px solid var(--pt-gray-600)' : 'none' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>{msg.text}</div>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginTop: '4px' }}>
                      {msg.sentAt?.toDate ? msg.sentAt.toDate().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 'var(--space-2)' }}>
              <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, margin: 0 }} />
              <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !newMsg.trim()}>📤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
