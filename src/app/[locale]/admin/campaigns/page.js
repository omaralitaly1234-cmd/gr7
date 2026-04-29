'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CAMPAIGN_TYPES = {
  renewal: { ar: 'تجديد اشتراك', en: 'Renewal', icon: '🔄', color: '#4FC3F7' },
  welcome: { ar: 'ترحيب', en: 'Welcome', icon: '👋', color: '#00C853' },
  offer: { ar: 'عرض خاص', en: 'Special Offer', icon: '🏷️', color: '#F5C518' },
  birthday: { ar: 'عيد ميلاد', en: 'Birthday', icon: '🎂', color: '#FF5252' },
  winback: { ar: 'استعادة عملاء', en: 'Win Back', icon: '💪', color: '#7C4DFF' },
  announcement: { ar: 'إعلان', en: 'Announcement', icon: '📢', color: '#FF9100' },
};

const CHANNELS = {
  whatsapp: { ar: 'واتساب', en: 'WhatsApp', icon: '💬' },
  sms: { ar: 'رسائل SMS', en: 'SMS', icon: '📱' },
  email: { ar: 'بريد إلكتروني', en: 'Email', icon: '📧' },
  push: { ar: 'إشعارات', en: 'Push', icon: '🔔' },
};

export default function CampaignsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [campaigns, setCampaigns] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');

  const [form, setForm] = useState({
    name: '', type: 'offer', channel: 'whatsapp', message: '',
    target: 'all', scheduledDate: '', isAutomation: false,
    triggerEvent: 'renewal_due', triggerDays: 3,
  });

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data: camps } = await getTenantDocuments(tenantId, 'campaigns', [],
        { field: 'createdAt', direction: 'desc' });
      const { data: autos } = await getTenantDocuments(tenantId, 'automations', [],
        { field: 'createdAt', direction: 'desc' });
      setCampaigns(camps || []);
      setAutomations(autos || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.name || !form.message) return;
    try {
      const collection = form.isAutomation ? 'automations' : 'campaigns';
      await addTenantDocument(tenantId, collection, {
        ...form,
        status: form.isAutomation ? 'active' : 'draft',
        sentCount: 0, openRate: 0, clickRate: 0,
        scheduledDate: form.scheduledDate ? Timestamp.fromDate(new Date(form.scheduledDate)) : null,
      });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ name: '', type: 'offer', channel: 'whatsapp', message: '', target: 'all', scheduledDate: '', isAutomation: false, triggerEvent: 'renewal_due', triggerDays: 3 });
      loadData();
    } catch (err) { toast.error(t('common.error')); }
  };

  const toggleAutomation = async (auto) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'automations', auto.id, { status: auto.status === 'active' ? 'paused' : 'active' });
    loadData();
  };

  const deleteCampaign = async (id, isAuto) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, isAuto ? 'automations' : 'campaigns', id);
    toast.success(t('common.success'));
    loadData();
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📢</span> {t('sidebar.campaigns')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {isAr ? 'حملة جديدة' : 'New Campaign'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📢</div>
          <div className="stat-info">
            <div className="stat-value">{campaigns.length}</div>
            <div className="stat-label">{isAr ? 'حملات' : 'Campaigns'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">⚡</div>
          <div className="stat-info">
            <div className="stat-value">{automations.filter(a => a.status === 'active').length}</div>
            <div className="stat-label">{isAr ? 'أتمتة نشطة' : 'Active Automations'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📨</div>
          <div className="stat-info">
            <div className="stat-value">{campaigns.reduce((s, c) => s + (c.sentCount || 0), 0)}</div>
            <div className="stat-label">{isAr ? 'رسائل مرسلة' : 'Messages Sent'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📊</div>
          <div className="stat-info">
            <div className="stat-value">{campaigns.length > 0 ? `${(campaigns.reduce((s, c) => s + (c.openRate || 0), 0) / Math.max(campaigns.length, 1)).toFixed(0)}%` : '0%'}</div>
            <div className="stat-label">{isAr ? 'معدل الفتح' : 'Open Rate'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-1)' }}>
        {[
          { id: 'campaigns', label: isAr ? '📢 الحملات' : '📢 Campaigns' },
          { id: 'automations', label: isAr ? '⚡ الأتمتة' : '⚡ Automations' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: 'var(--space-2) var(--space-4)', background: activeTab === tab.id ? 'var(--pt-gold-glow)' : 'transparent',
            color: activeTab === tab.id ? 'var(--pt-gold)' : 'var(--pt-gray-500)', fontWeight: activeTab === tab.id ? 700 : 400,
            border: 'none', cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid var(--pt-gold)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', fontSize: 'var(--font-size-sm)',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : activeTab === 'campaigns' ? (
        campaigns.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📢</div>
            <h3>{isAr ? 'لا توجد حملات' : 'No campaigns yet'}</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {campaigns.map(camp => {
              const typeInfo = CAMPAIGN_TYPES[camp.type] || CAMPAIGN_TYPES.offer;
              const channelInfo = CHANNELS[camp.channel] || CHANNELS.whatsapp;
              return (
                <div key={camp.id} className="card" style={{ borderTop: `3px solid ${typeInfo.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-md)' }}>{camp.name}</h3>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                        <span className="badge badge-gold" style={{ fontSize: '9px' }}>{typeInfo.icon} {typeInfo[locale]}</span>
                        <span className="badge badge-info" style={{ fontSize: '9px' }}>{channelInfo.icon} {channelInfo[locale]}</span>
                      </div>
                    </div>
                    <span className={`badge ${camp.status === 'sent' ? 'badge-success' : camp.status === 'draft' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                      {camp.status === 'sent' ? (isAr ? '✅ مرسلة' : '✅ Sent') : camp.status === 'scheduled' ? (isAr ? '📅 مجدولة' : '📅 Scheduled') : (isAr ? '📝 مسودة' : '📝 Draft')}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', lineHeight: 1.5, marginBottom: 'var(--space-3)', maxHeight: 60, overflow: 'hidden' }}>
                    {camp.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-2)' }}>
                    <span>📨 {camp.sentCount || 0} {isAr ? 'مرسلة' : 'sent'}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteCampaign(camp.id, false)} style={{ color: 'var(--pt-danger)', padding: '2px 8px' }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        automations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⚡</div>
            <h3>{isAr ? 'لا توجد أتمتة' : 'No automations yet'}</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {automations.map(auto => {
              const typeInfo = CAMPAIGN_TYPES[auto.type] || CAMPAIGN_TYPES.renewal;
              return (
                <div key={auto.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderInlineStart: `3px solid ${auto.status === 'active' ? 'var(--pt-success)' : 'var(--pt-gray-600)'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                      <span style={{ fontSize: '1.2rem' }}>{typeInfo.icon}</span>
                      <h3 style={{ fontSize: 'var(--font-size-md)' }}>{auto.name}</h3>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                      {auto.triggerEvent === 'renewal_due' ? (isAr ? `قبل انتهاء الاشتراك بـ ${auto.triggerDays} أيام` : `${auto.triggerDays} days before expiry`) :
                       auto.triggerEvent === 'birthday' ? (isAr ? 'يوم عيد الميلاد' : 'On birthday') :
                       auto.triggerEvent === 'inactive' ? (isAr ? `بعد ${auto.triggerDays} أيام عدم نشاط` : `After ${auto.triggerDays} days inactive`) :
                       (isAr ? 'عند التسجيل' : 'On registration')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button onClick={() => toggleAutomation(auto)} style={{
                      width: 48, height: 26, borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                      background: auto.status === 'active' ? 'var(--pt-success)' : 'var(--pt-gray-700)',
                      position: 'relative', transition: 'background 0.3s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 'var(--radius-full)', background: 'white',
                        position: 'absolute', top: 3, transition: 'transform 0.3s',
                        transform: auto.status === 'active' ? (isAr ? 'translateX(-24px)' : 'translateX(24px)') : 'translateX(3px)',
                        insetInlineStart: 0,
                      }} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteCampaign(auto.id, true)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2>📢 {isAr ? 'حملة جديدة' : 'New Campaign'}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <button className={`btn btn-sm ${!form.isAutomation ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setForm(f => ({ ...f, isAutomation: false }))}>📢 {isAr ? 'حملة' : 'Campaign'}</button>
                <button className={`btn btn-sm ${form.isAutomation ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setForm(f => ({ ...f, isAutomation: true }))}>⚡ {isAr ? 'أتمتة' : 'Automation'}</button>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم الحملة' : 'Campaign Name'} *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('common.type')}</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'القناة' : 'Channel'}</label>
                  <select className="form-select" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {Object.entries(CHANNELS).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[locale]}</option>))}
                  </select>
                </div>
              </div>
              {form.isAutomation && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'حدث التشغيل' : 'Trigger Event'}</label>
                    <select className="form-select" value={form.triggerEvent} onChange={e => setForm(f => ({ ...f, triggerEvent: e.target.value }))}>
                      <option value="renewal_due">{isAr ? '🔄 قبل انتهاء الاشتراك' : '🔄 Before Expiry'}</option>
                      <option value="birthday">{isAr ? '🎂 عيد ميلاد' : '🎂 Birthday'}</option>
                      <option value="inactive">{isAr ? '💤 عدم نشاط' : '💤 Inactive'}</option>
                      <option value="registration">{isAr ? '👋 تسجيل جديد' : '👋 New Registration'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'أيام' : 'Days'}</label>
                    <input className="form-input" type="number" dir="ltr" value={form.triggerDays} onChange={e => setForm(f => ({ ...f, triggerDays: Number(e.target.value) }))} min={1} />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{isAr ? 'الرسالة' : 'Message'} *</label>
                <textarea className="form-input" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={isAr ? 'اكتب نص الرسالة...' : 'Write message...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name || !form.message}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
