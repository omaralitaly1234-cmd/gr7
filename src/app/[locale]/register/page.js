'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/firebase/auth';

export default function RegisterPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', email: '', phone: '', password: '', confirmPassword: '',
    gender: '', dob: '', nationalId: '', emergencyPhone: '',
    plan: '', paymentMethod: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.nameAr.trim()) newErrors.nameAr = locale === 'ar' ? 'الاسم مطلوب' : 'Name is required';
      if (!form.email.trim()) newErrors.email = locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
      if (!form.phone.trim()) newErrors.phone = locale === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone is required';
      if (!form.gender) newErrors.gender = locale === 'ar' ? 'النوع مطلوب' : 'Gender is required';
      if (!form.password || form.password.length < 6) newErrors.password = locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = locale === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match';
    } else if (currentStep === 2) {
      if (!form.plan) newErrors.plan = locale === 'ar' ? 'اختر خطة اشتراك' : 'Please select a plan';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const result = await registerUser(form.email, form.password, {
        displayName: form.nameAr,
        fullName: { ar: form.nameAr, en: form.nameEn },
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        plan: form.plan,
        role: 'member',
        lang: locale,
      });
      if (result.error) {
        setSubmitError(result.error[locale] || result.error.ar || result.error);
      } else {
        router.push(`/${locale}/client/dashboard`);
      }
    } catch (err) {
      setSubmitError(locale === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'gold-monthly', name: locale === 'ar' ? 'ذهبي — شهري' : 'Gold — Monthly', price: 900, features: locale === 'ar' ? ['صالة الجيم', 'دش + لوكر', 'مدرب خاص'] : ['Gym Access', 'Shower + Locker', 'Personal Trainer'], color: '#FFD740' },
    { id: 'gold-quarterly', name: locale === 'ar' ? 'ذهبي — ربع سنوي' : 'Gold — Quarterly', price: 2400, features: locale === 'ar' ? ['صالة الجيم', 'دش + لوكر', 'مدرب خاص', 'خطة غذائية'] : ['Gym Access', 'Shower + Locker', 'Trainer', 'Diet Plan'], color: '#FFD740', popular: true },
    { id: 'diamond-monthly', name: locale === 'ar' ? 'ماسي — شهري' : 'Diamond — Monthly', price: 1200, features: locale === 'ar' ? ['كل مميزات الذهبي', 'سبا', 'ساونا', 'جاكوزي'] : ['All Gold', 'Spa', 'Sauna', 'Jacuzzi'], color: '#B388FF' },
    { id: 'diamond-quarterly', name: locale === 'ar' ? 'ماسي — ربع سنوي' : 'Diamond — Quarterly', price: 3200, features: locale === 'ar' ? ['كل مميزات الذهبي', 'سبا كامل', 'حصص جماعية'] : ['All Gold', 'Full Spa', 'Group Classes'], color: '#B388FF' },
  ];

  const update = (key, val) => setForm({ ...form, [key]: val });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pt-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      {/* Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '15%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(245,197,24,0.06)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,197,24,0.04)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>⚡</div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--pt-gold)' }}>GR 7</h1>
          <p style={{ color: 'var(--pt-gray-400)' }}>{locale === 'ar' ? 'انضم إلينا الآن' : 'Join Us Now'}</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: s <= step ? 'var(--pt-gold)' : 'var(--pt-gray-800)', color: s <= step ? 'var(--pt-black)' : 'var(--pt-gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 'var(--font-size-sm)' }}>
                {s < step ? '✓' : s}
              </div>
              <span style={{ color: s <= step ? 'var(--pt-gold)' : 'var(--pt-gray-600)', fontSize: 'var(--font-size-sm)', fontWeight: s === step ? 700 : 400 }}>
                {s === 1 ? (locale === 'ar' ? 'البيانات' : 'Personal') : s === 2 ? (locale === 'ar' ? 'الاشتراك' : 'Plan') : (locale === 'ar' ? 'التأكيد' : 'Confirm')}
              </span>
              {s < 3 && <div style={{ width: 40, height: 2, background: s < step ? 'var(--pt-gold)' : 'var(--pt-gray-800)', marginInlineStart: 'var(--space-2)' }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <>
              <h2 style={{ marginBottom: 'var(--space-5)' }}>👤 {locale === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}</h2>
              <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'} *</label>
                  <input className="form-input" value={form.nameAr} onChange={e => update('nameAr', e.target.value)} placeholder={locale === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input className="form-input" value={form.nameEn} onChange={e => update('nameEn', e.target.value)} placeholder="Ahmed Mohamed" dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'} *</label>
                  <input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="01012345678" dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'النوع' : 'Gender'} *</label>
                  <select className="form-select" value={form.gender} onChange={e => update('gender', e.target.value)}>
                    <option value="">{locale === 'ar' ? 'اختر...' : 'Select...'}</option>
                    <option value="male">{locale === 'ar' ? 'ذكر' : 'Male'}</option>
                    <option value="female">{locale === 'ar' ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                  <input className="form-input" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'كلمة المرور' : 'Password'} *</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => update('password', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *</label>
                  <input className="form-input" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} dir="ltr" />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Plan Selection */}
          {step === 2 && (
            <>
              <h2 style={{ marginBottom: 'var(--space-5)' }}>💳 {locale === 'ar' ? 'اختر الاشتراك' : 'Choose Your Plan'}</h2>
              <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                {plans.map(plan => (
                  <div key={plan.id} onClick={() => update('plan', plan.id)}
                    style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: form.plan === plan.id ? `2px solid ${plan.color}` : '1px solid var(--glass-border)', background: 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                    {plan.popular && <span style={{ position: 'absolute', top: -10, insetInlineStart: 16, background: 'var(--pt-gold)', color: 'var(--pt-black)', padding: '2px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 800 }}>⭐ {locale === 'ar' ? 'الأكثر طلباً' : 'Popular'}</span>}
                    <h3 style={{ color: plan.color, marginBottom: 'var(--space-2)' }}>{plan.name}</h3>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, marginBottom: 'var(--space-3)' }}>{plan.price.toLocaleString()} <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'ج.م' : 'EGP'}</span></div>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', paddingBlock: '2px' }}>✓ {f}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                <select className="form-select" value={form.paymentMethod} onChange={e => update('paymentMethod', e.target.value)}>
                  <option value="">{locale === 'ar' ? 'اختر...' : 'Select...'}</option>
                  <option value="cash">{locale === 'ar' ? 'كاش' : 'Cash'}</option>
                  <option value="visa">{locale === 'ar' ? 'فيزا' : 'Visa'}</option>
                  <option value="instapay">InstaPay</option>
                </select>
              </div>
            </>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <>
              <h2 style={{ marginBottom: 'var(--space-5)' }}>✅ {locale === 'ar' ? 'تأكيد التسجيل' : 'Confirm Registration'}</h2>
              <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  <span style={{ color: 'var(--pt-gray-500)' }}>👤 {locale === 'ar' ? 'الاسم' : 'Name'}:</span>
                  <span style={{ fontWeight: 600 }}>{form.nameAr || '—'}</span>
                  <span style={{ color: 'var(--pt-gray-500)' }}>📧 {locale === 'ar' ? 'الإيميل' : 'Email'}:</span>
                  <span dir="ltr">{form.email || '—'}</span>
                  <span style={{ color: 'var(--pt-gray-500)' }}>📞 {locale === 'ar' ? 'الهاتف' : 'Phone'}:</span>
                  <span dir="ltr">{form.phone || '—'}</span>
                  <span style={{ color: 'var(--pt-gray-500)' }}>💳 {locale === 'ar' ? 'الخطة' : 'Plan'}:</span>
                  <span style={{ color: 'var(--pt-gold)', fontWeight: 700 }}>{plans.find(p => p.id === form.plan)?.name || '—'}</span>
                  <span style={{ color: 'var(--pt-gray-500)' }}>💰 {locale === 'ar' ? 'السعر' : 'Price'}:</span>
                  <span style={{ fontWeight: 700 }}>{plans.find(p => p.id === form.plan)?.price.toLocaleString() || '—'} {locale === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
            </>
          )}

          {/* Errors */}
          {submitError && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--pt-danger-bg)', border: '1px solid rgba(255,23,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-3)' }}>⚠️ {submitError}</div>
          )}
          {Object.keys(errors).length > 0 && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--pt-danger-bg)', border: '1px solid rgba(255,23,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-3)' }}>
              {Object.values(errors).map((e, i) => <div key={i}>⚠️ {e}</div>)}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-5)' }}>
            {step > 1 ? (
              <button className="btn btn-outline" onClick={() => setStep(step - 1)}>← {locale === 'ar' ? 'السابق' : 'Back'}</button>
            ) : <div />}
            {step < 3 ? (
              <button className="btn btn-primary" onClick={handleNext}>{locale === 'ar' ? 'التالي' : 'Next'} →</button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ fontSize: 'var(--font-size-lg)', padding: 'var(--space-3) var(--space-6)' }}>
                {loading ? (locale === 'ar' ? 'جاري التسجيل...' : 'Registering...') : (<>⚡ {locale === 'ar' ? 'تسجيل' : 'Register'}</>)}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', color: 'var(--pt-gray-500)' }}>
          {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link href={`/${locale}/login`} style={{ color: 'var(--pt-gold)', fontWeight: 600 }}>{locale === 'ar' ? 'تسجيل الدخول' : 'Login'}</Link>
        </p>
      </div>
    </div>
  );
}
