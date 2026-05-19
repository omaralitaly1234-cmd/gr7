'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { updateTenantDocument } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ClientProfilePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading, tenantId } = useMemberData();
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (memberData) {
      setForm({
        nameAr: memberData.fullName?.ar || '',
        nameEn: memberData.fullName?.en || '',
        email: memberData.email || user?.email || '',
        phone: memberData.phone || '',
        dob: memberData.dateOfBirth || '',
        gender: memberData.gender || 'male',
        address: memberData.address || '',
        emergencyPhone: memberData.emergencyContact?.phone || '',
        emergencyName: memberData.emergencyContact?.name || '',
        bloodType: memberData.bloodType || '',
        height: memberData.height || '',
        weight: memberData.weight || '',
        fitnessGoal: memberData.fitnessGoal || 'fitness',
        medicalNotes: memberData.medicalNotes || '',
        notifications: { email: true, sms: true, whatsapp: true, push: false },
        language: locale,
        theme: 'dark',
      });
    }
  }, [memberData, user, locale]);

  const update = (key, val) => setForm({ ...form, [key]: val });

  const handleSave = async () => {
    if (!tenantId || !memberData?.id || !form) return;
    try {
      await updateTenantDocument(tenantId, 'members', memberData.id, {
        fullName: { ar: form.nameAr, en: form.nameEn },
        phone: form.phone,
        address: form.address,
        dateOfBirth: form.dob,
        bloodType: form.bloodType,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        fitnessGoal: form.fitnessGoal,
        medicalNotes: form.medicalNotes,
        emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone },
      });
      setSaved(true);
      toast.success(isAr ? 'تم الحفظ بنجاح' : 'Saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Error saving');
    }
  };

  const tabs = [
    { id: 'personal', label: isAr ? 'البيانات الشخصية' : 'Personal Info', icon: '👤' },
    { id: 'health', label: isAr ? 'البيانات الصحية' : 'Health Info', icon: '🏥' },
    { id: 'preferences', label: isAr ? 'التفضيلات' : 'Preferences', icon: '⚙️' },
    { id: 'security', label: isAr ? 'الأمان' : 'Security', icon: '🔒' },
  ];

  if (loading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  if (!form) return (<div className="animate-fadeIn"><div className="page-header"><h1><span>👤</span> {isAr ? 'الملف الشخصي' : 'My Profile'}</h1></div><div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div><p style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'لم يتم العثور على بيانات' : 'No data found'}</p></div></div>);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👤</span> {isAr ? 'الملف الشخصي' : 'My Profile'}</h1>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✓ ' + (isAr ? 'تم الحفظ!' : 'Saved!') : '💾 ' + t('common.save')}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, flexShrink: 0 }}>
          {(form.nameAr || '?').charAt(0)}
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{form.nameAr || form.nameEn}</h2>
          <div style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>{form.email}</div>
          <div style={{ color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{memberData?.membershipNumber || '-'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-2)' }}>
        {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{tab.icon} {tab.label}</button>))}
      </div>

      {activeTab === 'personal' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>👤 {isAr ? 'البيانات الشخصية' : 'Personal Information'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group"><label className="form-label">{isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}</label><input className="form-input" value={form.nameAr} onChange={e => update('nameAr', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}</label><input className="form-input" value={form.nameEn} onChange={e => update('nameEn', e.target.value)} dir="ltr" /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label><input className="form-input" type="email" value={form.email} readOnly dir="ltr" style={{ opacity: 0.6 }} /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'رقم الهاتف' : 'Phone'}</label><input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} dir="ltr" /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'تاريخ الميلاد' : 'DOB'}</label><input className="form-input" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} dir="ltr" /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'العنوان' : 'Address'}</label><input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'اسم الطوارئ' : 'Emergency Name'}</label><input className="form-input" value={form.emergencyName} onChange={e => update('emergencyName', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'رقم الطوارئ' : 'Emergency Phone'}</label><input className="form-input" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} dir="ltr" /></div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🏥 {isAr ? 'البيانات الصحية' : 'Health Info'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group"><label className="form-label">{isAr ? 'الطول (سم)' : 'Height (cm)'}</label><input className="form-input" type="number" value={form.height} onChange={e => update('height', e.target.value)} dir="ltr" /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</label><input className="form-input" type="number" value={form.weight} onChange={e => update('weight', e.target.value)} dir="ltr" /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'فصيلة الدم' : 'Blood Type'}</label><select className="form-select" value={form.bloodType} onChange={e => update('bloodType', e.target.value)}><option value="">{t('common.select')}</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}</select></div>
            <div className="form-group"><label className="form-label">{isAr ? 'هدف اللياقة' : 'Fitness Goal'}</label><select className="form-select" value={form.fitnessGoal} onChange={e => update('fitnessGoal', e.target.value)}><option value="muscle_gain">{t('members.goals.muscle_gain')}</option><option value="weight_loss">{t('members.goals.weight_loss')}</option><option value="fitness">{t('members.goals.fitness')}</option><option value="rehabilitation">{t('members.goals.rehabilitation')}</option></select></div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">{isAr ? 'ملاحظات طبية' : 'Medical Notes'}</label><textarea className="form-input" rows={3} value={form.medicalNotes} onChange={e => update('medicalNotes', e.target.value)} style={{ resize: 'vertical' }} /></div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>⚙️ {isAr ? 'التفضيلات' : 'Preferences'}</h3>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h4 style={{ marginBottom: 'var(--space-3)' }}>🔔 {isAr ? 'الإشعارات' : 'Notifications'}</h4>
            {[{ key: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email', icon: '📧' }, { key: 'sms', label: 'SMS', icon: '📱' }, { key: 'whatsapp', label: 'WhatsApp', icon: '💬' }, { key: 'push', label: isAr ? 'إشعارات الهاتف' : 'Push Notifications', icon: '🔔' }].map(n => (
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
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>🔒 {isAr ? 'الأمان' : 'Security'}</h3>
          <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group"><label className="form-label">{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</label><input className="form-input" type="password" dir="ltr" placeholder="••••••••" /></div>
            <div />
            <div className="form-group"><label className="form-label">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label><input className="form-input" type="password" dir="ltr" /></div>
            <div className="form-group"><label className="form-label">{isAr ? 'تأكيد كلمة المرور' : 'Confirm'}</label><input className="form-input" type="password" dir="ltr" /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>🔑 {isAr ? 'تغيير كلمة المرور' : 'Change Password'}</button>
        </div>
      )}
    </div>
  );
}
