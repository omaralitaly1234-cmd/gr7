'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const SPA_SERVICES = [
  { id: 'steam', icon: '♨️', ar: 'غرفة بخار', en: 'Steam Room', price: 150 },
  { id: 'sauna', icon: '🧖', ar: 'ساونا', en: 'Sauna', price: 200 },
  { id: 'jacuzzi', icon: '🛁', ar: 'جاكوزي', en: 'Jacuzzi', price: 250 },
  { id: 'massage', icon: '💆', ar: 'مساج', en: 'Massage', price: 350 },
  { id: 'facial', icon: '✨', ar: 'تنظيف بشرة', en: 'Facial', price: 300 },
  { id: 'body_wrap', icon: '🧴', ar: 'لفائف الجسم', en: 'Body Wrap', price: 400 },
  { id: 'cryo', icon: '❄️', ar: 'علاج بالتبريد', en: 'Cryotherapy', price: 500 },
  { id: 'turkish_bath', icon: '🏠', ar: 'حمام تركي', en: 'Turkish Bath', price: 450 },
];

export default function SpaPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [bookings, setBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [bookForm, setBookForm] = useState({
    memberId: '', serviceId: 'steam', duration: 60, price: 150, notes: '',
    scheduledTime: '', paymentMethod: 'cash',
  });

  useEffect(() => { loadData(); }, [tenantId, dateFilter]);

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

      const { data: mems } = await getTenantDocuments(tenantId, 'members');
      setMembers(mems || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const todayRevenue = bookings.filter(b => {
    const d = b.createdAt?.toDate ? b.createdAt.toDate() : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return d && d >= today;
  }).reduce((s, b) => s + (b.price || 0), 0);

  const handleBook = async () => {
    if (!tenantId || !bookForm.memberId || !bookForm.serviceId) return;
    try {
      const member = members.find(m => m.id === bookForm.memberId);
      const service = SPA_SERVICES.find(s => s.id === bookForm.serviceId);

      await addTenantDocument(tenantId, 'spa_bookings', {
        memberId: bookForm.memberId,
        memberName: member?.fullName?.[locale] || member?.fullName?.ar || '',
        serviceId: bookForm.serviceId,
        serviceName: service?.[locale] || service?.ar || '',
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
        invoiceNumber: `SPA-${new Date().getFullYear()}-${String(bookings.length + 1).padStart(4, '0')}`,
      });

      toast.success(isAr ? 'تم الحجز بنجاح' : 'Booking confirmed');
      setShowBooking(false);
      setBookForm({ memberId: '', serviceId: 'steam', duration: 60, price: 150, notes: '', scheduledTime: '', paymentMethod: 'cash' });
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

  const statusColors = { confirmed: 'badge-success', in_progress: 'badge-gold', completed: 'badge-info', cancelled: 'badge-danger' };
  const statusLabels = { confirmed: isAr ? 'مؤكد' : 'Confirmed', in_progress: isAr ? 'جاري' : 'In Progress', completed: isAr ? 'مكتمل' : 'Completed', cancelled: isAr ? 'ملغي' : 'Cancelled' };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧖</span> {t('spa.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowBooking(true)}>+ {t('spa.newBooking')}</button>
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

      {/* Services Grid */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>✨ {t('spa.services')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {SPA_SERVICES.map(service => (
            <div key={service.id} onClick={() => { setBookForm(f => ({ ...f, serviceId: service.id, price: service.price })); setShowBooking(true); }}
              style={{
                padding: 'var(--space-3)', textAlign: 'center', borderRadius: 'var(--radius-md)',
                background: 'var(--pt-darker)', border: '1px solid var(--glass-border)',
                cursor: 'pointer', transition: 'all 0.3s',
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{service.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{service[locale]}</div>
              <div style={{ color: 'var(--pt-gold)', fontWeight: 800, fontSize: 'var(--font-size-sm)' }}>{service.price} {t('common.egp')}</div>
            </div>
          ))}
        </div>
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
                const svc = SPA_SERVICES.find(s => s.id === b.serviceId);
                return (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{b.memberName}</td>
                    <td>{svc?.icon} {b.serviceName || svc?.[locale]}</td>
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
                <select className="form-select" value={bookForm.memberId} onChange={e => setBookForm(f => ({ ...f, memberId: e.target.value }))}>
                  <option value="">{t('common.select')}...</option>
                  {members.map(m => (<option key={m.id} value={m.id}>{m.fullName?.[locale] || m.fullName?.ar} — {m.membershipNumber}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('spa.service')} *</label>
                <select className="form-select" value={bookForm.serviceId} onChange={e => {
                  const svc = SPA_SERVICES.find(s => s.id === e.target.value);
                  setBookForm(f => ({ ...f, serviceId: e.target.value, price: svc?.price || f.price }));
                }}>
                  {SPA_SERVICES.map(s => (<option key={s.id} value={s.id}>{s.icon} {s[locale]} — {s.price} {t('common.egp')}</option>))}
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
              <button className="btn btn-primary" onClick={handleBook} disabled={!bookForm.memberId}>✅ {t('spa.confirmBooking')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
