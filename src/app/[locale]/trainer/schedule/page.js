'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';

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

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const { data: allSessions } = await getTenantDocuments(tenantId, 'trainer_sessions');
        const sessions = (allSessions || []).filter(s => s.trainerId === user.uid);
        sessions.sort((a, b) => {
          const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
          const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
          return da - db;
        });

        const dayNames = isAr
          ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
          : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const days = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const daySessions = (sessions || []).filter(s => {
            const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
            return sDate.toISOString().split('T')[0] === dateStr;
          }).map(s => ({
            time: s.time || '',
            client: s.clientName || '',
            type: s.sessionType || '',
            status: s.status || 'upcoming',
          }));
          days.push({ name: dayNames[d.getDay()], date: dateStr, sessions: daySessions });
        }
        setWeekDays(days);

        const todayIdx = days.findIndex(d => d.date === today.toISOString().split('T')[0]);
        if (todayIdx >= 0) setSelectedDay(todayIdx);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

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
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', borderInlineStart: `3px solid ${session.status === 'completed' ? 'var(--pt-success)' : 'var(--pt-gold)'}` }}>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)' }}>{session.time.split(' - ')[0] || session.time}</div>
                {session.time.includes(' - ') && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{session.time.split(' - ')[1]}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{session.client}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>🏋️ {session.type}</div>
              </div>
              <span className={`badge ${session.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {session.status === 'completed' ? (isAr ? '✓ مكتمل' : '✓ Done') : (isAr ? '⏳ قادمة' : '⏳ Upcoming')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🏖️</div>
          <p style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'لا توجد حصص في هذا اليوم' : 'No sessions this day'}</p>
        </div>
      )}
    </div>
  );
}
