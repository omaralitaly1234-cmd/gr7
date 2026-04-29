'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function TrainerAnalyticsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [period, setPeriod] = useState('month');

  const kpis = {
    totalSessions: 48, completionRate: 94, avgRating: 4.8, revenue: 12500,
    clientRetention: 92, newClients: 3, cancelRate: 6, avgSessionDuration: 52,
  };

  const monthlyData = [
    { month: locale === 'ar' ? 'أكتوبر' : 'Oct', sessions: 35, revenue: 8500, rating: 4.6 },
    { month: locale === 'ar' ? 'نوفمبر' : 'Nov', sessions: 38, revenue: 9200, rating: 4.7 },
    { month: locale === 'ar' ? 'ديسمبر' : 'Dec', sessions: 42, revenue: 10800, rating: 4.7 },
    { month: locale === 'ar' ? 'يناير' : 'Jan', sessions: 40, revenue: 10200, rating: 4.8 },
    { month: locale === 'ar' ? 'فبراير' : 'Feb', sessions: 45, revenue: 11500, rating: 4.8 },
    { month: locale === 'ar' ? 'مارس' : 'Mar', sessions: 48, revenue: 12500, rating: 4.8 },
  ];

  const clientPerformance = [
    { name: locale === 'ar' ? 'أحمد محمد' : 'Ahmed M.', sessions: 12, adherence: 95, progress: 88, revenue: 3600, trend: '↑' },
    { name: locale === 'ar' ? 'سارة علي' : 'Sara A.', sessions: 10, adherence: 90, progress: 82, revenue: 3000, trend: '↑' },
    { name: locale === 'ar' ? 'عمر حسام' : 'Omar H.', sessions: 8, adherence: 75, progress: 70, revenue: 2400, trend: '→' },
    { name: locale === 'ar' ? 'نور أحمد' : 'Nour A.', sessions: 6, adherence: 85, progress: 65, revenue: 1800, trend: '↑' },
    { name: locale === 'ar' ? 'خالد أحمد' : 'Khaled A.', sessions: 12, adherence: 98, progress: 92, revenue: 3600, trend: '↑↑' },
  ];

  const specializations = [
    { type: locale === 'ar' ? 'تضخيم' : 'Bulking', count: 2, color: '#00C853' },
    { type: locale === 'ar' ? 'تنشيف' : 'Cutting', count: 2, color: '#4FC3F7' },
    { type: locale === 'ar' ? 'قوة' : 'Strength', count: 3, color: '#FF5252' },
    { type: locale === 'ar' ? 'لياقة' : 'Fitness', count: 1, color: '#FFD740' },
    { type: locale === 'ar' ? 'جماعي' : 'Group', count: 2, color: '#FF9100' },
  ];

  const maxSessions = Math.max(...monthlyData.map(m => m.sessions));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📈</span> {locale === 'ar' ? 'تحليلات أدائي' : 'My Performance Analytics'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['month', 'quarter', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`btn ${period === p ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
              {p === 'month' ? (locale === 'ar' ? 'شهري' : 'Month') : p === 'quarter' ? (locale === 'ar' ? 'ربع سنوي' : 'Quarter') : (locale === 'ar' ? 'سنوي' : 'Year')}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { v: kpis.totalSessions, l: locale === 'ar' ? 'حصة هذا الشهر' : 'Sessions', icon: '📋', color: 'var(--pt-gold)', sub: `${kpis.completionRate}% ${locale === 'ar' ? 'إتمام' : 'completion'}` },
          { v: `${kpis.avgRating}⭐`, l: locale === 'ar' ? 'متوسط التقييم' : 'Avg Rating', icon: '⭐', color: '#FFD740', sub: locale === 'ar' ? 'من 5.0' : 'out of 5.0' },
          { v: `${(kpis.revenue / 1000).toFixed(1)}K`, l: locale === 'ar' ? 'الإيرادات (ج.م)' : 'Revenue (EGP)', icon: '💰', color: 'var(--pt-success)', sub: `+18% ${locale === 'ar' ? 'عن الشهر الماضي' : 'vs last month'}` },
          { v: `${kpis.clientRetention}%`, l: locale === 'ar' ? 'احتفاظ العملاء' : 'Client Retention', icon: '🔄', color: '#4FC3F7', sub: `+${kpis.newClients} ${locale === 'ar' ? 'عملاء جدد' : 'new clients'}` },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.v}</div>
              <div className="stat-label">{s.l}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-success)', fontWeight: 600 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Sessions Trend */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'تطور الحصص' : 'Sessions Trend'}</h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: 140 }}>
            {monthlyData.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700 }}>{m.sessions}</span>
                <div style={{ width: '100%', height: `${(m.sessions / maxSessions) * 110}px`, background: i === monthlyData.length - 1 ? 'var(--pt-gold)' : 'rgba(245,197,24,0.3)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'height 0.5s' }} />
                <span style={{ fontSize: '8px', color: 'var(--pt-gray-600)' }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialization Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🎯 {locale === 'ar' ? 'توزيع التخصصات' : 'Specialization Mix'}</h3>
          {specializations.map((sp, i) => {
            const total = specializations.reduce((a, s) => a + s.count, 0);
            const pct = Math.round((sp.count / total) * 100);
            return (
              <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: sp.color, display: 'inline-block' }} />
                    {sp.type}
                  </span>
                  <span style={{ fontWeight: 700, color: sp.color }}>{sp.count} ({pct}%)</span>
                </div>
                <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: sp.color, borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Performance Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>👥 {locale === 'ar' ? 'أداء العملاء' : 'Client Performance'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'العميل' : 'Client'}</th>
              <th style={{ textAlign: 'center' }}>📋 {locale === 'ar' ? 'حصص' : 'Sessions'}</th>
              <th style={{ textAlign: 'center' }}>📊 {locale === 'ar' ? 'التزام' : 'Adherence'}</th>
              <th style={{ textAlign: 'center' }}>📈 {locale === 'ar' ? 'تقدم' : 'Progress'}</th>
              <th style={{ textAlign: 'center' }}>💰 {locale === 'ar' ? 'إيراد' : 'Revenue'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'اتجاه' : 'Trend'}</th>
            </tr>
          </thead>
          <tbody>
            {clientPerformance.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td style={{ textAlign: 'center' }}>{c.sessions}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: c.adherence >= 90 ? 'var(--pt-success)' : c.adherence >= 75 ? 'var(--pt-gold)' : 'var(--pt-danger)' }}>{c.adherence}%</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <div style={{ width: 50, height: 5, background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${c.progress}%`, height: '100%', background: c.progress >= 80 ? 'var(--pt-success)' : 'var(--pt-gold)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700 }}>{c.progress}%</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.revenue.toLocaleString()}</td>
                <td style={{ textAlign: 'center', color: c.trend.includes('↑') ? 'var(--pt-success)' : 'var(--pt-gray-500)', fontWeight: 800 }}>{c.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
