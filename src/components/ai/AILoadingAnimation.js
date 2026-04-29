'use client';

export default function AILoadingAnimation({ locale, message }) {
  const isAr = locale === 'ar';

  return (
    <div className="ai-loading-container" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-8)', gap: 'var(--space-4)',
    }}>
      {/* Pulsing AI brain */}
      <div style={{ position: 'relative' }}>
        <div className="ai-pulse-ring" />
        <div className="ai-pulse-ring" style={{ animationDelay: '0.4s' }} />
        <div className="ai-pulse-ring" style={{ animationDelay: '0.8s' }} />
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', position: 'relative', zIndex: 1,
          animation: 'float 2s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
        }}>
          🤖
        </div>
      </div>

      {/* Typing dots */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#8B5CF6',
            animation: `aiDotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>

      {/* Message */}
      <div style={{ textAlign: 'center', color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
        {message || (isAr ? 'الذكاء الاصطناعي يفكر...' : 'AI is thinking...')}
      </div>
    </div>
  );
}
