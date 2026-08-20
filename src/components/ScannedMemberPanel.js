'use client';

// ============================================
// Full member card shown next to the scanner after a code is read.
//
// The front desk needs the whole picture at the moment the member walks in —
// who they are, how to reach them, medical flags, what they owe, and their
// actual visit history with dates — not just the name + visit count the scan
// banner used to show.
// ============================================

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { toDate } from '@/lib/format';

const DAY = 86400000;

function Row({ label, value, dir }) {
  if (value === null || value === undefined || value === '' ) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '6px 0', borderBottom: '1px solid var(--glass-border)' }}>
      <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, textAlign: 'end', wordBreak: 'break-word' }} dir={dir}>{value}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gold)', marginBottom: 'var(--space-2)' }}>
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}

export default function ScannedMemberPanel({
  member,
  history = [],        // attendance docs, newest first
  historyLoading = false,
  subscription = null, // the member's newest subscription, or null
  locale = 'ar',
  onClose,
}) {
  const t = useTranslations();
  const isAr = locale === 'ar';

  const fmtDate = (v, opts) => {
    const d = toDate(v);
    return d ? d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', opts || { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  };
  const fmtTime = (v) => {
    const d = toDate(v);
    return d ? d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
  };

  // Visit tallies come from the loaded history window, except the all-time
  // figure which uses the member's own counter (the window is capped).
  const stats = useMemo(() => {
    const now = Date.now();
    const startOfWeek = now - 7 * DAY;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let week = 0, month = 0;
    for (const a of history) {
      const d = toDate(a.checkIn);
      if (!d) continue;
      if (d.getTime() >= startOfWeek) week += 1;
      if (d.getTime() >= monthStart.getTime()) month += 1;
    }
    return { week, month };
  }, [history]);

  const age = useMemo(() => {
    const d = toDate(member?.dateOfBirth);
    if (!d) return null;
    const years = Math.floor((Date.now() - d.getTime()) / (365.25 * DAY));
    return years > 0 && years < 120 ? years : null;
  }, [member?.dateOfBirth]);

  const remainingDays = useMemo(() => {
    const end = toDate(subscription?.endDate || member?.endDate);
    if (!end) return null;
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY));
  }, [subscription, member]);

  if (!member) return null;

  const name = member.fullName?.[locale] || member.fullName?.ar || '—';
  const nameOther = member.fullName?.en && locale === 'ar' ? member.fullName.en : null;
  const trainerName = member.assignedTrainerName?.[locale] || member.assignedTrainerName?.ar || null;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', minWidth: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-full)', flexShrink: 0,
            background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 900, color: 'var(--pt-gold)',
          }}>
            {name.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 2 }}>{name}</h3>
            {nameOther && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">{nameOther}</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span className={`badge ${member.status === 'active' ? 'badge-success' : member.status === 'frozen' ? 'badge-frozen' : 'badge-danger'}`}>
                ● {t(`common.${member.status}`)}
              </span>
              <span className={`badge ${member.currentPlan?.type === 'diamond' ? 'badge-diamond' : 'badge-gold'}`}>
                {member.currentPlan?.type === 'diamond' ? '💎' : '🥇'} {member.planName || member.currentPlan?.planName || '—'}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ fontSize: '1.1rem', color: 'var(--pt-gray-500)' }} title={t('common.close')}>✕</button>
        )}
      </div>

      {/* Visit tallies */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        {[
          { v: member.totalVisits || 0, l: isAr ? 'إجمالي الزيارات' : 'Total visits', c: 'var(--pt-gold)' },
          { v: stats.month, l: isAr ? 'هذا الشهر' : 'This month', c: 'var(--pt-success)' },
          { v: stats.week, l: isAr ? 'آخر ٧ أيام' : 'Last 7 days', c: 'var(--pt-info, #00B0FF)' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--pt-gray-500)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {member.balanceDue > 0 && (
        <div style={{
          marginTop: 'var(--space-3)', padding: '10px 14px',
          background: 'rgba(255,145,0,0.12)', border: '1px solid var(--pt-warning)',
          borderRadius: 'var(--radius-sm)', color: 'var(--pt-warning)',
          fontWeight: 800, fontSize: 'var(--font-size-sm)', textAlign: 'center',
        }}>
          💰 {isAr ? 'متبقي عليه' : 'Owes'}: {member.balanceDue.toLocaleString()} {t('common.egp')}
        </div>
      )}

      {/* Attendance history with dates */}
      <Section title={isAr ? 'سجل الحضور' : 'Attendance history'} icon="📅">
        {historyLoading ? (
          <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-2)' }}>
            {t('common.loading')}
          </p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-2)' }}>
            {isAr ? 'لا يوجد حضور مسجل' : 'No recorded attendance'}
          </p>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map((a, i) => (
              <div key={a.id || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-sm)',
              }}>
                <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)', width: 24 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{fmtDate(a.checkIn, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span dir="ltr" style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-xs)' }}>{fmtTime(a.checkIn)}</span>
              </div>
            ))}
          </div>
        )}
        {history.length > 0 && (
          <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
            {isAr
              ? `آخر ${history.length} زيارة — الإجمالي ${member.totalVisits || history.length}`
              : `Last ${history.length} visits — ${member.totalVisits || history.length} total`}
          </p>
        )}
      </Section>

      {/* Personal data */}
      <Section title={isAr ? 'البيانات الشخصية' : 'Personal details'} icon="👤">
        <Row label={isAr ? 'رقم العضوية' : 'Membership no.'} value={member.membershipNumber} dir="ltr" />
        <Row label={isAr ? 'الهاتف' : 'Phone'} value={member.phone} dir="ltr" />
        <Row label={isAr ? 'واتساب' : 'WhatsApp'} value={member.whatsapp && member.whatsapp !== member.phone ? member.whatsapp : null} dir="ltr" />
        <Row label={isAr ? 'البريد' : 'Email'} value={member.email} dir="ltr" />
        <Row label={isAr ? 'الجنس' : 'Gender'} value={member.gender ? t(`common.${member.gender}`) : null} />
        <Row label={isAr ? 'تاريخ الميلاد' : 'Date of birth'} value={member.dateOfBirth ? `${fmtDate(member.dateOfBirth)}${age ? ` (${age} ${isAr ? 'سنة' : 'yrs'})` : ''}` : null} />
        <Row label={isAr ? 'الرقم القومي' : 'National ID'} value={member.nationalId} dir="ltr" />
        <Row label={isAr ? 'العنوان' : 'Address'} value={member.address} />
        <Row label={isAr ? 'تاريخ الانضمام' : 'Joined'} value={member.joinDate ? fmtDate(member.joinDate) : null} />
        <Row label={isAr ? 'آخر زيارة' : 'Last visit'} value={member.lastVisit ? `${fmtDate(member.lastVisit)} — ${fmtTime(member.lastVisit)}` : null} />
        <Row label={isAr ? 'إجمالي المدفوع' : 'Total spent'} value={member.totalSpent ? `${member.totalSpent.toLocaleString()} ${t('common.egp')}` : null} />
      </Section>

      {/* Subscription */}
      <Section title={isAr ? 'الاشتراك' : 'Subscription'} icon="💳">
        <Row label={isAr ? 'الباقة' : 'Plan'} value={member.planName || member.currentPlan?.planName} />
        <Row label={isAr ? 'ينتهي في' : 'Ends'} value={fmtDate(subscription?.endDate || member.endDate)} />
        <Row label={isAr ? 'الأيام المتبقية' : 'Days left'} value={remainingDays === null ? null : `${remainingDays} ${isAr ? 'يوم' : 'days'}`} />
        <Row
          label={isAr ? 'الحصص المتبقية' : 'Sessions left'}
          value={subscription && subscription.totalSessions !== null && subscription.totalSessions !== undefined
            ? `${subscription.remainingSessions || 0} / ${subscription.totalSessions}`
            : null}
        />
        <Row label={isAr ? 'أيام التجميد' : 'Freeze days'} value={subscription?.maxFreezeDays ? `${subscription.freezeDaysUsed || 0} / ${subscription.maxFreezeDays}` : null} />
        <Row label={isAr ? 'المدرب' : 'Trainer'} value={trainerName} />
      </Section>

      {/* Health */}
      {(member.height || member.weight || member.bloodType || member.medicalNotes || member.fitnessGoal) && (
        <Section title={isAr ? 'بيانات صحية' : 'Health'} icon="🏥">
          <Row label={isAr ? 'الطول' : 'Height'} value={member.height ? `${member.height} cm` : null} dir="ltr" />
          <Row label={isAr ? 'الوزن' : 'Weight'} value={member.weight ? `${member.weight} kg` : null} dir="ltr" />
          <Row label={isAr ? 'فصيلة الدم' : 'Blood type'} value={member.bloodType} dir="ltr" />
          <Row label={isAr ? 'الهدف' : 'Goal'} value={member.fitnessGoal} />
          <Row label={isAr ? 'ملاحظات طبية' : 'Medical notes'} value={member.medicalNotes} />
        </Section>
      )}

      {/* Emergency contact */}
      {(member.emergencyContact?.name || member.emergencyContact?.phone) && (
        <Section title={isAr ? 'في حالة الطوارئ' : 'Emergency contact'} icon="🚨">
          <Row label={isAr ? 'الاسم' : 'Name'} value={member.emergencyContact?.name} />
          <Row label={isAr ? 'الهاتف' : 'Phone'} value={member.emergencyContact?.phone} dir="ltr" />
          <Row label={isAr ? 'صلة القرابة' : 'Relation'} value={member.emergencyContact?.relation} />
        </Section>
      )}

      <Link href={`/${locale}/admin/members/${member.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-4)', width: '100%' }}>
        👁️ {isAr ? 'فتح الملف الكامل' : 'Open full profile'}
      </Link>
    </div>
  );
}
