'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';

export default function TrainerAssessmentFormPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { clients, loading: clientsLoading } = useTrainerClients();
  const [selectedClient, setSelectedClient] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  const client = clients[selectedClient];

  useEffect(() => {
    async function load() {
      if (!tenantId || !client) return;
      setLoading(true);
      try {
        const { data } = await getTenantDocuments(tenantId, 'evaluations',
          [{ field: 'memberId', operator: '==', value: client.id }],
          { field: 'createdAt', direction: 'desc' }, 5);
        setAssessments(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, client]);

  const getScoreColor = (s) => s >= 4 ? 'var(--pt-success)' : s >= 3 ? 'var(--pt-gold)' : 'var(--pt-danger)';

  const ScoreBar = ({ label, score }) => {
    if (score == null) return null;
    return (
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: '3px' }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span style={{ fontWeight: 800, color: getScoreColor(score) }}>{score}/5</span>
        </div>
        <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${(score / 5) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${getScoreColor(score)}, var(--pt-gold))`, borderRadius: 'var(--radius-full)', transition: 'width 0.6s' }} />
        </div>
      </div>
    );
  };

  if (clientsLoading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  const a = assessments[0]; // Latest evaluation

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {isAr ? 'تقييم العميل' : 'Client Assessment'}</h1>
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📋</div>
          <h3>{isAr ? 'لا يوجد عملاء مخصصين لك بعد' : 'No clients assigned yet'}</h3>
        </div>
      ) : (
        <>
          {/* Client Selector */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
            {clients.map((c, i) => {
              const name = c.fullName?.[locale] || c.fullName?.ar || '';
              return (
                <button key={c.id} onClick={() => setSelectedClient(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                    background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)',
                    border: selectedClient === i ? '2px solid var(--pt-gold)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{name.charAt(0)}</div>
                  <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{name}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div></div>
          ) : !a ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
              <h3>{isAr ? 'لا توجد تقييمات بعد' : 'No evaluations yet'}</h3>
              <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'اذهب لصفحة "تقييم العميل" لإنشاء تقييم جديد' : 'Go to "Client Evaluation" page to create one'}</p>
            </div>
          ) : (
            <>
              {/* Overall Score */}
              <div className="card" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', borderTop: `3px solid ${getScoreColor(((a.consistency||0)+(a.effort||0)+(a.technique||0)+(a.diet||0)+(a.progress||0)) / 5)}` }}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)' }}>
                  📋 {isAr ? 'آخر تقييم' : 'Latest Evaluation'} — {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>
                  {(((a.consistency||0)+(a.effort||0)+(a.technique||0)+(a.diet||0)+(a.progress||0)) / 5).toFixed(1)}/5
                </div>
              </div>

              <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
                <div className="card">
                  <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>⭐ {isAr ? 'الأداء' : 'Performance'}</h3>
                  <ScoreBar label={isAr ? 'الالتزام' : 'Consistency'} score={a.consistency} />
                  <ScoreBar label={isAr ? 'المجهود' : 'Effort'} score={a.effort} />
                  <ScoreBar label={isAr ? 'التقنية' : 'Technique'} score={a.technique} />
                  <ScoreBar label={isAr ? 'النظام الغذائي' : 'Diet'} score={a.diet} />
                  <ScoreBar label={isAr ? 'التقدم' : 'Progress'} score={a.progress} />
                </div>
                <div className="card">
                  <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📏 {isAr ? 'القياسات' : 'Measurements'}</h3>
                  {a.measurements ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {Object.entries(a.measurements).filter(([_, v]) => v).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                          <span style={{ color: 'var(--pt-gray-400)', textTransform: 'capitalize' }}>{key}</span>
                          <span style={{ fontWeight: 700 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--pt-gray-500)', textAlign: 'center' }}>{isAr ? 'لا توجد قياسات' : 'No measurements'}</p>
                  )}
                </div>
              </div>

              {(a.overallNotes || a.goals) && (
                <div className="card">
                  <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📝 {isAr ? 'الملاحظات' : 'Notes'}</h3>
                  {a.overallNotes && <p style={{ color: 'var(--pt-gray-400)', marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: '3px solid var(--pt-gold)' }}>{a.overallNotes}</p>}
                  {a.goals && <p style={{ color: 'var(--pt-gray-400)', padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: '3px solid var(--pt-success)' }}>🎯 {a.goals}</p>}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
