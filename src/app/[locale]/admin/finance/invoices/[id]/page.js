'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function InvoiceDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const invoice = {
    id: 'INV-2026-0042',
    date: '2026-03-01',
    dueDate: '2026-03-01',
    status: 'paid',
    member: { name: 'أحمد محمد سعيد', id: 'PT-2026-0001', phone: '01012345678', email: 'ahmed.said@email.com' },
    items: [
      { desc: locale === 'ar' ? 'اشتراك ذهبي — ربع سنوي (3 شهور)' : 'Gold Subscription — Quarterly (3 months)', qty: 1, unit: 2400, total: 2400 },
      { desc: locale === 'ar' ? 'مدرب خاص' : 'Personal Trainer', qty: 1, unit: 0, total: 0 },
      { desc: locale === 'ar' ? 'خطة غذائية' : 'Diet Plan', qty: 1, unit: 0, total: 0 },
    ],
    subtotal: 2400,
    discount: 0,
    tax: 0,
    total: 2400,
    paymentMethod: locale === 'ar' ? 'كاش' : 'Cash',
    notes: locale === 'ar' ? 'شكراً لاختيارك GR 7 Gym!' : 'Thank you for choosing GR 7 Gym!',
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧾</span> {locale === 'ar' ? 'فاتورة' : 'Invoice'} {invoice.id}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨️ {t('common.print')}</button>
          <button className="btn btn-primary btn-sm">📥 PDF</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }} id="invoice-print">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-5)', borderBottom: '2px solid var(--glass-border)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>⚡ GR 7</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'أكتر من مجرد جيم' : 'More Than Just a Gym'}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)', marginTop: 'var(--space-2)' }}>
              {locale === 'ar' ? 'المعادي، القاهرة' : 'Maadi, Cairo'}<br />
              📞 01000000000<br />
              📧 info@gr7.gym
            </div>
          </div>
          <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{locale === 'ar' ? 'فاتورة' : 'INVOICE'}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
              <div><strong>#{invoice.id}</strong></div>
              <div style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'التاريخ' : 'Date'}: {invoice.date}</div>
            </div>
            <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: 'var(--space-2)' }}>
              {invoice.status === 'paid' ? (locale === 'ar' ? '✓ مدفوعة' : '✓ Paid') : (locale === 'ar' ? '⏳ معلقة' : '⏳ Pending')}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontWeight: 600, color: 'var(--pt-gray-400)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>{locale === 'ar' ? 'فاتورة إلى' : 'BILL TO'}</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{invoice.member.name}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
            {locale === 'ar' ? 'رقم العضوية' : 'Member ID'}: {invoice.member.id}<br />
            📞 <span dir="ltr">{invoice.member.phone}</span> | 📧 <span dir="ltr">{invoice.member.email}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-container" style={{ marginBottom: 'var(--space-5)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                <th>{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>{locale === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.desc}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit > 0 ? `${item.unit.toLocaleString()} ${t('common.egp')}` : (locale === 'ar' ? 'مجاناً' : 'Free')}</td>
                  <td style={{ fontWeight: 600 }}>{item.total > 0 ? `${item.total.toLocaleString()} ${t('common.egp')}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-5)' }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', fontSize: 'var(--font-size-sm)' }}>
              <span style={{ color: 'var(--pt-gray-500)' }}>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>{invoice.subtotal.toLocaleString()} {t('common.egp')}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', fontSize: 'var(--font-size-sm)', color: 'var(--pt-success)' }}>
                <span>{locale === 'ar' ? 'الخصم' : 'Discount'}</span>
                <span>-{invoice.discount.toLocaleString()} {t('common.egp')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderTop: '2px solid var(--glass-border)', fontWeight: 900, fontSize: 'var(--font-size-xl)', color: 'var(--pt-gold)' }}>
              <span>{locale === 'ar' ? 'الإجمالي' : 'TOTAL'}</span>
              <span>{invoice.total.toLocaleString()} {t('common.egp')}</span>
            </div>
          </div>
        </div>

        {/* Payment Method + Notes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
            <div style={{ fontWeight: 600 }}>💵 {invoice.paymentMethod}</div>
          </div>
          <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
            <div style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>{invoice.notes}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
