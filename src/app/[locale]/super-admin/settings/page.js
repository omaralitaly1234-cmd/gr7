'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function SuperAdminSettings() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⚙️</span> {locale === 'ar' ? 'إعدادات المنصة' : 'Platform Settings'}</h1>
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Platform Info */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
            🏢 {locale === 'ar' ? 'بيانات المنصة' : 'Platform Info'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'اسم المنصة' : 'Platform Name'}</label>
              <input className="form-input" defaultValue="Power Time" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'الوصف' : 'Description'}</label>
              <input className="form-input" defaultValue={locale === 'ar' ? 'أكتر من مجرد جيم' : 'More than a Gym'} />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'إيميل الدعم' : 'Support Email'}</label>
              <input className="form-input" type="email" defaultValue="support@powertime.com" dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}</label>
              <input className="form-input" type="tel" defaultValue="01000000000" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Trial Settings */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
            🎁 {locale === 'ar' ? 'إعدادات الفترة التجريبية' : 'Trial Settings'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'مدة التجربة (أيام)' : 'Trial Duration (days)'}</label>
              <input className="form-input" type="number" defaultValue="90" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'حد الأعضاء في التجربة' : 'Trial Max Members'}</label>
              <input className="form-input" type="number" defaultValue="100" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'حد المدربين في التجربة' : 'Trial Max Trainers'}</label>
              <input className="form-input" type="number" defaultValue="3" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'تنبيه قبل الانتهاء (أيام)' : 'Expiry Reminder (days)'}</label>
              <select className="form-select" defaultValue="7">
                <option value="3">3</option>
                <option value="7">7</option>
                <option value="14">14</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-5)' }}>
            🔔 {locale === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
          </h3>
          {[
            { label: locale === 'ar' ? 'إشعار عند تسجيل جيم جديد' : 'New gym registration notification', defaultChecked: true },
            { label: locale === 'ar' ? 'إشعار عند اقتراب انتهاء التجربة' : 'Trial expiry warning', defaultChecked: true },
            { label: locale === 'ar' ? 'إشعار عند استلام دفعة' : 'Payment received notification', defaultChecked: true },
            { label: locale === 'ar' ? 'تقرير أسبوعي بالإيرادات' : 'Weekly revenue report', defaultChecked: false },
          ].map((n, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)', background: 'var(--pt-darker)',
              borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)',
            }}>
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{n.label}</span>
              <label style={{
                position: 'relative', width: 44, height: 24, cursor: 'pointer',
              }}>
                <input type="checkbox" defaultChecked={n.defaultChecked} style={{
                  position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer',
                }} />
                <span style={{
                  display: 'block', width: 44, height: 24, borderRadius: 12,
                  background: n.defaultChecked ? 'var(--pt-gold)' : 'var(--pt-gray-700)', transition: 'background 0.2s',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: 3, left: n.defaultChecked ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', boxShadow: 'var(--shadow-sm)',
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            ✓ {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
          </button>
          {saved && (
            <span className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', color: 'var(--pt-success)', fontSize: 'var(--font-size-sm)' }}>
              ✅ {locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
