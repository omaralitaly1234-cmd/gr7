'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useMemberData } from '@/lib/hooks/useMemberData';
import toast from 'react-hot-toast';

export default function ClientCheckInPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading: memberLoading, tenantId } = useMemberData();
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [soreness, setSoreness] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [weekHistory, setWeekHistory] = useState([]);

  const moods = [
    { val: 5, emoji: '😁', label: isAr ? 'ممتاز' : 'Great' },
    { val: 4, emoji: '😊', label: isAr ? 'جيد' : 'Good' },
    { val: 3, emoji: '😐', label: isAr ? 'عادي' : 'Okay' },
    { val: 2, emoji: '😔', label: isAr ? 'مش كويس' : 'Low' },
    { val: 1, emoji: '😩', label: isAr ? 'سيء' : 'Bad' },
  ];
  const energyLevels = [
    { val: 5, icon: '⚡⚡⚡', label: isAr ? 'مشحون بالكامل' : 'Fully Charged' },
    { val: 4, icon: '⚡⚡', label: isAr ? 'نشيط' : 'Energetic' },
    { val: 3, icon: '⚡', label: isAr ? 'متوسط' : 'Average' },
    { val: 2, icon: '🔋', label: isAr ? 'منخفض' : 'Low' },
    { val: 1, icon: '🪫', label: isAr ? 'مرهق' : 'Exhausted' },
  ];
  const sleepOptions = [
    { val: '8+', label: isAr ? '+8 ساعات' : '8+ hours', icon: '😴' },
    { val: '7', label: isAr ? '7 ساعات' : '7 hours', icon: '🛏️' },
    { val: '6', label: isAr ? '6 ساعات' : '6 hours', icon: '😐' },
    { val: '5', label: isAr ? '5 ساعات' : '5 hours', icon: '😟' },
    { val: '<5', label: isAr ? 'أقل من 5' : '<5 hours', icon: '☕' },
  ];
  const sorenessOptions = [
    { val: 0, label: isAr ? 'لا يوجد ألم' : 'No soreness', color: '#00C853' },
    { val: 1, label: isAr ? 'ألم خفيف' : 'Mild', color: '#FFD740' },
    { val: 2, label: isAr ? 'ألم متوسط' : 'Moderate', color: '#FF9100' },
    { val: 3, label: isAr ? 'ألم شديد' : 'Severe', color: '#FF5252' },
  ];

  useEffect(() => {
    async function loadHistory() {
      if (!tenantId || !memberData) return;
      try {
        const { data } = await getTenantDocuments(tenantId, 'checkins',
          [{ field: 'memberId', operator: '==', value: memberData.id }],
          { field: 'createdAt', direction: 'desc' }, 7);
        setWeekHistory(data || []);
      } catch (err) { console.error(err); }
    }
    if (!memberLoading && memberData) loadHistory();
  }, [tenantId, memberData, memberLoading]);

  const handleSubmit = async () => {
    if (!tenantId || !memberData) return;
    try {
      await addTenantDocument(tenantId, 'checkins', { memberId: memberData.id, mood, energy, sleep, soreness, date: new Date().toISOString().split('T')[0] });
      toast.success(isAr ? 'تم تسجيل الحالة' : 'Check-in saved');
      setSubmitted(true);
    } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  const moodEmoji = (v) => moods.find(m => m.val === v)?.emoji || '—';

  if (memberLoading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  if (submitted) {
    return (
      <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
        <div style={{ fontSize: '5rem', marginBottom: 'var(--space-4)' }}>✅</div>
        <h1 style={{ color: 'var(--pt-gold)', marginBottom: 'var(--space-3)' }}>{isAr ? 'تم تسجيل الدخول اليومي!' : 'Daily Check-in Complete!'}</h1>
        <p style={{ color: 'var(--pt-gray-400)', maxWidth: 400, margin: '0 auto var(--space-5)' }}>{isAr ? 'شكراً لتسجيل حالتك اليوم.' : 'Thanks for checking in!'}</p>
        <button className="btn btn-secondary" onClick={() => setSubmitted(false)}>← {isAr ? 'تعديل' : 'Edit'}</button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {isAr ? 'تسجيل الحالة اليومية' : 'Daily Check-in'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gold)' }}>📅 {today}</span>
      </div>
      <div style={{ maxWidth: 650, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>😊 {isAr ? 'كيف حاسس النهاردة؟' : 'How are you feeling today?'}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {moods.map(m => (<button key={m.val} onClick={() => setMood(m.val)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: mood === m.val ? '2px solid var(--pt-gold)' : '2px solid transparent', background: mood === m.val ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: 'white', transform: mood === m.val ? 'scale(1.1)' : 'scale(1)' }}><span style={{ fontSize: '2rem' }}>{m.emoji}</span><span style={{ fontSize: '11px', fontWeight: 600 }}>{m.label}</span></button>))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>⚡ {isAr ? 'مستوى الطاقة' : 'Energy Level'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {energyLevels.map(e => (<button key={e.val} onClick={() => setEnergy(e.val)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: energy === e.val ? '2px solid var(--pt-gold)' : '1px solid var(--glass-border)', background: energy === e.val ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: 'white', textAlign: 'start' }}><span style={{ fontSize: '1.2rem', minWidth: 50 }}>{e.icon}</span><span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{e.label}</span></button>))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>😴 {isAr ? 'ساعات النوم' : 'Hours of Sleep'}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {sleepOptions.map(s => (<button key={s.val} onClick={() => setSleep(s.val)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: sleep === s.val ? '2px solid var(--pt-gold)' : '2px solid transparent', background: sleep === s.val ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: 'white', minWidth: 70 }}><span style={{ fontSize: '1.5rem' }}>{s.icon}</span><span style={{ fontSize: '11px', fontWeight: 600 }}>{s.label}</span></button>))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>💪 {isAr ? 'ألم العضلات' : 'Muscle Soreness'}</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {sorenessOptions.map(s => (<button key={s.val} onClick={() => setSoreness(s.val)} style={{ flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: soreness === s.val ? `2px solid ${s.color}` : '1px solid var(--glass-border)', background: soreness === s.val ? `${s.color}15` : 'var(--pt-darker)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', color: soreness === s.val ? s.color : 'var(--pt-gray-400)', textAlign: 'center', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{s.label}</button>))}
          </div>
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 'var(--space-6)' }} onClick={handleSubmit} disabled={mood === null || energy === null || sleep === null || soreness === null}>✓ {isAr ? 'تسجيل الحالة' : 'Submit Check-in'}</button>
      </div>
      {weekHistory.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'السجل الأخير' : 'Recent History'}</h3>
          <table className="data-table"><thead><tr><th>{isAr ? 'التاريخ' : 'Date'}</th><th style={{ textAlign: 'center' }}>{isAr ? 'المزاج' : 'Mood'}</th><th style={{ textAlign: 'center' }}>{isAr ? 'الطاقة' : 'Energy'}</th><th style={{ textAlign: 'center' }}>{isAr ? 'النوم' : 'Sleep'}</th></tr></thead><tbody>
            {weekHistory.map((day, i) => (<tr key={i}><td>{day.date || '-'}</td><td style={{ textAlign: 'center', fontSize: '1.3rem' }}>{moodEmoji(day.mood)}</td><td style={{ textAlign: 'center' }}>{day.energy || '-'}/5</td><td style={{ textAlign: 'center' }}>{day.sleep || '-'}</td></tr>))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
