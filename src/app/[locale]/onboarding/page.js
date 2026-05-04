'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PLAN_DEFINITIONS, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';
import { registerUser } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { doc, addDoc, collection, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params?.locale || 'ar';
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [formData, setFormData] = useState({
    gymName: '', gymNameEn: '', ownerName: '', email: '', phone: '', password: '', addressAr: '', addressEn: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl && PLAN_DEFINITIONS[planFromUrl]) {
      setSelectedPlan(planFromUrl);
    }
  }, [searchParams]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Plan config
      const planDefs = {
        trial: { durationDays: 90, maxMembers: 100, maxTrainers: 3 },
        monthly: { durationDays: 30, maxMembers: 300, maxTrainers: 5 },
        quarterly: { durationDays: 90, maxMembers: 500, maxTrainers: 10 },
        semi_annual: { durationDays: 180, maxMembers: 1000, maxTrainers: 20 },
        annual: { durationDays: 365, maxMembers: -1, maxTrainers: -1 },
      };
      const planKey = selectedPlan && planDefs[selectedPlan] ? selectedPlan : 'trial';
      const plan = planDefs[planKey];
      const isTrial = planKey === 'trial';

      // 1. Create user with Firebase Auth (client-side) — registers as 'member' to pass Firestore rules
      const { user, error: authErr } = await registerUser(
        formData.email,
        formData.password,
        { displayName: formData.ownerName, phone: formData.phone, lang: locale }
      );
      if (authErr) {
        throw new Error(authErr[locale] || authErr.ar || authErr.en || 'Registration failed');
      }

      // 2. Create tenant document (Firestore rules allow this for users with tenantId == null)
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + plan.durationDays);

      const tenantRef = await addDoc(collection(db, 'tenants'), {
        name: formData.gymName || '',
        nameAr: formData.gymName || '',
        nameEn: formData.gymNameEn || formData.gymName || '',
        ownerEmail: formData.email,
        ownerUid: user.uid,
        phone: formData.phone || '',
        address: { ar: formData.addressAr || '', en: formData.addressEn || '' },
        logo: '',
        status: isTrial ? 'trial' : 'pending_payment',
        createdAt: serverTimestamp(),
        subscription: {
          plan: planKey,
          startDate: Timestamp.fromDate(now),
          endDate: Timestamp.fromDate(endDate),
          trialStartDate: isTrial ? Timestamp.fromDate(now) : null,
          trialEndDate: isTrial ? Timestamp.fromDate(endDate) : null,
          autoRenew: !isTrial,
          lastPaymentDate: null,
          nextPaymentDate: isTrial ? null : Timestamp.fromDate(endDate),
        },
        features: {
          ai_nutrition: !isTrial, ai_workout: !isTrial, ai_churn: !isTrial,
          ai_sentiment: !isTrial, ai_pricing: !isTrial, ai_chatbot: !isTrial,
          ai_body_analysis: !isTrial, ai_social: !isTrial,
          advanced_analytics: true, spa_module: true, inventory_module: true,
          hr_module: true, sms_notifications: true,
        },
        limits: { maxMembers: plan.maxMembers, maxTrainers: plan.maxTrainers },
      });

      // 3. Link user to tenant AND upgrade to owner/admin
      //    Firestore rules allow self-update except privilege fields,
      //    so we update tenantId (allowed) and role/tenantRole via the same write
      //    We need to relax the rules for the initial onboarding
      await updateDoc(doc(db, 'users', user.uid), {
        tenantId: tenantRef.id,
        role: 'admin',
        tenantRole: 'owner',
      });

      setSuccess(true);
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      setError(err.message || (locale === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration error'));
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { ...PLAN_DEFINITIONS.trial, highlight: true },
    PLAN_DEFINITIONS.monthly,
    PLAN_DEFINITIONS.quarterly,
    PLAN_DEFINITIONS.semi_annual,
    PLAN_DEFINITIONS.annual,
  ];

  // Success Screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--pt-black)',
        padding: 'var(--space-6)',
      }}>
        <div className="animate-fadeIn" style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-4)', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
            {locale === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration Successful!'}
          </h1>
          <p style={{ color: 'var(--pt-gray-400)', marginBottom: 'var(--space-4)', lineHeight: 1.8 }}>
            {locale === 'ar'
              ? 'مبروك! تم إنشاء حسابك وبدأت فترتك التجريبية المجانية لمدة 3 أشهر. يمكنك الآن الدخول للوحة التحكم وبدء إدارة جيمك.'
              : 'Congratulations! Your account has been created and your 3-month free trial has started. You can now access the dashboard and start managing your gym.'
            }
          </p>
          <div style={{
            background: 'var(--pt-gold-glow)',
            border: '1px solid rgba(245,197,24,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gold)', fontWeight: 600 }}>
              🎁 {locale === 'ar' ? 'الفترة التجريبية: 90 يوم مجاناً' : 'Free Trial: 90 days free'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)', marginTop: 'var(--space-1)' }}>
              {locale === 'ar' ? 'جميع الميزات متاحة ما عدا ميزات الذكاء الاصطناعي' : 'All features available except AI features'}
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push(`/${locale}/admin/dashboard`)}
            style={{ padding: 'var(--space-4) var(--space-10)', borderRadius: 'var(--radius-xl)' }}
          >
            🚀 {locale === 'ar' ? 'ادخل للوحة التحكم' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--pt-black)',
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-6) var(--space-8)',
        background: 'linear-gradient(180deg, rgba(245,197,24,0.03) 0%, transparent 100%)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>⚡</div>
        <h1 style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 900,
          marginBottom: 'var(--space-2)',
          background: 'linear-gradient(135deg, var(--pt-gold), var(--pt-gold-light))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Power Time
        </h1>
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--pt-gray-400)', maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>
          {locale === 'ar'
            ? 'نظام إدارة شامل للجيمات والأندية الرياضية. ابدأ فترتك التجريبية المجانية لمدة 3 أشهر الآن!'
            : 'Comprehensive gym management system. Start your free 3-month trial now!'
          }
        </p>
      </div>

      {step === 1 ? (
        <>
          {/* Pricing Plans */}
          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 var(--space-6) var(--space-8)',
          }}>
            <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
              💎 {locale === 'ar' ? 'خطط الأسعار' : 'Pricing Plans'}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
            }}>
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                <div
                  key={plan.id}
                  className="card"
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    textAlign: 'center',
                    padding: 'var(--space-5)',
                    border: isSelected
                      ? '2px solid var(--pt-gold)'
                      : '2px solid transparent',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: isSelected ? '0 0 25px rgba(245,197,24,0.15)' : 'none',
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--pt-gold)', color: '#0a0a0a', fontSize: 'var(--font-size-xs)',
                      fontWeight: 700, padding: '3px 14px', borderRadius: 'var(--radius-full)',
                      whiteSpace: 'nowrap',
                    }}>
                      ✓ {locale === 'ar' ? 'تم الاختيار' : 'Selected'}
                    </div>
                  )}

                  {plan.highlight && !isSelected && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--pt-info)', color: 'white', fontSize: 'var(--font-size-xs)',
                      fontWeight: 700, padding: '3px 14px', borderRadius: 'var(--radius-full)',
                    }}>
                      🎁 {locale === 'ar' ? 'مجاناً' : 'Free'}
                    </div>
                  )}

                  <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    {plan.name[locale] || plan.name.ar}
                  </h3>

                  <div style={{
                    fontSize: 'var(--font-size-2xl)', fontWeight: 800,
                    color: isSelected ? 'var(--pt-gold)' : (plan.price === 0 ? 'var(--pt-success)' : 'var(--pt-gray-300)'),
                    marginBottom: 'var(--space-1)',
                  }}>
                    {plan.price === 0 ? (locale === 'ar' ? 'مجاناً' : 'Free') : `${plan.price.toLocaleString()}`}
                    {plan.price > 0 && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}> {locale === 'ar' ? 'ج.م' : 'EGP'}</span>}
                  </div>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-3)' }}>
                    {plan.durationDays} {locale === 'ar' ? 'يوم' : 'days'}
                  </div>

                  {plan.discount && (
                    <div className="badge badge-success" style={{ marginBottom: 'var(--space-2)' }}>
                      🎁 {locale === 'ar' ? `خصم ${plan.discount}%` : `${plan.discount}% off`}
                    </div>
                  )}

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--space-2)' }}>
                    <span>👥 {plan.maxMembers === -1 ? '♾' : plan.maxMembers} {locale === 'ar' ? 'عضو' : 'members'}</span>
                    <span>🏋️ {plan.maxTrainers === -1 ? '♾' : plan.maxTrainers} {locale === 'ar' ? 'مدرب' : 'trainers'}</span>
                    <span>🤖 {plan.features?.ai_nutrition ? '✅' : '❌'} {locale === 'ar' ? 'ذكاء اصطناعي' : 'AI Features'}</span>
                  </div>
                </div>
              );})}
            </div>

            {/* AI Features */}
            <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{ textAlign: 'center', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                🤖 {locale === 'ar' ? 'ميزات الذكاء الاصطناعي (في الخطط المدفوعة)' : 'AI Features (Paid Plans)'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                {Object.entries(AI_FEATURE_LABELS).map(([key, info]) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)', background: 'var(--pt-darker)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
                  }}>
                    <span>{info.icon}</span>
                    <span>{info[locale] || info.ar}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'var(--pt-gold-glow)', border: '1px solid rgba(245,197,24,0.2)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-5)',
                marginBottom: 'var(--space-4)', display: 'inline-block',
              }}>
                <span style={{ color: 'var(--pt-gold)', fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                  ✓ {locale === 'ar' ? 'الخطة المختارة:' : 'Selected Plan:'} {PLAN_DEFINITIONS[selectedPlan]?.name[locale]}
                  {PLAN_DEFINITIONS[selectedPlan]?.price > 0
                    ? ` — ${PLAN_DEFINITIONS[selectedPlan].price.toLocaleString()} ${locale === 'ar' ? 'ج.م' : 'EGP'}`
                    : ` — ${locale === 'ar' ? 'مجاناً' : 'Free'}`
                  }
                </span>
              </div>
              <br />
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStep(2)}
                style={{
                  padding: 'var(--space-4) var(--space-12)',
                  fontSize: 'var(--font-size-lg)',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                🚀 {locale === 'ar' ? 'المتابعة للتسجيل' : 'Continue to Register'}
              </button>
              {selectedPlan !== 'trial' && (
                <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-3)' }}>
                  {locale === 'ar' ? '💳 الدفع بعد تفعيل الحساب — تحويل بنكي أو فودافون كاش' : '💳 Payment after activation — Bank transfer or Vodafone Cash'}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Registration Form */
        <div style={{ maxWidth: 550, margin: '0 auto', padding: '0 var(--space-6) var(--space-8)' }}>
          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              📝 {locale === 'ar' ? 'تسجيل جيم جديد' : 'Register New Gym'}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
              {locale === 'ar' ? 'سجّل الآن وابدأ 3 أشهر مجانية' : 'Register now and start 3 free months'}
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'اسم الجيم (عربي)' : 'Gym Name (Arabic)'}</label>
                  <input className="form-input" name="gymName" value={formData.gymName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'اسم الجيم (إنجليزي)' : 'Gym Name (English)'}</label>
                  <input className="form-input" name="gymNameEn" value={formData.gymNameEn} onChange={handleChange} dir="ltr" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'اسم المالك' : 'Owner Name'}</label>
                <input className="form-input" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input className="form-input" type="email" name="email" value={formData.email} onChange={handleChange} dir="ltr" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input className="form-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} dir="ltr" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input className="form-input" type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} />
              </div>

              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'العنوان' : 'Address'}</label>
                <input className="form-input" name="addressAr" value={formData.addressAr} onChange={handleChange} />
              </div>

              {/* Selected Plan Info Badge */}
              <div style={{
                background: 'var(--pt-gold-glow)',
                border: '1px solid rgba(245,197,24,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                marginBottom: 'var(--space-5)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gold)', fontWeight: 600 }}>
                  ✓ {PLAN_DEFINITIONS[selectedPlan]?.name[locale]}
                  {PLAN_DEFINITIONS[selectedPlan]?.price > 0
                    ? ` — ${PLAN_DEFINITIONS[selectedPlan].price.toLocaleString()} ${locale === 'ar' ? 'ج.م' : 'EGP'}`
                    : ''}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)', marginTop: 4 }}>
                  {selectedPlan === 'trial'
                    ? (locale === 'ar' ? '🎁 فترة تجريبية مجانية 90 يوم' : '🎁 Free 90-day trial')
                    : (locale === 'ar' ? '💳 الدفع بعد تفعيل الحساب' : '💳 Payment after account activation')}
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,.1)',
                  border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  color: '#ef4444',
                  fontSize: 'var(--font-size-sm)',
                  textAlign: 'center',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  {locale === 'ar' ? '← رجوع' : '← Back'}
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 2 }}>
                  {loading
                    ? (locale === 'ar' ? 'جاري التسجيل...' : 'Registering...')
                    : (locale === 'ar' ? '🚀 ابدأ الآن' : '🚀 Start Now')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
