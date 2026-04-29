'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ClientProfilePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [activeTab, setActiveTab] = useState('personal');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    nameAr: 'أحمد محمد سعيد',
    nameEn: 'Ahmed Mohamed Said',
    email: 'ahmed.said@email.com',
    phone: '01012345678',
    dob: '1998-05-15',
    gender: 'male',
    address: locale === 'ar' ? 'المعادي، القاهرة' : 'Maadi, Cairo',
    emergencyPhone: '01198765432',
    bloodType: 'A+',
    height: 178, weight: 92,
    fitnessGoal: locale === 'ar' ? 'خسارة وزن + بناء عضلات' : 'Weight Loss + Muscle Building',
    medicalNotes: locale === 'ar' ? 'إصابة سابقة في أسفل الظهر' : 'Previous lower back injury',
    notifications: { email: true, sms: true, whatsapp: true, push: false },
    language: locale,
    theme: 'dark',
  });

  const update = (key, val) => setForm({ ...form, [key]: val });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'personal', label: locale === 'ar' ? 'البيانات الشخصية' : 'Personal Info', icon: '👤' },
    { id: 'health', label: locale === 'ar' ? 'البيانات الصحية' : 'Health Info', icon: '🏥' },
    { id: 'preferences', label: locale === 'ar' ? 'التفضيلات' : 'Preferences', icon: '⚙️' },
    { id: 'security', label: locale === 'ar' ? 'الأمان' : 'Security', icon: '🔒' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👤</span> {locale === 'ar' ? 'الملف الشخصي' : 'My Profile'}</h1>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✓ ' + (locale === 'ar' ? 'تم الحفظ!' : 'Saved!') : '💾 ' + t('common.save')}
        </button>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, flexShrink: 0, position: 'relative' }}>
          أ
          <button style={{ position: 'absolute', bottom: 0, insetInlineEnd: 0, width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'var(--pt-gold)', color: 'var(--pt-black)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📷</button>
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{form.nameAr}</h2>
          <div style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>{form.email}</div>
          <div style={{ color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>PT-2026-0001</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-2)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeTab === 'personal' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>👤 {locale === 'ar' ? 'البيانات الشخصية' : 'Personal Information'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
              <input className="form-input" value={form.nameAr} onChange={e => update('nameAr', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
              <input className="form-input" value={form.nameEn} onChange={e => update('nameEn', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
              <input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'تاريخ الميلاد' : 'DOB'}</label>
              <input className="form-input" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'العنوان' : 'Address'}</label>
              <input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'رقم الطوارئ' : 'Emergency Phone'}</label>
              <input className="form-input" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} dir="ltr" />
            </div>
          </div>
        </div>
      )}

      {/* Health Info */}
      {activeTab === 'health' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🏥 {locale === 'ar' ? 'البيانات الصحية' : 'Health Info'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'الطول (سم)' : 'Height (cm)'}</label>
              <input className="form-input" type="number" value={form.height} onChange={e => update('height', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
              <input className="form-input" type="number" value={form.weight} onChange={e => update('weight', e.target.value)} dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'فصيلة الدم' : 'Blood Type'}</label>
              <select className="form-select" value={form.bloodType} onChange={e => update('bloodType', e.target.value)}>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'هدف اللياقة' : 'Fitness Goal'}</label>
              <select className="form-select" value={form.fitnessGoal} onChange={e => update('fitnessGoal', e.target.value)}>
                <option>{locale === 'ar' ? 'خسارة وزن' : 'Weight Loss'}</option>
                <option>{locale === 'ar' ? 'تضخيم' : 'Bulking'}</option>
                <option>{locale === 'ar' ? 'تنشيف' : 'Cutting'}</option>
                <option>{locale === 'ar' ? 'لياقة عامة' : 'General Fitness'}</option>
                <option>{locale === 'ar' ? 'خسارة وزن + بناء عضلات' : 'Weight Loss + Muscle Building'}</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">{locale === 'ar' ? 'ملاحظات طبية' : 'Medical Notes'}</label>
              <textarea className="form-input" rows={3} value={form.medicalNotes} onChange={e => update('medicalNotes', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {activeTab === 'preferences' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>⚙️ {locale === 'ar' ? 'التفضيلات' : 'Preferences'}</h3>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h4 style={{ marginBottom: 'var(--space-3)' }}>🔔 {locale === 'ar' ? 'الإشعارات' : 'Notifications'}</h4>
            {[
              { key: 'email', label: locale === 'ar' ? 'البريد الإلكتروني' : 'Email', icon: '📧' },
              { key: 'sms', label: 'SMS', icon: '📱' },
              { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
              { key: 'push', label: locale === 'ar' ? 'إشعارات الهاتف' : 'Push Notifications', icon: '🔔' },
            ].map(n => (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                <span>{n.icon} {n.label}</span>
                <label style={{ position: 'relative', width: 48, height: 26, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.notifications[n.key]} onChange={e => setForm({...form, notifications: {...form.notifications, [n.key]: e.target.checked}})} style={{ opacity: 0, position: 'absolute' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 13, background: form.notifications[n.key] ? 'var(--pt-gold)' : 'var(--pt-gray-700)', transition: 'all 0.3s' }}>
                    <div style={{ position: 'absolute', top: 3, left: form.notifications[n.key] ? 24 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
                  </div>
                </label>
              </div>
            ))}
          </div>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'اللغة' : 'Language'}</label>
              <select className="form-select" value={form.language} onChange={e => update('language', e.target.value)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'المظهر' : 'Theme'}</label>
              <select className="form-select" value={form.theme} onChange={e => update('theme', e.target.value)}>
                <option value="dark">{locale === 'ar' ? 'داكن' : 'Dark'}</option>
                <option value="light">{locale === 'ar' ? 'فاتح' : 'Light'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🔒 {locale === 'ar' ? 'الأمان' : 'Security'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
              <input className="form-input" type="password" dir="ltr" placeholder="••••••••" />
            </div>
            <div />
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <input className="form-input" type="password" dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm'}</label>
              <input className="form-input" type="password" dir="ltr" />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>🔑 {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</button>

          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(255,82,82,0.05)', border: '1px solid rgba(255,82,82,0.15)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ color: 'var(--pt-danger)', marginBottom: 'var(--space-2)' }}>⚠️ {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-3)' }}>
              {locale === 'ar' ? 'حذف الحساب نهائي ولا يمكن التراجع عنه.' : 'Account deletion is permanent and cannot be undone.'}
            </p>
            <button className="btn btn-sm" style={{ background: 'rgba(255,82,82,0.1)', color: 'var(--pt-danger)', border: '1px solid rgba(255,82,82,0.3)' }}>
              🗑️ {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
