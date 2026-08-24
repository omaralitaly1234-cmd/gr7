'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, getTenantDocumentsByIds, clearReadCache } from '@/lib/firebase/firestore';
import { authPost } from '@/lib/authenticated-fetch';
import { needsInvoiceNumber } from '@/lib/invoice-number';
import { paymentTypeLabel } from '@/lib/invoice-view';
import { loadGymProfile } from '@/lib/firebase/gym-settings';
import { gymName, gymAddress, DEFAULT_GYM_PROFILE } from '@/lib/gym-profile';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

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
  const [numbering, setNumbering] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_GYM_PROFILE);

  const loadData = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: pays }, gym] = await Promise.all([
        getTenantDocuments(tenantId, 'payments', [], { field: 'createdAt', direction: 'desc' }, 200),
        loadGymProfile(tenantId),
      ]);
      setPayments(pays || []);
      setProfile(gym);
      // Only the members referenced by the invoices on screen.
      const memberMap = await getTenantDocumentsByIds(tenantId, 'members', (pays || []).map(p => p.memberId));
      setMembers([...memberMap.values()]);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // How many of the invoices ON THIS PAGE still have no serial. The server
  // counts the whole collection when the button is pressed; this is only here
  // to tell the admin whether pressing it is worth anything.
  const unnumberedHere = payments.filter(needsInvoiceNumber).length;

  /**
   * Give every previously unnumbered invoice its place in the sequence.
   * Only the payments desk and the spa used to number their rows, so every
   * invoice from a new subscription or a renewal is blank until this runs.
   */
  const numberOldInvoices = async () => {
    if (!tenantId || numbering) return;
    setNumbering(true);
    const toastId = toast.loading(isAr ? 'جاري ترقيم الفواتير…' : 'Numbering invoices…');
    try {
      const res = await authPost('/api/admin/invoices/backfill', { tenantId });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        toast.error(result.message || (isAr ? 'تعذّر ترقيم الفواتير' : 'Could not number the invoices'), { id: toastId });
        setNumbering(false);
        return;
      }

      if (result.numbered === 0) {
        toast.success(isAr ? 'كل الفواتير مرقّمة بالفعل ✅' : 'Every invoice is already numbered ✅', { id: toastId });
      } else {
        toast.success(
          isAr
            ? `تم ترقيم ${result.numbered} فاتورة (${result.from} → ${result.to}) ✅`
            : `Numbered ${result.numbered} invoices (${result.from} → ${result.to}) ✅`,
          { id: toastId },
        );
      }
      if (result.truncated) {
        toast(isAr
          ? 'فيه فواتير أقدم لسه من غير رقم — اضغط الزرار تاني.'
          : 'Older invoices are still unnumbered — press the button again.');
      }

      // The numbers were written by the Admin SDK, so this client's read cache
      // still holds the old rows.
      clearReadCache();
      loadData();
    } catch (err) {
      console.error('[Invoices] backfill failed:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ' : 'Error occurred'), { id: toastId });
    }
    setNumbering(false);
  };

  const filtered = payments.filter(p => {
    if (!search) return true;
    return (p.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.memberName || '').includes(search);
  });

  const handlePrint = (pay) => {
    const member = members.find(m => m.id === pay.memberId);
    // Escape any member-controlled value before injecting into the print HTML (prevents stored XSS)
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${locale}">
      <head>
        <meta charset="utf-8">
        <title>${esc(pay.invoiceNumber || 'Invoice')}</title>
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
          <h1>⚡ ${esc(gymName(profile, locale))}</h1>
          ${gymAddress(profile, locale) ? `<p>${esc(gymAddress(profile, locale))}</p>` : ''}
          ${profile.phone ? `<p dir="ltr">📞 ${esc(profile.phone)}</p>` : ''}
          ${profile.email ? `<p dir="ltr">📧 ${esc(profile.email)}</p>` : ''}
        </div>
        <div style="text-align:center;margin-bottom:12px;">
          <strong>${isAr ? 'فاتورة / إيصال' : 'Invoice / Receipt'}</strong><br/>
          <span style="color:#888">${esc(pay.invoiceNumber || '-')}</span>
        </div>
        <div class="info">
          <div class="row"><span class="label">${isAr ? 'العضو' : 'Member'}</span><span class="value">${esc(pay.memberName || '-')}</span></div>
          <div class="row"><span class="label">${isAr ? 'رقم العضوية' : 'ID'}</span><span class="value">${esc(member?.membershipNumber || '-')}</span></div>
          <div class="row"><span class="label">${isAr ? 'التاريخ' : 'Date'}</span><span class="value">${pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</span></div>
          <div class="row"><span class="label">${isAr ? 'النوع' : 'Type'}</span><span class="value">${esc(paymentTypeLabel(pay.type, locale))}</span></div>
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
          <p>© ${new Date().getFullYear()} ${esc(gymName(profile, locale))} — ${isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
          <p>${isAr ? 'شكراً لاختياركم' : 'Thank you for choosing'} ${esc(gymName(profile, locale))} ⚡</p>
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
        <button className="btn btn-secondary" onClick={numberOldInvoices} disabled={numbering}
          title={isAr ? 'يدي رقم تسلسلي لكل فاتورة قديمة من غير رقم' : 'Give every previously unnumbered invoice a serial'}>
          {numbering ? '⏳' : '🔢'} {isAr ? 'ترقيم الفواتير القديمة' : 'Number old invoices'}
        </button>
      </div>

      {unnumberedHere > 0 && (
        <div className="card" style={{
          marginBottom: 'var(--space-5)', background: 'var(--pt-gold-glow)',
          border: '1px solid rgba(245,197,24,0.3)',
        }}>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            💡 {isAr
              ? `فيه ${unnumberedHere} فاتورة في الصفحة دي من غير رقم تسلسلي — دي فواتير اتسجّلت قبل ما الترقيم يشتغل على كل الشاشات. اضغط "ترقيم الفواتير القديمة" وهياخدوا أرقامهم بالترتيب من الأقدم للأحدث.`
              : `${unnumberedHere} invoices on this page have no serial — they were recorded before numbering covered every screen. Press "Number old invoices" and they take their place in the sequence, oldest first.`}
          </p>
        </div>
      )}

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
                  <td>
                    {needsInvoiceNumber(pay) ? (
                      <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                        {isAr ? 'من غير رقم' : 'unnumbered'}
                      </span>
                    ) : (
                      <code dir="ltr" style={{ color: 'var(--pt-gold)', background: 'var(--pt-gold-glow)', padding: '2px 8px', borderRadius: 4, fontSize: '11px' }}>{pay.invoiceNumber}</code>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{pay.memberName || '-'}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{pay.type}</span></td>
                  <td>{(pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                  <td style={{ fontWeight: 800, color: 'var(--pt-gold)' }}>{(pay.netAmount || pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                  <td>{pay.method === 'cash' ? '💵' : pay.method === 'visa' ? '💳' : '🏦'} {t(`finance.${pay.method === 'bank_transfer' ? 'bankTransfer' : pay.method}`)}</td>
                  <td>{pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <Link href={`/${locale}/admin/finance/invoices/${pay.id}`} className="btn btn-ghost btn-sm"
                        title={isAr ? 'عرض الفاتورة' : 'View invoice'}>👁️</Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(pay)} title={t('finance.printReceipt')}>🖨️</button>
                    </div>
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
