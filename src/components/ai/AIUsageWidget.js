'use client';

export default function AIUsageWidget({ usage, locale, compact = false, onUpgrade }) {
  if (!usage) return null;

  const isAr = locale === 'ar';
  const percent = usage.usagePercent || 0;
  const barColor = percent >= 90 ? 'var(--pt-danger)' : percent >= 70 ? 'var(--pt-warning)' : 'var(--ai-accent, #8B5CF6)';
  const planName = isAr ? usage.planNameAr : usage.planNameEn;

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
        background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-xs)',
      }}>
        <span>🤖</span>
        <div style={{ flex: 1, height: 4, background: 'var(--pt-gray-800)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: barColor, borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
        </div>
        <span style={{ color: 'var(--pt-gray-500)', whiteSpace: 'nowrap' }}>${usage.usedUSD?.toFixed(3)} / ${usage.monthlyLimitUSD?.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div className="card" style={{
      borderTop: '3px solid var(--ai-accent, #8B5CF6)',
      background: 'linear-gradient(135deg, var(--pt-dark) 0%, rgba(139,92,246,0.05) 100%)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-lg)' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
              {isAr ? 'استخدام الذكاء الاصطناعي' : 'AI Usage'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
              {planName} — {usage.month}
            </div>
          </div>
        </div>
        <span className={`badge ${usage.plan === 'premium' ? 'badge-diamond' : 'badge-gold'}`} style={{ fontSize: '10px' }}>
          {usage.plan === 'premium' ? (isAr ? '⭐ كاملة' : '⭐ Premium') : (isAr ? 'مجانية' : 'Free')}
        </span>
      </div>

      {/* Usage Bar */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)', marginBottom: '4px' }}>
          <span>${usage.usedUSD?.toFixed(4)}</span>
          <span>{percent}%</span>
          <span>${usage.monthlyLimitUSD?.toFixed(2)}</span>
        </div>
        <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${percent}%`, height: '100%', background: barColor,
            borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div style={{ flex: 1, background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, color: 'var(--ai-accent, #8B5CF6)' }}>{usage.requestCount || 0}</div>
          <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{isAr ? 'طلب' : 'Requests'}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, color: 'var(--pt-success)' }}>${usage.remainingUSD?.toFixed(3)}</div>
          <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{isAr ? 'متبقي' : 'Remaining'}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--pt-darker)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 800 }}>{(usage.totalTokens || 0).toLocaleString()}</div>
          <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{isAr ? 'توكنز' : 'Tokens'}</div>
        </div>
      </div>

      {/* Upgrade Button */}
      {usage.plan !== 'premium' && (
        <button
          className="btn btn-primary btn-sm"
          onClick={onUpgrade}
          style={{ width: '100%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
        >
          ⭐ {isAr ? 'ترقية للخطة الكاملة — 500 ج.م/شهر' : 'Upgrade to Full AI — 500 EGP/mo'}
        </button>
      )}
    </div>
  );
}
