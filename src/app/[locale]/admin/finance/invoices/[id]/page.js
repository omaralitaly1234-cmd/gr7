'use client';

// A real invoice document for one recorded payment.
//
// This page used to render hard-coded mock data — the same fabricated member,
// the same INV-2026-0042, the same three fake line items, for every id in the
// URL. It now reads the payment it was asked for, the member it belongs to and
// the gym's own details from admin/settings.
//
// Every number shown comes from the payment document as recorded. The total is
// the cash that actually changed hands; nothing is computed into existence.

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocument } from '@/lib/firebase/firestore';
import { loadGymProfile } from '@/lib/firebase/gym-settings';
import { useTenant } from '@/context/TenantContext';
import { buildInvoiceView, money } from '@/lib/invoice-view';
import { gymName, gymAddress, DEFAULT_GYM_PROFILE } from '@/lib/gym-profile';
import { formatDate } from '@/lib/format';

// The global print stylesheet already hides the sidebar and buttons, but the
// invoice's own panels are painted with dark theme variables via inline styles,
// which no stylesheet can override. Force them light for paper.
const PRINT_CSS = `
@media print {
  .invoice-panel { background: #f7f7f7 !important; border: 1px solid #ddd !important; }
  .invoice-doc, .invoice-doc * { color: #222 !important; }
  .invoice-accent { color: #8a6d00 !important; }
  .invoice-muted { color: #666 !important; }
  .invoice-doc { box-shadow: none !important; border: none !important; }
  .no-print { display: none !important; }
}
`;

export default function InvoiceDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const invoiceId = params?.id;
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_GYM_PROFILE);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!tenantId || !invoiceId) { setLoading(false); return; }
      try {
        const [{ data: payment }, gym] = await Promise.all([
          getTenantDocument(tenantId, 'payments', invoiceId),
          loadGymProfile(tenantId),
        ]);
        setProfile(gym);

        if (!payment) { setNotFound(true); setLoading(false); return; }

        // The member may have been deleted since; the invoice still stands, and
        // buildInvoiceView falls back to the name stored on the payment row.
        const { data: member } = payment.memberId
          ? await getTenantDocument(tenantId, 'members', payment.memberId)
          : { data: null };

        setInvoice(buildInvoiceView(payment, member, gym, { locale }));
      } catch (err) {
        console.error('[Invoice] load failed:', err);
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [tenantId, invoiceId, locale]);

  const fmt = (n) => money(n, invoice?.currency || profile.currency, locale);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
          <p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <h1><span>🧾</span> {isAr ? 'فاتورة' : 'Invoice'}</h1>
          <Link href={`/${locale}/admin/finance/invoices`} className="btn btn-secondary">← {t('common.back')}</Link>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🔍</div>
          <h3>{isAr ? 'الفاتورة دي مش موجودة' : 'This invoice does not exist'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>
            {isAr
              ? 'يمكن تكون اتحذفت، أو اللينك مش مظبوط.'
              : 'It may have been deleted, or the link is wrong.'}
          </p>
        </div>
      </div>
    );
  }

  const { totals, member } = invoice;

  return (
    <div className="animate-fadeIn">
      <style>{PRINT_CSS}</style>

      <div className="page-header">
        <h1>
          <span>🧾</span> {isAr ? 'فاتورة' : 'Invoice'}{' '}
          {invoice.hasNumber
            ? invoice.number
            : <span style={{ color: 'var(--pt-warning)', fontSize: 'var(--font-size-md)' }}>
                ({isAr ? 'من غير رقم' : 'unnumbered'})
              </span>}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link href={`/${locale}/admin/finance/invoices`} className="btn btn-secondary btn-sm">← {t('common.back')}</Link>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            🖨️ {isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
          </button>
        </div>
      </div>

      {!invoice.hasNumber && (
        <div className="card no-print" style={{
          marginBottom: 'var(--space-5)', background: 'var(--pt-gold-glow)',
          border: '1px solid rgba(245,197,24,0.3)',
        }}>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            💡 {isAr
              ? 'الفاتورة دي لسه من غير رقم تسلسلي. ارجع لقائمة الفواتير واضغط "ترقيم الفواتير القديمة" وهتاخد رقمها.'
              : 'This invoice has no serial yet. Go back to the invoices list and press "Number old invoices".'}
          </p>
        </div>
      )}

      <div className="card invoice-doc" style={{ maxWidth: 800, margin: '0 auto' }} id="invoice-print">
        {/* Gym header — the gym's own details, from admin/settings */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-5)',
          borderBottom: '2px solid var(--glass-border)', gap: 'var(--space-4)', flexWrap: 'wrap',
        }}>
          <div>
            <div className="invoice-accent" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>
              ⚡ {gymName(profile, locale)}
            </div>
            <div className="invoice-muted" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)', marginTop: 'var(--space-2)', lineHeight: 1.8 }}>
              {gymAddress(profile, locale) && <>{gymAddress(profile, locale)}<br /></>}
              {profile.phone && <>📞 <span dir="ltr">{profile.phone}</span><br /></>}
              {profile.email && <>📧 <span dir="ltr">{profile.email}</span></>}
            </div>
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <div className="invoice-accent" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>
              {isAr ? 'فاتورة' : 'INVOICE'}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
              <div><strong dir="ltr">{invoice.hasNumber ? invoice.number : '—'}</strong></div>
              <div className="invoice-muted" style={{ color: 'var(--pt-gray-500)' }}>
                {t('common.date')}: {formatDate(invoice.date, locale)}
              </div>
            </div>
            <span className={`badge ${invoice.isSettled ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: 'var(--space-2)' }}>
              {invoice.isSettled
                ? (isAr ? '✓ مدفوعة' : '✓ Paid')
                : (isAr ? '⏳ متبقي عليها' : '⏳ Balance due')}
            </span>
          </div>
        </div>

        {/* Bill to */}
        <div className="invoice-panel" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
          <div className="invoice-muted" style={{ fontWeight: 600, color: 'var(--pt-gray-400)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
            {isAr ? 'فاتورة إلى' : 'BILL TO'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
            {member.name || (isAr ? 'عضو محذوف' : 'Deleted member')}
          </div>
          <div className="invoice-muted" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', lineHeight: 1.9 }}>
            {member.code && <>{isAr ? 'كود العضو' : 'Member code'}: <span dir="ltr">{member.code}</span><br /></>}
            {member.phone && <>📞 <span dir="ltr">{member.phone}</span>{member.email ? ' | ' : ''}</>}
            {member.email && <>📧 <span dir="ltr">{member.email}</span></>}
          </div>
          {member.id && !member.missing && (
            <Link href={`/${locale}/admin/members/${member.id}`} className="btn btn-ghost btn-sm no-print" style={{ marginTop: 'var(--space-2)' }}>
              👁️ {isAr ? 'ملف العضو' : 'Member profile'}
            </Link>
          )}
        </div>

        {/* Line items */}
        <div className="table-container" style={{ marginBottom: 'var(--space-5)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isAr ? 'الوصف' : 'Description'}</th>
                <th>{t('finance.paymentType')}</th>
                <th>{isAr ? 'الكمية' : 'Qty'}</th>
                <th>{isAr ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, i) => (
                <tr key={i}>
                  <td className="invoice-muted" style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{line.description}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{invoice.typeLabel}</span></td>
                  <td>{line.qty}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-5)' }}>
          <div style={{ width: 320, maxWidth: '100%' }}>
            <Row label={isAr ? 'المجموع الفرعي' : 'Subtotal'} value={fmt(totals.subtotal)} />
            {totals.discount > 0 && (
              <Row label={t('finance.discount')} value={`-${fmt(totals.discount)}`} color="var(--pt-success)" />
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0',
              borderTop: '2px solid var(--glass-border)', fontWeight: 900,
              fontSize: 'var(--font-size-xl)',
            }}>
              <span>{isAr ? 'المدفوع' : 'PAID'}</span>
              <span className="invoice-accent" style={{ color: 'var(--pt-gold)' }}>{fmt(totals.net)}</span>
            </div>

            {/* Only when the gym set a tax rate in settings. The tax is shown as
                INCLUDED in what was paid — never added on top, which would
                print a total the member never handed over. */}
            {totals.taxRate > 0 && (
              <div className="invoice-muted" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', paddingTop: 'var(--space-1)' }}>
                {isAr
                  ? `شامل ضريبة ${totals.taxRate}% (${fmt(totals.tax)}) — الأساس ${fmt(totals.taxBase)}`
                  : `Includes ${totals.taxRate}% tax (${fmt(totals.tax)}) — base ${fmt(totals.taxBase)}`}
              </div>
            )}

            {totals.balanceAfter > 0 && (
              <>
                {totals.totalDue > 0 && (
                  <Row label={isAr ? 'إجمالي المستحق' : 'Total due'} value={fmt(totals.totalDue)} />
                )}
                <Row label={isAr ? 'المتبقي بعد الدفعة' : 'Balance remaining'}
                  value={fmt(totals.balanceAfter)} color="var(--pt-warning)" bold />
              </>
            )}
          </div>
        </div>

        {/* Method + notes */}
        <div className="invoice-panel" style={{
          display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap',
          padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
        }}>
          <div>
            <span className="invoice-muted" style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
              {t('finance.paymentMethod')}
            </span>
            <div style={{ fontWeight: 600 }}>{invoice.methodLabel}</div>
          </div>
          {invoice.notes && (
            <div style={{ textAlign: isAr ? 'left' : 'right', maxWidth: 380 }}>
              <span className="invoice-muted" style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                {t('common.notes')}
              </span>
              <div className="invoice-muted" style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>{invoice.notes}</div>
            </div>
          )}
        </div>

        <div className="invoice-muted" style={{ textAlign: 'center', marginTop: 'var(--space-5)', color: 'var(--pt-gray-600)', fontSize: 'var(--font-size-xs)' }}>
          {isAr ? `شكراً لاختيارك ${gymName(profile, locale)}` : `Thank you for choosing ${gymName(profile, locale)}`} ⚡
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0',
      fontSize: 'var(--font-size-sm)', color, fontWeight: bold ? 800 : undefined,
    }}>
      <span className={color ? undefined : 'invoice-muted'} style={color ? undefined : { color: 'var(--pt-gray-500)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
