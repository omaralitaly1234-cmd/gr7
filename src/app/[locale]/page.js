'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import s from './landing.module.css';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';

function useAnim() {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.12 }); o.observe(el); return () => o.disconnect(); }, []);
  return [ref, v];
}
function Counter({ end, suffix = '', dur = 1800 }) {
  const [val, setVal] = useState(0); const ref = useRef(null); const ran = useRef(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting && !ran.current) { ran.current = true; const n = parseFloat(String(end).replace(/[^0-9.]/g, '')); if (isNaN(n)) { setVal(end); return; } const t0 = performance.now(); const go = (t) => { const p = Math.min((t - t0) / dur, 1); const e2 = 1 - Math.pow(1 - p, 3); setVal(n % 1 !== 0 ? +(n * e2).toFixed(1) : Math.floor(n * e2)); if (p < 1) requestAnimationFrame(go); else setVal(n); }; requestAnimationFrame(go); o.disconnect(); } }, { threshold: 0.5 }); o.observe(el); return () => o.disconnect(); }, [end, dur]);
  return <span ref={ref} className={s.counter}>{val}{suffix}</span>;
}
function A({ children, delay = 0 }) { const [r, v] = useAnim(); return <div ref={r} className={`${s.animItem} ${v ? s.animVisible : ''}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>; }

export default function LandingPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const sw = isAr ? 'en' : 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [isDay, setIsDay] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { const h = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', h); setIsDay(new Date().getHours() >= 6 && new Date().getHours() < 18); return () => window.removeEventListener('scroll', h); }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close menu on scroll
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close);
    return () => window.removeEventListener('scroll', close);
  }, [menuOpen]);

  const features = [
    { icon: '👥', t: isAr ? 'إدارة العضويات الذكية' : 'Smart Membership', d: isAr ? 'نظام شامل لإدارة آلاف الأعضاء مع ملفات تعريف مفصلة، تجديد تلقائي، وفلاتر بحث متقدمة.' : 'Complete system managing thousands of members with profiles, auto-renewal, and advanced filters.' },
    { icon: '💳', t: isAr ? 'اشتراكات مرنة' : 'Flexible Plans', d: isAr ? 'خطط ذهبية وماسية مع تجميد ذكي، تجديد تلقائي، وتتبع الحصص لكل عضو بدقة.' : 'Gold & Diamond plans with smart freeze, auto-renewal, and precise session tracking.' },
    { icon: '📱', t: isAr ? 'حضور QR فوري' : 'QR Attendance', d: isAr ? 'مسح سريع لكود QR مع تحقق فوري من صلاحية الاشتراك وتسجيل تلقائي للحضور.' : 'Quick QR scan with instant validation and automatic attendance logging.' },
    { icon: '🧖', t: isAr ? 'إدارة السبا' : 'Spa Management', d: isAr ? 'نظام حجز متكامل لخدمات السبا والمساج والساونا مع تتبع حقوق الأعضاء.' : 'Complete booking for spa, massage & sauna with member entitlement tracking.' },
    { icon: '💪', t: isAr ? 'بوابة المدرب' : 'Trainer Portal', d: isAr ? 'برامج تمارين وأنظمة غذائية مخصصة مع متابعة تقدم العملاء وتحليل الأداء.' : 'Custom workout & diet plans with progress tracking and performance analysis.' },
    { icon: '💰', t: isAr ? 'إدارة مالية' : 'Finance', d: isAr ? 'تقارير مالية احترافية، فواتير PDF، تتبع العمولات والمصاريف، وتحليل الإيرادات.' : 'Professional reports, PDF invoices, commission tracking, and revenue analysis.' },
    { icon: '🤖', t: isAr ? 'ذكاء اصطناعي' : 'AI Assistant', d: isAr ? 'مساعد ذكي يقدم خطط تغذية وتدريب مخصصة، تنبؤات بالإيرادات، وتحليل سلوك الأعضاء.' : 'AI providing custom nutrition & workout plans, forecasts, and behavior analysis.' },
    { icon: '🔔', t: isAr ? 'إشعارات ذكية' : 'Smart Alerts', d: isAr ? 'تذكيرات تلقائية للتجديد والمواعيد، حملات تسويقية مستهدفة، وإشعارات فورية.' : 'Auto reminders, targeted campaigns, and instant push notifications.' },
  ];
  const stats = [
    { v: 10, sf: 'K+', l: isAr ? 'عضو نشط' : 'Active Members' },
    { v: 500, sf: '+', l: isAr ? 'نادي ومركز' : 'Gyms & Centers' },
    { v: 99.9, sf: '%', l: isAr ? 'وقت التشغيل' : 'Uptime' },
    { v: 4.9, sf: '★', l: isAr ? 'تقييم العملاء' : 'Client Rating' },
  ];
  const showcases = [
    { img: '/images/Futuristic gym dashboard in gold accents.webp', tag: isAr ? 'لوحة تحكم ذكية' : 'Smart Dashboard', title: isAr ? 'تحكم كامل من شاشة واحدة' : 'Full Control From One Screen', desc: isAr ? 'لوحة تحكم تفاعلية تعرض الأعضاء النشطين، الإيرادات، الحضور، والتنبيهات في الوقت الحقيقي.' : 'Interactive dashboard with active members, revenue, attendance, and real-time alerts.', list: isAr ? ['إحصائيات فورية ومحدثة','تنبيهات ذكية للاشتراكات','تقارير مالية يومية وشهرية','متابعة أداء المدربين'] : ['Real-time statistics','Smart subscription alerts','Daily & monthly reports','Trainer monitoring'] },
    { img: '/images/PowerTime gym session with trainer.webp', tag: isAr ? 'إدارة المدربين' : 'Trainers', title: isAr ? 'مدربين أكثر إنتاجية' : 'More Productive Trainers', desc: isAr ? 'أدوات احترافية لإنشاء برامج تدريبية مخصصة وخطط تغذية بالذكاء الاصطناعي.' : 'Professional tools for custom programs and AI nutrition plans.', list: isAr ? ['برامج تدريب مخصصة','خطط تغذية AI','متابعة القياسات','تقييم أداء تلقائي'] : ['Custom programs','AI nutrition','Body tracking','Auto evaluation'], reverse: true },
    { img: '/images/Luxurious spa booking experience.webp', tag: isAr ? 'خدمات السبا' : 'Spa', title: isAr ? 'تجربة سبا فاخرة' : 'Premium Spa Experience', desc: isAr ? 'نظام حجز متطور لخدمات السبا — ساونا، جاكوزي، حمام مغربي، ومساج.' : 'Advanced booking for sauna, jacuzzi, Moroccan bath & massage.', list: isAr ? ['حجز فوري للخدمات','تتبع حقوق الأعضاء','جدول الخدمات','تقارير الإشغال'] : ['Instant booking','Member tracking','Service schedule','Occupancy reports'] },
  ];
  const plans = [{ ...PLAN_DEFINITIONS.trial, highlight: true }, PLAN_DEFINITIONS.monthly, PLAN_DEFINITIONS.quarterly, PLAN_DEFINITIONS.semi_annual, PLAN_DEFINITIONS.annual];

  return (
    <div className={`${s.landing} ${isDay ? s.dayMode : ''}`}>
      {/* Nav */}
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ''}`}>
        <Link href={`/${locale}`} className={s.navLogo}><span className={s.navLogoIcon}>⚡</span><span className={s.navLogoText}>Power Time</span></Link>
        <div className={s.navDesktop}>
          <a href="#features" className={s.navLink}>{isAr ? 'المميزات' : 'Features'}</a>
          <a href="#showcase" className={s.navLink}>{isAr ? 'النظام' : 'System'}</a>
          <a href="#plans" className={s.navLink}>{isAr ? 'الأسعار' : 'Pricing'}</a>
          <Link href={`/${sw}`} className={s.navLink}>{isAr ? 'EN' : 'ع'}</Link>
          <Link href={`/${locale}/login`} className={s.navLink}>{isAr ? 'دخول' : 'Sign In'}</Link>
          <Link href={`/${locale}/onboarding`} className={s.navCta}>{isAr ? 'ابدأ مجاناً' : 'Start Free'}</Link>
          <button onClick={() => setIsDay(!isDay)} className={s.navLink} aria-label="Theme">{isDay ? '🌙' : '☀️'}</button>
        </div>
        <div className={s.navMobileRight}>
          <button onClick={() => setIsDay(!isDay)} className={s.navLink} aria-label="Theme">{isDay ? '🌙' : '☀️'}</button>
          <Link href={`/${locale}/onboarding`} className={s.navCta}>{isAr ? 'ابدأ' : 'Start'}</Link>
          <button className={s.burger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`${s.burgerLine} ${menuOpen ? s.burgerOpen1 : ''}`} /><span className={`${s.burgerLine} ${menuOpen ? s.burgerOpen2 : ''}`} /><span className={`${s.burgerLine} ${menuOpen ? s.burgerOpen3 : ''}`} />
          </button>
        </div>
      </nav>
      <div className={`${s.mobileMenu} ${menuOpen ? s.mobileMenuOpen : ''}`}>
        <a href="#features" className={s.mobileLink} onClick={() => setMenuOpen(false)}>⚡ {isAr ? 'المميزات' : 'Features'}</a>
        <a href="#showcase" className={s.mobileLink} onClick={() => setMenuOpen(false)}>📱 {isAr ? 'النظام' : 'System'}</a>
        <a href="#plans" className={s.mobileLink} onClick={() => setMenuOpen(false)}>💎 {isAr ? 'الأسعار' : 'Pricing'}</a>
        <Link href={`/${locale}/login`} className={s.mobileLink} onClick={() => setMenuOpen(false)}>🔐 {isAr ? 'تسجيل الدخول' : 'Sign In'}</Link>
        <Link href={`/${sw}`} className={s.mobileLink} onClick={() => setMenuOpen(false)}>🌐 {isAr ? 'English' : 'عربي'}</Link>
        <Link href={`/${locale}/onboarding`} className={s.mobileCta} onClick={() => setMenuOpen(false)}>🚀 {isAr ? 'ابدأ مجاناً' : 'Start Free'}</Link>
      </div>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroGlow} /><div className={s.heroGlow2} /><div className={s.heroGrid} />
        <div className={s.heroContent}>
          <div>
            <div className={s.heroBadge}>⚡ {isAr ? 'نظام إدارة الأندية #1 في الشرق الأوسط' : '#1 Gym Management System in the Middle East'}</div>
            <h1 className={s.heroTitle}><span className={s.heroTitleGold}>Power Time</span><span className={s.heroTitleWhite}>{isAr ? 'أكتر من مجرد جيم' : 'More Than a Gym'}</span></h1>
            <p className={s.heroDesc}>{isAr ? 'نظام سحابي متكامل لإدارة الأندية — العضويات، الاشتراكات، المدربين، السبا، المالية، والحضور بـ QR. كل ما تحتاجه باحترافية عالمية.' : 'All-in-one cloud gym management — memberships, trainers, spa, finance & QR attendance. World-class professionalism.'}</p>
            <div className={s.heroBtns}>
              <Link href={`/${locale}/onboarding`} className={s.heroBtn}>🚀 {isAr ? 'ابدأ 3 شهور مجاناً' : 'Start 3 Months Free'}</Link>
              <a href="#showcase" className={s.heroBtnOutline}>{isAr ? 'شاهد النظام ↓' : 'See System ↓'}</a>
            </div>
            <div className={s.heroStats}>
              {stats.map((st, i) => (<div key={i} className={s.heroStat}><div className={s.heroStatVal}><Counter end={st.v} suffix={st.sf} /></div><div className={s.heroStatLabel}>{st.l}</div></div>))}
            </div>
          </div>
          <div className={s.heroImage}><div className={s.heroImgGlow} /><Image src="/images/High-tech gym dashboard visualization.webp" alt="Power Time" width={600} height={600} className={s.heroImg} priority /></div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={s.section}>
        <A><span className={s.sectionTag}>{isAr ? 'المميزات' : 'FEATURES'}</span></A>
        <A delay={80}><h2 className={s.sectionTitle}>{isAr ? 'كل ما يحتاجه ناديك' : 'Everything Your Gym Needs'}</h2></A>
        <A delay={160}><p className={s.sectionDesc}>{isAr ? 'نظام متكامل يغطي كل جوانب إدارة الأندية — من العضويات حتى الذكاء الاصطناعي.' : 'Complete system covering every aspect of gym management — memberships to AI.'}</p></A>
        <div className={s.featuresGrid}>{features.map((f, i) => (<A key={i} delay={i * 60}><div className={s.featureCard}><div className={s.featureIcon}>{f.icon}</div><div><h3 className={s.featureTitle}>{f.t}</h3><p className={s.featureDesc}>{f.d}</p></div></div></A>))}</div>
      </section>

      {/* Showcase */}
      <section id="showcase" className={s.showcase}>
        <div className={s.showcaseInner}>
          <A><span className={s.sectionTag}>{isAr ? 'داخل النظام' : 'INSIDE THE SYSTEM'}</span></A>
          <A delay={80}><h2 className={s.sectionTitle}>{isAr ? 'شاهد القوة بنفسك' : 'See the Power'}</h2></A>
          <A delay={160}><p className={s.sectionDesc}>{isAr ? 'صُمم ليمنحك السيطرة الكاملة على كل تفصيلة.' : 'Designed to give you complete control over every detail.'}</p></A>
          {showcases.map((sc, i) => (<A key={i} delay={80}><div className={`${s.showcaseRow} ${sc.reverse ? s.showcaseRowReverse : ''}`}><div><div className={s.showcaseTag}>⚡ {sc.tag}</div><h3 className={s.showcaseTitle}>{sc.title}</h3><p className={s.showcaseDesc}>{sc.desc}</p><ul className={s.showcaseList}>{sc.list.map((item, j) => (<li key={j} className={s.showcaseListItem}><span className={s.showcaseCheck}>✓</span> {item}</li>))}</ul></div><Image src={sc.img} alt={sc.tag} width={560} height={560} className={s.showcaseImg} /></div></A>))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className={s.plans}>
        <div className={s.plansInner}>
          <A><span className={s.sectionTag}>{isAr ? 'الأسعار' : 'PRICING'}</span></A>
          <A delay={80}><h2 className={s.sectionTitle}>{isAr ? 'ابدأ مجاناً وتوسّع' : 'Start Free, Scale Up'}</h2></A>
          <A delay={160}><p className={s.sectionDesc}>{isAr ? 'خطط مرنة تناسب كل الأحجام — من ناديك الصغير لسلسلة كبيرة.' : 'Flexible plans for all sizes — small club to large chain.'}</p></A>
          <div className={s.plansGrid}>{plans.map((p, i) => (<A key={p.id} delay={i * 60}><div className={`${s.planCard} ${p.id === 'quarterly' ? s.planPopular : ''}`}>{p.id === 'quarterly' && <div className={s.planBadge}>{isAr ? '⭐ الأكثر طلباً' : '⭐ Popular'}</div>}<div className={s.planName}>{p.name[locale] || p.name.ar}</div><div className={s.planPrice}>{p.price === 0 ? (isAr ? 'مجاناً' : 'Free') : p.price.toLocaleString()}{p.price > 0 && <span className={s.planPer}> {isAr ? 'ج.م' : 'EGP'}</span>}</div><div className={s.planPer}>{p.durationDays} {isAr ? 'يوم' : 'days'}</div>{p.discount && <div style={{ color: 'var(--gold)', fontSize: '.75rem', fontWeight: 700, marginTop: 4 }}>🎁 {isAr ? `خصم ${p.discount}%` : `${p.discount}% off`}</div>}<ul className={s.planFeatures}><li className={s.planFeature}><span className={s.showcaseCheck}>✓</span> 👥 {p.maxMembers === -1 ? '♾' : p.maxMembers} {isAr ? 'عضو' : 'members'}</li><li className={s.planFeature}><span className={s.showcaseCheck}>✓</span> 🏋️ {p.maxTrainers === -1 ? '♾' : p.maxTrainers} {isAr ? 'مدرب' : 'trainers'}</li><li className={s.planFeature}><span className={s.showcaseCheck}>{p.features?.ai_nutrition ? '✓' : '✗'}</span> 🤖 AI</li></ul><Link href={`/${locale}/onboarding?plan=${p.id}`} className={`${s.planBtn} ${p.id === 'quarterly' ? s.planBtnPrimary : ''}`}>{p.price === 0 ? (isAr ? 'ابدأ مجاناً' : 'Start Free') : (isAr ? 'اشترك' : 'Subscribe')}</Link></div></A>))}</div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}><A><div className={s.ctaInner}><span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '.75rem' }}>⚡</span><h2 className={s.ctaTitle}>{isAr ? 'جاهز تطوّر ناديك؟' : 'Ready to Transform?'}</h2><p className={s.ctaDesc}>{isAr ? 'انضم لمئات الأندية مع Power Time. ابدأ 3 أشهر مجاناً — بدون بطاقة ائتمان.' : 'Join hundreds of gyms with Power Time. Start 3 months free — no credit card.'}</p><Link href={`/${locale}/onboarding`} className={s.heroBtn}>🚀 {isAr ? 'ابدأ الآن' : 'Start Now'} →</Link></div></A></section>

      {/* Footer */}
      <footer className={s.footer}><div className={s.footerBrand}><span className={s.footerLogo}>⚡</span><span className={s.footerName}>Power Time</span></div><p className={s.footerCopy}>© 2026 Power Time. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p></footer>
    </div>
  );
}
