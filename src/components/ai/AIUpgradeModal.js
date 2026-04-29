'use client';

export default function AIUpgradeModal({ show, onClose, onUpgrade, locale, usage }) {
  if (!show) return null;

  const isAr = locale === 'ar';

  const features = [
    { free: isAr ? '10 طلبات/يوم' : '10 requests/day', premium: isAr ? '100 طلب/يوم' : '100 requests/day' },
    { free: isAr ? 'حد $1/شهر' : '$1/month limit', premium: isAr ? 'حد $5/شهر' : '$5/month limit' },
    { free: isAr ? 'مساعد تغذية أساسي' : 'Basic nutrition AI', premium: isAr ? 'مساعد تغذية متقدم' : 'Advanced nutrition AI' },
    { free: isAr ? 'مولّد تمارين أساسي' : 'Basic workout AI', premium: isAr ? 'مولّد تمارين متقدم' : 'Advanced workout AI' },
    { free: isAr ? 'محادثة محدودة' : 'Limited chat', premium: isAr ? 'محادثة غير محدودة' : 'Unlimited chat' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-6)',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.1) 100%)',
          borderBottom: '1px solid var(--glass-border)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>🤖✨</div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>
            {isAr ? 'ترقية الذكاء الاصطناعي' : 'Upgrade AI Plan'}
          </h2>
          <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
            {isAr ? 'لقد استنفذت رصيدك الشهري المجاني' : "You've used your free monthly quota"}
          </p>
          {usage && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--pt-danger-bg)', color: 'var(--pt-danger)',
              padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)', fontWeight: 600, marginTop: 'var(--space-2)',
            }}>
              ⚠️ ${usage.usedUSD?.toFixed(3)} / ${usage.monthlyLimitUSD?.toFixed(2)} {isAr ? 'مستخدم' : 'used'}
            </div>
          )}
        </div>

        {/* Plan Comparison */}
        <div style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {/* Free Plan */}
            <div style={{
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)', opacity: 0.7,
            }}>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>
                  {isAr ? 'الخطة الحالية' : 'Current Plan'}
                </div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)' }}>
                  {isAr ? 'مجانية' : 'Free'}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>$1/{isAr ? 'شهر' : 'month'}</div>
              </div>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) 0', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                  <span>○</span> {f.free}
                </div>
              ))}
            </div>

            {/* Premium Plan */}
            <div style={{
              border: '2px solid #8B5CF6', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.04))',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white',
                padding: '2px 12px', borderRadius: 'var(--radius-full)',
                fontSize: '10px', fontWeight: 700,
              }}>
                ⭐ {isAr ? 'موصى بها' : 'Recommended'}
              </div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#8B5CF6', marginBottom: 'var(--space-1)' }}>
                  {isAr ? 'الخطة الكاملة' : 'Full Plan'}
                </div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', color: '#8B5CF6' }}>
                  500 {isAr ? 'ج.م' : 'EGP'}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>$5/{isAr ? 'شهر' : 'month'} limit</div>
              </div>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) 0', fontSize: 'var(--font-size-xs)' }}>
                  <span style={{ color: '#8B5CF6' }}>✓</span> {f.premium}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--glass-border)',
          display: 'flex', gap: 'var(--space-3)',
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            {isAr ? 'لاحقاً' : 'Later'}
          </button>
          <button
            className="btn btn-primary"
            onClick={onUpgrade}
            style={{ flex: 2, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' }}
          >
            ⭐ {isAr ? 'اشترك الآن — 500 ج.م/شهر' : 'Subscribe Now — 500 EGP/mo'}
          </button>
        </div>
      </div>
    </div>
  );
}
