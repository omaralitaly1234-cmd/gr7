'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import s from './landing.module.css';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

export default function LandingPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const sw = isAr ? 'en' : 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [isDay, setIsDay] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    const hour = new Date().getHours();
    setIsDay(hour >= 6 && hour < 18);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const features = [
    { icon: '👥', t: isAr ? 'إدارة العضويات الذكية' : 'Smart Membership Management', d: isAr ? 'نظام شامل لإدارة آلاف الأعضاء مع ملفات تعريف مفصلة، تجديد تلقائي، وفلاتر بحث متقدمة في ثوانٍ.' : 'Manage thousands of members with detailed profiles, auto-renewal, and advanced search filters in seconds.' },
    { icon: '💳', t: isAr ? 'اشتراكات وخطط مرنة' : 'Flexible Plans & Subscriptions', d: isAr ? 'خطط ذهبية وماسية مع تجميد ذكي، تجديد تلقائي، وتتبع الحصص لكل عضو بدقة.' : 'Gold & Diamond plans with smart freeze, auto-renewal, and precise session tracking per member.' },
    { icon: '📱', t: isAr ? 'حضور فوري بـ QR Code' : 'Instant QR Attendance', d: isAr ? 'مسح سريع لكود QR مع تحقق فوري من صلاحية الاشتراك وتسجيل تلقائي للحضور.' : 'Quick QR scan with instant subscription validation and automatic attendance logging.' },
    { icon: '🧖', t: isAr ? 'إدارة السبا المتكاملة' : 'Full Spa Management', d: isAr ? 'نظام حجز متكامل لخدمات السبا والمساج والساونا مع تتبع حقوق الأعضاء الماسيين.' : 'Complete booking system for spa, massage & sauna with Diamond member entitlement tracking.' },
    { icon: '💪', t: isAr ? 'بوابة المدرب الشخصي' : 'Personal Trainer Portal', d: isAr ? 'برامج تمارين وأنظمة غذائية مخصصة مع متابعة تقدم العملاء وتحليل الأداء.' : 'Custom workout & diet plans with client progress tracking and performance analysis.' },
    { icon: '💰', t: isAr ? 'إدارة مالية شاملة' : 'Complete Financial Management', d: isAr ? 'تقارير مالية احترافية، فواتير PDF، تتبع العمولات والمصاريف، وتحليل الإيرادات.' : 'Professional financial reports, PDF invoices, commission tracking, and revenue analysis.' },
    { icon: '🤖', t: isAr ? 'ذكاء اصطناعي متقدم' : 'Advanced AI Assistant', d: isAr ? 'مساعد ذكي يقدم خطط تغذية وتدريب مخصصة، تنبؤات بالإيرادات، وتحليل سلوك الأعضاء.' : 'AI assistant providing custom nutrition & workout plans, revenue forecasts, and member behavior analysis.' },
    { icon: '🔔', t: isAr ? 'إشعارات وحملات ذكية' : 'Smart Notifications & Campaigns', d: isAr ? 'تذكيرات تلقائية للتجديد والمواعيد، حملات تسويقية مستهدفة، وإشعارات فورية.' : 'Auto reminders for renewals, targeted marketing campaigns, and instant push notifications.' },
  ];

  const stats = [
    { v: '10K+', l: isAr ? 'عضو نشط' : 'Active Members' },
    { v: '500+', l: isAr ? 'نادي ومركز' : 'Gyms & Centers' },
    { v: '99.9%', l: isAr ? 'وقت التشغيل' : 'Uptime' },
    { v: '4.9★', l: isAr ? 'تقييم العملاء' : 'Client Rating' },
  ];

  const showcases = [
    {
      img: '/images/Futuristic gym dashboard in gold accents.webp',
      tag: isAr ? 'لوحة تحكم ذكية' : 'Smart Dashboard',
      title: isAr ? 'تحكم كامل من شاشة واحدة' : 'Full Control From One Screen',
      desc: isAr ? 'لوحة تحكم تفاعلية تعرض كل ما تحتاجه — الأعضاء النشطين، الإيرادات، الحضور، والتنبيهات في الوقت الحقيقي. صُممت لتمنحك رؤية 360° لناديك.' : 'An interactive dashboard showing everything you need — active members, revenue, attendance, and real-time alerts. Designed to give you a 360° view of your gym.',
      list: isAr ? ['إحصائيات فورية ومحدثة','تنبيهات ذكية للاشتراكات المنتهية','تقارير مالية يومية وشهرية','متابعة أداء المدربين'] : ['Real-time updated statistics','Smart alerts for expiring subscriptions','Daily & monthly financial reports','Trainer performance monitoring'],
    },
    {
      img: '/images/PowerTime gym session with trainer.webp',
      tag: isAr ? 'إدارة المدربين' : 'Trainer Management',
      title: isAr ? 'مدربين أكثر إنتاجية' : 'More Productive Trainers',
      desc: isAr ? 'امنح مدربيك أدوات احترافية لإنشاء برامج تدريبية مخصصة وخطط تغذية بالذكاء الاصطناعي ومتابعة تقدم كل عميل.' : 'Give your trainers professional tools to create custom workout programs, AI nutrition plans, and track every client\'s progress.',
      list: isAr ? ['برامج تدريب مخصصة لكل عميل','خطط تغذية بالذكاء الاصطناعي','متابعة القياسات والتحول','تقييم أداء تلقائي'] : ['Custom training programs per client','AI-powered nutrition plans','Body measurements & transformation tracking','Automated performance evaluation'],
      reverse: true,
    },
    {
      img: '/images/Luxurious spa booking experience.webp',
      tag: isAr ? 'خدمات السبا' : 'Spa Services',
      title: isAr ? 'تجربة سبا فاخرة ومتكاملة' : 'Premium Integrated Spa Experience',
      desc: isAr ? 'نظام حجز متطور لخدمات السبا — ساونا، جاكوزي، حمام مغربي، ومساج. مع تتبع تلقائي لحقوق الأعضاء الماسيين.' : 'Advanced booking system for spa services — sauna, jacuzzi, Moroccan bath & massage. With automatic Diamond member entitlement tracking.',
      list: isAr ? ['حجز فوري للخدمات','تتبع حقوق الأعضاء الماسيين','جدول الخدمات اليومي','تقارير إشغال السبا'] : ['Instant service booking','Diamond member entitlement tracking','Daily service schedule','Spa occupancy reports'],
    },
  ];

  const plans = [
    { ...PLAN_DEFINITIONS.trial, highlight: true },
    PLAN_DEFINITIONS.monthly,
    PLAN_DEFINITIONS.quarterly,
    PLAN_DEFINITIONS.semi_annual,
    PLAN_DEFINITIONS.annual,
  ];

  return (
    <div className={`${s.landing} ${isDay ? s.dayMode : ''}`}>
      {/* === Navbar === */}
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ''}`}>
        <Link href={`/${locale}`} className={s.navLogo}>
          <span className={s.navLogoIcon}>⚡</span>
          <span className={s.navLogoText}>Power Time</span>
        </Link>
        <div className={s.navDesktop}>
          <a href="#features" className={s.navLink}>{isAr ? 'المميزات' : 'Features'}</a>
          <a href="#showcase" className={s.navLink}>{isAr ? 'النظام' : 'System'}</a>
          <a href="#plans" className={s.navLink}>{isAr ? 'الأسعار' : 'Pricing'}</a>
          <Link href={`/${sw}`} className={s.navLink}>{isAr ? 'English' : 'عربي'}</Link>
          <Link href={`/${locale}/login`} className={s.navLink}>{isAr ? 'دخول' : 'Sign In'}</Link>
          <Link href={`/${locale}/onboarding`} className={s.navCta}>{isAr ? 'ابدأ مجاناً' : 'Start Free'}</Link>
          <button onClick={() => setIsDay(!isDay)} className={s.navLink} aria-label="Toggle theme">{isDay ? '🌙' : '☀️'}</button>
        </div>
        {/* Mobile Controls */}
        <div className={s.navMobileRight}>
          <button onClick={() => setIsDay(!isDay)} className={s.navLink} aria-label="Toggle theme">{isDay ? '🌙' : '☀️'}</button>
          <Link href={`/${locale}/onboarding`} className={s.navCta}>{isAr ? 'ابدأ' : 'Start'}</Link>
          <button className={s.burger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`${s.burgerLine} ${menuOpen ? s.burgerOpen1 : ''}`} />
            <span className={`${s.burgerLine} ${menuOpen ? s.burgerOpen2 : ''}`} />
            <span className={`${s.burgerLine} ${menuOpen ? s.burgerOpen3 : ''}`} />
          </button>
        </div>
      </nav>
      {/* Mobile Menu */}
      <div className={`${s.mobileMenu} ${menuOpen ? s.mobileMenuOpen : ''}`}>
        <a href="#features" className={s.mobileLink} onClick={() => setMenuOpen(false)}>⚡ {isAr ? 'المميزات' : 'Features'}</a>
        <a href="#showcase" className={s.mobileLink} onClick={() => setMenuOpen(false)}>📱 {isAr ? 'النظام' : 'System'}</a>
        <a href="#plans" className={s.mobileLink} onClick={() => setMenuOpen(false)}>💎 {isAr ? 'الأسعار' : 'Pricing'}</a>
        <Link href={`/${locale}/login`} className={s.mobileLink} onClick={() => setMenuOpen(false)}>🔐 {isAr ? 'تسجيل الدخول' : 'Sign In'}</Link>
        <Link href={`/${sw}`} className={s.mobileLink} onClick={() => setMenuOpen(false)}>🌐 {isAr ? 'English' : 'عربي'}</Link>
        <Link href={`/${locale}/onboarding`} className={s.mobileCta} onClick={() => setMenuOpen(false)}>🚀 {isAr ? 'ابدأ مجاناً' : 'Start Free'}</Link>
      </div>

      {/* === Hero === */}
      <section className={s.hero}>
        <div className={s.heroGlow} />
        <div className={s.heroGrid} />
        <div className={s.heroContent}>
          <div className={s.heroText}>
            <div className={s.heroBadge}>
              ⚡ {isAr ? 'نظام إدارة الأندية #1 في الشرق الأوسط' : '#1 Gym Management System in the Middle East'}
            </div>
            <h1 className={s.heroTitle}>
              <span className={s.heroTitleGold}>Power Time</span>
              <span className={s.heroTitleWhite}>{isAr ? 'أكتر من مجرد جيم' : 'More Than a Gym'}</span>
            </h1>
            <p className={s.heroDesc}>
              {isAr
                ? 'نظام إدارة سحابي متكامل للأندية والجيمات — إدارة العضويات، الاشتراكات، المدربين، السبا، المالية، والحضور بكود QR. كل ما تحتاجه لإدارة ناديك باحترافية عالمية.'
                : 'All-in-one cloud gym management — memberships, subscriptions, trainers, spa, finance & QR attendance. Everything you need to run your gym with world-class professionalism.'}
            </p>
            <div className={s.heroBtns}>
              <Link href={`/${locale}/onboarding`} className={s.heroBtn}>
                {isAr ? '🚀 ابدأ 3 شهور مجاناً' : '🚀 Start 3 Months Free'}
              </Link>
              <a href="#showcase" className={s.heroBtnOutline}>
                {isAr ? 'شاهد النظام' : 'See the System'} ↓
              </a>
            </div>
            <div className={s.heroStats}>
              {stats.map((st, i) => (
                <div key={i} className={s.heroStat}>
                  <div className={s.heroStatVal}>{st.v}</div>
                  <div className={s.heroStatLabel}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={s.heroImage}>
            <div className={s.heroImgGlow} />
            <Image src="/images/High-tech gym dashboard visualization.webp" alt="Power Time Dashboard" width={600} height={600} className={s.heroImg} priority />
          </div>
        </div>
      </section>

      {/* === Features === */}
      <section id="features" className={s.section}>
        <span className={s.sectionTag}>{isAr ? 'المميزات' : 'FEATURES'}</span>
        <h2 className={s.sectionTitle}>{isAr ? 'كل ما يحتاجه ناديك في مكان واحد' : 'Everything Your Gym Needs in One Place'}</h2>
        <p className={s.sectionDesc}>{isAr ? 'نظام متكامل يغطي كل جوانب إدارة الأندية الحديثة — من العضويات حتى الذكاء الاصطناعي.' : 'A complete system covering every aspect of modern gym management — from memberships to AI.'}</p>
        <div className={s.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className={s.featureCard}>
              <div className={s.featureIcon}>{f.icon}</div>
              <div>
                <h3 className={s.featureTitle}>{f.t}</h3>
                <p className={s.featureDesc}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === Showcase === */}
      <section id="showcase" className={s.showcase}>
        <div className={s.showcaseInner}>
          <span className={s.sectionTag}>{isAr ? 'داخل النظام' : 'INSIDE THE SYSTEM'}</span>
          <h2 className={s.sectionTitle}>{isAr ? 'شاهد القوة بنفسك' : 'See the Power Yourself'}</h2>
          <p className={s.sectionDesc}>{isAr ? 'نظام صُمم ليمنحك السيطرة الكاملة على كل تفصيلة في ناديك.' : 'A system designed to give you complete control over every detail of your gym.'}</p>

          {showcases.map((sc, i) => (
            <div key={i} className={`${s.showcaseRow} ${sc.reverse ? s.showcaseRowReverse : ''}`}>
              <div>
                <div className={s.showcaseTag}>⚡ {sc.tag}</div>
                <h3 className={s.showcaseTitle}>{sc.title}</h3>
                <p className={s.showcaseDesc}>{sc.desc}</p>
                <ul className={s.showcaseList}>
                  {sc.list.map((item, j) => (
                    <li key={j} className={s.showcaseListItem}>
                      <span className={s.showcaseCheck}>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Image src={sc.img} alt={sc.tag} width={560} height={560} className={s.showcaseImg} />
            </div>
          ))}
        </div>
      </section>

      {/* === Plans === */}
      <section id="plans" className={s.plans}>
        <div className={s.plansInner}>
          <span className={s.sectionTag}>{isAr ? 'خطط الاشتراك' : 'PRICING'}</span>
          <h2 className={s.sectionTitle}>{isAr ? 'ابدأ مجاناً، وتوسّع حسب احتياجك' : 'Start Free, Scale as You Grow'}</h2>
          <p className={s.sectionDesc}>{isAr ? 'خطط مرنة تناسب كل أحجام الأندية — من ناديك الصغير حتى سلسلة أندية كبيرة.' : 'Flexible plans for all gym sizes — from your small club to a large fitness chain.'}</p>
          <div className={s.plansGrid}>
            {plans.map((p) => (
              <div key={p.id} className={`${s.planCard} ${p.id === 'quarterly' ? s.planPopular : ''}`}>
                {p.id === 'quarterly' && <div className={s.planBadge}>{isAr ? '⭐ الأكثر طلباً' : '⭐ Most Popular'}</div>}
                <div className={s.planName}>{p.name[locale] || p.name.ar}</div>
                <div className={s.planPrice}>
                  {p.price === 0 ? (isAr ? 'مجاناً' : 'Free') : p.price.toLocaleString()}
                  {p.price > 0 && <span className={s.planPer}> {isAr ? 'ج.م' : 'EGP'}</span>}
                </div>
                <div className={s.planPer}>{p.durationDays} {isAr ? 'يوم' : 'days'}</div>
                {p.discount && <div style={{ color: 'var(--pt-gold)', fontSize: '0.78rem', fontWeight: 700, marginTop: 6 }}>🎁 {isAr ? `خصم ${p.discount}%` : `${p.discount}% off`}</div>}
                <ul className={s.planFeatures}>
                  <li className={s.planFeature}><span className={s.showcaseCheck}>✓</span> 👥 {p.maxMembers === -1 ? '♾' : p.maxMembers} {isAr ? 'عضو' : 'members'}</li>
                  <li className={s.planFeature}><span className={s.showcaseCheck}>✓</span> 🏋️ {p.maxTrainers === -1 ? '♾' : p.maxTrainers} {isAr ? 'مدرب' : 'trainers'}</li>
                  <li className={s.planFeature}><span className={s.showcaseCheck}>{p.features?.ai_nutrition ? '✓' : '✗'}</span> 🤖 {isAr ? 'ذكاء اصطناعي' : 'AI Features'}</li>
                  <li className={s.planFeature}><span className={s.showcaseCheck}>✓</span> 📊 {isAr ? 'تحليلات متقدمة' : 'Advanced Analytics'}</li>
                </ul>
                <Link href={`/${locale}/onboarding?plan=${p.id}`} className={`${s.planBtn} ${p.id === 'quarterly' ? s.planBtnPrimary : ''}`}>
                  {p.price === 0 ? (isAr ? 'ابدأ مجاناً' : 'Start Free') : (isAr ? 'اشترك الآن' : 'Subscribe Now')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>⚡</span>
          <h2 className={s.ctaTitle}>{isAr ? 'جاهز تطوّر ناديك؟' : 'Ready to Transform Your Gym?'}</h2>
          <p className={s.ctaDesc}>
            {isAr
              ? 'انضم لمئات الأندية التي تدير أعمالها بذكاء مع Power Time. ابدأ فترتك التجريبية المجانية لمدة 3 أشهر الآن — بدون بطاقة ائتمان.'
              : 'Join hundreds of gyms managing their business smartly with Power Time. Start your free 3-month trial now — no credit card required.'}
          </p>
          <Link href={`/${locale}/onboarding`} className={s.heroBtn}>
            {isAr ? '🚀 ابدأ مجاناً الآن' : '🚀 Start Free Now'} →
          </Link>
        </div>
      </section>

      {/* === Footer === */}
      <footer className={s.footer}>
        <div className={s.footerBrand}>
          <span className={s.footerLogo}>⚡</span>
          <span className={s.footerName}>Power Time</span>
        </div>
        <p className={s.footerCopy}>© 2026 Power Time. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
      </footer>
    </div>
  );
}
