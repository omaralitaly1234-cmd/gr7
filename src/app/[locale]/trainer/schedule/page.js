'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const SESSION_TYPES = [
  { id: 'strength', ar: 'تمارين قوة', en: 'Strength' },
  { id: 'cardio', ar: 'كارديو', en: 'Cardio' },
  { id: 'hiit', ar: 'هيت', en: 'HIIT' },
  { id: 'flexibility', ar: 'مرونة', en: 'Flexibility' },
  { id: 'assessment', ar: 'تقييم', en: 'Assessment' },
];

export default function TrainerSchedulePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weekDays, setWeekDays] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ memberId: '', date: '', startTime: '', duration: 60, type: 'strength' });

  const dayNames = isAr
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const loadData = useCallback(async () => {
    if (!tenantId || !user) { setLoading(false); return; }
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [sessionsRes, clientsRes] = await Promise.all([
        getTenantDocuments(tenantId, 'trainer_sessions', [{ field: 'trainerId', operator: '==', value: user.uid }]),
        getTenantDocuments(tenantId, 'members', [{ field: 'assignedTrainer', operator: '==', value: user.uid }]),
      ]);
      setClients(clientsRes.data || []);

      const sessions = sessionsRes.data || [];
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const daySessions = sessions.filter(s => {
          const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
          return !isNaN(sDate) && sDate.toISOString().split('T')[0] === dateStr;
        }).map(s => ({
          id: s.id,
          time: s.time || '',
          client: s.clientName || '',
          type: s.sessionType || s.type || '',
          status: s.status || 'upcoming',
        })).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        days.push({ name: dayNames[d.getDay()], date: dateStr, sessions: daySessions });
      }
      setWeekDays(days);

      const todayIdx = days.findIndex(d => d.date === today.toISOString().split('T')[0]);
      if (todayIdx >= 0) setSelectedDay(todayIdx);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [tenantId, user, isAr]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!tenantId || !user || !form.memberId || !form.date || !form.startTime) {
      toast.error(isAr ? 'اختر العميل والتاريخ والوقت' : 'Select client, date and time');
      return;
    }
    setSaving(true);
    try {
      const client = clients.find(c => c.id === form.memberId);
      const clientName = client ? (client.fullName?.[locale] || client.fullName?.ar || '') : '';
      const typeDef = SESSION_TYPES.find(x => x.id === form.type);
      const dur = Math.max(15, Number(form.duration) || 60);
      // end time = start + duration
      const [h, m] = form.startTime.split(':').map(Number);
      const end = new Date(0, 0, 0, h, m + dur);
      const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

      await addTenantDocument(tenantId, 'trainer_sessions', {
        trainerId: user.uid,
        memberId: form.memberId,
        clientName,
        date: Timestamp.fromDate(new Date(form.date + 'T00:00:00')),
        time: `${form.startTime} - ${endStr}`,
        // both field names — different reader pages use `type` vs `sessionType`
        sessionType: typeDef ? typeDef[locale] || typeDef.ar : form.type,
        type: typeDef ? typeDef[locale] || typeDef.ar : form.type,
        duration: dur,
        status: 'upcoming',
      });
      toast.success(isAr ? 'تمت إضافة الحصة' : 'Session added');
      setShowModal(false);
      setForm({ memberId: '', date: '', startTime: '', duration: 60, type: 'strength' });
      loadData();
    } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
    setSaving(false);
  };

  const handleComplete = async (sessionId) => {
    if (!tenantId || !sessionId) return;
    try {
      await updateTenantDocument(tenantId, 'trainer_sessions', sessionId, { status: 'completed' });
      setWeekDays(prev => prev.map(d => ({
        ...d,
        sessions: d.sessions.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s),
      })));
    } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  const totalWeekSessions = weekDays.reduce((s, d) => s + d.sessions.length, 0);
  const completedSessions = weekDays.reduce((s, d) => s + d.sessions.filter(x => x.status === 'completed').length, 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {t('sidebar.schedule')}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + {isAr ? 'حصة جديدة' : 'New Session'}
        </button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📅</div>
          <div className="stat-info">
            <div className="stat-value">{totalWeekSessions}</div>
            <div className="stat-label">{isAr ? 'حصص هذا الأسبوع' : "This Week's Sessions"}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{completedSessions}</div>
            <div className="stat-label">{isAr ? 'حصص مكتملة' : 'Completed'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{totalWeekSessions - completedSessions}</div>
            <div className="stat-label">{isAr ? 'حصص متبقية' : 'Remaining'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
        {weekDays.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            className={`btn ${selectedDay === i ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            style={{ minWidth: 100, flexDirection: 'column', alignItems: 'center', padding: 'var(--space-2) var(--space-3)' }}>
            <span style={{ fontWeight: 700 }}>{day.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>{day.sessions.length} {isAr ? 'حصص' : 'sessions'}</span>
          </button>
        ))}
      </div>

      {weekDays[selectedDay]?.sessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {weekDays[selectedDay].sessions.map((session, i) => (
            <div key={session.id || i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', borderInlineStart: `3px solid ${session.status === 'completed' ? 'var(--pt-success)' : 'var(--pt-gold)'}` }}>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>{session.time.split(' - ')[0] || session.time}</div>
                {session.time.includes(' - ') && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{session.time.split(' - ')[1]}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{session.client}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🏋️ {session.type}</div>
              </div>
              {session.status === 'completed' ? (
                <span className="badge badge-success">{isAr ? '✓ مكتمل' : '✓ Done'}</span>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => handleComplete(session.id)}>
                  {isAr ? '✓ إنهاء' : '✓ Complete'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🏖️</div>
          <p style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'لا توجد حصص في هذا اليوم' : 'No sessions this day'}</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>📅 {isAr ? 'حصة تدريب جديدة' : 'New Training Session'}</h2>
              <button onClick={() => setShowModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              {clients.length === 0 ? (
                <p style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'لا يوجد عملاء مخصصون لك بعد.' : 'No clients assigned to you yet.'}</p>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                    <label className="form-label">{isAr ? 'العميل' : 'Client'}</label>
                    <select className="form-select" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}>
                      <option value="">{isAr ? '— اختر —' : '— select —'}</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName?.[locale] || c.fullName?.ar || c.membershipNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'التاريخ' : 'Date'}</label>
                      <input className="form-input" type="date" dir="ltr" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'وقت البدء' : 'Start time'}</label>
                      <input className="form-input" type="time" dir="ltr" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                      <input className="form-input" type="number" min="15" step="15" dir="ltr" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'النوع' : 'Type'}</label>
                      <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                        {SESSION_TYPES.map(x => <option key={x.id} value={x.id}>{x[locale] || x.ar}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || clients.length === 0}>
                {saving ? '...' : (isAr ? 'إضافة الحصة' : 'Add Session')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
