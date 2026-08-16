'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Shows a newly-created member's check-in code as a big readable string plus a
 * scannable QR. The QR encodes the membership number verbatim, which is exactly
 * what the attendance scanner looks up (members.membershipNumber, falling back
 * to members.qrCode), so a phone photo of this card works at the door.
 *
 * The `qrcode` lib is imported lazily so it never lands in the initial bundle.
 */
export default function MemberCodeCard({ code, memberName, planName, endDate, isAr = true }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!code) return;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(String(code), {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0D0D0D', light: '#FFFFFF' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=420,height=640');
    if (!w) return;
    // Everything is escaped/derived from our own data; the QR is a data: URI.
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
    w.document.write(`<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}"><head>
<meta charset="utf-8"><title>${esc(code)}</title>
<style>
  body{font-family:system-ui,'Segoe UI',Tahoma,sans-serif;margin:0;padding:24px;
       display:flex;align-items:center;justify-content:center;background:#fff;color:#111}
  .card{width:320px;border:2px solid #111;border-radius:16px;padding:24px;text-align:center}
  .gym{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:14px}
  .name{font-size:19px;font-weight:800;margin-bottom:4px}
  .plan{font-size:13px;color:#555;margin-bottom:16px}
  .code{font-family:ui-monospace,Consolas,monospace;font-size:26px;font-weight:800;
        letter-spacing:2px;margin:14px 0 6px;direction:ltr}
  .hint{font-size:11px;color:#777;margin-top:12px}
  img{width:200px;height:200px}
</style></head><body onload="window.print()">
<div class="card">
  <div class="gym">POWER TIME</div>
  <div class="name">${esc(memberName)}</div>
  <div class="plan">${esc(planName || '')}${endDate ? ' · ' + esc(endDate) : ''}</div>
  <img src="${qrDataUrl}" alt="">
  <div class="code">${esc(code)}</div>
  <div class="hint">${isAr ? 'اعرض هذا الكود عند الاستقبال لتسجيل الحضور' : 'Show this code at reception to check in'}</div>
</div></body></html>`);
    w.document.close();
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(String(code)); } catch { /* clipboard blocked */ }
  };

  return (
    <div
      ref={printRef}
      className="card"
      style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}
    >
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>✅</div>
      <h2 style={{ marginBottom: 'var(--space-1)' }}>
        {isAr ? 'تمت إضافة العضو' : 'Member added'}
      </h2>
      <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)' }}>
        {memberName}{planName ? ` · ${planName}` : ''}
      </p>

      <div style={{
        background: '#fff', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
        display: 'inline-block', marginBottom: 'var(--space-4)', minHeight: 200, minWidth: 200,
      }}>
        {qrDataUrl
          ? <img src={qrDataUrl} alt={isAr ? 'كود العضو' : 'Member code'} style={{ width: 200, height: 200, display: 'block' }} />
          : <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>…</div>}
      </div>

      <div style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
        {isAr ? 'كود تسجيل الحضور' : 'Check-in code'}
      </div>
      <div
        dir="ltr"
        style={{
          fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 'var(--font-size-xl)',
          fontWeight: 900, letterSpacing: 2, color: 'var(--pt-gold)', marginBottom: 'var(--space-5)',
        }}
      >
        {code}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={copyCode}>
          📋 {isAr ? 'نسخ الكود' : 'Copy code'}
        </button>
        <button className="btn btn-primary" onClick={handlePrint} disabled={!qrDataUrl}>
          🖨️ {isAr ? 'طباعة الكارت' : 'Print card'}
        </button>
      </div>
    </div>
  );
}
