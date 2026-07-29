'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { PLAN_DEFINITIONS } from '@/lib/firebase/subscription';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function TenantsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Plan change modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [modalTenant, setModalTenant] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

  useEffect(() => { loadTenants(); }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await getDocuments('tenants', [], { field: 'createdAt', direction: 'desc' });
      if (error) {
        console.error('[Tenants] Load error:', error);
        toast.error(isAr ? 'فشل تحميل العملاء' : 'Failed to load tenants');
      }
      setTenants(data || []);
    } catch (err) {
      console.error('[Tenants] Error:', err);
    }
    setLoading(false);
  };

  // Change tenant status
  const changeStatus = async (tenantId, newStatus) => {
    setActionLoading(tenantId);
    try {
      const { error } = await updateDocument('tenants', tenantId, { status: newStatus });
      if (error) throw new Error(error);
      toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
      loadTenants();
    } catch (err) {
      console.error('[Tenants] Status change error:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ' : 'Error'));
    }
    setActionLoading(null);
  };

  // Open plan change modal for a tenant
  const openPlanModal = (tenant) => {
    setModalTenant(tenant);
    setSelectedPlan(tenant.subscription?.plan === 'trial' ? 'monthly' : (tenant.subscription?.plan || 'monthly'));
    setCustomDays('');
    setUseCustomDays(false);
    setShowPlanModal(true);
  };

  // Handle plan change
  const handleChangePlan = async () => {
    if (!modalTenant || !selectedPlan) return;
    const plan = PLAN_DEFINITIONS[selectedPlan];
    if (!plan) { toast.error(isAr ? 'باقة غير صالحة' : 'Invalid plan'); return; }

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

      await updateDoc(doc(db, 'tenants', modalTenant.id), {
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
        ? `تم تغيير باقة ${modalTenant.nameAr || modalTenant.name} إلى ${plan.name[locale] || plan.name.ar} (${durationDays} يوم)`
        : `Changed ${modalTenant.nameEn || modalTenant.name} to ${plan.name.en} (${durationDays} days)`
      );
      setShowPlanModal(false);
      setModalTenant(null);
      loadTenants();
    } catch (err) {
      console.error('[Tenants] Plan change error:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ' : 'Error'));
    }
    setPlanChangeLoading(false);
  };

  const filtered = tenants.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(s) ||
        t.nameAr?.toLowerCase().includes(s) ||
        t.nameEn?.toLowerCase().includes(s) ||
        t.ownerEmail?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const statusBadge = (status) => {
    const map = {
      active: { cls: 'badge-success', text: isAr ? 'فعال' : 'Active' },
      trial: { cls: 'badge-info', text: isAr ? 'تجريبي' : 'Trial' },
      expired: { cls: 'badge-danger', text: isAr ? 'منتهي' : 'Expired' },
      suspended: { cls: 'badge-warning', text: isAr ? 'معلّق' : 'Suspended' },
      pending_payment: { cls: 'badge-warning', text: isAr ? 'بانتظار الدفع' : 'Pending Payment' },
    };
    const s = map[status] || { cls: 'badge-danger', text: status || '—' };
    return <span className={`badge ${s.cls}`}>{s.text}</span>;
  };

  const planLabel = (plan) => {
    const p = PLAN_DEFINITIONS[plan];
    return p ? (p.name?.[locale] || p.name?.ar || plan) : plan || '—';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp?.seconds ? timestamp.seconds * 1000 : timestamp);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  const countByStatus = (status) => tenants.filter(t => t.status === status).length;

  const filters = [
    { key: 'all', label: isAr ? 'الكل' : 'All', count: tenants.length },
    { key: 'active', label: isAr ? 'فعال' : 'Active', count: countByStatus('active') },
    { key: 'trial', label: isAr ? 'تجريبي' : 'Trial', count: countByStatus('trial') },
    { key: 'expired', label: isAr ? 'منتهي' : 'Expired', count: countByStatus('expired') },
    { key: 'suspended', label: isAr ? 'معلّق' : 'Suspended', count: countByStatus('suspended') },
    { key: 'pending_payment', label: isAr ? 'بانتظار الدفع' : 'Pending', count: countByStatus('pending_payment') },
  ];

  const availablePlans = Object.values(PLAN_DEFINITIONS).filter(p => p.id !== 'trial');

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏢</span> {isAr ? 'إدارة العملاء (الجيمات)' : 'Manage Tenants (Gyms)'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
          {isAr ? `${tenants.length} عميل مسجّل` : `${tenants.length} registered clients`}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-icon info">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{tenants.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الجيمات' : 'Total Gyms'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{countByStatus('active')}</div>
            <div className="stat-label">{isAr ? 'فعال' : 'Active'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{countByStatus('trial')}</div>
            <div className="stat-label">{isAr ? 'تجريبي' : 'Trial'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">🚫</div>
          <div className="stat-info">
            <div className="stat-value">{countByStatus('expired') + countByStatus('suspended')}</div>
            <div className="stat-label">{isAr ? 'منتهي/معلّق' : 'Expired/Suspended'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <input
          className="form-input"
          placeholder={isAr ? '🔍 ابحث بالاسم أو الإيميل...' : '🔍 Search by name or email...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
          <p style={{ color: 'var(--pt-gray-500)', marginTop: 'var(--space-3)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🏢</div>
          <h3>{isAr ? 'لا يوجد عملاء' : 'No tenants found'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'لم يتم العثور على أي جيمات' : 'No gyms match your search'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'الجيم' : 'Gym'}</th>
                  <th>{isAr ? 'الخطة' : 'Plan'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'تاريخ الإنشاء' : 'Created'}</th>
                  <th>{isAr ? 'تاريخ الانتهاء' : 'End Date'}</th>
                  <th>{isAr ? 'الحدود' : 'Limits'}</th>
                  <th>{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={{ opacity: actionLoading === t.id ? 0.5 : 1 }}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{isAr ? (t.nameAr || t.name) : (t.nameEn || t.name)}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                          📧 {t.ownerEmail || '—'}
                        </div>
                        {t.phone && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                            📞 <span dir="ltr">{t.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold">{planLabel(t.subscription?.plan)}</span>
                    </td>
                    <td>{statusBadge(t.status)}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>
                      {formatDate(t.subscription?.endDate || t.subscription?.trialEndDate)}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)' }}>
                      {t.limits?.maxMembers === -1
                        ? '♾'
                        : `👥 ${t.limits?.maxMembers || '—'} / 🏋️ ${t.limits?.maxTrainers || '—'}`
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {/* Change Plan */}
                        <button
                          className="btn btn-sm"
                          style={{ background: 'linear-gradient(135deg, var(--pt-gold), #e6a800)', color: 'var(--pt-black)', fontWeight: 700, border: 'none' }}
                          onClick={() => openPlanModal(t)}
                          disabled={actionLoading === t.id}
                        >
                          🔄 {isAr ? 'تغيير الباقة' : 'Change Plan'}
                        </button>
                        {/* Activate */}
                        {(t.status === 'trial' || t.status === 'pending_payment' || t.status === 'expired') && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => changeStatus(t.id, 'active')}
                            disabled={actionLoading === t.id}
                          >
                            ✅ {isAr ? 'تفعيل' : 'Activate'}
                          </button>
                        )}
                        {/* Suspend */}
                        {(t.status === 'active' || t.status === 'trial') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--pt-warning)' }}
                            onClick={() => changeStatus(t.id, 'suspended')}
                            disabled={actionLoading === t.id}
                          >
                            ⏸️ {isAr ? 'تعليق' : 'Suspend'}
                          </button>
                        )}
                        {/* Reactivate */}
                        {t.status === 'suspended' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--pt-success)' }}
                            onClick={() => changeStatus(t.id, 'active')}
                            disabled={actionLoading === t.id}
                          >
                            ▶️ {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Change Modal */}
      {showPlanModal && modalTenant && (
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
                ? `الجيم: ${modalTenant.nameAr || modalTenant.name} — الباقة الحالية: ${PLAN_DEFINITIONS[modalTenant.subscription?.plan]?.name?.ar || modalTenant.subscription?.plan}`
                : `Gym: ${modalTenant.nameEn || modalTenant.name} — Current: ${PLAN_DEFINITIONS[modalTenant.subscription?.plan]?.name?.en || modalTenant.subscription?.plan}`
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
                      type="radio" name="plan" value={plan.id}
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
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
                  type="checkbox" checked={useCustomDays}
                  onChange={(e) => setUseCustomDays(e.target.checked)}
                  style={{ accentColor: 'var(--pt-gold)' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  {isAr ? 'تحديد مدة مخصصة (بالأيام)' : 'Set custom duration (days)'}
                </span>
              </label>
              {useCustomDays && (
                <input
                  className="form-input" type="number" min="1"
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
                  <strong>{useCustomDays && customDays ? customDays : PLAN_DEFINITIONS[selectedPlan]?.durationDays} {isAr ? 'يوم' : 'days'}</strong>
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
              <button className="btn btn-ghost" onClick={() => setShowPlanModal(false)} disabled={planChangeLoading}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
