'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';
import toast from 'react-hot-toast';

export default function TrainerWeeklyPlannerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useTrainerClients();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const days = isAr
    ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) return;
      setLoading(true);
      try {
        const { data } = await getTenantDocuments(tenantId, 'trainer-sessions',
          [{ field: 'trainerId', operator: '==', value: user.uid }]);
        setSessions(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, user]);

  if (clientsLoading || loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60;
  const getSessionForSlot = (dayIdx, time) => sessions.find(s => s.day === dayIdx && s.time === time);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📅</span> {isAr ? 'المخطط الأسبوعي' : 'Weekly Planner'}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: totalSessions, l: isAr ? 'حصة هذا الأسبوع' : 'Sessions', icon: '📋', color: 'var(--pt-gold)' },
          { v: clients.length, l: isAr ? 'عملاء مخصصين' : 'My Clients', icon: '👥', color: '#4FC3F7' },
          { v: totalHours.toFixed(1) + 'h', l: isAr ? 'ساعات تدريب' : 'Training Hours', icon: '⏱️', color: '#7C4DFF' },
          { v: '0', l: isAr ? 'مؤكدة' : 'Confirmed', icon: '✅', color: 'var(--pt-success)' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📅</div>
          <h3>{isAr ? 'لا توجد حصص مجدولة بعد' : 'No sessions scheduled yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'سيظهر هنا الجدول الأسبوعي للحصص عند إضافتها' : 'Weekly schedule will appear here when sessions are added'}</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 'var(--space-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '1px', minWidth: 800 }}>
            <div style={{ padding: 'var(--space-2)', fontWeight: 800, fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>⏰</div>
            {days.map((day, i) => (
              <div key={i} style={{ padding: 'var(--space-2)', textAlign: 'center', fontWeight: 800, fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)', borderRadius: 'var(--radius-sm)' }}>{day}</div>
            ))}
            {timeSlots.map((time, ti) => (
              <>
                <div key={`t-${ti}`} style={{ padding: 'var(--space-2)', fontSize: '10px', color: 'var(--pt-gray-600)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{time}</div>
                {days.map((_, di) => {
                  const session = getSessionForSlot(di, time);
                  return (
                    <div key={`${ti}-${di}`} style={{ padding: '2px', minHeight: 44 }}>
                      {session ? (
                        <div style={{ padding: '4px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,197,24,0.08)', borderInlineStart: '3px solid var(--pt-gold)', fontSize: '10px', height: '100%' }}>
                          <div style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{session.clientName || '-'}</div>
                          <div style={{ color: 'var(--pt-gray-500)', fontSize: '9px' }}>{session.type || '-'} • {session.duration || 0}{isAr ? 'د' : 'm'}</div>
                        </div>
                      ) : (
                        <div style={{ height: '100%', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)' }} />
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* My Clients Quick View */}
      {clients.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>👥 {isAr ? 'عملائي' : 'My Clients'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {clients.map(c => {
              const name = c.fullName?.[locale] || c.fullName?.ar || '';
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: '3px solid var(--pt-gold)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>{name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>🎯 {c.fitnessGoal ? t(`members.goals.${c.fitnessGoal}`) : '-'}</div>
                  </div>
                  <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '9px' }}>{c.status === 'active' ? '✅' : '⏸️'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
