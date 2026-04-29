'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function AdminAIDashboardPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';

  // Demo data for admin AI dashboard
  const aiStats = {
    totalUsers: 47,
    premiumUsers: 12,
    freeUsers: 35,
    totalTokensUsed: 1_245_000,
    totalCostUSD: 2.87,
    totalRevenueEGP: 6000, // 12 premium × 500 EGP
    avgCostPerUser: 0.061,
    topFeature: isAr ? 'مساعد التغذية' : 'Nutrition AI',
    month: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' }),
  };

  const featureBreakdown = [
    { feature: isAr ? '🥗 مساعد التغذية' : '🥗 Nutrition AI', requests: 156, tokens: 520000, cost: 1.23, users: 38 },
    { feature: isAr ? '🏋️ مولّد التمارين' : '🏋️ Workout AI', requests: 89, tokens: 410000, cost: 0.98, users: 29 },
    { feature: isAr ? '🤖 المساعد الذكي' : '🤖 Chat AI', requests: 234, tokens: 315000, cost: 0.66, users: 42 },
  ];

  const topUsers = [
    { name: 'أحمد محمد', plan: 'premium', requests: 45, cost: 0.32, usage: 6.4 },
    { name: 'سارة علي', plan: 'premium', requests: 38, cost: 0.28, usage: 5.6 },
    { name: 'عمر حسام', plan: 'free', requests: 28, cost: 0.85, usage: 85.0 },
    { name: 'منة الله', plan: 'free', requests: 22, cost: 0.67, usage: 67.0 },
    { name: 'خالد أحمد', plan: 'premium', requests: 18, cost: 0.15, usage: 3.0 },
  ];

  const recentActivity = [
    { user: 'أحمد محمد', feature: '🥗', action: isAr ? 'طلب خطة تغذية' : 'Nutrition plan', time: '2 min', cost: 0.003 },
    { user: 'سارة علي', feature: '🤖', action: isAr ? 'محادثة' : 'Chat', time: '5 min', cost: 0.001 },
    { user: 'عمر حسام', feature: '🏋️', action: isAr ? 'برنامج تمارين' : 'Workout plan', time: '8 min', cost: 0.004 },
    { user: 'منة الله', feature: '🤖', action: isAr ? 'محادثة' : 'Chat', time: '12 min', cost: 0.001 },
    { user: 'خالد أحمد', feature: '🥗', action: isAr ? 'خطة تغذية' : 'Nutrition plan', time: '15 min', cost: 0.003 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🤖</span> {isAr ? 'لوحة تحكم الذكاء الاصطناعي' : 'AI Dashboard'}</h1>
        <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', padding: 'var(--space-2) var(--space-3)' }}>
          📊 {aiStats.month}
        </span>
      </div>

      {/* Key Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>🤖</div>
          <div className="stat-info">
            <div className="stat-value">{aiStats.totalUsers}</div>
            <div className="stat-label">{isAr ? 'مستخدمي AI' : 'AI Users'}</div>
            <div className="stat-change up">⭐ {aiStats.premiumUsers} {isAr ? 'مشترك' : 'premium'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">💰</div>
          <div className="stat-info">
            <div className="stat-value">{aiStats.totalRevenueEGP.toLocaleString()}</div>
            <div className="stat-label">{isAr ? 'إيرادات AI (ج.م)' : 'AI Revenue (EGP)'}</div>
            <div className="stat-change up">+{aiStats.premiumUsers} × 500</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📊</div>
          <div className="stat-info">
            <div className="stat-value">${aiStats.totalCostUSD.toFixed(2)}</div>
            <div className="stat-label">{isAr ? 'تكلفة API الفعلية' : 'Actual API Cost'}</div>
            <div className="stat-change up">{isAr ? 'ربح صافي عالي' : 'High profit margin'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">⚡</div>
          <div className="stat-info">
            <div className="stat-value">{(aiStats.totalTokensUsed / 1000).toFixed(0)}K</div>
            <div className="stat-label">{isAr ? 'إجمالي التوكنز' : 'Total Tokens'}</div>
            <div className="stat-change up">${aiStats.avgCostPerUser.toFixed(3)}/{isAr ? 'مستخدم' : 'user'}</div>
          </div>
        </div>
      </div>

      {/* Revenue vs Cost Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderTop: '3px solid var(--pt-success)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>💹 {isAr ? 'الإيرادات مقابل التكلفة' : 'Revenue vs Cost'}</h3>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-success)' }}>
              {aiStats.totalRevenueEGP.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'إيرادات (ج.م)' : 'Revenue (EGP)'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-danger)' }}>
              ${aiStats.totalCostUSD.toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'تكلفة API' : 'API Cost'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-success)' }}>
              {((1 - (aiStats.totalCostUSD * 50) / aiStats.totalRevenueEGP) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{isAr ? 'هامش الربح' : 'Profit Margin'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Feature Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📊 {isAr ? 'استخدام الميزات' : 'Feature Usage'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {featureBreakdown.map((f, i) => (
              <div key={i} style={{
                background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)', borderInlineStart: '3px solid #8B5CF6',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{f.feature}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>${f.cost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-400)' }}>
                  <span>📋 {f.requests} {isAr ? 'طلب' : 'req'}</span>
                  <span>⚡ {(f.tokens / 1000).toFixed(0)}K tokens</span>
                  <span>👥 {f.users} {isAr ? 'مستخدم' : 'users'}</span>
                </div>
                <div style={{ marginTop: 'var(--space-2)', background: 'var(--pt-gray-800)', height: 4, borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${(f.cost / aiStats.totalCostUSD) * 100}%`, height: '100%', background: '#8B5CF6', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>👥 {isAr ? 'أكثر المستخدمين نشاطاً' : 'Top AI Users'}</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المستخدم' : 'User'}</th>
                  <th>{isAr ? 'الخطة' : 'Plan'}</th>
                  <th>{isAr ? 'الطلبات' : 'Requests'}</th>
                  <th>{isAr ? 'التكلفة' : 'Cost'}</th>
                  <th>{isAr ? 'الاستخدام' : 'Usage'}</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>
                      <span className={`badge ${u.plan === 'premium' ? 'badge-diamond' : 'badge-gold'}`}>
                        {u.plan === 'premium' ? '⭐' : '○'} {u.plan === 'premium' ? (isAr ? 'كاملة' : 'Premium') : (isAr ? 'مجانية' : 'Free')}
                      </span>
                    </td>
                    <td>{u.requests}</td>
                    <td>${u.cost.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ width: 40, height: 4, background: 'var(--pt-gray-800)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(u.usage, 100)}%`, height: '100%', background: u.usage >= 80 ? 'var(--pt-danger)' : '#8B5CF6', borderRadius: 'var(--radius-full)' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--pt-gray-500)' }}>{u.usage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>⚡ {isAr ? 'النشاط الأخير' : 'Recent Activity'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {recentActivity.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3)', background: 'var(--pt-darker)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{a.feature}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{a.user}</span>
                <span style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}> — {a.action}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-600)' }}>{a.time}</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: '#8B5CF6', fontWeight: 600 }}>${a.cost.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
