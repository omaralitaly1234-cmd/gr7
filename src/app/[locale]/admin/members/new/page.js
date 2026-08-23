'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { addTenantDocument, getTenantCollectionCount, getTenantDocuments, setDocument } from '@/lib/firebase/firestore';
import { nextSequentialNumber } from '@/lib/firebase/counters';
import { logAuditClient } from '@/lib/firebase/audit';
import { useTenant } from '@/context/TenantContext';
import { useMembershipPlans } from '@/lib/hooks/useMembershipPlans';
import { codeErrorMessage } from '@/lib/member-code';
import { checkCodeAvailable } from '@/lib/firebase/member-codes';
import { buildInstallmentSchedule, splitPayment } from '@/lib/installments';
import { parseDateInput, toDateInputValue } from '@/lib/format';
import MemberCodeCard from '@/components/MemberCodeCard';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function NewMemberPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [created, setCreated] = useState(null); // { code, name, planName, endDate }
  const [formData, setFormData] = useState({
    fullNameAr: '', fullNameEn: '',
    phone: '', whatsapp: '', email: '',
    gender: 'male', dateOfBirth: '',
    nationalId: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    height: '', weight: '', bloodType: '',
    medicalNotes: '', fitnessGoal: 'fitness',
    selectedPlan: '', paymentMethod: 'cash',
    // Blank = starts today. The admin can postpone or backdate the start so the
    // member's days are not burned before they actually begin training.
    subscriptionStart: '',
    discount: 0, notes: '',
    createAccount: false, accountEmail: '', accountPassword: '',
    memberCode: '',
    assignedTrainer: '',
    // Instalments
    payFull: true,
    paidNow: '',
    scheduleInstallments: false,
    installmentCount: 2,
    firstDueDate: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { plans: membershipPlans } = useMembershipPlans(tenantId);
  const selectedPlan = membershipPlans.find(p => p.id === formData.selectedPlan);

  // The subscription term. `subscriptionStart` is a plain "YYYY-MM-DD" from a
  // date input, parsed at LOCAL midnight — `new Date('2026-08-24')` would be
  // UTC midnight and shift the whole term by a day west of Greenwich.
  const startDate = parseDateInput(formData.subscriptionStart) || new Date();
  const computedEndDate = (() => {
    if (!selectedPlan) return null;
    const end = new Date(startDate);
    end.setDate(end.getDate() + selectedPlan.duration);
    return end;
  })();

  useEffect(() => {
    async function loadTrainers() {
      if (!tenantId) return;
      try {
        const { data } = await getTenantDocuments(tenantId, 'trainers');
        setTrainers((data || []).filter(tr => tr.status === 'active' || !tr.status));
      } catch (err) { console.error(err); }
    }
    loadTrainers();
  }, [tenantId]);

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const discountAmount = (selectedPlan.price * formData.discount) / 100;
    return selectedPlan.price - discountAmount;
  };

  // "Pay in full" is the default; otherwise the admin types what the member
  // actually handed over now and the rest becomes an outstanding balance.
  const money = splitPayment(
    calculateTotal(),
    formData.payFull ? calculateTotal() : formData.paidNow
  );

  const generateMemberNumber = async () => {
    // Atomic, unique, monotonic membership number (seeded from the current count
    // the first time the counter is created so it won't collide with existing
    // pre-counter members). Replaces the racy count+1 / random fallback.
    const { count } = await getTenantCollectionCount(tenantId, 'members');
    return nextSequentialNumber(tenantId, 'members', 'PT', count || 0);
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
      // The admin may hand out their own code (the number on the member's card);
      // otherwise fall back to the atomic sequential number.
      let memberNumber;
      if (formData.memberCode.trim()) {
        const avail = await checkCodeAvailable(tenantId, formData.memberCode);
        if (!avail.ok) {
          toast.error(codeErrorMessage(avail.error, isAr));
          setLoading(false);
          return;
        }
        memberNumber = avail.code;
      } else {
        memberNumber = await generateMemberNumber();
      }
      const now = new Date();
      const plan = selectedPlan;
      // The term runs from the date the admin picked (today when left blank),
      // NOT from the moment the record is created.
      const start = parseDateInput(formData.subscriptionStart) || now;
      const endDate = new Date(start);
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
        currentPlan: plan ? { planId: plan.planId || plan.id, planName: plan.name[locale], type: plan.type, endDate: Timestamp.fromDate(endDate) } : null,
        planName: plan ? plan.name[locale] : '',
        endDate: plan ? Timestamp.fromDate(endDate) : null, // proper Timestamp (was a lossy locale string)
        assignedTrainer: (() => { const tr = trainers.find(t => t.id === formData.assignedTrainer); return tr ? (tr.uid || formData.assignedTrainer) : null; })(),
        assignedTrainerName: (() => { const tr = trainers.find(t => t.id === formData.assignedTrainer); return tr ? tr.name : null; })(),
        assignedTrainerDocId: formData.assignedTrainer || null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        bloodType: formData.bloodType,
        medicalNotes: formData.medicalNotes,
        fitnessGoal: formData.fitnessGoal,
        totalVisits: 0, lastVisit: null, totalSpent: money.paid, tags: [], notes: formData.notes,
        // Denormalised so the scanner and the members table can warn about a
        // debt without a second read per member.
        balanceDue: money.remaining,
      };

      const { id: memberId, error } = await addTenantDocument(tenantId, 'members', memberData);

      if (error) throw new Error(error);

      // Create subscription record
      if (plan) {
        // Optional dated schedule for whatever is still owed.
        const schedule = (!money.isFullyPaid && formData.scheduleInstallments)
          ? buildInstallmentSchedule(
              money.remaining,
              formData.installmentCount,
              parseDateInput(formData.firstDueDate)?.getTime() ?? Date.now(),
            )
          : [];

        await addTenantDocument(tenantId, 'subscriptions', {
          memberId,
          planId: plan.planId || plan.id,
          planSnapshot: plan,
          startDate: Timestamp.fromDate(start),
          endDate: Timestamp.fromDate(endDate),
          originalEndDate: Timestamp.fromDate(endDate),
          status: 'active',
          totalSessions: plan.sessions,
          usedSessions: 0,
          remainingSessions: plan.sessions,
          freezeDaysUsed: 0,
          maxFreezeDays: 14,
          currentFreezeStart: null,
          // Payment state
          totalAmount: money.total,
          amountPaid: money.paid,
          balanceDue: money.remaining,
          paymentStatus: money.isFullyPaid ? 'paid' : 'partial',
          installments: schedule.map(i => ({ ...i, dueDate: Timestamp.fromMillis(i.dueDate) })),
          discountApplied: { percentage: formData.discount, amount: (plan.price * formData.discount) / 100 },
          paymentMethod: formData.paymentMethod,
          invitationsUsed: 0,
          maxInvitations: 2,
          autoRenew: false,
          renewalReminded: false,
          createdBy: 'admin',
        });

        // Record only what was actually collected. A zero-payment signup still
        // gets no payment row, so revenue reports stay honest.
        if (money.paid > 0) {
          await addTenantDocument(tenantId, 'payments', {
            memberId,
            memberName: formData.fullNameAr,
            type: 'subscription',
            referenceId: plan.planId || plan.id,
            amount: plan.price,
            discount: (plan.price * formData.discount) / 100,
            netAmount: money.paid,
            totalDue: money.total,
            balanceAfter: money.remaining,
            method: formData.paymentMethod,
            status: 'completed',
            notes: money.isFullyPaid
              ? (isAr ? 'اشتراك جديد' : 'New subscription')
              : (isAr ? 'اشتراك جديد — دفعة مقدمة' : 'New subscription — down payment'),
            receivedBy: 'admin',
          });
        }
      }

      logAuditClient({ action: 'create', entity: 'member', entityId: memberId, tenantId, details: { description: { en: `Created member ${memberNumber}`, ar: `إنشاء عضو ${memberNumber}` } } });
      toast.success(t('members.memberCreated'));
      // Show the check-in code instead of redirecting — the admin needs to hand
      // it to the member, and it was previously never displayed anywhere.
      setCreated({
        code: memberNumber,
        name: formData.fullNameAr,
        planName: plan ? plan.name[locale] : '',
        endDate: plan ? endDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '',
      });
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

  // Success view — the member's check-in code, ready to print or copy.
  if (created) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <h1><span>👤</span> {t('members.addMember')}</h1>
        </div>
        <MemberCodeCard
          code={created.code}
          memberName={created.name}
          planName={created.planName}
          endDate={created.endDate}
          isAr={isAr}
        />
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => router.push(`/${locale}/admin/members`)}>
            👥 {isAr ? 'قائمة الأعضاء' : 'Members list'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setCreated(null);
              setStep(1);
              setFormData(prev => ({
                ...prev,
                fullNameAr: '', fullNameEn: '', phone: '', whatsapp: '', email: '',
                dateOfBirth: '', nationalId: '', address: '',
                emergencyName: '', emergencyPhone: '', emergencyRelation: '',
                height: '', weight: '', medicalNotes: '', notes: '',
                selectedPlan: '', discount: 0, subscriptionStart: '',
                createAccount: false, accountEmail: '', accountPassword: '',
                memberCode: '',
                payFull: true, paidNow: '', scheduleInstallments: false,
                installmentCount: 2, firstDueDate: '',
              }));
            }}
          >
            + {isAr ? 'إضافة عضو آخر' : 'Add another member'}
          </button>
        </div>
      </div>
    );
  }

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
              <label className="form-label">{isAr ? 'كود العضو' : 'Member code'}</label>
              <input className="form-input" type="text" dir="ltr" value={formData.memberCode}
                onChange={e => handleChange('memberCode', e.target.value)}
                placeholder={isAr ? 'مثال: 7470 — سيبها فاضية للترقيم التلقائي' : 'e.g. 7470 — leave blank to auto-number'} />
              <small style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                {isAr
                  ? 'ده الكود اللي العضو هيسجّل بيه حضوره على الماسح أو الـ QR.'
                  : 'This is the code the member checks in with at the scanner or QR.'}
              </small>
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

          {/* Assign Trainer */}
          {trainers.length > 0 && (
            <>
              <h4 style={{ margin: 'var(--space-6) 0 var(--space-4)', color: 'var(--pt-gray-300)' }}>
                👨‍🏫 {isAr ? 'تخصيص مدرب' : 'Assign Trainer'}
              </h4>
              <div className="form-group">
                <label className="form-label">{isAr ? 'اختر المدرب المسؤول عن هذا المتدرب' : 'Select trainer responsible for this trainee'}</label>
                <select className="form-select" value={formData.assignedTrainer}
                  onChange={e => handleChange('assignedTrainer', e.target.value)}>
                  <option value="">{isAr ? '— بدون مدرب —' : '— No Trainer —'}</option>
                  {trainers.map(tr => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name?.[locale] || tr.name?.ar} — {tr.specialization || (isAr ? 'عام' : 'General')}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
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
              {membershipPlans.map(plan => (
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

          {/* Subscription start — the admin decides when the days start burning */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'تاريخ بداية الاشتراك' : 'Subscription start date'}</label>
              <input className="form-input" type="date" dir="ltr"
                value={formData.subscriptionStart}
                onChange={e => handleChange('subscriptionStart', e.target.value)} />
              <small style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                {isAr
                  ? 'سيبها فاضية = يبدأ النهاردة. تقدر تأخّره يوم أو أكتر لو العضو هيبدأ بعدين.'
                  : 'Leave blank = starts today. Postpone it if the member starts later.'}
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'تاريخ نهاية الاشتراك' : 'Subscription end date'}</label>
              <div className="form-input" dir="ltr" style={{
                display: 'flex', alignItems: 'center',
                color: computedEndDate ? 'var(--pt-gold)' : 'var(--pt-gray-500)', fontWeight: 700,
              }}>
                {computedEndDate
                  ? `${toDateInputValue(computedEndDate)} (${selectedPlan.duration} ${isAr ? 'يوم' : 'days'})`
                  : (isAr ? 'اختر الباقة الأول' : 'Pick a plan first')}
              </div>
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

          {/* ===== Instalments ===== */}
          {selectedPlan && (
            <div style={{
              margin: 'var(--space-4) 0', padding: 'var(--space-4)',
              background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.18)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
                💰 {isAr ? 'طريقة السداد' : 'Payment terms'}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="payMode" checked={formData.payFull}
                    onChange={() => handleChange('payFull', true)}
                    style={{ accentColor: 'var(--pt-gold)' }} />
                  {isAr ? 'دفع كامل' : 'Pay in full'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="payMode" checked={!formData.payFull}
                    onChange={() => handleChange('payFull', false)}
                    style={{ accentColor: 'var(--pt-gold)' }} />
                  {isAr ? 'تقسيط / دفعة مقدمة' : 'Instalments / down payment'}
                </label>
              </div>

              {!formData.payFull && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'المدفوع الآن' : 'Paid now'}</label>
                      <input className="form-input" type="number" dir="ltr" min={0}
                        max={calculateTotal()} value={formData.paidNow}
                        onChange={e => handleChange('paidNow', e.target.value)}
                        placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'المتبقي' : 'Remaining'}</label>
                      <div className="form-input" style={{
                        display: 'flex', alignItems: 'center',
                        color: money.remaining > 0 ? 'var(--pt-warning)' : 'var(--pt-success)',
                        fontWeight: 800,
                      }} dir="ltr">
                        {money.remaining.toLocaleString()} {t('common.egp')}
                      </div>
                    </div>
                  </div>

                  {money.remaining > 0 && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 'var(--space-3)' }}>
                        <input type="checkbox" checked={formData.scheduleInstallments}
                          onChange={e => handleChange('scheduleInstallments', e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--pt-gold)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>
                          {isAr ? 'جدولة المتبقي على أقساط بتواريخ' : 'Split the balance into dated instalments'}
                        </span>
                      </label>

                      {formData.scheduleInstallments && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                              <label className="form-label">{isAr ? 'عدد الأقساط' : 'Number of instalments'}</label>
                              <input className="form-input" type="number" dir="ltr" min={1} max={24}
                                value={formData.installmentCount}
                                onChange={e => handleChange('installmentCount', Math.max(1, Math.min(24, Number(e.target.value) || 1)))} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">{isAr ? 'تاريخ أول قسط' : 'First due date'}</label>
                              <input className="form-input" type="date" dir="ltr"
                                value={formData.firstDueDate}
                                onChange={e => handleChange('firstDueDate', e.target.value)} />
                            </div>
                          </div>

                          {/* Live preview so the admin sees exactly what will be saved */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'var(--space-2)' }}>
                            {buildInstallmentSchedule(
                              money.remaining,
                              formData.installmentCount,
                              parseDateInput(formData.firstDueDate)?.getTime() ?? Date.now(),
                            ).map(inst => (
                              <div key={inst.number} style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)',
                                padding: '6px 10px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                              }}>
                                <span>{isAr ? `قسط ${inst.number}` : `Instalment ${inst.number}`}</span>
                                <span dir="ltr">
                                  {inst.amount.toLocaleString()} {t('common.egp')} · {new Date(inst.dueDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

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
                    {money.total.toLocaleString()} {t('common.egp')}
                  </span>
                </div>
                {!money.isFullyPaid && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'المدفوع الآن' : 'Paid now'}</span>
                      <span style={{ color: 'var(--pt-success)', fontWeight: 700 }}>
                        {money.paid.toLocaleString()} {t('common.egp')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'المتبقي' : 'Remaining'}</span>
                      <span style={{ color: 'var(--pt-warning)', fontWeight: 800 }}>
                        {money.remaining.toLocaleString()} {t('common.egp')}
                      </span>
                    </div>
                  </>
                )}
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
