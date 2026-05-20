'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ClientAssessmentPage() {
  const t = useTranslations();
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
        const { data } = await getTenantDocuments(tenantId, 'assessments',
          [{ field: 'memberId', operator: '==', value: client.id }],
          { field: 'createdAt', direction: 'desc' }, 10);
        setAssessments(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, client]);

  if (clientsLoading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  const current = assessments[0];
  const previous = assessments[1];

  const BodyStat = ({ label, current: c, prev, unit, inverse }) => {
    if (c == null) return null;
    const d = prev != null ? c - prev : 0;
    const isGood = inverse ? d < 0 : d > 0;
    return (
      <div style={{ padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>{c}<span style={{ fontSize: '12px', fontWeight: 400 }}>{unit}</span></div>
        {prev != null && (
          <div style={{ fontSize: '11px', fontWeight: 700, color: isGood ? '#00C853' : d === 0 ? 'var(--pt-gray-500)' : '#FF5252' }}>
            {d > 0 ? '↑' : d < 0 ? '↓' : '→'} {d > 0 ? `+${d}` : d}{unit}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📋</span> {isAr ? 'تقييم جسمي شامل' : 'Body Assessment'}</h1>
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📋</div>
          <h3>{isAr ? 'لا يوجد عملاء مخصصين لك بعد' : 'No clients assigned yet'}</h3>
          <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'سيظهر هنا العملاء المخصصين لك من قبل إدارة النادي' : 'Clients assigned to you by admin will appear here'}</p>
        </div>
      ) : (
        <>
          {/* Client Selector */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {clients.map((c, i) => {
              const name = c.fullName?.[locale] || c.fullName?.ar || '';
              return (
                <button key={c.id} onClick={() => setSelectedClient(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                    background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)',
                    border: selectedClient === i ? '2px solid var(--pt-gold)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{name.charAt(0)}</div>
                  <div><div style={{ fontWeight: 700 }}>{name}</div></div>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div></div>
          ) : assessments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
              <h3>{isAr ? 'لا توجد تقييمات بعد' : 'No assessments yet'}</h3>
              <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'لم يتم تسجيل أي تقييم جسمي لهذا العميل بعد' : 'No body assessments recorded for this client yet'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
                <BodyStat label={isAr ? 'الوزن' : 'Weight'} current={current?.weight} prev={previous?.weight} unit="kg" inverse />
                <BodyStat label={isAr ? 'نسبة الدهون' : 'Body Fat'} current={current?.bodyFat} prev={previous?.bodyFat} unit="%" inverse />
                <BodyStat label={isAr ? 'كتلة عضلية' : 'Muscle Mass'} current={current?.muscleMass} prev={previous?.muscleMass} unit="kg" />
                {current?.weight && client?.height && (
                  <div style={{ padding: 'var(--space-3)', background: 'var(--pt-dark)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: '4px' }}>BMI</div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, color: current.weight / ((client.height / 100) ** 2) < 25 ? '#00C853' : '#FFD740' }}>
                      {(current.weight / ((client.height / 100) ** 2)).toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              {current?.notes && (
                <div className="card">
                  <h3 style={{ marginBottom: 'var(--space-3)' }}>📝 {isAr ? 'ملاحظات المدرب' : 'Trainer Notes'}</h3>
                  <p style={{ color: 'var(--pt-gray-400)', background: 'var(--pt-darker)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderInlineStart: '3px solid var(--pt-gold)' }}>{current.notes}</p>
                </div>
              )}

              {/* Assessment History */}
              <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'سجل التقييمات' : 'Assessment History'}</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr>
                      <th>{isAr ? 'التاريخ' : 'Date'}</th>
                      <th>{isAr ? 'الوزن' : 'Weight'}</th>
                      <th>{isAr ? 'الدهون' : 'Fat'}</th>
                      <th>{isAr ? 'العضلات' : 'Muscle'}</th>
                    </tr></thead>
                    <tbody>
                      {assessments.map(a => (
                        <tr key={a.id}>
                          <td>{a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : a.date || '-'}</td>
                          <td style={{ fontWeight: 700 }}>{a.weight || '-'} kg</td>
                          <td>{a.bodyFat || '-'}%</td>
                          <td>{a.muscleMass || '-'} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
