'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function OffersPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    discountType: 'percentage',
    discountValue: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    applicablePlans: [],
    isActive: true,
    code: '',
  });

  useEffect(() => { loadOffers(); }, [tenantId]);

  const loadOffers = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'offers', [], { field: 'createdAt', direction: 'desc' });
      setOffers(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.title.ar) return;
    try {
      await addTenantDocument(tenantId, 'offers', {
        ...form,
        validFrom: Timestamp.fromDate(new Date(form.validFrom)),
        validTo: form.validTo ? Timestamp.fromDate(new Date(form.validTo)) : null,
      });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ title: { ar: '', en: '' }, description: { ar: '', en: '' }, discountType: 'percentage', discountValue: 10, validFrom: new Date().toISOString().split('T')[0], validTo: '', applicablePlans: [], isActive: true, code: '' });
      loadOffers();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const toggleOffer = async (offer) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'offers', offer.id, { isActive: !offer.isActive });
    loadOffers();
  };

  const deleteOffer = async (offerId) => {
    if (!tenantId) return;
    await deleteTenantDocument(tenantId, 'offers', offerId);
    toast.success(t('common.success'));
    loadOffers();
  };

  const plans = ['gold-monthly', 'gold-quarterly', 'gold-semi', 'gold-annual', 'diamond-quarterly', 'diamond-semi', 'diamond-annual'];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏷️</span> {t('offers.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {t('offers.newOffer')}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">🏷️</div>
          <div className="stat-info">
            <div className="stat-value">{offers.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي العروض' : 'Total Offers'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{offers.filter(o => o.isActive).length}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{offers.filter(o => !o.isActive).length}</div>
            <div className="stat-label">{t('common.inactive')}</div>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        </div>
      ) : offers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏷️</div>
          <h3>{isAr ? 'لا توجد عروض حالياً' : 'No offers yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', marginBottom: 'var(--space-4)' }}>
            {isAr ? 'أضف عرضاً جديداً لجذب المزيد من الأعضاء' : 'Add a new offer to attract more members'}
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {t('offers.newOffer')}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {offers.map(offer => {
            const validTo = offer.validTo?.toDate ? offer.validTo.toDate() : null;
            const isExpired = validTo && validTo < new Date();
            return (
              <div key={offer.id} className="card" style={{
                opacity: offer.isActive && !isExpired ? 1 : 0.6,
                borderInlineStart: `3px solid ${offer.isActive && !isExpired ? 'var(--pt-gold)' : 'var(--pt-gray-600)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: '4px' }}>{offer.title?.[locale] || offer.title?.ar}</h3>
                    <span className={`badge ${offer.isActive && !isExpired ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                      {isExpired ? (isAr ? 'منتهي' : 'Expired') : offer.isActive ? t('common.active') : t('common.inactive')}
                    </span>
                  </div>
                  <div style={{
                    background: 'var(--pt-gold)', color: '#0D0D0D', padding: '6px 14px',
                    borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: 'var(--font-size-lg)',
                  }}>
                    {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `${offer.discountValue} ${t('common.egp')}`}
                  </div>
                </div>
                {offer.description?.[locale] && (
                  <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
                    {offer.description[locale]}
                  </p>
                )}
                {offer.code && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <code style={{ background: 'var(--pt-gold-glow)', color: 'var(--pt-gold)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                      {offer.code}
                    </code>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <span>{isAr ? 'من' : 'From'}: {offer.validFrom?.toDate ? offer.validFrom.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</span>
                  <span>{validTo ? `${isAr ? 'حتى' : 'To'}: ${validTo.toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}` : (isAr ? 'بدون حد' : 'No expiry')}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleOffer(offer)}>
                    {offer.isActive ? '⏸️' : '▶️'} {offer.isActive ? (isAr ? 'إيقاف' : 'Pause') : (isAr ? 'تفعيل' : 'Activate')}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteOffer(offer.id)} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Offer Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>🏷️ {t('offers.newOffer')}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'عنوان العرض (عربي)' : 'Title (Arabic)'} *</label>
                  <input className="form-input" value={form.title.ar} onChange={e => setForm(f => ({ ...f, title: { ...f.title, ar: e.target.value } }))} placeholder={isAr ? 'عرض الصيف' : 'Summer Offer'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'عنوان العرض (إنجليزي)' : 'Title (English)'}</label>
                  <input className="form-input" dir="ltr" value={form.title.en} onChange={e => setForm(f => ({ ...f, title: { ...f.title, en: e.target.value } }))} placeholder="Summer Offer" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.description')}</label>
                <textarea className="form-input" rows={2} value={form.description[locale]} onChange={e => setForm(f => ({ ...f, description: { ...f.description, [locale]: e.target.value } }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'نوع الخصم' : 'Discount Type'}</label>
                  <select className="form-select" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                    <option value="percentage">{t('offers.discountPercent')} (%)</option>
                    <option value="fixed">{t('offers.discountAmount')} ({t('common.egp')})</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'القيمة' : 'Value'}</label>
                  <input className="form-input" type="number" dir="ltr" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'كود الخصم' : 'Promo Code'}</label>
                  <input className="form-input" dir="ltr" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER26" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('offers.validFrom')}</label>
                  <input className="form-input" type="date" dir="ltr" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('offers.validTo')}</label>
                  <input className="form-input" type="date" dir="ltr" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.title.ar}>✅ {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
