'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PLAN_DEFINITIONS, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';
import { signIn } from '@/lib/firebase/auth';

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gymName: '', gymNameEn: '', ownerName: '', email: '', phone: '', password: '', addressAr: '', addressEn: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Use server-side API for secure gym owner registration
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.ownerName,
          phone: formData.phone,
          lang: locale,
          gymName: formData.gymName,
          gymNameAr: formData.gymName,
          gymNameEn: formData.gymNameEn,
          addressAr: formData.addressAr,
          addressEn: formData.addressEn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Sign in the newly created user
      const { error: signInError } = await signIn(formData.email, formData.password);
      if (signInError) {
        // User was created but sign-in failed — still show success
        console.warn('[Onboarding] Auto sign-in failed:', signInError);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
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
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: 'var(--space-5)',
                    border: plan.highlight
                      ? '2px solid var(--pt-info)'
                      : plan.type === 'annual'
                        ? '2px solid var(--pt-gold)'
                        : undefined,
                    position: 'relative',
                  }}
                >
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--pt-info)', color: 'white', fontSize: 'var(--font-size-xs)',
                      fontWeight: 700, padding: '3px 14px', borderRadius: 'var(--radius-full)',
                    }}>
                      🎁 {locale === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
                    </div>
                  )}

                  <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', marginTop: plan.highlight ? 'var(--space-2)' : 0 }}>
                    {plan.name[locale] || plan.name.ar}
                  </h3>

                  <div style={{
                    fontSize: 'var(--font-size-2xl)', fontWeight: 800,
                    color: plan.price === 0 ? 'var(--pt-success)' : 'var(--pt-gold)',
                    marginBottom: 'var(--space-1)',
                  }}>
                    {plan.price === 0 ? (locale === 'ar' ? 'مجاناً' : 'Free') : `${plan.price.toLocaleString()}`}
                  </div>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-3)' }}>
                    {plan.durationDays} {locale === 'ar' ? 'يوم' : 'days'}
                  </div>

                  {plan.discount && (
                    <div className="badge badge-success" style={{ marginBottom: 'var(--space-2)' }}>
                      {locale === 'ar' ? `خصم ${plan.discount}%` : `${plan.discount}% off`}
                    </div>
                  )}

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>👥 {plan.maxMembers === -1 ? '♾' : plan.maxMembers} {locale === 'ar' ? 'عضو' : 'members'}</span>
                    <span>🤖 {plan.features?.ai_nutrition ? '✅' : '❌'} AI</span>
                  </div>
                </div>
              ))}
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
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStep(2)}
                style={{
                  padding: 'var(--space-4) var(--space-12)',
                  fontSize: 'var(--font-size-lg)',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                🚀 {locale === 'ar' ? 'ابدأ فترتك التجريبية المجانية' : 'Start Your Free Trial'}
              </button>
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

              {/* Trial Info Badge */}
              <div style={{
                background: 'var(--pt-gold-glow)',
                border: '1px solid rgba(245,197,24,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                marginBottom: 'var(--space-5)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gold)', fontWeight: 600 }}>
                  🎁 {locale === 'ar'
                    ? 'ستبدأ بفترة تجريبية مجانية لمدة 3 أشهر'
                    : 'You will start with a 3-month free trial'}
                </span>
              </div>

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
