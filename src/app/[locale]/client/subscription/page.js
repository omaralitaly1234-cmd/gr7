'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, updateTenantDocument, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ClientSubscriptionPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [freezeDays, setFreezeDays] = useState(3);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadSubscriptionData() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        let members = [];
        const { data: byUid } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'uid', operator: '==', value: user.uid }]);
        members = byUid || [];
        if (members.length === 0) {
          const { data: byUserId } = await getTenantDocuments(tenantId, 'members',
            [{ field: 'userId', operator: '==', value: user.uid }]);
          members = byUserId || [];
        }
        const member = members[0] || null;
        setMemberData(member);
        if (member) {
          const { data: activeSubs } = await getTenantDocuments(tenantId, 'subscriptions',
            [{ field: 'memberId', operator: '==', value: member.id },
              { field: 'status', operator: '==', value: 'active' }]);
          setSubscription(activeSubs?.[0] || null);
          const { data: allSubs } = await getTenantDocuments(tenantId, 'subscriptions',
            [{ field: 'memberId', operator: '==', value: member.id }],
            { field: 'createdAt', direction: 'desc' });
          setHistory(allSubs || []);
        }
      } catch (err) { console.error('Error loading subscription data:', err); }
      setLoading(false);
    }
    loadSubscriptionData();
  }, [tenantId, user]);

  const toDate = (ts) => { if (!ts) return null; if (ts.toDate) return ts.toDate(); if (ts.seconds) return new Date(ts.seconds * 1000); return new Date(ts); };
  const formatDate = (ts) => { const d = toDate(ts); if (!d) return '-'; return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };
  const getDaysLeft = () => { if (!subscription?.endDate) return 0; const end = toDate(subscription.endDate); return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24))); };
  const getTotalDays = () => { if (!subscription?.startDate || !subscription?.endDate) return subscription?.planSnapshot?.duration || 30; const s = toDate(subscription.startDate); const e = toDate(subscription.endDate); return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24))); };

  const remaining = getDaysLeft();
  const totalDays = getTotalDays();
  const progress = Math.round(((totalDays - remaining) / totalDays) * 100);
  const planType = subscription?.planSnapshot?.type || memberData?.currentPlan?.type || 'gold';
  const planName = subscription?.planSnapshot?.name?.[locale] || memberData?.currentPlan?.planName || memberData?.planName || (isAr ? 'لا اشتراك' : 'No Subscription');
  const planPrice = subscription?.amountPaid || subscription?.planSnapshot?.price || 0;
  const paymentMethod = subscription?.paymentMethod || '-';
  const memberId = memberData?.membershipNumber || memberData?.qrCode || '-';
  const freezeUsed = subscription?.freezeDaysUsed || 0;
  const freezeMax = subscription?.maxFreezeDays || 14;
  const guestsUsed = subscription?.invitationsUsed || 0;
  const guestsMax = subscription?.maxInvitations || 2;

  const getFeatures = () => {
    if (planType === 'diamond') return isAr ? ['صالة الجيم (جميع الأجهزة)', 'دش + لوكر', 'مدرب خاص', 'خطة غذائية', 'برنامج تدريب شخصي', 'سبا وساونا', 'أولوية الحجز'] : ['Full Gym Access', 'Shower + Locker', 'Personal Trainer', 'Diet Plan', 'Custom Training Program', 'Spa & Sauna', 'Priority Booking'];
    return isAr ? ['صالة الجيم (جميع الأجهزة)', 'دش + لوكر', 'مدرب خاص', 'خطة غذائية', 'برنامج تدريب شخصي'] : ['Full Gym Access', 'Shower + Locker', 'Personal Trainer', 'Diet Plan', 'Custom Training Program'];
  };

  if (loading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  if (!memberData) return (<div className="animate-fadeIn"><div className="page-header"><h1><span>💳</span> {t('client.mySubscription')}</h1></div><div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div><p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-lg)' }}>{isAr ? 'لم يتم العثور على بيانات العضوية' : 'No membership data found'}</p><p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'يرجى التواصل مع إدارة النادي' : 'Please contact gym management'}</p></div></div>);

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>💳</span> {t('client.mySubscription')}</h1></div>
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: `3px solid ${planType === 'diamond' ? 'var(--pt-info)' : 'var(--pt-gold)'}`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, insetInlineEnd: 16 }}>
          {subscription ? (<span className="badge badge-success" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-3)' }}>✓ {t('common.active')}</span>) : (<span className="badge badge-danger" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-3)' }}>{isAr ? 'غير مشترك' : 'No Active Plan'}</span>)}
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}>#{memberId}</div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: planType === 'diamond' ? 'var(--pt-info)' : 'var(--pt-gold)' }}>{planType === 'diamond' ? '💎' : '💛'} {planName}</h2>
          {subscription && <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginTop: 'var(--space-1)' }}>{planPrice.toLocaleString()} {t('common.egp')}</div>}
        </div>
        {subscription && (<>
          <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
            <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: remaining <= 7 ? 'var(--pt-danger)' : 'var(--pt-gold)' }}>{remaining}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'يوم متبقي' : 'Days Left'}</div></div>
            <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>{totalDays}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'إجمالي الأيام' : 'Total Days'}</div></div>
            <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>❄️ {freezeUsed}/{freezeMax}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'تجميد' : 'Freeze'}</div></div>
            <div style={{ background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>👥 {guestsUsed}/{guestsMax}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'ضيوف' : 'Guests'}</div></div>
          </div>
          {subscription.totalSessions && (<div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}><span>{isAr ? 'الحصص المتبقية' : 'Remaining Sessions'}</span><span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{subscription.remainingSessions || 0} / {subscription.totalSessions}</span></div><div style={{ height: 6, background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: 'var(--pt-gold)', width: `${((subscription.remainingSessions || 0) / subscription.totalSessions) * 100}%`, transition: 'width 0.3s' }} /></div></div>)}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-1)' }}><span>{formatDate(subscription.startDate)}</span><span>{progress}%</span><span>{formatDate(subscription.endDate)}</span></div>
            <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: progress > 80 ? 'var(--pt-danger)' : 'var(--pt-gold)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)' }}>
            <span>💰 {isAr ? 'طريقة الدفع' : 'Payment'}: <strong style={{ color: 'var(--pt-gray-200)' }}>{paymentMethod === 'cash' ? (isAr ? 'كاش' : 'Cash') : paymentMethod === 'visa' ? (isAr ? 'فيزا' : 'Visa') : paymentMethod === 'bank_transfer' ? (isAr ? 'تحويل بنكي' : 'Bank Transfer') : paymentMethod}</strong></span>
            {subscription.discountApplied?.percentage > 0 && <span>🏷️ {isAr ? 'خصم' : 'Discount'}: <strong style={{ color: 'var(--pt-success)' }}>{subscription.discountApplied.percentage}%</strong></span>}
          </div>
        </>)}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowRenewModal(true)}>🔄 {isAr ? 'تجديد الاشتراك' : 'Renew'}</button>
          {subscription && (<><button className="btn btn-outline" onClick={() => setShowFreezeModal(true)} disabled={freezeUsed >= freezeMax}>❄️ {isAr ? 'تجميد' : 'Freeze'}</button><button className="btn btn-outline" onClick={() => setShowGuestModal(true)} disabled={guestsUsed >= guestsMax}>👥 {isAr ? 'دعوة ضيف' : 'Invite Guest'}</button></>)}
        </div>
      </div>
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>✨ {isAr ? 'مميزات اشتراكك' : 'Your Features'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {getFeatures().map((f, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}><span style={{ color: 'var(--pt-success)' }}>✓</span><span>{f}</span></div>))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 {isAr ? 'سجل الاشتراكات' : 'History'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {history.length === 0 ? (<p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>📭 {isAr ? 'لا يوجد سجل اشتراكات' : 'No subscription history'}</p>) : (
              history.map((h, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: `3px solid ${h.status === 'active' ? 'var(--pt-gold)' : 'var(--pt-gray-700)'}` }}><div><div style={{ fontWeight: 600 }}>{h.planSnapshot?.type === 'diamond' ? '💎' : '🥇'} {h.planSnapshot?.name?.[locale] || h.planId || '-'}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{formatDate(h.startDate)} → {formatDate(h.endDate)}</div></div><div style={{ textAlign: 'end' }}><div style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{(h.amountPaid || h.planSnapshot?.price || 0).toLocaleString()} {t('common.egp')}</div><span className={`badge ${h.status === 'active' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px' }}>{h.status === 'active' ? (isAr ? 'حالي' : 'Current') : (isAr ? 'مكتمل' : 'Completed')}</span></div></div>))
            )}
          </div>
        </div>
      </div>
      {/* Renew Modal */}
      {showRenewModal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>🔄 {isAr ? 'تجديد الاشتراك' : 'Renew Subscription'}</h2>
            <div className="card" style={{ background: 'var(--pt-darker)', marginBottom: 'var(--space-4)' }}>
              <p style={{ marginBottom: 'var(--space-2)' }}>{isAr ? 'الخطة الحالية' : 'Current Plan'}: <strong style={{ color: 'var(--pt-gold)' }}>{planName}</strong></p>
              <p>{isAr ? 'السعر' : 'Price'}: <strong>{planPrice.toLocaleString()} {t('common.egp')}</strong></p>
            </div>
            <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>{isAr ? 'سيتم إرسال طلب التجديد لإدارة النادي للموافقة عليه.' : 'A renewal request will be sent to gym management for approval.'}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={async () => {
                setActionLoading(true);
                try {
                  await addTenantDocument(tenantId, 'renewal-requests', { memberId: memberData.id, memberName: memberData.fullName, currentPlan: planName, price: planPrice, status: 'pending', requestedAt: new Date().toISOString() });
                  toast.success(isAr ? 'تم إرسال طلب التجديد بنجاح' : 'Renewal request sent');
                  setShowRenewModal(false);
                } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                setActionLoading(false);
              }}>{actionLoading ? '...' : '✓ ' + (isAr ? 'إرسال الطلب' : 'Send Request')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Modal */}
      {showFreezeModal && (
        <div className="modal-overlay" onClick={() => setShowFreezeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>❄️ {isAr ? 'تجميد الاشتراك' : 'Freeze Subscription'}</h2>
            <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>{isAr ? `لديك ${freezeMax - freezeUsed} يوم تجميد متبقي` : `You have ${freezeMax - freezeUsed} freeze days remaining`}</p>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">{isAr ? 'عدد الأيام' : 'Number of Days'}</label>
              <input className="form-input" type="number" min="1" max={freezeMax - freezeUsed} value={freezeDays} onChange={e => setFreezeDays(Math.min(Number(e.target.value), freezeMax - freezeUsed))} dir="ltr" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary" onClick={() => setShowFreezeModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={actionLoading || freezeDays < 1} onClick={async () => {
                setActionLoading(true);
                try {
                  const newEnd = new Date(toDate(subscription.endDate).getTime() + freezeDays * 86400000);
                  await updateTenantDocument(tenantId, 'subscriptions', subscription.id, { freezeDaysUsed: freezeUsed + freezeDays, endDate: newEnd, lastFreezeDate: new Date().toISOString() });
                  toast.success(isAr ? `تم تجميد ${freezeDays} يوم بنجاح` : `${freezeDays} days frozen successfully`);
                  setShowFreezeModal(false);
                  setSubscription(prev => ({ ...prev, freezeDaysUsed: freezeUsed + freezeDays, endDate: newEnd }));
                } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                setActionLoading(false);
              }}>{'❄️ ' + (isAr ? 'تجميد' : 'Freeze')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Invite Modal */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>👥 {isAr ? 'دعوة ضيف' : 'Invite Guest'}</h2>
            <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>{isAr ? `لديك ${guestsMax - guestsUsed} دعوة متبقية` : `You have ${guestsMax - guestsUsed} invitations remaining`}</p>
            <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="form-label">{isAr ? 'اسم الضيف' : 'Guest Name'}</label>
              <input className="form-input" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={isAr ? 'الاسم الكامل' : 'Full name'} />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
              <input className="form-input" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary" onClick={() => setShowGuestModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={actionLoading || !guestName.trim()} onClick={async () => {
                setActionLoading(true);
                try {
                  await addTenantDocument(tenantId, 'guest-invitations', { memberId: memberData.id, memberName: memberData.fullName, subscriptionId: subscription.id, guestName: guestName.trim(), guestPhone: guestPhone.trim(), date: new Date().toISOString(), status: 'active' });
                  await updateTenantDocument(tenantId, 'subscriptions', subscription.id, { invitationsUsed: guestsUsed + 1 });
                  toast.success(isAr ? 'تم إرسال الدعوة بنجاح' : 'Guest invitation sent');
                  setShowGuestModal(false);
                  setGuestName(''); setGuestPhone('');
                  setSubscription(prev => ({ ...prev, invitationsUsed: guestsUsed + 1 }));
                } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
                setActionLoading(false);
              }}>{'👥 ' + (isAr ? 'إرسال الدعوة' : 'Send Invite')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
