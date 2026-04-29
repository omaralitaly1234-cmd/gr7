'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function AdminMemberInsightsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const segments = [
    { name: locale === 'ar' ? 'VIP — ذهبي' : 'VIP — Gold', count: 18, pct: 7, color: '#FFD700', icon: '👑', avgRevenue: 4200, retention: 98, avgVisits: 22 },
    { name: locale === 'ar' ? 'نشط جداً' : 'Super Active', count: 45, pct: 18, color: '#00C853', icon: '🔥', avgRevenue: 1800, retention: 92, avgVisits: 18 },
    { name: locale === 'ar' ? 'نشط' : 'Active', count: 82, pct: 33, color: '#4FC3F7', icon: '✅', avgRevenue: 1200, retention: 78, avgVisits: 12 },
    { name: locale === 'ar' ? 'متوسط' : 'Moderate', count: 55, pct: 22, color: '#FFD740', icon: '⚠️', avgRevenue: 800, retention: 55, avgVisits: 6 },
    { name: locale === 'ar' ? 'خامل' : 'Inactive', count: 35, pct: 14, color: '#FF9100', icon: '😴', avgRevenue: 400, retention: 30, avgVisits: 2 },
    { name: locale === 'ar' ? 'معرّض للمغادرة' : 'At Risk', count: 10, pct: 4, color: '#FF5252', icon: '🚨', avgRevenue: 200, retention: 10, avgVisits: 0 },
  ];

  const demographics = {
    gender: [
      { label: locale === 'ar' ? 'ذكور' : 'Male', count: 165, pct: 67, color: '#4FC3F7' },
      { label: locale === 'ar' ? 'إناث' : 'Female', count: 80, pct: 33, color: '#E040FB' },
    ],
    age: [
      { label: '18-24', count: 58, pct: 24, color: '#00E676' },
      { label: '25-34', count: 95, pct: 39, color: '#4FC3F7' },
      { label: '35-44', count: 52, pct: 21, color: '#FFD740' },
      { label: '45+', count: 40, pct: 16, color: '#FF9100' },
    ],
    goals: [
      { label: locale === 'ar' ? 'خسارة وزن' : 'Weight Loss', count: 85, pct: 35, color: '#FF5252' },
      { label: locale === 'ar' ? 'تضخيم' : 'Bulking', count: 60, pct: 24, color: '#00C853' },
      { label: locale === 'ar' ? 'لياقة عامة' : 'General Fitness', count: 55, pct: 22, color: '#4FC3F7' },
      { label: locale === 'ar' ? 'تنشيف' : 'Cutting', count: 30, pct: 12, color: '#FFD740' },
      { label: locale === 'ar' ? 'علاج طبيعي' : 'Physiotherapy', count: 15, pct: 6, color: '#7C4DFF' },
    ],
  };

  const churnRisk = [
    { name: locale === 'ar' ? 'أحمد فتحي' : 'Ahmed Fathy', lastVisit: locale === 'ar' ? '15 يوم' : '15 days', expiry: locale === 'ar' ? '5 أيام' : '5 days', risk: 90, revenue: 1200 },
    { name: locale === 'ar' ? 'هدى عادل' : 'Huda Adel', lastVisit: locale === 'ar' ? '12 يوم' : '12 days', expiry: locale === 'ar' ? '8 أيام' : '8 days', risk: 75, revenue: 800 },
    { name: locale === 'ar' ? 'كريم سامي' : 'Karim Sami', lastVisit: locale === 'ar' ? '10 أيام' : '10 days', expiry: locale === 'ar' ? '15 يوم' : '15 days', risk: 60, revenue: 1500 },
  ];

  const totalMembers = segments.reduce((a, s) => a + s.count, 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🧠</span> {locale === 'ar' ? 'تحليل الأعضاء' : 'Member Insights'}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--pt-gold)' }}>
          <div className="stat-icon gold">👥</div>
          <div className="stat-info">
            <div className="stat-value">{totalMembers}</div>
            <div className="stat-label">{locale === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--pt-success)' }}>
          <div className="stat-icon success">📈</div>
          <div className="stat-info">
            <div className="stat-value">72%</div>
            <div className="stat-label">{locale === 'ar' ? 'معدل الاحتفاظ' : 'Retention Rate'}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #FF5252' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,82,82,0.12)', color: '#FF5252' }}>🚨</div>
          <div className="stat-info">
            <div className="stat-value">10</div>
            <div className="stat-label">{locale === 'ar' ? 'معرّض للمغادرة' : 'At Churn Risk'}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #4FC3F7' }}>
          <div className="stat-icon info">💰</div>
          <div className="stat-info">
            <div className="stat-value">1.2K</div>
            <div className="stat-label">{locale === 'ar' ? 'متوسط إيراد/عضو' : 'Avg Revenue/Member'} ({locale === 'ar' ? 'ج.م' : 'EGP'})</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Member Segments */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🎯 {locale === 'ar' ? 'شرائح الأعضاء' : 'Member Segments'}</h3>
          {segments.map((seg, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', borderInlineStart: `3px solid ${seg.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{seg.icon} {seg.name}</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: seg.color }}>{seg.count} ({seg.pct}%)</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '9px', color: 'var(--pt-gray-600)' }}>
                <span>💰 {seg.avgRevenue} {locale === 'ar' ? 'ج.م' : 'EGP'}</span>
                <span>📊 {seg.retention}% {locale === 'ar' ? 'احتفاظ' : 'retention'}</span>
                <span>📅 {seg.avgVisits} {locale === 'ar' ? 'زيارة/شهر' : 'visits/mo'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Demographics */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>📊 {locale === 'ar' ? 'الديموغرافيا' : 'Demographics'}</h3>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
              {locale === 'ar' ? 'الجنس' : 'Gender'}
            </div>
            <div style={{ display: 'flex', borderRadius: 'var(--radius-full)', overflow: 'hidden', height: 20, marginBottom: 'var(--space-2)' }}>
              {demographics.gender.map((g, i) => (
                <div key={i} style={{ width: `${g.pct}%`, background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>{g.pct}%</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '10px' }}>
              {demographics.gender.map((g, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color, display: 'inline-block' }} /> {g.label} ({g.count})
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
              {locale === 'ar' ? 'الفئة العمرية' : 'Age Groups'}
            </div>
            {demographics.age.map((a, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                  <span>{a.label}</span>
                  <span style={{ fontWeight: 700 }}>{a.count} ({a.pct}%)</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-full)', height: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: a.color, borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
              {locale === 'ar' ? 'الأهداف' : 'Goals'}
            </div>
            {demographics.goals.map((g, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                  <span>{g.label}</span>
                  <span style={{ fontWeight: 700 }}>{g.count} ({g.pct}%)</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-full)', height: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${g.pct}%`, height: '100%', background: g.color, borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Churn Risk Table */}
      <div className="card" style={{ borderTop: '3px solid #FF5252' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>🚨 {locale === 'ar' ? 'أعضاء معرّضون للمغادرة' : 'Churn Risk Members'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'العضو' : 'Member'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'آخر زيارة' : 'Last Visit'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'ينتهي خلال' : 'Expires In'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'نسبة المخاطرة' : 'Risk %'}</th>
              <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'إيراد شهري' : 'Monthly Rev'}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {churnRisk.map((m, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td style={{ textAlign: 'center', color: 'var(--pt-danger)', fontSize: 'var(--font-size-xs)' }}>📅 {m.lastVisit}</td>
                <td style={{ textAlign: 'center', color: 'var(--pt-warning)', fontSize: 'var(--font-size-xs)' }}>⏰ {m.expiry}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: m.risk >= 80 ? 'rgba(255,82,82,0.15)' : 'rgba(255,145,0,0.15)', color: m.risk >= 80 ? '#FF5252' : '#FF9100', fontWeight: 800, fontSize: '11px' }}>{m.risk}%</span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{m.revenue} {locale === 'ar' ? 'ج.م' : 'EGP'}</td>
                <td><button className="btn btn-primary btn-sm">📞 {locale === 'ar' ? 'تواصل' : 'Contact'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
