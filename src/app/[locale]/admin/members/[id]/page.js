'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { getTenantDocument, getTenantDocuments, updateTenantDocument, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function MemberProfilePage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const memberId = params?.id;
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [member, setMember] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ title: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    async function loadMember() {
      if (!tenantId || !memberId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocument(tenantId, 'members', memberId);
        setMember(data);

        const { data: subs } = await getTenantDocuments(tenantId, 'subscriptions',
          [{ field: 'memberId', operator: '==', value: memberId }],
          { field: 'createdAt', direction: 'desc' });
        setSubscriptions(subs || []);

        const { data: pays } = await getTenantDocuments(tenantId, 'payments',
          [{ field: 'memberId', operator: '==', value: memberId }],
          { field: 'createdAt', direction: 'desc' });
        setPayments(pays || []);

        const { data: att } = await getTenantDocuments(tenantId, 'attendance',
          [{ field: 'memberId', operator: '==', value: memberId }],
          { field: 'checkIn', direction: 'desc' }, 20);
        setAttendance(att || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadMember();
  }, [tenantId, memberId]);

  const handleFreeze = async () => {
    if (!tenantId || !memberId) return;
    const activeSub = subscriptions.find(s => s.status === 'active');
    if (!activeSub) return;

    try {
      const freezeStart = new Date();
      await updateTenantDocument(tenantId, 'subscriptions', activeSub.id, {
        status: 'frozen',
        currentFreezeStart: Timestamp.fromDate(freezeStart),
        freezeReason: freezeReason || '',
      });
      await updateTenantDocument(tenantId, 'members', memberId, { status: 'frozen' });
      // Update local state so UI reflects changes immediately
      setMember(prev => ({ ...prev, status: 'frozen' }));
      setSubscriptions(prev => prev.map(s =>
        s.id === activeSub.id
          ? { ...s, status: 'frozen', currentFreezeStart: Timestamp.fromDate(freezeStart), freezeReason: freezeReason || '' }
          : s
      ));
      setShowFreezeModal(false);
      setFreezeReason('');
      toast.success(isAr ? 'تم تجميد الاشتراك بنجاح ❄️' : 'Subscription frozen ❄️');
    } catch (err) {
      console.error('[Freeze]', err);
      toast.error(isAr ? 'حدث خطأ أثناء التجميد' : 'Error freezing subscription');
    }
  };

  const handleUnfreeze = async () => {
    const frozenSub = subscriptions.find(s => s.status === 'frozen');
    if (!frozenSub || !tenantId) return;

    try {
      const freezeStart = frozenSub.currentFreezeStart?.toDate ? frozenSub.currentFreezeStart.toDate() : new Date(frozenSub.currentFreezeStart);
      const daysFrozen = Math.max(1, Math.ceil((new Date() - freezeStart) / (1000 * 60 * 60 * 24)));
      const originalEnd = frozenSub.endDate?.toDate ? frozenSub.endDate.toDate() : new Date(frozenSub.endDate);
      const newEnd = new Date(originalEnd);
      newEnd.setDate(newEnd.getDate() + daysFrozen);
      const newEndTimestamp = Timestamp.fromDate(newEnd);

      await updateTenantDocument(tenantId, 'subscriptions', frozenSub.id, {
        status: 'active',
        currentFreezeStart: null,
        endDate: newEndTimestamp,
        freezeDaysUsed: (frozenSub.freezeDaysUsed || 0) + daysFrozen,
      });
      await updateTenantDocument(tenantId, 'members', memberId, { status: 'active' });
      // Update local state so UI reflects changes immediately
      setMember(prev => ({ ...prev, status: 'active' }));
      setSubscriptions(prev => prev.map(s =>
        s.id === frozenSub.id
          ? { ...s, status: 'active', currentFreezeStart: null, endDate: newEndTimestamp, freezeDaysUsed: (frozenSub.freezeDaysUsed || 0) + daysFrozen }
          : s
      ));
      toast.success(isAr ? `تم إلغاء التجميد — تمت إضافة ${daysFrozen} يوم ✅` : `Unfrozen — ${daysFrozen} days added ✅`);
    } catch (err) {
      console.error('[Unfreeze]', err);
      toast.error(isAr ? 'حدث خطأ أثناء إلغاء التجميد' : 'Error unfreezing subscription');
    }
  };

  const handleSendMessage = async () => {
    if (!tenantId || !memberId || !messageForm.title || !messageForm.message) return;
    setSendingMessage(true);
    try {
      await addTenantDocument(tenantId, 'notifications', {
        title: messageForm.title,
        message: messageForm.message,
        type: 'general',
        target: 'individual',
        memberId: memberId,
        memberName: name,
        status: 'sent',
        sentAt: Timestamp.fromDate(new Date()),
        readBy: [],
      });
      toast.success(isAr ? 'تم إرسال الرسالة بنجاح 📤' : 'Message sent successfully 📤');
      setShowMessageModal(false);
      setMessageForm({ title: '', message: '' });
    } catch (err) {
      console.error('[SendMessage]', err);
      toast.error(isAr ? 'حدث خطأ أثناء الإرسال' : 'Error sending message');
    }
    setSendingMessage(false);
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-500)', marginTop: '0.5rem' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  if (!member) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>😔</div>
      <h2>{isAr ? 'لم يتم العثور على العضو' : 'Member not found'}</h2>
      <Link href={`/${locale}/admin/members`} className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
        ← {t('common.back')}
      </Link>
    </div>
  );

  const name = member.fullName?.[locale] || member.fullName?.ar || '';
  const statusColors = { active: 'badge-success', expired: 'badge-danger', frozen: 'badge-frozen', cancelled: 'badge-warning' };
  const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'frozen');

  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: '📋' },
    { id: 'subscriptions', label: isAr ? 'الاشتراكات' : 'Subscriptions', icon: '💳' },
    { id: 'payments', label: isAr ? 'المدفوعات' : 'Payments', icon: '💰' },
    { id: 'attendance', label: isAr ? 'الحضور' : 'Attendance', icon: '📊' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>👤</span> {t('members.memberProfile')}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={() => router.back()}>← {t('common.back')}</button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: 'var(--radius-xl)',
            background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 900, color: 'var(--pt-gold)', flexShrink: 0,
            border: '3px solid rgba(245,197,24,0.3)',
          }}>
            {name.charAt(0)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{name}</h2>
              <span className={`badge ${statusColors[member.status] || 'badge-info'}`}>
                ● {t(`common.${member.status}`)}
              </span>
              <span className={`badge ${member.currentPlan?.type === 'diamond' ? 'badge-diamond' : 'badge-gold'}`}>
                {member.currentPlan?.type === 'diamond' ? '💎' : '🥇'} {member.planName || member.currentPlan?.planName}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
              <span>📱 <span dir="ltr">{member.phone}</span></span>
              <span>🎫 <code style={{ color: 'var(--pt-gold)', background: 'var(--pt-gold-glow)', padding: '2px 8px', borderRadius: 4 }}>{member.membershipNumber}</code></span>
              <span>{member.gender === 'male' ? '♂️' : '♀️'} {t(`common.${member.gender}`)}</span>
              {member.email && <span>📧 {member.email}</span>}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {[
              { v: member.totalVisits || 0, l: isAr ? 'زيارة' : 'Visits', c: 'var(--pt-gold)' },
              { v: (member.totalSpent || 0).toLocaleString(), l: t('common.egp'), c: 'var(--pt-success)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-5)', flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-4)' }}>
          <Link href={`/${locale}/admin/subscriptions?member=${memberId}`} className="btn btn-primary btn-sm">
            💳 {t('subscriptions.renew')}
          </Link>
          {member.status === 'active' && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowFreezeModal(true)}>
              ❄️ {t('subscriptions.freeze')}
            </button>
          )}
          {member.status === 'frozen' && (
            <button className="btn btn-outline btn-sm" onClick={handleUnfreeze} style={{ color: 'var(--pt-success)', borderColor: 'var(--pt-success)' }}>
              🔓 {t('subscriptions.unfreeze')}
            </button>
          )}
          <Link href={`/${locale}/admin/finance/payments?member=${memberId}`} className="btn btn-ghost btn-sm">
            💰 {isAr ? 'تسجيل دفعة' : 'Record Payment'}
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMessageModal(true)}>📱 {isAr ? 'إرسال رسالة' : 'Send Message'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-1)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            background: activeTab === tab.id ? 'var(--pt-gold-glow)' : 'transparent',
            color: activeTab === tab.id ? 'var(--pt-gold)' : 'var(--pt-gray-500)',
            fontWeight: activeTab === tab.id ? 700 : 400, fontSize: 'var(--font-size-sm)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            borderBottom: activeTab === tab.id ? '2px solid var(--pt-gold)' : '2px solid transparent',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>👤 {t('members.personalInfo')}</h3>
            {[
              { l: t('members.fullNameAr'), v: member.fullName?.ar },
              { l: t('members.fullNameEn'), v: member.fullName?.en },
              { l: t('members.phone'), v: member.phone, dir: 'ltr' },
              { l: t('members.whatsapp'), v: member.whatsapp, dir: 'ltr' },
              { l: t('members.email'), v: member.email, dir: 'ltr' },
              { l: t('members.gender'), v: t(`common.${member.gender}`) },
              { l: t('members.nationalId'), v: member.nationalId, dir: 'ltr' },
              { l: t('members.address'), v: member.address },
              { l: t('members.joinDate'), v: member.joinDate?.toDate ? member.joinDate.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : member.joinDate },
            ].filter(f => f.v).map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--glass-border)', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{f.l}</span>
                <span style={{ fontWeight: 600 }} dir={f.dir}>{f.v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>🏥 {t('members.healthInfo')}</h3>
            {[
              { l: t('members.height'), v: member.height ? `${member.height} cm` : null },
              { l: t('members.weight'), v: member.weight ? `${member.weight} kg` : null },
              { l: t('members.bloodType'), v: member.bloodType },
              { l: t('members.fitnessGoal'), v: member.fitnessGoal ? t(`members.goals.${member.fitnessGoal}`) : null },
              { l: t('members.medicalNotes'), v: member.medicalNotes },
            ].filter(f => f.v).map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--glass-border)', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--pt-gray-500)' }}>{f.l}</span>
                <span style={{ fontWeight: 600 }}>{f.v}</span>
              </div>
            ))}
            {member.emergencyContact?.name && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--pt-danger)', marginBottom: '4px' }}>🆘 {t('members.emergencyContact')}</div>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  {member.emergencyContact.name} — {member.emergencyContact.relation} — <span dir="ltr">{member.emergencyContact.phone}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>💳 {t('subscriptions.title')}</h3>
          {subscriptions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>📭 {t('common.noData')}</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr>
                  <th>{t('subscriptions.plan')}</th><th>{t('subscriptions.startDate')}</th>
                  <th>{t('subscriptions.endDate')}</th><th>{t('common.status')}</th>
                  <th>{t('finance.amount')}</th>
                </tr></thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600 }}>{sub.planSnapshot?.name?.[locale] || sub.planId}</td>
                      <td>{sub.startDate?.toDate ? sub.startDate.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                      <td>{sub.endDate?.toDate ? sub.endDate.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                      <td><span className={`badge ${statusColors[sub.status] || 'badge-info'}`}>● {t(`common.${sub.status}`)}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{(sub.amountPaid || 0).toLocaleString()} {t('common.egp')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Payments */}
      {activeTab === 'payments' && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>💰 {t('sidebar.payments')}</h3>
          {payments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>📭 {t('common.noData')}</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr>
                  <th>{t('common.date')}</th><th>{t('finance.paymentType')}</th>
                  <th>{t('finance.amount')}</th><th>{t('finance.discount')}</th>
                  <th>{t('finance.netAmount')}</th><th>{t('finance.paymentMethod')}</th>
                </tr></thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id}>
                      <td>{pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                      <td><span className="badge badge-info">{pay.type}</span></td>
                      <td>{(pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                      <td style={{ color: 'var(--pt-success)' }}>{pay.discount ? `-${pay.discount.toLocaleString()}` : '-'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{(pay.netAmount || 0).toLocaleString()} {t('common.egp')}</td>
                      <td>{pay.method === 'cash' ? '💵' : pay.method === 'visa' ? '💳' : '🏦'} {t(`finance.${pay.method}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Attendance */}
      {activeTab === 'attendance' && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>📊 {t('attendance.title')}</h3>
          {attendance.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>📭 {t('common.noData')}</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr>
                  <th>{t('common.date')}</th><th>{t('attendance.checkIn')}</th>
                  <th>{t('attendance.checkOut')}</th><th>{isAr ? 'المدة' : 'Duration'}</th>
                </tr></thead>
                <tbody>
                  {attendance.map(att => (
                    <tr key={att.id}>
                      <td>{att.checkIn?.toDate ? att.checkIn.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                      <td dir="ltr">{att.checkIn?.toDate ? att.checkIn.toDate().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td dir="ltr">{att.checkOut?.toDate ? att.checkOut.toDate().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{att.duration ? `${att.duration} ${isAr ? 'دقيقة' : 'min'}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Freeze Modal */}
      {showFreezeModal && (
        <div className="modal-overlay" onClick={() => setShowFreezeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>❄️ {t('subscriptions.freeze')}</h2>
              <button onClick={() => setShowFreezeModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--pt-gray-400)' }}>
                {isAr ? 'سيتم تجميد اشتراك العضو وتمديد تاريخ الانتهاء بعدد أيام التجميد' : "Member's subscription will be frozen and end date extended by freeze days"}
              </p>
              <div className="form-group">
                <label className="form-label">{t('subscriptions.freezeReason')}</label>
                <textarea className="form-input" value={freezeReason} rows={3}
                  onChange={e => setFreezeReason(e.target.value)}
                  placeholder={isAr ? 'سبب التجميد...' : 'Reason for freezing...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFreezeModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleFreeze}>❄️ {t('subscriptions.freeze')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>📱 {isAr ? 'إرسال رسالة' : 'Send Message'}</h2>
              <button onClick={() => setShowMessageModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--pt-gold-glow)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.5rem' }}>👤</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)' }}>
                    {member.phone && <span dir="ltr">{member.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'عنوان الرسالة' : 'Message Title'} *</label>
                <input className="form-input" value={messageForm.title}
                  onChange={e => setMessageForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={isAr ? 'مثال: تذكير بالتجديد' : 'e.g. Renewal Reminder'} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'نص الرسالة' : 'Message Body'} *</label>
                <textarea className="form-input" rows={4} value={messageForm.message}
                  onChange={e => setMessageForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={isAr ? 'اكتب الرسالة هنا...' : 'Write your message here...'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMessageModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSendMessage}
                disabled={!messageForm.title || !messageForm.message || sendingMessage}>
                {sendingMessage ? (isAr ? '⏳ جاري الإرسال...' : '⏳ Sending...') : `📤 ${t('common.send')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
