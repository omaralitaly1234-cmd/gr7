'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function AdminForecastPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const forecastMonths = [
    { month: locale === 'ar' ? 'يناير' : 'Jan', actual: 145000, predicted: null },
    { month: locale === 'ar' ? 'فبراير' : 'Feb', actual: 158000, predicted: null },
    { month: locale === 'ar' ? 'مارس' : 'Mar', actual: 172000, predicted: 165000 },
    { month: locale === 'ar' ? 'أبريل' : 'Apr', actual: null, predicted: 185000 },
    { month: locale === 'ar' ? 'مايو' : 'May', actual: null, predicted: 192000 },
    { month: locale === 'ar' ? 'يونيو' : 'Jun', actual: null, predicted: 178000 },
  ];

  const growthMetrics = [
    { label: locale === 'ar' ? 'نمو الإيرادات' : 'Revenue Growth', current: '+12%', trend: '↑', color: 'var(--pt-success)', forecast: locale === 'ar' ? '+15% متوقع أبريل' : '+15% predicted Apr' },
    { label: locale === 'ar' ? 'نمو الأعضاء' : 'Member Growth', current: '+8 /شهر', trend: '↑', color: '#4FC3F7', forecast: locale === 'ar' ? '+10 متوقع أبريل' : '+10 predicted Apr' },
    { label: locale === 'ar' ? 'معدل التجديد' : 'Renewal Rate', current: '78%', trend: '→', color: 'var(--pt-gold)', forecast: locale === 'ar' ? '80% متوقع' : '80% predicted' },
    { label: locale === 'ar' ? 'معدل الإلغاء' : 'Churn Rate', current: '5.2%', trend: '↓', color: '#FF5252', forecast: locale === 'ar' ? '4.8% متوقع' : '4.8% predicted' },
  ];

  const seasonalInsights = [
    { icon: '☀️', period: locale === 'ar' ? 'الصيف (يونيو-أغسطس)' : 'Summer (Jun-Aug)', prediction: locale === 'ar' ? 'انخفاض 15-20% — عروض صيفية مطلوبة' : '15-20% dip — Summer offers needed', risk: 'medium' },
    { icon: '🌙', period: locale === 'ar' ? 'رمضان (أبريل)' : 'Ramadan (April)', prediction: locale === 'ar' ? 'تغيير مواعيد + تحديات خاصة = فرصة نمو' : 'Schedule changes + special challenges = growth opportunity', risk: 'low' },
    { icon: '📚', period: locale === 'ar' ? 'بداية الدراسة (سبتمبر)' : 'Back to School (Sep)', prediction: locale === 'ar' ? 'زيادة 25% في اشتراكات الطلاب' : '25% increase in student subs', risk: 'low' },
  ];

  const revenueStreams = [
    { label: locale === 'ar' ? 'اشتراكات' : 'Subscriptions', current: 135000, predicted: 148000, pct: 74, color: 'var(--pt-gold)' },
    { label: locale === 'ar' ? 'حصص خاصة' : 'PT Sessions', current: 22000, predicted: 26000, pct: 13, color: '#4FC3F7' },
    { label: locale === 'ar' ? 'سبا' : 'Spa Services', current: 8500, predicted: 10000, pct: 5, color: '#00C853' },
    { label: locale === 'ar' ? 'كافيتريا' : 'Cafeteria', current: 4500, predicted: 5500, pct: 3, color: '#FF9100' },
    { label: locale === 'ar' ? 'حصص جماعية' : 'Group Classes', current: 6000, predicted: 7500, pct: 4, color: '#7C4DFF' },
    { label: locale === 'ar' ? 'مبيعات أخرى' : 'Other Sales', current: 2000, predicted: 3000, pct: 1, color: '#E040FB' },
  ];

  const maxVal = Math.max(...forecastMonths.map(m => Math.max(m.actual || 0, m.predicted || 0)));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔮</span> {locale === 'ar' ? 'التوقعات المالية' : 'Financial Forecast'}</h1>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {growthMetrics.map((m, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="stat-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-value" style={{ color: m.color }}>{m.current}</div>
                <span style={{ fontWeight: 800, color: m.trend === '↑' ? 'var(--pt-success)' : m.trend === '↓' ? 'var(--pt-danger)' : 'var(--pt-gold)' }}>{m.trend}</span>
              </div>
              <div className="stat-label">{m.label}</div>
              <div style={{ fontSize: '9px', color: 'var(--pt-gray-500)', marginTop: '2px' }}>📊 {m.forecast}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Revenue Forecast Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📈 {locale === 'ar' ? 'توقع الإيرادات' : 'Revenue Forecast'}</h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: 160 }}>
            {forecastMonths.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: m.actual ? 'var(--pt-gold)' : '#4FC3F7' }}>
                  {((m.actual || m.predicted) / 1000).toFixed(0)}K
                </span>
                <div style={{ width: '100%', display: 'flex', gap: '2px', justifyContent: 'center', height: `${((m.actual || m.predicted) / maxVal) * 130}px` }}>
                  {m.actual && (
                    <div style={{ flex: 1, background: 'var(--pt-gold)', borderRadius: '3px 3px 0 0' }} />
                  )}
                  {m.predicted && (
                    <div style={{ flex: 1, background: m.actual ? '#4FC3F7' : 'rgba(79,195,247,0.4)', borderRadius: '3px 3px 0 0', borderStyle: m.actual ? 'solid' : 'dashed', borderWidth: m.actual ? 0 : '1px', borderColor: '#4FC3F7' }} />
                  )}
                </div>
                <span style={{ fontSize: '8px', color: 'var(--pt-gray-600)' }}>{m.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', fontSize: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, background: 'var(--pt-gold)', borderRadius: 2, display: 'inline-block' }} />
              {locale === 'ar' ? 'فعلي' : 'Actual'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, background: '#4FC3F7', borderRadius: 2, display: 'inline-block' }} />
              {locale === 'ar' ? 'متوقع' : 'Predicted'}
            </span>
          </div>
        </div>

        {/* Revenue Streams */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>💰 {locale === 'ar' ? 'مصادر الإيراد' : 'Revenue Streams'}</h3>
          {revenueStreams.map((s, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                  {s.label} ({s.pct}%)
                </span>
                <span style={{ fontWeight: 700 }}>
                  <span style={{ color: 'var(--pt-gray-500)' }}>{(s.current / 1000).toFixed(0)}K</span>
                  <span style={{ color: 'var(--pt-gray-700)', margin: '0 4px' }}>→</span>
                  <span style={{ color: s.color }}>{(s.predicted / 1000).toFixed(0)}K</span>
                </span>
              </div>
              <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Insights */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🔮 {locale === 'ar' ? 'توقعات موسمية' : 'Seasonal Insights'}</h3>
        {seasonalInsights.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: `3px solid ${s.risk === 'low' ? 'var(--pt-success)' : '#FF9100'}` }}>
            <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{s.period}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{s.prediction}</div>
            </div>
            <span className={`badge ${s.risk === 'low' ? 'badge-success' : 'badge-gold'}`} style={{ fontSize: '9px' }}>
              {s.risk === 'low' ? '🟢' : '🟡'} {s.risk === 'low' ? (locale === 'ar' ? 'فرصة' : 'Opportunity') : (locale === 'ar' ? 'تحذير' : 'Caution')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
