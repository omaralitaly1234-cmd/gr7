'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function AdminActivityLogPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [filter, setFilter] = useState('all');

  const logs = [
    { time: '14:32', user: 'Admin', action: locale === 'ar' ? 'أضاف عضو جديد' : 'Added new member', target: 'أحمد محمد سعيد', type: 'member', icon: '➕' },
    { time: '14:15', user: 'Admin', action: locale === 'ar' ? 'سجل دفعة' : 'Recorded payment', target: '2,400 ج.م — اشتراك ذهبي', type: 'payment', icon: '💰' },
    { time: '13:45', user: locale === 'ar' ? 'كابتن أحمد' : 'Cap. Ahmed', action: locale === 'ar' ? 'أضاف تقييم عميل' : 'Added client evaluation', target: 'عمر حسام الدين', type: 'trainer', icon: '📋' },
    { time: '13:20', user: 'System', action: locale === 'ar' ? 'تنبيه انتهاء اشتراك' : 'Sub. expiry alert', target: locale === 'ar' ? '5 اشتراكات تنتهي قريباً' : '5 subs expiring soon', type: 'system', icon: '⚠️' },
    { time: '12:50', user: 'Admin', action: locale === 'ar' ? 'جمد اشتراك' : 'Froze subscription', target: 'محمد صلاح — 7 أيام', type: 'member', icon: '❄️' },
    { time: '12:30', user: 'Admin', action: locale === 'ar' ? 'أرسل إشعار جماعي' : 'Sent broadcast', target: locale === 'ar' ? 'عرض رمضان الخاص — 245 عضو' : 'Ramadan offer — 245 members', type: 'system', icon: '📢' },
    { time: '11:45', user: locale === 'ar' ? 'كابتن سارة' : 'Cap. Sara', action: locale === 'ar' ? 'عدلت خطة غذائية' : 'Updated diet plan', target: 'نور أحمد', type: 'trainer', icon: '🥗' },
    { time: '11:00', user: 'System', action: locale === 'ar' ? 'حضور عبر QR' : 'QR check-in', target: 'عمر حسام الدين — PT-2026-0003', type: 'attendance', icon: '📱' },
    { time: '10:30', user: 'Admin', action: locale === 'ar' ? 'حجز سبا جديد' : 'New spa booking', target: locale === 'ar' ? 'مساج رياضي — سارة علي' : 'Sports Massage — Sara Ali', type: 'spa', icon: '🧖' },
    { time: '09:15', user: 'System', action: locale === 'ar' ? 'نسخ احتياطي تلقائي' : 'Auto backup', target: locale === 'ar' ? 'تم بنجاح — 23.5 MB' : 'Success — 23.5 MB', type: 'system', icon: '💾' },
  ];

  const filters = [
    { id: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
    { id: 'member', label: locale === 'ar' ? 'الأعضاء' : 'Members' },
    { id: 'payment', label: locale === 'ar' ? 'المالية' : 'Finance' },
    { id: 'trainer', label: locale === 'ar' ? 'المدربين' : 'Trainers' },
    { id: 'system', label: locale === 'ar' ? 'النظام' : 'System' },
  ];

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📜</span> {locale === 'ar' ? 'سجل النشاطات' : 'Activity Log'}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`btn ${filter === f.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Today Summary */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { icon: '📌', value: logs.length, label: locale === 'ar' ? 'إجمالي النشاطات' : 'Total Activities' },
          { icon: '👤', value: logs.filter(l => l.type === 'member').length, label: locale === 'ar' ? 'عمليات أعضاء' : 'Member Actions' },
          { icon: '💰', value: logs.filter(l => l.type === 'payment').length, label: locale === 'ar' ? 'عمليات مالية' : 'Financial' },
          { icon: '⚙️', value: logs.filter(l => l.type === 'system').length, label: locale === 'ar' ? 'نظام' : 'System' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>📅 {locale === 'ar' ? 'اليوم — 24 مارس 2026' : 'Today — March 24, 2026'}</h3>
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, insetInlineStart: 20, width: 2, background: 'rgba(245,197,24,0.15)' }} />

          {filtered.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) 0', position: 'relative', paddingInlineStart: 'var(--space-8)' }}>
              {/* Timeline dot */}
              <div style={{ position: 'absolute', insetInlineStart: 13, top: 18, width: 16, height: 16, borderRadius: 'var(--radius-full)', background: 'var(--pt-darker)', border: '2px solid var(--pt-gold)', zIndex: 1 }} />

              <div style={{ flex: 1, padding: 'var(--space-3) var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', borderInlineStart: `3px solid ${log.type === 'payment' ? 'var(--pt-success)' : log.type === 'system' ? '#4FC3F7' : log.type === 'trainer' ? '#B388FF' : 'var(--pt-gold)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{log.icon} {log.action}</span>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)', marginTop: '2px' }}>{log.target}</div>
                  </div>
                  <div style={{ textAlign: 'end', flexShrink: 0 }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)', fontWeight: 600 }}>{log.time}</div>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{log.user}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
