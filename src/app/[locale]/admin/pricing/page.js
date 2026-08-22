'use client';

// Subscription price list — the gym edits its own plans here.
// Changing a plan never touches subscriptions already sold: each subscription
// stores a planSnapshot from the moment of purchase.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { useMembershipPlans } from '@/lib/hooks/useMembershipPlans';
import {
  createTenantPlan, updateTenantPlan, deleteTenantPlan, planErrorMessage,
} from '@/lib/firebase/membership-plans-store';
import { logAuditClient } from '@/lib/firebase/audit';
import toast from 'react-hot-toast';

const EMPTY = { nameAr: '', nameEn: '', type: 'gold', price: '', duration: 30, sessions: '', active: true };

export default function PricingPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const { plans, loading, reload } = useMembershipPlans(tenantId, { includeInactive: true });
  const [editing, setEditing] = useState(null);   // plan doc id, or 'new'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(EMPTY); setEditing('new'); };

  const openEdit = (plan) => {
    setForm({
      nameAr: plan.name?.ar || '',
      nameEn: plan.name?.en || '',
      type: plan.type || 'gold',
      price: plan.price ?? '',
      duration: plan.duration ?? 30,
      sessions: plan.sessions ?? '',
      active: plan.active !== false,
    });
    setEditing(plan.id);
  };

  const close = () => { setEditing(null); setForm(EMPTY); };

  const save = async () => {
    if (saving || !tenantId) return;
    setSaving(true);
    const isNew = editing === 'new';
    const res = isNew
      ? await createTenantPlan(tenantId, form, plans.length)
      : await updateTenantPlan(tenantId, editing, form);

    if (!res.ok) {
      toast.error(planErrorMessage(res.error, isAr));
      setSaving(false);
      return;
    }

    logAuditClient({
      action: isNew ? 'create' : 'update',
      entity: 'membership_plan',
      entityId: isNew ? res.id : editing,
      tenantId,
      details: {
        description: {
          en: `${isNew ? 'Created' : 'Updated'} plan ${form.nameAr} at ${form.price}`,
          ar: `${isNew ? 'إضافة' : 'تعديل'} باقة ${form.nameAr} بسعر ${form.price}`,
        },
      },
    });

    toast.success(isAr ? 'تم الحفظ ✅' : 'Saved ✅');
    close();
    reload();
    setSaving(false);
  };

  const remove = async () => {
    if (!confirmDelete || !tenantId) return;
    const res = await deleteTenantPlan(tenantId, confirmDelete.id);
    if (!res.ok) {
      toast.error(planErrorMessage(res.error, isAr));
      return;
    }
    logAuditClient({
      action: 'delete', entity: 'membership_plan', entityId: confirmDelete.id, tenantId,
      severity: 'warning',
      details: { description: { en: `Deleted plan ${confirmDelete.name?.ar}`, ar: `حذف باقة ${confirmDelete.name?.ar}` } },
    });
    toast.success(isAr ? 'تم حذف الباقة' : 'Plan deleted');
    setConfirmDelete(null);
    reload();
  };

  const toggleActive = async (plan) => {
    const res = await updateTenantPlan(tenantId, plan.id, {
      nameAr: plan.name?.ar, nameEn: plan.name?.en, type: plan.type,
      price: plan.price, duration: plan.duration, sessions: plan.sessions,
      active: !(plan.active !== false),
    });
    if (!res.ok) { toast.error(planErrorMessage(res.error, isAr)); return; }
    reload();
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏷️</span> {isAr ? 'أسعار الاشتراكات' : 'Subscription Pricing'}</h1>
        <button className="btn btn-primary" onClick={openNew}>+ {isAr ? 'باقة جديدة' : 'New Plan'}</button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)', background: 'var(--pt-gold-glow)', border: '1px solid rgba(245,197,24,0.3)' }}>
        <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
          💡 {isAr
            ? 'تعديل سعر أو اسم باقة بيأثر على الاشتراكات الجديدة بس. الأعضاء اللي مشتركين بالفعل بيفضلوا على السعر والاسم اللي اشتركوا بيهم.'
            : 'Editing a price or name affects new subscriptions only. Members who already subscribed keep the price and name they signed up on.'}
        </p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isAr ? 'اسم الباقة' : 'Plan name'}</th>
              <th>{isAr ? 'النوع' : 'Type'}</th>
              <th>{isAr ? 'السعر' : 'Price'}</th>
              <th>{isAr ? 'المدة' : 'Duration'}</th>
              <th>{isAr ? 'الحصص' : 'Sessions'}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>{t('common.noData')}
              </td></tr>
            ) : plans.map((p, i) => (
              <tr key={p.id} style={{ opacity: p.active === false ? 0.5 : 1 }}>
                <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name?.[locale] || p.name?.ar}</div>
                  {p.name?.en && locale === 'ar' && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">{p.name.en}</div>
                  )}
                </td>
                <td>
                  <span className={`badge ${p.type === 'diamond' ? 'badge-diamond' : 'badge-gold'}`}>
                    {p.type === 'diamond' ? '💎' : '🥇'} {p.type === 'diamond' ? (isAr ? 'ماسي' : 'Diamond') : (isAr ? 'ذهبي' : 'Gold')}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }} dir="ltr">
                  {(p.price || 0).toLocaleString()} <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{t('common.egp')}</span>
                </td>
                <td dir="ltr">{p.duration} {isAr ? 'يوم' : 'days'}</td>
                <td dir="ltr">{p.sessions === null ? (isAr ? 'مفتوح' : 'Unlimited') : p.sessions}</td>
                <td>
                  <span className={`badge ${p.active !== false ? 'badge-success' : 'badge-danger'}`}>
                    ● {p.active !== false ? (isAr ? 'مفعّلة' : 'Active') : (isAr ? 'متوقفة' : 'Hidden')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title={t('common.edit')}>✏️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(p)}
                      title={p.active !== false ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'تفعيل' : 'Activate')}>
                      {p.active !== false ? '🚫' : '✅'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(p)}
                      title={t('common.delete')} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / edit */}
      {editing && (
        <div className="modal-overlay" onClick={() => { if (!saving) close(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>🏷️ {editing === 'new' ? (isAr ? 'باقة جديدة' : 'New Plan') : (isAr ? 'تعديل الباقة' : 'Edit Plan')}</h2>
              <button onClick={close} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم بالعربي' : 'Name (Arabic)'} *</label>
                  <input className="form-input" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input className="form-input" dir="ltr" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'النوع' : 'Type'}</label>
                  <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="gold">🥇 {isAr ? 'ذهبي' : 'Gold'}</option>
                    <option value="diamond">💎 {isAr ? 'ماسي' : 'Diamond'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'السعر' : 'Price'} ({t('common.egp')}) *</label>
                  <input className="form-input" type="number" min="0" dir="ltr"
                    value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المدة (يوم)' : 'Duration (days)'} *</label>
                  <input className="form-input" type="number" min="1" dir="ltr"
                    value={form.duration} onChange={e => set('duration', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'عدد الحصص' : 'Sessions'}</label>
                  <input className="form-input" type="number" min="1" dir="ltr"
                    value={form.sessions} onChange={e => set('sessions', e.target.value)}
                    placeholder={isAr ? 'فاضية = مفتوح' : 'Blank = unlimited'} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.active !== false} onChange={e => set('active', e.target.checked)} />
                <span>{isAr ? 'الباقة معروضة للبيع' : 'Plan is available for sale'}</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close} disabled={saving}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '⏳' : '💾'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--pt-danger)' }}>🗑️ {isAr ? 'حذف الباقة' : 'Delete Plan'}</h2>
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-3)' }}>
                {isAr ? `هتحذف باقة "${confirmDelete.name?.ar}".` : `Delete the plan "${confirmDelete.name?.en || confirmDelete.name?.ar}".`}
              </p>
              <div style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
                {isAr
                  ? 'الاشتراكات المباعة بالباقة دي مش هتتأثر — بس مش هتقدر تبيعها لأعضاء جداد. لو عايز توقفها مؤقتاً بس، استخدم زرار الإخفاء 🚫 بدل الحذف.'
                  : 'Subscriptions already sold on this plan are unaffected — you just cannot sell it to new members. To pause it instead, use the hide button 🚫.'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={remove}>🗑️ {t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
