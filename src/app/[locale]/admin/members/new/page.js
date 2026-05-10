'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { addTenantDocument, getTenantCollectionCount, setDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const MEMBERSHIP_PLANS = [
  { id: 'gold-monthly', name: { ar: 'ذهبي — شهري', en: 'Gold — Monthly' }, type: 'gold', duration: 30, price: 900, sessions: null },
  { id: 'gold-quarterly', name: { ar: 'ذهبي — ربع سنوي', en: 'Gold — Quarterly' }, type: 'gold', duration: 90, price: 2400, sessions: null },
  { id: 'gold-semi', name: { ar: 'ذهبي — نصف سنوي', en: 'Gold — Semi-Annual' }, type: 'gold', duration: 180, price: 4200, sessions: null },
  { id: 'gold-annual', name: { ar: 'ذهبي — سنوي', en: 'Gold — Annual' }, type: 'gold', duration: 365, price: 7200, sessions: null },
  { id: 'gold-12sessions', name: { ar: 'ذهبي — 12 حصة', en: 'Gold — 12 Sessions' }, type: 'gold', duration: 30, price: 600, sessions: 12 },
  { id: 'diamond-quarterly', name: { ar: 'ماسي — ربع سنوي', en: 'Diamond — Quarterly' }, type: 'diamond', duration: 90, price: 4500, sessions: null },
  { id: 'diamond-semi', name: { ar: 'ماسي — نصف سنوي', en: 'Diamond — Semi-Annual' }, type: 'diamond', duration: 180, price: 8000, sessions: null },
  { id: 'diamond-annual', name: { ar: 'ماسي — سنوي', en: 'Diamond — Annual' }, type: 'diamond', duration: 365, price: 14000, sessions: null },
];

export default function NewMemberPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullNameAr: '', fullNameEn: '',
    phone: '', whatsapp: '', email: '',
    gender: 'male', dateOfBirth: '',
    nationalId: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    height: '', weight: '', bloodType: '',
    medicalNotes: '', fitnessGoal: 'fitness',
    selectedPlan: '', paymentMethod: 'cash',
    discount: 0, notes: '',
    createAccount: false, accountEmail: '', accountPassword: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedPlan = MEMBERSHIP_PLANS.find(p => p.id === formData.selectedPlan);

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const discountAmount = (selectedPlan.price * formData.discount) / 100;
    return selectedPlan.price - discountAmount;
  };

  const generateMemberNumber = async () => {
    const year = new Date().getFullYear();
    try {
      const { count } = await getTenantCollectionCount(tenantId, 'members');
      return `PT-${year}-${String(count + 1).padStart(4, '0')}`;
    } catch {
      return `PT-${year}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    }
  };

  const handleSubmit = async () => {
    if (!tenantId) {
      toast.error(isAr ? 'خطأ في بيانات الجيم' : 'Gym data error');
      return;
    }
    if (formData.createAccount && (!formData.accountEmail || !formData.accountPassword)) {
      toast.error(isAr ? 'يرجى إدخال البريد وكلمة المرور لإنشاء حساب' : 'Email & password required for account');
      return;
    }
    if (formData.createAccount && formData.accountPassword.length < 6) {
      toast.error(isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'Password min 6 chars');
      return;
    }

    setLoading(true);
    try {
      const memberNumber = await generateMemberNumber();
      const now = new Date();
      const plan = selectedPlan;
      const endDate = new Date(now);
      if (plan) endDate.setDate(endDate.getDate() + plan.duration);

      let memberUid = null;

      // Create Firebase Auth account if requested
      if (formData.createAccount && formData.accountEmail && formData.accountPassword) {
        const { initializeApp, deleteApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const fbConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        };
        const secondaryApp = initializeApp(fbConfig, 'memberCreator_' + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        try {
          const displayName = formData.fullNameAr;
          const cred = await createUserWithEmailAndPassword(secondaryAuth, formData.accountEmail, formData.accountPassword);
          memberUid = cred.user.uid;
          await updateProfile(cred.user, { displayName });
          await secondaryAuth.signOut();
          await setDocument('users', memberUid, {
            uid: memberUid, email: formData.accountEmail, phone: formData.phone || '',
            displayName, role: 'member', lang: 'ar', avatar: '', isActive: true,
            tenantId, superAdmin: false, tenantRole: 'member', fcmTokens: [],
          }, false);
        } finally {
          try { await deleteApp(secondaryApp); } catch {}
        }
      }

      const memberData = {
        fullName: { ar: formData.fullNameAr, en: formData.fullNameEn || formData.fullNameAr },
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        email: formData.accountEmail || formData.email,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        nationalId: formData.nationalId,
        address: formData.address,
        photo: '',
        emergencyContact: { name: formData.emergencyName, phone: formData.emergencyPhone, relation: formData.emergencyRelation },
        membershipNumber: memberNumber,
        qrCode: memberNumber,
        joinDate: Timestamp.fromDate(now),
        status: 'active',
        uid: memberUid,
        currentPlan: plan ? { planId: plan.id, planName: plan.name[locale], type: plan.type, endDate: Timestamp.fromDate(endDate) } : null,
        planName: plan ? plan.name[locale] : '',
        endDate: plan ? endDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : '',
        assignedTrainer: null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        bloodType: formData.bloodType,
        medicalNotes: formData.medicalNotes,
        fitnessGoal: formData.fitnessGoal,
        totalVisits: 0, lastVisit: null, totalSpent: calculateTotal(), tags: [], notes: formData.notes,
      };

      const { id: memberId, error } = await addTenantDocument(tenantId, 'members', memberData);

      if (error) throw new Error(error);

      // Create subscription record
      if (plan) {
        await addTenantDocument(tenantId, 'subscriptions', {
          memberId,
          planId: plan.id,
          planSnapshot: plan,
          startDate: Timestamp.fromDate(now),
          endDate: Timestamp.fromDate(endDate),
          originalEndDate: Timestamp.fromDate(endDate),
          status: 'active',
          totalSessions: plan.sessions,
          usedSessions: 0,
          remainingSessions: plan.sessions,
          freezeDaysUsed: 0,
          maxFreezeDays: 14,
          currentFreezeStart: null,
          amountPaid: calculateTotal(),
          discountApplied: { percentage: formData.discount, amount: (plan.price * formData.discount) / 100 },
          paymentMethod: formData.paymentMethod,
          invitationsUsed: 0,
          maxInvitations: 2,
          autoRenew: false,
          renewalReminded: false,
          createdBy: 'admin',
        });

        // Create payment record
        await addTenantDocument(tenantId, 'payments', {
          memberId,
          memberName: formData.fullNameAr,
          type: 'subscription',
          referenceId: plan.id,
          amount: plan.price,
          discount: (plan.price * formData.discount) / 100,
          netAmount: calculateTotal(),
          method: formData.paymentMethod,
          status: 'completed',
          notes: isAr ? 'اشتراك جديد' : 'New subscription',
          receivedBy: 'admin',
        });
      }

      toast.success(t('members.memberCreated'));
      router.push(`/${locale}/admin/members`);
    } catch (err) {
      console.error('Error creating member:', err);
      toast.error(isAr ? 'حدث خطأ أثناء إضافة العضو' : 'Error adding member');
    }
    setLoading(false);
  };

  const steps = [
    { num: 1, label: isAr ? 'البيانات الشخصية' : 'Personal Info', icon: '👤' },
    { num: 2, label: isAr ? 'بيانات صحية' : 'Health Info', icon: '🏥' },
    { num: 3, label: isAr ? 'الاشتراك والدفع' : 'Plan & Payment', icon: '💳' },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h1><span>👤</span> {t('members.addMember')}</h1>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          ← {t('common.back')}
        </button>
      </div>

      {/* Stepper */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        marginBottom: 'var(--space-8)', flexWrap: 'wrap',
      }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setStep(s.num)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px', fontWeight: 600,
                fontSize: 'var(--font-size-sm)', border: 'none', cursor: 'pointer',
                transition: 'all 0.3s',
                background: step === s.num ? 'linear-gradient(135deg, var(--pt-gold), var(--pt-gold-dim))' : 'var(--pt-dark)',
                color: step === s.num ? '#0D0D0D' : 'var(--pt-gray-400)',
                boxShadow: step === s.num ? '0 4px 20px rgba(245,197,24,0.2)' : 'none',
              }}
            >
              <span>{s.icon}</span> {s.label}
            </button>
            {i < steps.length - 1 && (
              <span style={{ color: 'var(--pt-gray-700)', fontSize: '0.8rem' }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-lg)' }}>
            👤 {t('members.personalInfo')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.fullNameAr')} *</label>
              <input className="form-input" type="text" value={formData.fullNameAr}
                onChange={e => handleChange('fullNameAr', e.target.value)}
                placeholder={isAr ? 'أحمد محمد سعيد' : 'أحمد محمد سعيد'} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.fullNameEn')}</label>
              <input className="form-input" type="text" dir="ltr" value={formData.fullNameEn}
                onChange={e => handleChange('fullNameEn', e.target.value)}
                placeholder="Ahmed Mohamed Said" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.phone')} *</label>
              <input className="form-input" type="tel" dir="ltr" value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="01234567890" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.whatsapp')}</label>
              <input className="form-input" type="tel" dir="ltr" value={formData.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                placeholder="01234567890" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.email')}</label>
              <input className="form-input" type="email" dir="ltr" value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="ahmed@email.com" />
            </div>
          </div>

          {/* Account Creation Toggle */}
          <div style={{ margin: 'var(--space-4) 0', padding: 'var(--space-4)', background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.15)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.createAccount} onChange={e => handleChange('createAccount', e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--pt-gold)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>🔐 {isAr ? 'إنشاء حساب دخول للعضو' : 'Create login account for member'}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'سيتمكن العضو من الدخول بالبريد وكلمة المرور' : 'Member can log in with email & password'}</div>
              </div>
            </label>
            {formData.createAccount && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'} *</label>
                  <input className="form-input" type="email" dir="ltr" value={formData.accountEmail}
                    onChange={e => handleChange('accountEmail', e.target.value)} placeholder="member@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'كلمة المرور' : 'Password'} *</label>
                  <input className="form-input" type="password" dir="ltr" value={formData.accountPassword}
                    onChange={e => handleChange('accountPassword', e.target.value)} placeholder={isAr ? '6 أحرف على الأقل' : 'Min 6 characters'} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.gender')} *</label>
              <select className="form-select" value={formData.gender}
                onChange={e => handleChange('gender', e.target.value)}>
                <option value="male">{t('common.male')}</option>
                <option value="female">{t('common.female')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.dateOfBirth')}</label>
              <input className="form-input" type="date" dir="ltr" value={formData.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.nationalId')}</label>
              <input className="form-input" type="text" dir="ltr" value={formData.nationalId}
                onChange={e => handleChange('nationalId', e.target.value)}
                placeholder="29901011234567" maxLength={14} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">{t('members.address')}</label>
              <input className="form-input" type="text" value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder={isAr ? 'المنصورة' : 'Mansoura'} />
            </div>
          </div>

          {/* Emergency Contact */}
          <h4 style={{ margin: 'var(--space-6) 0 var(--space-4)', color: 'var(--pt-gray-300)' }}>
            🆘 {t('members.emergencyContact')}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.emergencyName')}</label>
              <input className="form-input" type="text" value={formData.emergencyName}
                onChange={e => handleChange('emergencyName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.emergencyPhone')}</label>
              <input className="form-input" type="tel" dir="ltr" value={formData.emergencyPhone}
                onChange={e => handleChange('emergencyPhone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.emergencyRelation')}</label>
              <input className="form-input" type="text" value={formData.emergencyRelation}
                onChange={e => handleChange('emergencyRelation', e.target.value)}
                placeholder={isAr ? 'أب / أخ / صديق' : 'Father / Brother / Friend'} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}
              disabled={!formData.fullNameAr || !formData.phone}>
              {t('common.next')} →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Health Info */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-lg)' }}>
            🏥 {t('members.healthInfo')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.height')}</label>
              <input className="form-input" type="number" dir="ltr" value={formData.height}
                onChange={e => handleChange('height', e.target.value)} placeholder="175" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.weight')}</label>
              <input className="form-input" type="number" dir="ltr" value={formData.weight}
                onChange={e => handleChange('weight', e.target.value)} placeholder="80" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.bloodType')}</label>
              <select className="form-select" value={formData.bloodType}
                onChange={e => handleChange('bloodType', e.target.value)}>
                <option value="">{t('common.select')}</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.fitnessGoal')}</label>
              <select className="form-select" value={formData.fitnessGoal}
                onChange={e => handleChange('fitnessGoal', e.target.value)}>
                <option value="muscle_gain">{t('members.goals.muscle_gain')}</option>
                <option value="weight_loss">{t('members.goals.weight_loss')}</option>
                <option value="fitness">{t('members.goals.fitness')}</option>
                <option value="rehabilitation">{t('members.goals.rehabilitation')}</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
            <label className="form-label">{t('members.medicalNotes')}</label>
            <textarea className="form-input" value={formData.medicalNotes} rows={3}
              onChange={e => handleChange('medicalNotes', e.target.value)}
              placeholder={isAr ? 'أي ملاحظات طبية أو إصابات سابقة...' : 'Any medical notes or previous injuries...'} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← {t('common.back')}</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>{t('common.next')} →</button>
          </div>
        </div>
      )}

      {/* Step 3: Plan & Payment */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-lg)' }}>
            💳 {isAr ? 'الاشتراك والدفع' : 'Plan & Payment'}
          </h3>

          {/* Plan Selection */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>
              {t('members.selectPlan')} *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              {MEMBERSHIP_PLANS.map(plan => (
                <button key={plan.id}
                  onClick={() => handleChange('selectedPlan', plan.id)}
                  style={{
                    padding: 'var(--space-4)',  borderRadius: 'var(--radius-md)',
                    border: formData.selectedPlan === plan.id ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)',
                    background: formData.selectedPlan === plan.id ? 'var(--pt-gold-glow)' : 'var(--pt-darker)',
                    cursor: 'pointer', textAlign: isAr ? 'right' : 'left', transition: 'all 0.2s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge ${plan.type === 'diamond' ? 'badge-diamond' : 'badge-gold'}`}
                      style={{ fontSize: '10px' }}>
                      {plan.type === 'diamond' ? '💎' : '🥇'} {plan.type === 'diamond' ? (isAr ? 'ماسي' : 'Diamond') : (isAr ? 'ذهبي' : 'Gold')}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', marginBottom: '2px' }}>
                    {plan.name[locale]}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--pt-gold)', fontSize: 'var(--font-size-lg)' }}>
                    {plan.price.toLocaleString()} <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{t('common.egp')}</span>
                  </div>
                  {plan.sessions && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-info)', marginTop: '2px' }}>
                      📊 {plan.sessions} {t('subscriptions.sessions')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('finance.paymentMethod')}</label>
              <select className="form-select" value={formData.paymentMethod}
                onChange={e => handleChange('paymentMethod', e.target.value)}>
                <option value="cash">{t('finance.cash')} 💵</option>
                <option value="visa">{t('finance.visa')} 💳</option>
                <option value="bank_transfer">{t('finance.bankTransfer')} 🏦</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('finance.discount')} (%)</label>
              <input className="form-input" type="number" dir="ltr" value={formData.discount}
                onChange={e => handleChange('discount', Math.min(100, Math.max(0, Number(e.target.value))))}
                min={0} max={100} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('common.notes')}</label>
            <textarea className="form-input" value={formData.notes} rows={2}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'} />
          </div>

          {/* Payment Summary */}
          {selectedPlan && (
            <div style={{
              background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)', marginTop: 'var(--space-4)',
              border: '1px solid rgba(245,197,24,0.15)',
            }}>
              <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--pt-gold)' }}>
                📄 {isAr ? 'ملخص الدفع' : 'Payment Summary'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span style={{ color: 'var(--pt-gray-400)' }}>{selectedPlan.name[locale]}</span>
                  <span>{selectedPlan.price.toLocaleString()} {t('common.egp')}</span>
                </div>
                {formData.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--pt-success)' }}>
                    <span>{t('finance.discount')} ({formData.discount}%)</span>
                    <span>-{((selectedPlan.price * formData.discount) / 100).toLocaleString()} {t('common.egp')}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>{t('common.total')}</span>
                  <span style={{ fontWeight: 900, color: 'var(--pt-gold)', fontSize: 'var(--font-size-xl)' }}>
                    {calculateTotal().toLocaleString()} {t('common.egp')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← {t('common.back')}</button>
            <button className="btn btn-primary btn-lg" onClick={handleSubmit}
              disabled={loading || !formData.selectedPlan}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
                  {isAr ? 'جاري الحفظ...' : 'Saving...'}
                </span>
              ) : (
                <>✅ {t('common.save')} — {isAr ? 'إضافة العضو' : 'Add Member'}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
