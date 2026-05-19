'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAI } from '@/lib/hooks/useAI';
import AIUsageWidget from '@/components/ai/AIUsageWidget';
import AIUpgradeModal from '@/components/ai/AIUpgradeModal';

export default function AISubscriptionPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { usage, showUpgrade, setShowUpgrade, upgradeToPremium } = useAI();

  const isPremium = usage?.plan === 'premium';

  const historyData = usage?.history || [];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🤖</span> {isAr ? 'اشتراك الذكاء الاصطناعي' : 'AI Subscription'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Current Plan Card */}
        <div>
          <div className="card" style={{
            borderTop: `3px solid ${isPremium ? '#8B5CF6' : 'var(--pt-gold)'}`,
            background: isPremium
              ? 'linear-gradient(135deg, var(--pt-dark) 0%, rgba(139,92,246,0.06) 100%)'
              : 'linear-gradient(135deg, var(--pt-dark) 0%, rgba(217,177,75,0.04) 100%)',
            marginBottom: 'var(--space-6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                  background: isPremium
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : 'var(--pt-gold-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>
                  {isPremium ? '⭐' : '🆓'}
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{isPremium ? (isAr ? 'الخطة الكاملة' : 'Full AI Plan') : (isAr ? 'الخطة المجانية' : 'Free Plan')}</h2>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                    {isPremium ? (isAr ? '500 ج.م/شهر' : '500 EGP/month') : (isAr ? 'بدون رسوم' : 'No charge')}
                  </div>
                </div>
              </div>
              <span className={`badge ${isPremium ? 'badge-diamond' : 'badge-gold'}`} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                {isPremium ? (isAr ? '⭐ نشط' : '⭐ Active') : (isAr ? '○ مجاني' : '○ Free')}
              </span>
            </div>

            {/* Plan Features */}
            <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: '#8B5CF6', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  {isAr ? '✅ ما يشمله اشتراكك' : '✅ Your Plan Includes'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {[
                    { icon: '🥗', text: isAr ? 'مساعد التغذية الذكي' : 'AI Nutrition Assistant' },
                    { icon: '🏋️', text: isAr ? 'مولّد التمارين الذكي' : 'AI Workout Generator' },
                    { icon: '🤖', text: isAr ? 'المساعد الذكي (Chat)' : 'AI Chat Assistant' },
                    { icon: '💰', text: `${isAr ? 'حد شهري: $' : 'Monthly limit: $'}${isPremium ? '5.00' : '1.00'}` },
                    { icon: '📊', text: `${isPremium ? (isAr ? '100 طلب/يوم' : '100 req/day') : (isAr ? '10 طلبات/يوم' : '10 req/day')}` },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                      <span>{f.icon}</span> {f.text}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  {isAr ? '📊 إحصائيات الاستخدام' : '📊 Usage Stats'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'الاستخدام' : 'Used'}</span>
                    <span style={{ fontWeight: 700 }}>${usage?.usedUSD?.toFixed(4) || '0.0000'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'الحد' : 'Limit'}</span>
                    <span style={{ fontWeight: 700 }}>${usage?.monthlyLimitUSD?.toFixed(2) || '1.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'متبقي' : 'Remaining'}</span>
                    <span style={{ fontWeight: 700, color: 'var(--pt-success)' }}>${usage?.remainingUSD?.toFixed(4) || '1.0000'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'إجمالي الطلبات' : 'Total Requests'}</span>
                    <span style={{ fontWeight: 700 }}>{usage?.requestCount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'إجمالي التوكنز' : 'Total Tokens'}</span>
                    <span style={{ fontWeight: 700 }}>{(usage?.totalTokens || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            {!isPremium && (
              <button
                className="btn btn-lg"
                onClick={() => setShowUpgrade(true)}
                style={{ width: '100%', marginTop: 'var(--space-5)', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', border: 'none', fontSize: 'var(--font-size-md)' }}
              >
                ⭐ {isAr ? 'ترقية للخطة الكاملة — 500 ج.م/شهر' : 'Upgrade to Full AI — 500 EGP/month'}
              </button>
            )}
          </div>

          {/* Usage History */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>📜 {isAr ? 'سجل الاستخدام' : 'Usage History'}</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                    <th>{isAr ? 'الميزة' : 'Feature'}</th>
                    <th>{isAr ? 'الإجراء' : 'Action'}</th>
                    <th>{isAr ? 'التوكنز' : 'Tokens'}</th>
                    <th>{isAr ? 'التكلفة' : 'Cost'}</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>{h.date}</td>
                      <td style={{ fontSize: '1.2rem' }}>{h.feature}</td>
                      <td>{h.action}</td>
                      <td>{h.tokens.toLocaleString()}</td>
                      <td style={{ color: '#8B5CF6', fontWeight: 600 }}>${h.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <AIUsageWidget usage={usage} locale={locale} onUpgrade={() => setShowUpgrade(true)} />

          {/* Quick Access */}
          <div className="card">
            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              ⚡ {isAr ? 'أدوات AI' : 'AI Tools'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Link href={`/${locale}/client/ai-nutrition`} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                🥗 {isAr ? 'مساعد التغذية' : 'Nutrition AI'}
              </Link>
              <Link href={`/${locale}/client/ai-workout`} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                🏋️ {isAr ? 'مولّد التمارين' : 'Workout AI'}
              </Link>
              <Link href={`/${locale}/client/ai-assistant`} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                🤖 {isAr ? 'المساعد الذكي' : 'AI Chat'}
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="card">
            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              ❓ {isAr ? 'أسئلة شائعة' : 'FAQ'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                {
                  q: isAr ? 'ما هي التوكنز؟' : 'What are tokens?',
                  a: isAr ? 'التوكنز هي وحدة قياس استخدام الذكاء الاصطناعي. كل طلب يستهلك عدد من التوكنز بناءً على طول السؤال والإجابة.' : 'Tokens measure AI usage. Each request uses tokens based on question and answer length.',
                },
                {
                  q: isAr ? 'متى يتم تصفير الاستخدام؟' : 'When does usage reset?',
                  a: isAr ? 'يتم تصفير رصيد التوكنز تلقائياً في بداية كل شهر ميلادي.' : 'Token usage resets automatically at the start of each calendar month.',
                },
                {
                  q: isAr ? 'ما الفرق بين المجانية والكاملة؟' : 'Free vs Premium difference?',
                  a: isAr ? 'الخطة المجانية تتيح $1 شهرياً (حوالي 20 طلب). الكاملة تتيح $5 شهرياً (حوالي 100+ طلب) مع أولوية في الاستجابة.' : 'Free allows $1/month (~20 requests). Premium allows $5/month (~100+ requests) with priority.',
                },
              ].map((faq, i) => (
                <details key={i} style={{ cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: '#8B5CF6', marginBottom: 'var(--space-1)' }}>{faq.q}</summary>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', margin: 'var(--space-1) 0 0', paddingInlineStart: 'var(--space-3)' }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AIUpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={upgradeToPremium} locale={locale} usage={usage} />
    </div>
  );
}
