'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';

export default function InvoicesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data: pays } = await getTenantDocuments(tenantId, 'payments', [],
          { field: 'createdAt', direction: 'desc' }, 200);
        setPayments(pays || []);
        const { data: mems } = await getTenantDocuments(tenantId, 'members');
        setMembers(mems || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadData();
  }, [tenantId]);

  const filtered = payments.filter(p => {
    if (!search) return true;
    return (p.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.memberName || '').includes(search);
  });

  const handlePrint = (pay) => {
    const member = members.find(m => m.id === pay.memberId);
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${locale}">
      <head>
        <meta charset="utf-8">
        <title>${pay.invoiceNumber || 'Invoice'}</title>
        <style>
          body { font-family: 'Cairo', 'Segoe UI', sans-serif; padding: 24px; max-width: 380px; margin: 0 auto; color: #333; font-size: 13px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #F5C518; padding-bottom: 16px; }
          .header h1 { margin: 0; color: #F5C518; font-size: 20px; }
          .header p { margin: 4px 0; color: #888; font-size: 11px; }
          .info { margin: 16px 0; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ddd; }
          .row .label { color: #888; }
          .row .value { font-weight: 700; }
          .total { font-size: 18px; font-weight: 900; text-align: center; padding: 12px; background: #FFF8E1; border-radius: 8px; margin: 16px 0; color: #F5C518; }
          .footer { text-align: center; margin-top: 20px; color: #aaa; font-size: 10px; }
          @media print { body { padding: 12px; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚡ Power Time</h1>
          <p>${isAr ? 'أكتر من مجرد جيم' : 'More than a Gym'}</p>
        </div>
        <div style="text-align:center;margin-bottom:12px;">
          <strong>${isAr ? 'فاتورة / إيصال' : 'Invoice / Receipt'}</strong><br/>
          <span style="color:#888">${pay.invoiceNumber || '-'}</span>
        </div>
        <div class="info">
          <div class="row"><span class="label">${isAr ? 'العضو' : 'Member'}</span><span class="value">${pay.memberName || '-'}</span></div>
          <div class="row"><span class="label">${isAr ? 'رقم العضوية' : 'ID'}</span><span class="value">${member?.membershipNumber || '-'}</span></div>
          <div class="row"><span class="label">${isAr ? 'التاريخ' : 'Date'}</span><span class="value">${pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</span></div>
          <div class="row"><span class="label">${isAr ? 'النوع' : 'Type'}</span><span class="value">${pay.type || '-'}</span></div>
          <div class="row"><span class="label">${isAr ? 'طريقة الدفع' : 'Method'}</span><span class="value">${pay.method === 'cash' ? (isAr ? 'كاش' : 'Cash') : pay.method === 'visa' ? (isAr ? 'فيزا' : 'Visa') : (isAr ? 'تحويل' : 'Transfer')}</span></div>
          <div class="row"><span class="label">${isAr ? 'المبلغ' : 'Amount'}</span><span class="value">${(pay.amount || 0).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}</span></div>
          ${pay.discount ? `<div class="row"><span class="label">${isAr ? 'الخصم' : 'Discount'}</span><span class="value" style="color:green">-${pay.discount.toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}</span></div>` : ''}
        </div>
        <div class="total">${isAr ? 'الإجمالي' : 'Total'}: ${(pay.netAmount || pay.amount || 0).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}</div>
        <div style="text-align:center;margin:12px 0;">
          <button onclick="window.print()" style="padding:8px 24px;background:#F5C518;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
            🖨️ ${isAr ? 'طباعة' : 'Print'}
          </button>
        </div>
        <div class="footer">
          <p>© 2026 Power Time — ${isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
          <p>${isAr ? 'شكراً لاختياركم Power Time' : 'Thank you for choosing Power Time'} ⚡</p>
        </div>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧾</span> {t('sidebar.invoices')}</h1>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', insetInlineStart: 12, top: 10, fontSize: '1rem' }}>🔍</span>
          <input className="form-input" type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث برقم الفاتورة أو اسم العضو...' : 'Search by invoice # or member name...'}
            style={{ paddingInlineStart: 36 }} />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('finance.invoiceNumber')}</th>
              <th>{t('members.fullName')}</th>
              <th>{t('finance.paymentType')}</th>
              <th>{t('finance.amount')}</th>
              <th>{t('finance.netAmount')}</th>
              <th>{t('finance.paymentMethod')}</th>
              <th>{t('common.date')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>{t('common.noData')}
              </td></tr>
            ) : (
              filtered.map(pay => (
                <tr key={pay.id}>
                  <td><code style={{ color: 'var(--pt-gold)', background: 'var(--pt-gold-glow)', padding: '2px 8px', borderRadius: 4, fontSize: '11px' }}>{pay.invoiceNumber || '-'}</code></td>
                  <td style={{ fontWeight: 600 }}>{pay.memberName || '-'}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{pay.type}</span></td>
                  <td>{(pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                  <td style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{(pay.netAmount || pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                  <td>{pay.method === 'cash' ? '💵' : pay.method === 'visa' ? '💳' : '🏦'} {t(`finance.${pay.method === 'bank_transfer' ? 'bankTransfer' : pay.method}`)}</td>
                  <td>{pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(pay)} title={t('finance.printReceipt')}>🖨️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
