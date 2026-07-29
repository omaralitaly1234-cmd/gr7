'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { PLAN_DEFINITIONS, AI_FEATURE_LABELS } from '@/lib/firebase/subscription';
import { activateSubscription } from '@/lib/firebase/subscription';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function TenantDetailPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const tenantId = params?.id;

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Plan change modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

  useEffect(() => { if (tenantId) loadTenant(); }, [tenantId]);

  const loadTenant = async () => {
    setLoading(true);
    const { data, error } = await getDocument('tenants', tenantId);
    if (error) {
      console.error('[TenantDetail] Load error:', error);
      toast.error(isAr ? 'فشل تحميل بيانات الجيم' : 'Failed to load gym data');
    }
    setTenant(data);
    setLoading(false);
  };

  const changeStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await updateDocument('tenants', tenantId, { status: newStatus });
      if (error) throw new Error(error);
      toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
      loadTenant();
    } catch (err) {
      toast.error(err.message);
    }
    setActionLoading(false);
  };

  // Handle plan change
  const handleChangePlan = async () => {
    if (!selectedPlan) {
      toast.error(isAr ? 'اختر باقة أولاً' : 'Select a plan first');
      return;
    }
    const plan = PLAN_DEFINITIONS[selectedPlan];
    if (!plan) {
      toast.error(isAr ? 'باقة غير صالحة' : 'Invalid plan');
      return;
    }

    const durationDays = useCustomDays && customDays ? parseInt(customDays) : plan.durationDays;
    if (!durationDays || durationDays < 1) {
      toast.error(isAr ? 'أدخل عدد أيام صحيح' : 'Enter a valid number of days');
      return;
    }

    setPlanChangeLoading(true);
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      await updateDoc(doc(db, 'tenants', tenantId), {
        status: 'active',
        'subscription.plan': selectedPlan,
        'subscription.startDate': Timestamp.fromDate(now),
        'subscription.endDate': Timestamp.fromDate(endDate),
        'subscription.lastPaymentDate': Timestamp.fromDate(now),
        'subscription.nextPaymentDate': Timestamp.fromDate(endDate),
        'subscription.autoRenew': true,
        features: { ...plan.features },
        'limits.maxMembers': plan.maxMembers,
        'limits.maxTrainers': plan.maxTrainers,
        updatedAt: serverTimestamp(),
      });

      toast.success(isAr
        ? `تم تغيير الباقة إلى ${plan.name[locale] || plan.name.ar} (${durationDays} يوم)`
        : `Plan changed to ${plan.name.en} (${durationDays} days)`
      );
      setShowPlanModal(false);
      setSelectedPlan('');
      setCustomDays('');
      setUseCustomDays(false);
      loadTenant();
    } catch (err) {
      console.error('[TenantDetail] Plan change error:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء تغيير الباقة' : 'Error changing plan'));
    }
    setPlanChangeLoading(false);
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts?.seconds ? ts.seconds * 1000 : ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const statusBadge = (status) => {
    const map = {
      active: { cls: 'badge-success', text: isAr ? 'فعال' : 'Active' },
      trial: { cls: 'badge-info', text: isAr ? 'تجريبي' : 'Trial' },
      expired: { cls: 'badge-danger', text: isAr ? 'منتهي' : 'Expired' },
      suspended: { cls: 'badge-warning', text: isAr ? 'معلّق' : 'Suspended' },
      pending_payment: { cls: 'badge-warning', text: isAr ? 'بانتظار الدفع' : 'Pending Payment' },
    };
    const s = map[status] || { cls: 'badge-danger', text: status || '—' };
    return <span className={`badge ${s.cls}`} style={{ fontSize: 'var(--font-size-sm)', padding: '4px 14px' }}>{s.text}</span>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-500)', marginTop: 'var(--space-3)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>❌</div>
        <h3>{isAr ? 'لم يتم العثور على الجيم' : 'Gym not found'}</h3>
      </div>
    );
  }

  const now = new Date();
  const endDate = tenant.subscription?.trialEndDate || tenant.subscription?.endDate;
  let daysRemaining = 0;
  try {
    const end = endDate?.toDate ? endDate.toDate() : new Date(endDate?.seconds ? endDate.seconds * 1000 : endDate);
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  } catch {}

  // Plans available for change (exclude trial)
  const availablePlans = Object.values(PLAN_DEFINITIONS).filter(p => p.id !== 'trial');

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏢</span> {isAr ? (tenant.nameAr || tenant.name) : (tenant.nameEn || tenant.name)}</h1>
        {statusBadge(tenant.status)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main Info */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              📋 {isAr ? 'بيانات الجيم' : 'Gym Info'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {[
                { label: isAr ? 'الاسم (عربي)' : 'Name (Arabic)', value: tenant.nameAr || tenant.name },
                { label: isAr ? 'الاسم (إنجليزي)' : 'Name (English)', value: tenant.nameEn || tenant.name },
                { label: isAr ? 'البريد الإلكتروني' : 'Email', value: tenant.ownerEmail },
                { label: isAr ? 'الهاتف' : 'Phone', value: tenant.phone },
                { label: isAr ? 'العنوان' : 'Address', value: tenant.address?.[locale] || '—' },
                { label: isAr ? 'تاريخ التسجيل' : 'Registration Date', value: formatDate(tenant.createdAt) },
                { label: isAr ? 'معرّف المالك' : 'Owner UID', value: tenant.ownerUid || '—' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              🎛️ {isAr ? 'الميزات المفعّلة' : 'Active Features'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {Object.entries(AI_FEATURE_LABELS).map(([key, info]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                  background: tenant.features?.[key] ? 'var(--pt-success-bg)' : 'var(--pt-darker)',
                  opacity: tenant.features?.[key] ? 1 : 0.5,
                  fontSize: 'var(--font-size-sm)',
                }}>
                  <span>{tenant.features?.[key] ? '✅' : '🔒'}</span>
                  <span>{info.icon} {info[locale] || info.ar}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-5)', border: '1px solid rgba(245,197,24,0.15)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              💳 {isAr ? 'الاشتراك' : 'Subscription'}
            </h3>
            <div style={{ fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'الخطة' : 'Plan'}</span>
                <span className="badge badge-gold">{PLAN_DEFINITIONS[tenant.subscription?.plan]?.name?.[locale] || tenant.subscription?.plan || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'الأيام المتبقية' : 'Days Remaining'}</span>
                <span style={{ fontWeight: 700, color: daysRemaining <= 7 ? 'var(--pt-danger)' : 'var(--pt-info)' }}>
                  {daysRemaining} {isAr ? 'يوم' : 'days'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'تنتهي في' : 'Ends on'}</span>
                <span>{formatDate(endDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'حد الأعضاء' : 'Max Members'}</span>
                <span>{tenant.limits?.maxMembers === -1 ? '♾' : tenant.limits?.maxMembers || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'حد المدربين' : 'Max Trainers'}</span>
                <span>{tenant.limits?.maxTrainers === -1 ? '♾' : tenant.limits?.maxTrainers || '—'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              ⚡ {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {/* Change Plan Button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--pt-gold), #e6a800)', color: 'var(--pt-black)', fontWeight: 700 }}
                onClick={() => {
                  setSelectedPlan(tenant.subscription?.plan === 'trial' ? 'monthly' : (tenant.subscription?.plan || 'monthly'));
                  setShowPlanModal(true);
                }}
              >
                🔄 {isAr ? 'تغيير الباقة' : 'Change Plan'}
              </button>

              {tenant.status !== 'active' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => changeStatus('active')} disabled={actionLoading}>
                  ✅ {isAr ? 'تفعيل' : 'Activate'}
                </button>
              )}
              {tenant.status !== 'suspended' && (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => changeStatus('suspended')} disabled={actionLoading}>
                  ⏸️ {isAr ? 'تعليق مؤقت' : 'Suspend'}
                </button>
              )}
              {tenant.status === 'suspended' && (
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => changeStatus('active')} disabled={actionLoading}>
                  ▶️ {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Change Modal */}
      {showPlanModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 'var(--space-4)',
          }}
          onClick={() => !planChangeLoading && setShowPlanModal(false)}
        >
          <div
            className="card animate-fadeIn"
            style={{
              maxWidth: 520, width: '100%',
              border: '1px solid rgba(245,197,24,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-5)', textAlign: 'center' }}>
              🔄 {isAr ? 'تغيير باقة الاشتراك' : 'Change Subscription Plan'}
            </h2>

            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
              {isAr
                ? `الجيم: ${tenant.nameAr || tenant.name} — الباقة الحالية: ${PLAN_DEFINITIONS[tenant.subscription?.plan]?.name?.ar || tenant.subscription?.plan}`
                : `Gym: ${tenant.nameEn || tenant.name} — Current: ${PLAN_DEFINITIONS[tenant.subscription?.plan]?.name?.en || tenant.subscription?.plan}`
              }
            </p>

            {/* Plan Selection */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', display: 'block' }}>
                {isAr ? 'اختر الباقة الجديدة' : 'Select New Plan'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {availablePlans.map((plan) => (
                  <label
                    key={plan.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: selectedPlan === plan.id ? '2px solid var(--pt-gold)' : '1px solid var(--pt-gray-700)',
                      background: selectedPlan === plan.id ? 'rgba(245,197,24,0.08)' : 'var(--pt-darker)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={selectedPlan === plan.id}
                      onChange={() => {
                        setSelectedPlan(plan.id);
                        if (!useCustomDays) setCustomDays('');
                      }}
                      style={{ accentColor: 'var(--pt-gold)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{plan.name[locale] || plan.name.ar}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                        {plan.durationDays} {isAr ? 'يوم' : 'days'} • {plan.price} {isAr ? 'ج.م' : 'EGP'}
                        {' • '}{isAr ? 'أعضاء' : 'Members'}: {plan.maxMembers === -1 ? '♾' : plan.maxMembers}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Duration */}
            <div style={{
              marginBottom: 'var(--space-5)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--pt-gray-700)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: useCustomDays ? 'var(--space-3)' : 0 }}>
                <input
                  type="checkbox"
                  checked={useCustomDays}
                  onChange={(e) => setUseCustomDays(e.target.checked)}
                  style={{ accentColor: 'var(--pt-gold)' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  {isAr ? 'تحديد مدة مخصصة (بالأيام)' : 'Set custom duration (days)'}
                </span>
              </label>
              {useCustomDays && (
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder={isAr ? 'عدد الأيام...' : 'Number of days...'}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                />
              )}
            </div>

            {/* Summary */}
            {selectedPlan && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(245,197,24,0.06)',
                border: '1px solid rgba(245,197,24,0.15)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                fontSize: 'var(--font-size-sm)',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)', color: 'var(--pt-gold)' }}>
                  📋 {isAr ? 'ملخص التغيير' : 'Change Summary'}
                </div>
                <div style={{ color: 'var(--pt-gray-300)' }}>
                  {isAr ? 'الباقة: ' : 'Plan: '}<strong>{PLAN_DEFINITIONS[selectedPlan]?.name?.[locale]}</strong>
                  {' • '}
                  {isAr ? 'المدة: ' : 'Duration: '}
                  <strong>
                    {useCustomDays && customDays ? customDays : PLAN_DEFINITIONS[selectedPlan]?.durationDays} {isAr ? 'يوم' : 'days'}
                  </strong>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: 'linear-gradient(135deg, var(--pt-gold), #e6a800)', color: 'var(--pt-black)', fontWeight: 700 }}
                onClick={handleChangePlan}
                disabled={planChangeLoading || !selectedPlan}
              >
                {planChangeLoading
                  ? (isAr ? '⏳ جاري التغيير...' : '⏳ Changing...')
                  : (isAr ? '✅ تأكيد التغيير' : '✅ Confirm Change')
                }
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowPlanModal(false)}
                disabled={planChangeLoading}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
