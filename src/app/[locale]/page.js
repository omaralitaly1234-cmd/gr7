'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const switchLocale = isAr ? 'en' : 'ar';

  const features = [
    { icon: '👥', title: isAr ? 'إدارة الأعضاء' : 'Member Management', desc: isAr ? 'نظام شامل لإدارة العضويات مع بحث متقدم وفلاتر ذكية وملفات تعريف مفصلة' : 'Complete membership management with advanced search, smart filters, and detailed profiles' },
    { icon: '💳', title: isAr ? 'الاشتراكات والخطط' : 'Plans & Subscriptions', desc: isAr ? 'خطط ذهبية وماسية مرنة مع تجميد وتجديد تلقائي وتتبع الحصص' : 'Flexible Gold & Diamond plans with freeze, auto-renewal, and session tracking' },
    { icon: '📱', title: isAr ? 'حضور بـ QR' : 'QR Attendance', desc: isAr ? 'مسح سريع لكود QR مع التحقق الفوري من صلاحية الاشتراك وتسجيل تلقائي' : 'Fast QR scan with instant subscription validation and automatic logging' },
    { icon: '🧖', title: isAr ? 'إدارة السبا' : 'Spa Management', desc: isAr ? 'نظام حجز متكامل لخدمات السبا مع تتبع حقوق الأعضاء الماسيين' : 'Full booking system for spa services with Diamond member entitlement tracking' },
    { icon: '💪', title: isAr ? 'بوابة المدرب' : 'Trainer Portal', desc: isAr ? 'برامج تمارين وأنظمة غذائية مخصصة مع متابعة تقدم العملاء' : 'Custom workout & diet plans with client progress tracking' },
    { icon: '💰', title: isAr ? 'إدارة مالية' : 'Financial Management', desc: isAr ? 'تقارير مالية شاملة مع فواتير PDF وتتبع العمولات والمصاريف' : 'Comprehensive financial reports with PDF invoices and commission tracking' },
    { icon: '📊', title: isAr ? 'تحليلات ذكية' : 'Smart Analytics', desc: isAr ? 'لوحة تحكم ذكية مع توقعات الإيرادات وتحليل سلوك الأعضاء' : 'Smart dashboard with revenue forecasting and member behavior analysis' },
    { icon: '🔔', title: isAr ? 'إشعارات تلقائية' : 'Auto Notifications', desc: isAr ? 'تذكيرات تلقائية عبر واتساب للتجديد والمواعيد وأعياد الميلاد' : 'Automatic WhatsApp reminders for renewals, appointments, and birthdays' },
  ];

  const plans = [
    {
      name: isAr ? 'ذهبي — شهري' : 'Gold — Monthly',
      price: '900',
      duration: isAr ? 'شهر' : 'month',
      type: 'gold',
      features: [
        isAr ? 'صالة الجيم والفيتنس' : 'Gym & Fitness Hall',
        isAr ? 'فوطة نظيفة' : 'Hygiene Towel',
        isAr ? 'دعوتين مجانيتين/شهر' : '2 Free Guest Invitations/month',
        isAr ? 'تجميد حتى 14 يوم' : 'Freeze up to 14 days',
      ],
    },
    {
      name: isAr ? 'ذهبي — ربع سنوي' : 'Gold — Quarterly',
      price: '2,400',
      duration: isAr ? '3 شهور' : '3 months',
      type: 'gold',
      popular: true,
      features: [
        isAr ? 'كل مميزات الشهري' : 'All Monthly features',
        isAr ? 'خصم 11%' : '11% discount',
        isAr ? 'تجميد حتى 14 يوم' : 'Freeze up to 14 days',
        isAr ? 'دعوتين مجانيتين/شهر' : '2 Free Guest Invitations/month',
      ],
    },
    {
      name: isAr ? 'ماسي — ربع سنوي' : 'Diamond — Quarterly',
      price: '4,500',
      duration: isAr ? '3 شهور' : '3 months',
      type: 'diamond',
      features: [
        isAr ? 'مدرب خاص مخصص' : 'Personal Trainer',
        isAr ? 'ساونا + جاكوزي + بخار' : 'Sauna + Jacuzzi + Steam',
        isAr ? 'حمام مغربي/شهر' : 'Moroccan Bath/month',
        isAr ? 'مساج/شهر + خزنة خاصة' : 'Massage/month + Private Locker',
      ],
    },
  ];

  const stats = [
    { value: '500+', label: isAr ? 'عضو نشط' : 'Active Members' },
    { value: '50+', label: isAr ? 'مدرب محترف' : 'Pro Trainers' },
    { value: '15+', label: isAr ? 'خدمة سبا' : 'Spa Services' },
    { value: '99.9%', label: isAr ? 'وقت التشغيل' : 'Uptime' },
  ];

  return (
    <div style={{ background: 'var(--pt-black)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(245,197,24,0.1)',
        padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 8px rgba(245,197,24,0.4))' }}>⚡</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--pt-gold)', letterSpacing: '-0.5px' }}>Power Time</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/${switchLocale}`} style={{ color: 'var(--pt-gray-400)', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}>
            {isAr ? 'English' : 'عربي'}
          </Link>
          <Link href={`/${locale}/login`} style={{
            background: 'linear-gradient(135deg, var(--pt-gold), var(--pt-gold-dim))', color: '#0D0D0D',
            padding: '8px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(245,197,24,0.2)', transition: 'all 0.3s',
          }}>
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 64,
      }}>
        {/* Background effects */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px', pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', maxWidth: '800px', padding: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 20px',
            background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)',
            borderRadius: '100px', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--pt-gold)',
          }}>
            <span>⚡</span> {isAr ? 'نظام إدارة الجيم الأكثر تقدماً' : 'The Most Advanced Gym Management System'}
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1,
            marginBottom: '1.5rem', color: 'var(--pt-white)',
          }}>
            <span style={{ color: 'var(--pt-gold)' }}>Power Time</span>
            <br />
            {isAr ? 'أكتر من مجرد جيم' : 'More than a Gym'}
          </h1>

          <p style={{
            fontSize: '1.15rem', color: 'var(--pt-gray-400)', lineHeight: 1.8,
            maxWidth: '600px', margin: '0 auto 2.5rem',
          }}>
            {isAr
              ? 'نظام إدارة متكامل للجيم — إدارة العضويات، الاشتراكات، السبا، التدريب، المالية، والحضور بكود QR. كل ما تحتاجه في مكان واحد.'
              : 'Complete gym management system — memberships, subscriptions, spa, training, finance, and QR attendance. Everything you need in one place.'}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/login`} style={{
              background: 'linear-gradient(135deg, var(--pt-gold), #E6B800)', color: '#0D0D0D',
              padding: '14px 40px', borderRadius: '14px', fontWeight: 800, fontSize: '1.05rem',
              boxShadow: '0 8px 30px rgba(245,197,24,0.25)', display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.3s', textDecoration: 'none',
            }}>
              {isAr ? 'ابدأ الآن' : 'Get Started'} →
            </Link>
            <a href="#features" style={{
              padding: '14px 40px', borderRadius: '14px', fontWeight: 600, fontSize: '1.05rem',
              border: '1px solid rgba(245,197,24,0.3)', color: 'var(--pt-gold)', display: 'inline-flex',
              alignItems: 'center', gap: '8px', transition: 'all 0.3s', textDecoration: 'none',
            }}>
              {isAr ? 'اكتشف المميزات' : 'Explore Features'} ↓
            </a>
          </div>

          {/* Stats Row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem',
            marginTop: '4rem', maxWidth: '700px', marginInline: 'auto',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--pt-gold)', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--pt-gray-500)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--pt-gold)', textTransform: 'uppercase',
            letterSpacing: '3px', display: 'block', marginBottom: '0.75rem',
          }}>
            {isAr ? 'المميزات' : 'FEATURES'}
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            {isAr ? 'كل ما يحتاجه جيمك' : 'Everything Your Gym Needs'}
          </h2>
          <p style={{ color: 'var(--pt-gray-400)', maxWidth: '500px', margin: '0 auto', fontSize: '1.05rem' }}>
            {isAr ? 'نظام متكامل يغطي كل جوانب إدارة الجيم الحديث' : 'An integrated system covering all aspects of modern gym management'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--pt-dark)', border: '1px solid var(--glass-border)',
              borderRadius: '16px', padding: '2rem', transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, insetInlineStart: 0, width: '3px', height: '100%',
                background: 'var(--pt-gold)', borderRadius: '0 4px 4px 0', opacity: 0.5,
              }} />
              <div style={{
                width: 52, height: 52, borderRadius: '14px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                background: 'var(--pt-gold-glow)', marginBottom: '1rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--pt-gray-400)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" style={{
        padding: '6rem 2rem', background: 'linear-gradient(180deg, transparent, rgba(245,197,24,0.02), transparent)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{
              fontSize: '0.8rem', fontWeight: 700, color: 'var(--pt-gold)', textTransform: 'uppercase',
              letterSpacing: '3px', display: 'block', marginBottom: '0.75rem',
            }}>
              {isAr ? 'الخطط' : 'PLANS'}
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
              {isAr ? 'اختر خطتك المناسبة' : 'Choose Your Plan'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {plans.map((plan, i) => (
              <div key={i} style={{
                background: 'var(--pt-dark)', border: plan.popular ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)',
                borderRadius: '20px', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden',
                boxShadow: plan.popular ? '0 8px 40px rgba(245,197,24,0.15)' : 'none',
                transform: plan.popular ? 'scale(1.03)' : 'none',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: 16, insetInlineEnd: 16, background: 'var(--pt-gold)',
                    color: '#0D0D0D', padding: '4px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800,
                  }}>
                    {isAr ? '⭐ الأكثر طلباً' : '⭐ Most Popular'}
                  </div>
                )}
                <div style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700,
                  background: plan.type === 'diamond' ? 'linear-gradient(135deg, rgba(156,39,176,0.15), rgba(0,176,255,0.15))' : 'var(--pt-gold-glow)',
                  color: plan.type === 'diamond' ? '#CE93D8' : 'var(--pt-gold)',
                  border: plan.type === 'diamond' ? '1px solid rgba(156,39,176,0.3)' : '1px solid rgba(245,197,24,0.3)',
                  marginBottom: '1rem',
                }}>
                  {plan.type === 'diamond' ? '💎' : '🥇'} {plan.name}
                </div>
                <div style={{ margin: '1rem 0' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--pt-white)' }}>{plan.price}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--pt-gray-500)', marginInlineStart: '4px' }}>{t('common.egp')}/{plan.duration}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      padding: '8px 0', fontSize: '0.9rem', color: 'var(--pt-gray-300)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      borderBottom: j < plan.features.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    }}>
                      <span style={{ color: 'var(--pt-success)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/login`} style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: '12px',
                  fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s',
                  background: plan.popular ? 'linear-gradient(135deg, var(--pt-gold), var(--pt-gold-dim))' : 'transparent',
                  color: plan.popular ? '#0D0D0D' : 'var(--pt-gold)',
                  border: plan.popular ? 'none' : '1px solid var(--pt-gold)',
                }}>
                  {isAr ? 'اشترك الآن' : 'Subscribe Now'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(245,197,24,0.04))',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>⚡</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>
            {isAr ? 'جاهز تطوّر جيمك؟' : 'Ready to Transform Your Gym?'}
          </h2>
          <p style={{ color: 'var(--pt-gray-400)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            {isAr
              ? 'انضم لنظام Power Time وابدأ في إدارة جيمك باحترافية من اليوم'
              : 'Join Power Time and start managing your gym professionally today'}
          </p>
          <Link href={`/${locale}/login`} style={{
            background: 'linear-gradient(135deg, var(--pt-gold), #E6B800)', color: '#0D0D0D',
            padding: '16px 48px', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem',
            boxShadow: '0 8px 30px rgba(245,197,24,0.3)', display: 'inline-flex',
            alignItems: 'center', gap: '10px', textDecoration: 'none', transition: 'all 0.3s',
          }}>
            {isAr ? 'ابدأ مجاناً' : 'Start Free'} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem', borderTop: '1px solid var(--glass-border)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--pt-gold)' }}>Power Time</span>
        </div>
        <p style={{ color: 'var(--pt-gray-600)', fontSize: '0.85rem' }}>
          © 2026 Power Time. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
        </p>
        <p style={{ color: 'var(--pt-gray-700)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          {isAr ? 'أكتر من مجرد جيم' : 'More than a Gym'} ⚡
        </p>
      </footer>
    </div>
  );
}
