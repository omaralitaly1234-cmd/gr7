'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function TrainerEarningsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(10);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ thisMonth: 0, lastMonth: 0, pending: 0, totalYear: 0 });

  useEffect(() => {
    async function load() {
      if (!tenantId || !user) { setLoading(false); return; }
      try {
        // Get trainer info for commission rate
        const { data: trainers } = await getTenantDocuments(tenantId, 'trainers',
          [{ field: 'uid', operator: '==', value: user.uid }]);
        const trainer = trainers?.[0];
        const rate = trainer?.commission || 10;
        setCommissionRate(rate);

        // Get all payments linked to this trainer
        const { data: pays } = await getTenantDocuments(tenantId, 'payments',
          [{ field: 'trainerId', operator: '==', value: user.uid }],
          { field: 'createdAt', direction: 'desc' });

        const allPays = pays || [];
        setPayments(allPays);

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        let thisM = 0, lastM = 0, pending = 0, yearT = 0;
        allPays.forEach(p => {
          const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          const commission = (p.netAmount || p.amount || 0) * (rate / 100);
          if (d >= yearStart) yearT += commission;
          if (d >= thisMonthStart) thisM += commission;
          else if (d >= lastMonthStart) lastM += commission;
          if (p.status === 'pending') pending += commission;
        });
        setStats({ thisMonth: Math.round(thisM), lastMonth: Math.round(lastM), pending: Math.round(pending), totalYear: Math.round(yearT) });
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

  const changePercent = stats.lastMonth > 0 ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100) : 0;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💰</span> {t('trainer.earnings')}</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--pt-gold)' }}>
          <div className="stat-icon gold">💰</div>
          <div className="stat-info">
            <div className="stat-value">{stats.thisMonth.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'أرباح هذا الشهر' : 'This Month'} ({t('common.egp')})</div>
            {changePercent !== 0 && <span className={`stat-change ${changePercent > 0 ? 'up' : 'down'}`}>{changePercent > 0 ? '↑' : '↓'} {Math.abs(changePercent)}%</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.lastMonth.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'الشهر السابق' : 'Last Month'} ({t('common.egp')})</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'قيد التحصيل' : 'Pending'} ({t('common.egp')})</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📊</div>
          <div className="stat-info">
            <div className="stat-value">{commissionRate}%</div>
            <div className="stat-label">{isAr ? 'نسبة العمولة' : 'Commission Rate'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 'var(--space-8)' }}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🏆</div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-gold)', marginBottom: 'var(--space-1)' }}>
            {stats.totalYear.toLocaleString()} {t('common.egp')}
          </div>
          <div style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'إجمالي أرباح السنة' : "Year's Total Earnings"}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-5)' }}>📋 {isAr ? 'تفاصيل العمولات' : 'Commission Details'}</h3>
        {payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-8)' }}>📭 {t('common.noData')}</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead><tr>
                <th>#</th>
                <th>{isAr ? 'العميل' : 'Client'}</th>
                <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                <th>{isAr ? 'العمولة' : 'Commission'} ({commissionRate}%)</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
              </tr></thead>
              <tbody>
                {payments.slice(0, 20).map((pay, i) => {
                  const commission = Math.round((pay.netAmount || pay.amount || 0) * (commissionRate / 100));
                  const d = pay.createdAt?.toDate ? pay.createdAt.toDate() : null;
                  return (
                    <tr key={pay.id || i}>
                      <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{pay.memberName || '-'}</td>
                      <td>{(pay.netAmount || pay.amount || 0).toLocaleString()} {t('common.egp')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>{commission.toLocaleString()} {t('common.egp')}</td>
                      <td style={{ color: 'var(--pt-gray-400)' }}>{d ? d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
