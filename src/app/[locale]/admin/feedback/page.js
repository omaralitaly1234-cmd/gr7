'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, deleteTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

export default function AdminFeedbackPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const t = useTranslations();
  const { tenantId } = useTenant();

  const [tab, setTab] = useState('overview');
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberName: '', rating: 5, text: '', category: 'general',
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data } = await getTenantDocuments(tenantId, 'feedback', [],
        { field: 'createdAt', direction: 'desc' });
      setFeedbacks(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.memberName || !form.text) return;
    setSaving(true);
    try {
      await addTenantDocument(tenantId, 'feedback', {
        memberName: form.memberName,
        avatar: form.memberName.charAt(0),
        rating: Number(form.rating),
        text: form.text,
        category: form.category,
      });
      toast.success(t('common.success'));
      setShowForm(false);
      setForm({ memberName: '', rating: 5, text: '', category: 'general' });
      loadData();
    } catch (err) { toast.error(t('common.error')); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!tenantId) return;
    try {
      await deleteTenantDocument(tenantId, 'feedback', id);
      toast.success(t('common.success'));
      loadData();
    } catch (err) { toast.error(t('common.error')); }
  };

  // Calculate stats from real data
  const totalReviews = feedbacks.length;
  const overallRating = totalReviews > 0
    ? Number((feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / totalReviews).toFixed(1))
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = feedbacks.filter(f => Math.round(f.rating) === stars).length;
    return { stars, count, pct: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0 };
  });

  // NPS calculation
  const promoters = feedbacks.filter(f => f.rating >= 4.5).length;
  const passives = feedbacks.filter(f => f.rating >= 3.5 && f.rating < 4.5).length;
  const detractors = feedbacks.filter(f => f.rating < 3.5).length;
  const npsScore = totalReviews > 0
    ? Math.round(((promoters - detractors) / totalReviews) * 100)
    : 0;
  const nps = {
    promoters: totalReviews > 0 ? Math.round((promoters / totalReviews) * 100) : 0,
    passives: totalReviews > 0 ? Math.round((passives / totalReviews) * 100) : 0,
    detractors: totalReviews > 0 ? Math.round((detractors / totalReviews) * 100) : 0,
    score: npsScore,
  };

  // Category ratings
  const categoryMeta = {
    general: { ar: 'عام', en: 'General', icon: '📋' },
    equipment: { ar: 'المعدات والأجهزة', en: 'Equipment', icon: '🏋️' },
    cleanliness: { ar: 'النظافة', en: 'Cleanliness', icon: '✨' },
    trainer: { ar: 'المدربين', en: 'Trainers', icon: '👨‍🏫' },
    customer_service: { ar: 'خدمة العملاء', en: 'Customer Service', icon: '🤝' },
    pricing: { ar: 'الأسعار', en: 'Pricing', icon: '💰' },
    facilities: { ar: 'المرافق', en: 'Facilities', icon: '🏢' },
  };

  const categories = Object.keys(categoryMeta).map(cat => {
    const catFeedbacks = feedbacks.filter(f => f.category === cat);
    return {
      key: cat,
      name: categoryMeta[cat][locale],
      icon: categoryMeta[cat].icon,
      rating: catFeedbacks.length > 0 ? Number((catFeedbacks.reduce((s, f) => s + (f.rating || 0), 0) / catFeedbacks.length).toFixed(1)) : 0,
      reviews: catFeedbacks.length,
    };
  }).filter(c => c.reviews > 0);

  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: '📊' },
    { id: 'reviews', label: isAr ? 'التقييمات' : 'Reviews', icon: '💬' },
  ];

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>⭐</span> {isAr ? 'آراء وتقييمات الأعضاء' : 'Member Feedback'}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ {isAr ? 'إضافة تقييم' : 'Add Feedback'}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`btn ${tab === tb.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {totalReviews === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>{isAr ? 'لا توجد تقييمات بعد' : 'No feedback yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)', marginBottom: 'var(--space-4)' }}>
            {isAr ? 'أضف أول تقييم للأعضاء' : 'Add the first member feedback'}
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ {isAr ? 'إضافة تقييم' : 'Add Feedback'}</button>
        </div>
      ) : tab === 'overview' ? (
        <>
          <div className="grid grid-3" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Overall Rating */}
            <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--pt-gold)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--pt-gold)' }}>{overallRating}</div>
              <div style={{ marginBottom: 'var(--space-2)' }}>
                {'⭐'.repeat(Math.round(overallRating))}{'☆'.repeat(5 - Math.round(overallRating))}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{totalReviews} {isAr ? 'تقييم' : 'reviews'}</div>
            </div>

            {/* NPS Score */}
            <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--pt-success)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: 'var(--space-2)' }}>Net Promoter Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: nps.score >= 50 ? 'var(--pt-success)' : nps.score >= 0 ? 'var(--pt-gold)' : 'var(--pt-danger)' }}>{nps.score}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)', fontSize: '9px' }}>
                <span>🟢 {nps.promoters}%</span>
                <span>🟡 {nps.passives}%</span>
                <span>🔴 {nps.detractors}%</span>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="card">
              {ratingBreakdown.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', fontSize: '11px' }}>
                  <span style={{ width: 14, fontWeight: 700 }}>{r.stars}</span>
                  <span style={{ width: 14 }}>⭐</span>
                  <div style={{ flex: 1, background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: r.stars >= 4 ? 'var(--pt-gold)' : r.stars === 3 ? '#FFD740' : '#FF5252', borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <span style={{ width: 30, textAlign: 'end', fontSize: '10px', color: 'var(--pt-gray-500)' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          {categories.length > 0 && (
            <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {isAr ? 'تقييم حسب الفئة' : 'Ratings by Category'}</h3>
              <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                {categories.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{c.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)', color: c.rating >= 4.5 ? 'var(--pt-success)' : c.rating >= 4 ? 'var(--pt-gold)' : '#FF9100' }}>{c.rating}</span>
                        <span style={{ fontSize: '9px', color: 'var(--pt-gray-600)' }}>({c.reviews})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Reviews Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {feedbacks.map((r, i) => (
            <div key={r.id || i} className="card" style={{ borderInlineStart: `3px solid ${r.rating >= 4.5 ? 'var(--pt-gold)' : r.rating >= 3.5 ? 'var(--pt-success)' : '#FF9100'}` }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{r.avatar || (r.memberName || '?').charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{r.memberName}</span>
                      <span style={{ fontSize: '9px', color: 'var(--pt-gray-600)', marginInlineStart: '8px' }}>📅 {formatDate(r.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span>{'⭐'.repeat(Math.round(r.rating || 0))}</span>
                      <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pt-danger)', fontSize: '0.8rem', padding: '2px' }} title={isAr ? 'حذف' : 'Delete'}>🗑️</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)', lineHeight: 1.6, marginBottom: '4px' }}>{r.text}</p>
                  {r.category && (
                    <span style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(245,197,24,0.08)', borderRadius: 'var(--radius-full)', color: 'var(--pt-gold)' }}>
                      {categoryMeta[r.category]?.[locale] || r.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Feedback Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>⭐ {isAr ? 'إضافة تقييم' : 'Add Feedback'}</h2>
              <button onClick={() => setShowForm(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم العضو' : 'Member Name'} *</label>
                <input className="form-input" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} placeholder={isAr ? 'أحمد محمد' : 'Ahmed Mohamed'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'التقييم' : 'Rating'}</label>
                  <select className="form-select" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                    <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4)</option>
                    <option value={3}>⭐⭐⭐ (3)</option>
                    <option value={2}>⭐⭐ (2)</option>
                    <option value={1}>⭐ (1)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الفئة' : 'Category'}</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(categoryMeta).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v[locale]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'التعليق' : 'Comment'} *</label>
                <textarea className="form-input" rows={3} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder={isAr ? 'اكتب تقييم العضو...' : 'Write member feedback...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.memberName || !form.text}>
                {saving ? '⏳' : '✅'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
