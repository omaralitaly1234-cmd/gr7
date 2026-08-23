'use client';

// Spa desk — bookings plus the gym's own editable service/package catalogue.
// Prices and services used to be a hard-coded list in this file; they now live
// in `tenants/{tid}/spa_services` and the admin edits them right here.
// Changing a service never touches bookings already made: each booking stores
// the name and price it was sold at.

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import MemberPicker from '@/components/MemberPicker';
import { nextSequentialNumber } from '@/lib/firebase/counters';
import { useTenant } from '@/context/TenantContext';
import { useSpaServices } from '@/lib/hooks/useSpaServices';
import {
  createTenantSpaService, updateTenantSpaService, deleteTenantSpaService,
} from '@/lib/firebase/spa-services-store';
import { spaServiceErrorMessage, DEFAULT_SPA_ICON } from '@/lib/spa-services';
import { logAuditClient } from '@/lib/firebase/audit';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const EMPTY_SERVICE = {
  icon: DEFAULT_SPA_ICON, nameAr: '', nameEn: '', price: '', duration: 60, sessions: '', active: true,
};

export default function SpaPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [bookForm, setBookForm] = useState({
    memberId: '', member: null, serviceId: '', duration: 60, price: 0, notes: '',
    scheduledTime: '', paymentMethod: 'cash',
  });

  // The gym's catalogue. `includeInactive` so the management grid can show a
  // hidden service; the booking dropdown filters them back out.
  const { services, loading: servicesLoading, reload: reloadServices } =
    useSpaServices(tenantId, { includeInactive: true });
  const sellable = useMemo(() => services.filter(s => s.active), [services]);

  const [editingService, setEditingService] = useState(null); // doc id, or 'new'
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [savingService, setSavingService] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadData(); }, [tenantId, dateFilter]);

  // Keep the booking form pointed at a service that still exists — the admin
  // may have just renamed, hidden or deleted the one it was holding.
  useEffect(() => {
    if (sellable.length === 0) return;
    const current = sellable.find(s => s.serviceId === bookForm.serviceId);
    if (!current) {
      const first = sellable[0];
      setBookForm(f => ({ ...f, serviceId: first.serviceId, price: first.price, duration: first.duration }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellable]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const now = new Date();
      let startDate;
      if (dateFilter === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (dateFilter === 'week') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
      else startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data } = await getTenantDocuments(tenantId, 'spa_bookings',
        [{ field: 'createdAt', operator: '>=', value: Timestamp.fromDate(startDate) }],
        { field: 'createdAt', direction: 'desc' });
      setBookings(data || []);
      // Members are picked via search now — no full-collection load on mount.
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const todayRevenue = bookings.filter(b => {
    const d = b.createdAt?.toDate ? b.createdAt.toDate() : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return d && d >= today;
  }).reduce((s, b) => s + (b.price || 0), 0);

  const serviceById = useMemo(
    () => new Map(services.map(s => [s.serviceId, s])),
    [services],
  );

  // ==================== Bookings ====================

  const openBookingFor = (service) => {
    setBookForm(f => ({
      ...f, serviceId: service.serviceId, price: service.price, duration: service.duration,
    }));
    setShowBooking(true);
  };

  const handleBook = async () => {
    if (!tenantId || !bookForm.memberId || !bookForm.serviceId) return;
    try {
      // The picker hands us the full member doc, so no lookup list is needed.
      const member = bookForm.member;
      const service = serviceById.get(bookForm.serviceId);

      await addTenantDocument(tenantId, 'spa_bookings', {
        memberId: bookForm.memberId,
        memberName: member?.fullName?.[locale] || member?.fullName?.ar || '',
        serviceId: bookForm.serviceId,
        serviceName: service?.name?.[locale] || service?.name?.ar || '',
        serviceIcon: service?.icon || DEFAULT_SPA_ICON,
        duration: bookForm.duration,
        price: bookForm.price,
        notes: bookForm.notes,
        status: 'confirmed',
        scheduledTime: bookForm.scheduledTime,
        paymentMethod: bookForm.paymentMethod,
      });

      // Also record payment
      await addTenantDocument(tenantId, 'payments', {
        memberId: bookForm.memberId,
        memberName: member?.fullName?.[locale] || member?.fullName?.ar || '',
        type: 'spa',
        amount: bookForm.price,
        discount: 0,
        netAmount: bookForm.price,
        method: bookForm.paymentMethod,
        status: 'completed',
        invoiceNumber: await nextSequentialNumber(tenantId, 'spa_invoices', 'SPA', bookings.length),
      });

      toast.success(isAr ? 'تم الحجز بنجاح' : 'Booking confirmed');
      setShowBooking(false);
      const fallback = sellable[0];
      setBookForm({
        memberId: '', member: null,
        serviceId: fallback?.serviceId || '', duration: fallback?.duration || 60, price: fallback?.price || 0,
        notes: '', scheduledTime: '', paymentMethod: 'cash',
      });
      loadData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    if (!tenantId) return;
    await updateTenantDocument(tenantId, 'spa_bookings', bookingId, { status: newStatus });
    toast.success(t('common.success'));
    loadData();
  };

  // ==================== Catalogue editing ====================

  const setSvc = (k, v) => setServiceForm(f => ({ ...f, [k]: v }));

  const openNewService = () => { setServiceForm(EMPTY_SERVICE); setEditingService('new'); };

  const openEditService = (svc) => {
    setServiceForm({
      icon: svc.icon || DEFAULT_SPA_ICON,
      nameAr: svc.name?.ar || '',
      nameEn: svc.name?.en || '',
      price: svc.price ?? '',
      duration: svc.duration ?? 60,
      sessions: svc.sessions ?? '',
      active: svc.active !== false,
    });
    setEditingService(svc.id);
  };

  const closeService = () => { setEditingService(null); setServiceForm(EMPTY_SERVICE); };

  const saveService = async () => {
    if (savingService || !tenantId) return;
    setSavingService(true);
    const isNew = editingService === 'new';
    const res = isNew
      ? await createTenantSpaService(tenantId, serviceForm, services.length)
      : await updateTenantSpaService(tenantId, editingService, serviceForm);

    if (!res.ok) {
      toast.error(spaServiceErrorMessage(res.error, isAr));
      setSavingService(false);
      return;
    }

    logAuditClient({
      action: isNew ? 'create' : 'update',
      entity: 'spa_service',
      entityId: isNew ? res.id : editingService,
      tenantId,
      details: {
        description: {
          en: `${isNew ? 'Created' : 'Updated'} spa service ${serviceForm.nameAr} at ${serviceForm.price}`,
          ar: `${isNew ? 'إضافة' : 'تعديل'} خدمة سبا ${serviceForm.nameAr} بسعر ${serviceForm.price}`,
        },
      },
    });

    toast.success(isAr ? 'تم الحفظ ✅' : 'Saved ✅');
    closeService();
    reloadServices();
    setSavingService(false);
  };

  const removeService = async () => {
    if (!confirmDelete || !tenantId) return;
    const res = await deleteTenantSpaService(tenantId, confirmDelete.id);
    if (!res.ok) { toast.error(spaServiceErrorMessage(res.error, isAr)); return; }
    logAuditClient({
      action: 'delete', entity: 'spa_service', entityId: confirmDelete.id, tenantId,
      severity: 'warning',
      details: { description: { en: `Deleted spa service ${confirmDelete.name?.ar}`, ar: `حذف خدمة سبا ${confirmDelete.name?.ar}` } },
    });
    toast.success(isAr ? 'تم حذف الخدمة' : 'Service deleted');
    setConfirmDelete(null);
    reloadServices();
  };

  const toggleServiceActive = async (svc) => {
    const res = await updateTenantSpaService(tenantId, svc.id, {
      icon: svc.icon, nameAr: svc.name?.ar, nameEn: svc.name?.en,
      price: svc.price, duration: svc.duration, sessions: svc.sessions,
      active: !(svc.active !== false),
    });
    if (!res.ok) { toast.error(spaServiceErrorMessage(res.error, isAr)); return; }
    reloadServices();
  };

  const statusColors = { confirmed: 'badge-success', in_progress: 'badge-gold', completed: 'badge-info', cancelled: 'badge-danger' };
  const statusLabels = { confirmed: isAr ? 'مؤكد' : 'Confirmed', in_progress: isAr ? 'جاري' : 'In Progress', completed: isAr ? 'مكتمل' : 'Completed', cancelled: isAr ? 'ملغي' : 'Cancelled' };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧖</span> {t('spa.title')}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={openNewService}>+ {isAr ? 'خدمة / باكدج' : 'Service / Package'}</button>
          <button className="btn btn-primary" onClick={() => setShowBooking(true)} disabled={sellable.length === 0}>
            + {t('spa.newBooking')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">🧖</div>
          <div className="stat-info">
            <div className="stat-value">{bookings.length}</div>
            <div className="stat-label">{isAr ? 'إجمالي الحجوزات' : 'Total Bookings'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</div>
            <div className="stat-label">{isAr ? 'مؤكدة' : 'Confirmed'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{bookings.filter(b => b.status === 'in_progress').length}</div>
            <div className="stat-label">{isAr ? 'جارية' : 'In Progress'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">💰</div>
          <div className="stat-info">
            <div className="stat-value">{todayRevenue.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'إيرادات اليوم' : "Today's Revenue"} ({t('common.egp')})</div>
          </div>
        </div>
      </div>

      {/* Services Grid — click a card to book it, use the buttons to edit it */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', margin: 0 }}>✨ {t('spa.services')} & {t('spa.packages')}</h3>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
            {isAr
              ? 'تعديل السعر بيأثر على الحجوزات الجديدة بس — الحجوزات القديمة بتفضل بسعرها.'
              : 'Editing a price affects new bookings only — past bookings keep their price.'}
          </span>
        </div>
        {servicesLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--pt-gray-500)' }}>{t('common.loading')}</div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--pt-gray-500)' }}>
            📭 {t('common.noData')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {services.map(service => (
              <div key={service.id}
                style={{
                  padding: 'var(--space-3)', textAlign: 'center', borderRadius: 'var(--radius-md)',
                  background: 'var(--pt-darker)', border: '1px solid var(--glass-border)',
                  transition: 'all 0.3s', opacity: service.active ? 1 : 0.5,
                }}>
                <div onClick={() => service.active && openBookingFor(service)}
                  style={{ cursor: service.active ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{service.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{service.name?.[locale] || service.name?.ar}</div>
                  <div style={{ color: 'var(--pt-gold)', fontWeight: 800, fontSize: 'var(--font-size-sm)' }}>
                    {service.price.toLocaleString()} {t('common.egp')}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginTop: '2px' }}>
                    ⏱️ {service.duration} {isAr ? 'دقيقة' : 'min'}
                    {service.sessions ? ` · 📊 ${service.sessions} ${isAr ? 'جلسة' : 'sessions'}` : ''}
                  </div>
                  {!service.active && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-danger)', marginTop: '2px' }}>
                      {isAr ? 'متوقفة' : 'Hidden'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditService(service)} title={t('common.edit')}>✏️</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleServiceActive(service)}
                    title={service.active ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'تفعيل' : 'Activate')}>
                    {service.active ? '🚫' : '✅'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(service)}
                    title={t('common.delete')} style={{ color: 'var(--pt-danger)' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter & Table */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <select className="form-select" style={{ width: 'auto' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="today">{t('common.today')}</option>
          <option value="week">{t('common.thisWeek')}</option>
          <option value="month">{t('common.thisMonth')}</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>{t('members.fullName')}</th><th>{t('spa.service')}</th>
            <th>{isAr ? 'المدة' : 'Duration'}</th><th>{t('finance.amount')}</th>
            <th>{t('common.status')}</th><th>{t('common.actions')}</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>📭 {t('common.noData')}</td></tr>
            ) : (
              bookings.map((b, i) => {
                const svc = serviceById.get(b.serviceId);
                return (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{b.memberName}</td>
                    <td>{b.serviceIcon || svc?.icon || DEFAULT_SPA_ICON} {b.serviceName || svc?.name?.[locale] || svc?.name?.ar || '—'}</td>
                    <td>{b.duration} {isAr ? 'دقيقة' : 'min'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{(b.price || 0).toLocaleString()} {t('common.egp')}</td>
                    <td><span className={`badge ${statusColors[b.status] || 'badge-info'}`} style={{ fontSize: '10px' }}>● {statusLabels[b.status] || b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {b.status === 'confirmed' && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(b.id, 'in_progress')}>▶️</button>}
                        {b.status === 'in_progress' && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(b.id, 'completed')} style={{ color: 'var(--pt-success)' }}>✅</button>}
                        {b.status !== 'cancelled' && b.status !== 'completed' && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(b.id, 'cancelled')} style={{ color: 'var(--pt-danger)' }}>✕</button>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>🧖 {t('spa.newBooking')}</h2>
              <button onClick={() => setShowBooking(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('subscriptions.selectMember')} *</label>
                <MemberPicker
                  tenantId={tenantId}
                  value={bookForm.memberId}
                  isAr={isAr}
                  onChange={(id, member) => setBookForm(f => ({ ...f, memberId: id, member }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('spa.service')} *</label>
                <select className="form-select" value={bookForm.serviceId} onChange={e => {
                  const svc = serviceById.get(e.target.value);
                  setBookForm(f => ({
                    ...f,
                    serviceId: e.target.value,
                    price: svc ? svc.price : f.price,
                    duration: svc ? svc.duration : f.duration,
                  }));
                }}>
                  {sellable.map(s => (
                    <option key={s.id} value={s.serviceId}>
                      {s.icon} {s.name?.[locale] || s.name?.ar} — {s.price.toLocaleString()} {t('common.egp')}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                  <input className="form-input" type="number" dir="ltr" value={bookForm.duration} onChange={e => setBookForm(f => ({ ...f, duration: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('finance.amount')}</label>
                  <input className="form-input" type="number" dir="ltr" value={bookForm.price} onChange={e => setBookForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('finance.paymentMethod')}</label>
                  <select className="form-select" value={bookForm.paymentMethod} onChange={e => setBookForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    <option value="cash">💵 {t('finance.cash')}</option>
                    <option value="visa">💳 {t('finance.visa')}</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.notes')}</label>
                <textarea className="form-input" rows={2} value={bookForm.notes} onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBooking(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleBook} disabled={!bookForm.memberId || !bookForm.serviceId}>✅ {t('spa.confirmBooking')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / edit a spa service or package */}
      {editingService && (
        <div className="modal-overlay" onClick={() => { if (!savingService) closeService(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>🧖 {editingService === 'new'
                ? (isAr ? 'خدمة / باكدج جديدة' : 'New Service / Package')
                : (isAr ? 'تعديل الخدمة' : 'Edit Service')}</h2>
              <button onClick={closeService} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم بالعربي' : 'Name (Arabic)'} *</label>
                  <input className="form-input" value={serviceForm.nameAr} onChange={e => setSvc('nameAr', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input className="form-input" dir="ltr" value={serviceForm.nameEn} onChange={e => setSvc('nameEn', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الأيقونة' : 'Icon'}</label>
                  <input className="form-input" value={serviceForm.icon} onChange={e => setSvc('icon', e.target.value)}
                    placeholder={DEFAULT_SPA_ICON} maxLength={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'السعر' : 'Price'} ({t('common.egp')}) *</label>
                  <input className="form-input" type="number" min="0" dir="ltr"
                    value={serviceForm.price} onChange={e => setSvc('price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المدة (دقيقة)' : 'Duration (min)'} *</label>
                  <input className="form-input" type="number" min="1" dir="ltr"
                    value={serviceForm.duration} onChange={e => setSvc('duration', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'عدد الجلسات' : 'Sessions'}</label>
                  <input className="form-input" type="number" min="1" dir="ltr"
                    value={serviceForm.sessions} onChange={e => setSvc('sessions', e.target.value)}
                    placeholder={isAr ? 'فاضية = جلسة واحدة' : 'Blank = single visit'} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={serviceForm.active !== false} onChange={e => setSvc('active', e.target.checked)} />
                <span>{isAr ? 'الخدمة معروضة للحجز' : 'Service is available for booking'}</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeService} disabled={savingService}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={saveService} disabled={savingService}>
                {savingService ? '⏳' : '💾'} {t('common.save')}
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
              <h2 style={{ color: 'var(--pt-danger)' }}>🗑️ {isAr ? 'حذف الخدمة' : 'Delete Service'}</h2>
              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-3)' }}>
                {isAr ? `هتحذف خدمة "${confirmDelete.name?.ar}".` : `Delete the service "${confirmDelete.name?.en || confirmDelete.name?.ar}".`}
              </p>
              <div style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
                {isAr
                  ? 'الحجوزات القديمة على الخدمة دي مش هتتأثر — بس مش هتقدر تحجزها لحد جديد. لو عايز توقفها مؤقتاً بس، استخدم زرار الإخفاء 🚫 بدل الحذف.'
                  : 'Bookings already made on this service are unaffected — you just cannot book it again. To pause it instead, use the hide button 🚫.'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={removeService}>🗑️ {t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
