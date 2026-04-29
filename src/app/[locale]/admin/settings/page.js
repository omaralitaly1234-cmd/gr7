'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocument, updateTenantDocument, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('gym');
  const [settings, setSettings] = useState({
    gymName: { ar: 'Power Time', en: 'Power Time' },
    gymPhone: '',
    gymAddress: { ar: '', en: '' },
    gymEmail: '',
    whatsappNumber: '',
    menSchedule: { open: '06:00', close: '14:00' },
    womenSchedule: { open: '14:00', close: '22:00' },
    maxCapacity: 100,
    qrAutoCheckout: true,
    autoCheckoutHours: 3,
    enableWhatsapp: false,
    enableSms: false,
    renewalReminderDays: 3,
    birthdayMessage: true,
    currency: 'EGP',
    taxRate: 0,
    invoicePrefix: 'INV',
  });

  useEffect(() => {
    async function loadSettings() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocument(tenantId, 'config', 'settings');
        if (data) setSettings(prev => ({ ...prev, ...data }));
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadSettings();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      await updateTenantDocument(tenantId, 'config', 'settings', settings);
      toast.success(t('common.success'));
    } catch (err) {
      // If document doesn't exist, create it
      try {
        await addTenantDocument(tenantId, 'config', { ...settings, id: 'settings' });
        toast.success(t('common.success'));
      } catch (err2) {
        toast.error(t('common.error'));
      }
    }
    setSaving(false);
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setSettings(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  const tabs = [
    { id: 'gym', label: isAr ? 'بيانات الجيم' : 'Gym Info', icon: '🏢' },
    { id: 'schedule', label: isAr ? 'المواعيد' : 'Schedule', icon: '📅' },
    { id: 'notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: '🔔' },
    { id: 'finance', label: isAr ? 'المالية' : 'Finance', icon: '💰' },
    { id: 'system', label: isAr ? 'النظام' : 'System', icon: '⚙️' },
  ];

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⚙️</span> {t('settings.title')}</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⏳' : '💾'} {t('common.save')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            background: activeTab === tab.id ? 'var(--pt-gold-glow)' : 'transparent',
            color: activeTab === tab.id ? 'var(--pt-gold)' : 'var(--pt-gray-500)',
            fontWeight: activeTab === tab.id ? 700 : 400, fontSize: 'var(--font-size-sm)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            borderBottom: activeTab === tab.id ? '2px solid var(--pt-gold)' : '2px solid transparent',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Gym Info Tab */}
      {activeTab === 'gym' && (
        <div className="card" style={{ maxWidth: 700 }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🏢 {t('settings.gymInfo')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'اسم الجيم (عربي)' : 'Gym Name (Arabic)'}</label>
              <input className="form-input" value={settings.gymName?.ar || ''} onChange={e => handleNestedChange('gymName', 'ar', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'اسم الجيم (إنجليزي)' : 'Gym Name (English)'}</label>
              <input className="form-input" dir="ltr" value={settings.gymName?.en || ''} onChange={e => handleNestedChange('gymName', 'en', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.gymPhone')}</label>
              <input className="form-input" dir="ltr" value={settings.gymPhone} onChange={e => handleChange('gymPhone', e.target.value)} placeholder="01234567890" />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className="form-input" dir="ltr" value={settings.gymEmail} onChange={e => handleChange('gymEmail', e.target.value)} placeholder="info@powertime.com" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">{t('settings.gymAddress')}</label>
              <input className="form-input" value={settings.gymAddress?.[locale] || ''} onChange={e => handleNestedChange('gymAddress', locale, e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'رقم واتساب' : 'WhatsApp Number'}</label>
              <input className="form-input" dir="ltr" value={settings.whatsappNumber} onChange={e => handleChange('whatsappNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الطاقة الاستيعابية' : 'Max Capacity'}</label>
              <input className="form-input" type="number" dir="ltr" value={settings.maxCapacity} onChange={e => handleChange('maxCapacity', Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="card" style={{ maxWidth: 700 }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>📅 {t('settings.operatingHours')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            <div style={{ padding: 'var(--space-4)', background: 'rgba(66,165,245,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(66,165,245,0.2)' }}>
              <h4 style={{ color: 'var(--pt-info)', marginBottom: 'var(--space-3)' }}>♂️ {isAr ? 'فترة الرجال' : "Men's Session"}</h4>
              <div className="form-group">
                <label className="form-label">{isAr ? 'من' : 'From'}</label>
                <input className="form-input" type="time" dir="ltr" value={settings.menSchedule?.open || '06:00'} onChange={e => handleNestedChange('menSchedule', 'open', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'إلى' : 'To'}</label>
                <input className="form-input" type="time" dir="ltr" value={settings.menSchedule?.close || '14:00'} onChange={e => handleNestedChange('menSchedule', 'close', e.target.value)} />
              </div>
            </div>
            <div style={{ padding: 'var(--space-4)', background: 'rgba(233,30,99,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(233,30,99,0.2)' }}>
              <h4 style={{ color: '#EC407A', marginBottom: 'var(--space-3)' }}>♀️ {isAr ? 'فترة السيدات' : "Women's Session"}</h4>
              <div className="form-group">
                <label className="form-label">{isAr ? 'من' : 'From'}</label>
                <input className="form-input" type="time" dir="ltr" value={settings.womenSchedule?.open || '14:00'} onChange={e => handleNestedChange('womenSchedule', 'open', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'إلى' : 'To'}</label>
                <input className="form-input" type="time" dir="ltr" value={settings.womenSchedule?.close || '22:00'} onChange={e => handleNestedChange('womenSchedule', 'close', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ maxWidth: 700 }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🔔 {t('settings.notifications')}</h3>
          {[
            { field: 'enableWhatsapp', label: isAr ? 'تفعيل رسائل واتساب' : 'Enable WhatsApp Messages' },
            { field: 'enableSms', label: isAr ? 'تفعيل رسائل SMS' : 'Enable SMS' },
            { field: 'birthdayMessage', label: isAr ? 'تهنئة أعياد الميلاد' : 'Birthday Greetings' },
          ].map(item => (
            <div key={item.field} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)',
            }}>
              <span style={{ fontWeight: 600 }}>{item.label}</span>
              <button onClick={() => handleChange(item.field, !settings[item.field])} style={{
                width: 52, height: 28, borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                background: settings[item.field] ? 'var(--pt-gold)' : 'var(--pt-gray-700)',
                position: 'relative', transition: 'background 0.3s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 'var(--radius-full)',
                  background: 'white', position: 'absolute', top: 3,
                  transition: 'transform 0.3s',
                  transform: settings[item.field] ? (isAr ? 'translateX(-26px)' : 'translateX(26px)') : 'translateX(3px)',
                  insetInlineStart: 0,
                }} />
              </button>
            </div>
          ))}
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">{isAr ? 'تذكير التجديد قبل (أيام)' : 'Renewal Reminder (days before)'}</label>
            <input className="form-input" type="number" dir="ltr" value={settings.renewalReminderDays} onChange={e => handleChange('renewalReminderDays', Number(e.target.value))} min={1} max={30} />
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="card" style={{ maxWidth: 700 }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>💰 {isAr ? 'إعدادات مالية' : 'Finance Settings'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'العملة' : 'Currency'}</label>
              <select className="form-select" value={settings.currency} onChange={e => handleChange('currency', e.target.value)}>
                <option value="EGP">{isAr ? 'جنيه مصري' : 'Egyptian Pound'} (EGP)</option>
                <option value="USD">USD</option>
                <option value="SAR">{isAr ? 'ريال سعودي' : 'Saudi Riyal'} (SAR)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'نسبة الضريبة %' : 'Tax Rate %'}</label>
              <input className="form-input" type="number" dir="ltr" value={settings.taxRate} onChange={e => handleChange('taxRate', Number(e.target.value))} min={0} max={100} />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'بادئة الفاتورة' : 'Invoice Prefix'}</label>
              <input className="form-input" dir="ltr" value={settings.invoicePrefix} onChange={e => handleChange('invoicePrefix', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="card" style={{ maxWidth: 700 }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>⚙️ {isAr ? 'إعدادات النظام' : 'System Settings'}</h3>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)',
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{isAr ? 'خروج تلقائي من الحضور' : 'Auto Check-out'}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'تسجيل خروج تلقائي بعد فترة محددة' : 'Auto check-out after specified hours'}</div>
            </div>
            <button onClick={() => handleChange('qrAutoCheckout', !settings.qrAutoCheckout)} style={{
              width: 52, height: 28, borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
              background: settings.qrAutoCheckout ? 'var(--pt-gold)' : 'var(--pt-gray-700)',
              position: 'relative', transition: 'background 0.3s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 'var(--radius-full)',
                background: 'white', position: 'absolute', top: 3,
                transition: 'transform 0.3s',
                transform: settings.qrAutoCheckout ? (isAr ? 'translateX(-26px)' : 'translateX(26px)') : 'translateX(3px)',
                insetInlineStart: 0,
              }} />
            </button>
          </div>
          {settings.qrAutoCheckout && (
            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">{isAr ? 'ساعات الخروج التلقائي' : 'Auto Check-out Hours'}</label>
              <input className="form-input" type="number" dir="ltr" value={settings.autoCheckoutHours} onChange={e => handleChange('autoCheckoutHours', Number(e.target.value))} min={1} max={12} />
            </div>
          )}
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
              <strong>Power Time</strong> v1.0.0<br />
              © 2026 Power Time — {isAr ? 'أكتر من مجرد جيم' : 'More than a Gym'} ⚡
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
