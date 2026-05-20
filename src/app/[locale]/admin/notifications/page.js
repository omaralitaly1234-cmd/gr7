'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [composeForm, setComposeForm] = useState({
    title: '', message: '', type: 'general', target: 'all', memberId: '',
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'notifications', [],
        { field: 'createdAt', direction: 'desc' }, 100);
      setNotifications(data || []);
      const { data: mems } = await getTenantDocuments(tenantId, 'members');
      setMembers(mems || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!tenantId || !composeForm.title || !composeForm.message) return;
    try {
      if (composeForm.target === 'individual') {
        // Send to specific member
        if (!composeForm.memberId) {
          toast.error(isAr ? 'اختر العضو' : 'Select a member');
          return;
        }
        await addTenantDocument(tenantId, 'notifications', {
          title: composeForm.title,
          body: composeForm.message,
          message: composeForm.message,
          type: composeForm.type,
          target: 'individual',
          memberId: composeForm.memberId,
          icon: typeIcons[composeForm.type] || '📢',
          status: 'sent',
          read: false,
          sentAt: Timestamp.fromDate(new Date()),
        });
      } else {
        // Broadcast: create individual notification for each matching member
        let targetMembers = members;
        if (composeForm.target === 'active') {
          targetMembers = members.filter(m => m.status === 'active');
        } else if (composeForm.target === 'expired') {
          targetMembers = members.filter(m => m.status === 'expired');
        }
        // Create a notification for each member
        const promises = targetMembers.map(m =>
          addTenantDocument(tenantId, 'notifications', {
            title: composeForm.title,
            body: composeForm.message,
            message: composeForm.message,
            type: composeForm.type,
            target: composeForm.target,
            memberId: m.id,
            icon: typeIcons[composeForm.type] || '📢',
            status: 'sent',
            read: false,
            sentAt: Timestamp.fromDate(new Date()),
          })
        );
        await Promise.all(promises);
      }
      toast.success(isAr ? 'تم إرسال الإشعار' : 'Notification sent');
      setShowCompose(false);
      setComposeForm({ title: '', message: '', type: 'general', target: 'all', memberId: '' });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error'));
    }
  };

  const typeIcons = {
    general: '📢', renewal: '🔄', payment: '💰', offer: '🏷️',
    birthday: '🎂', system: '⚙️', warning: '⚠️',
  };
  const typeLabels = {
    general: isAr ? 'عام' : 'General',
    renewal: isAr ? 'تجديد' : 'Renewal',
    payment: isAr ? 'دفع' : 'Payment',
    offer: isAr ? 'عرض' : 'Offer',
    birthday: isAr ? 'عيد ميلاد' : 'Birthday',
    system: isAr ? 'نظام' : 'System',
    warning: isAr ? 'تحذير' : 'Warning',
  };

  const filtered = notifications.filter(n => filter === 'all' || n.type === filter);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔔</span> {t('sidebar.notifications')}</h1>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          + {isAr ? 'إرسال إشعار' : 'Send Notification'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">🔔</div>
          <div className="stat-info">
            <div className="stat-value">{notifications.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الإشعارات' : 'Total'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">📢</div>
          <div className="stat-info">
            <div className="stat-value">{notifications.filter(n => n.target === 'all').length}</div>
            <div className="stat-label">{isAr ? 'إشعارات عامة' : 'Broadcast'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">👤</div>
          <div className="stat-info">
            <div className="stat-value">{notifications.filter(n => n.target === 'individual').length}</div>
            <div className="stat-label">{isAr ? 'إشعارات فردية' : 'Individual'}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {['all', ...Object.keys(typeLabels)].map(type => (
          <button key={type} className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(type)} style={{ fontSize: '12px' }}>
            {type === 'all' ? (isAr ? '🔔 الكل' : '🔔 All') : `${typeIcons[type]} ${typeLabels[type]}`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🔔</div>
          <h3>{t('common.noData')}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map(notif => (
            <div key={notif.id} className="card" style={{
              padding: 'var(--space-4)',
              borderInlineStart: `3px solid ${notif.type === 'warning' ? 'var(--pt-warning)' : notif.type === 'renewal' ? 'var(--pt-danger)' : 'var(--pt-gold)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: '1.2rem' }}>{typeIcons[notif.type] || '📢'}</span>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{notif.title}</h3>
                    <span className="badge badge-info" style={{ fontSize: '9px' }}>{typeLabels[notif.type] || notif.type}</span>
                  </div>
                  <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>{notif.message}</p>
                </div>
                <div style={{ textAlign: 'end', flexShrink: 0, marginInlineStart: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                    {notif.sentAt?.toDate ? notif.sentAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>
                    {notif.target === 'all' ? (isAr ? '📢 للجميع' : '📢 All') : `👤 ${isAr ? 'فردي' : 'Individual'}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>📢 {isAr ? 'إرسال إشعار' : 'Send Notification'}</h2>
              <button onClick={() => setShowCompose(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('common.type')}</label>
                  <select className="form-select" value={composeForm.type} onChange={e => setComposeForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{typeIcons[k]} {v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الهدف' : 'Target'}</label>
                  <select className="form-select" value={composeForm.target} onChange={e => setComposeForm(f => ({ ...f, target: e.target.value }))}>
                    <option value="all">{isAr ? '📢 جميع الأعضاء' : '📢 All Members'}</option>
                    <option value="active">{isAr ? '✅ النشطين فقط' : '✅ Active Only'}</option>
                    <option value="expired">{isAr ? '❌ المنتهيين' : '❌ Expired'}</option>
                    <option value="individual">{isAr ? '👤 عضو محدد' : '👤 Individual'}</option>
                  </select>
                </div>
              </div>
              {composeForm.target === 'individual' && (
                <div className="form-group">
                  <label className="form-label">{t('subscriptions.selectMember')}</label>
                  <select className="form-select" value={composeForm.memberId} onChange={e => setComposeForm(f => ({ ...f, memberId: e.target.value }))}>
                    <option value="">{t('common.select')}...</option>
                    {members.map(m => (<option key={m.id} value={m.id}>{m.fullName?.[locale] || m.fullName?.ar}</option>))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{isAr ? 'العنوان' : 'Title'} *</label>
                <input className="form-input" value={composeForm.title} onChange={e => setComposeForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={isAr ? 'عنوان الإشعار' : 'Notification title'} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الرسالة' : 'Message'} *</label>
                <textarea className="form-input" rows={4} value={composeForm.message} onChange={e => setComposeForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={isAr ? 'اكتب رسالة الإشعار...' : 'Write the notification message...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCompose(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSend} disabled={!composeForm.title || !composeForm.message}>
                📤 {t('common.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
