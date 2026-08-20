'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { authPost } from '@/lib/authenticated-fetch';
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
  const [sec, setSec] = useState({ current: '', email: '', next: '', confirm: '' });
  const [savingAccount, setSavingAccount] = useState(false);
  const updateSec = (key, val) => setSec(prev => ({ ...prev, [key]: val }));

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

  // Prefill the email field with whatever the account currently signs in with.
  useEffect(() => {
    if (user?.email) setSec(prev => (prev.email ? prev : { ...prev, email: user.email }));
  }, [user?.email]);

  const update = (key, val) => setForm({ ...form, [key]: val });

  // Email/password changes go through Firebase Auth, not the profile document.
  // We re-authenticate first (which also refreshes the ID token, and the API
  // route rejects the request if that token's auth_time is stale), then let the
  // server apply the change and mirror it onto the member record the admin
  // panel reads.
  const handleAccountUpdate = async () => {
    if (savingAccount) return;
    const nextEmail = sec.email.trim().toLowerCase();
    const currentEmail = (user?.email || '').toLowerCase();
    const emailChanged = nextEmail && nextEmail !== currentEmail;
    const passwordChanged = sec.next.length > 0;

    if (!sec.current) {
      toast.error(isAr ? 'أدخل كلمة المرور الحالية' : 'Enter your current password');
      return;
    }
    if (!emailChanged && !passwordChanged) {
      toast.error(isAr ? 'مفيش حاجة اتغيّرت' : 'Nothing to change');
      return;
    }
    if (passwordChanged && sec.next !== sec.confirm) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (passwordChanged && sec.next.length < 6) {
      toast.error(isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setSavingAccount(true);
    try {
      const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      try {
        await reauthenticateWithCredential(
          user,
          EmailAuthProvider.credential(user.email, sec.current),
        );
      } catch (err) {
        const wrongPassword = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(err.code);
        toast.error(wrongPassword
          ? (isAr ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect')
          : (isAr ? 'تعذّر التحقق من كلمة المرور' : 'Could not verify your password'));
        setSavingAccount(false);
        return;
      }

      // Fresh token carrying the new auth_time the API route checks.
      await user.getIdToken(true);

      const res = await authPost('/api/member/account', {
        newEmail: emailChanged ? nextEmail : undefined,
        newPassword: passwordChanged ? sec.next : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.message || (isAr ? 'تعذّر حفظ إعدادات الحساب' : 'Could not save account settings'));
        setSavingAccount(false);
        return;
      }

      await user.reload();
      setSec({ current: '', email: emailChanged ? nextEmail : currentEmail, next: '', confirm: '' });
      if (emailChanged) setForm(prev => (prev ? { ...prev, email: nextEmail } : prev));
      toast.success(isAr ? 'تم تحديث بيانات الحساب ✅' : 'Account updated ✅');
    } catch (err) {
      console.error('[AccountUpdate]', err);
      toast.error(isAr ? 'حدث خطأ' : 'Something went wrong');
    }
    setSavingAccount(false);
  };

  const handleSave = async () => {
    if (!tenantId || !memberData?.id || !form) return;
    try {
      const res = await authPost('/api/member/profile', {
        fullName: { ar: form.nameAr, en: form.nameEn },
        phone: form.phone,
        address: form.address,
        dateOfBirth: form.dob,
        bloodType: form.bloodType,
        height: form.height,
        weight: form.weight,
        fitnessGoal: form.fitnessGoal,
        medicalNotes: form.medicalNotes,
        emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone },
      });
      if (!res.ok) throw new Error('save_failed');
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
          <h3 style={{ marginBottom: 'var(--space-2)' }}>🔒 {isAr ? 'إعدادات الحساب' : 'Account settings'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)' }}>
            {isAr
              ? 'غيّر البريد الإلكتروني أو كلمة المرور اللي بتسجّل بيهم الدخول. لازم تدخل كلمة المرور الحالية للتأكيد.'
              : 'Change the email or password you sign in with. Your current password is required to confirm.'}
          </p>

          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">{isAr ? 'كلمة المرور الحالية' : 'Current password'} *</label>
            <input className="form-input" type="password" dir="ltr" autoComplete="current-password"
              value={sec.current} onChange={e => updateSec('current', e.target.value)} placeholder="••••••••" />
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-4)' }}>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className="form-input" type="email" dir="ltr" autoComplete="email"
                value={sec.email} onChange={e => updateSec('email', e.target.value)} />
              <small style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                {isAr ? `البريد الحالي: ${user?.email || '—'}` : `Current: ${user?.email || '—'}`}
              </small>
            </div>

            <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">{isAr ? 'كلمة المرور الجديدة' : 'New password'}</label>
                <input className="form-input" type="password" dir="ltr" autoComplete="new-password"
                  value={sec.next} onChange={e => updateSec('next', e.target.value)}
                  placeholder={isAr ? 'اتركها فاضية لو مش عايز تغيّرها' : 'Leave blank to keep it'} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}</label>
                <input className="form-input" type="password" dir="ltr" autoComplete="new-password"
                  value={sec.confirm} onChange={e => updateSec('confirm', e.target.value)} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}
            onClick={handleAccountUpdate} disabled={savingAccount}>
            {savingAccount ? '⏳' : '🔑'} {isAr ? 'حفظ إعدادات الحساب' : 'Save account settings'}
          </button>
        </div>
      )}
    </div>
  );
}
