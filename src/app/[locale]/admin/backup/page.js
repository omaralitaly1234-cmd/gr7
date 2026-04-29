'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function AdminBackupPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [exporting, setExporting] = useState('');

  const backups = [
    { date: '2026-03-24 14:00', size: '23.5 MB', type: locale === 'ar' ? 'تلقائي' : 'Auto', status: 'success' },
    { date: '2026-03-23 14:00', size: '23.2 MB', type: locale === 'ar' ? 'تلقائي' : 'Auto', status: 'success' },
    { date: '2026-03-22 14:00', size: '23.1 MB', type: locale === 'ar' ? 'تلقائي' : 'Auto', status: 'success' },
    { date: '2026-03-20 16:30', size: '22.8 MB', type: locale === 'ar' ? 'يدوي' : 'Manual', status: 'success' },
    { date: '2026-03-15 14:00', size: '22.0 MB', type: locale === 'ar' ? 'تلقائي' : 'Auto', status: 'success' },
  ];

  const exports = [
    { icon: '👥', title: locale === 'ar' ? 'بيانات الأعضاء' : 'Members Data', desc: locale === 'ar' ? 'الاسم، الهاتف، الاشتراك، الحالة' : 'Name, Phone, Plan, Status', format: 'Excel', key: 'members' },
    { icon: '💰', title: locale === 'ar' ? 'التقارير المالية' : 'Financial Reports', desc: locale === 'ar' ? 'المدفوعات، الإيرادات، المصروفات' : 'Payments, Revenue, Expenses', format: 'Excel', key: 'finance' },
    { icon: '📅', title: locale === 'ar' ? 'سجل الحضور' : 'Attendance Log', desc: locale === 'ar' ? 'تواريخ الحضور لكل عضو' : 'Attendance dates per member', format: 'CSV', key: 'attendance' },
    { icon: '💳', title: locale === 'ar' ? 'الاشتراكات' : 'Subscriptions', desc: locale === 'ar' ? 'تفاصيل الاشتراكات النشطة والمنتهية' : 'Active, expired, frozen details', format: 'Excel', key: 'subscriptions' },
    { icon: '🧖', title: locale === 'ar' ? 'حجوزات السبا' : 'Spa Bookings', desc: locale === 'ar' ? 'الحجوزات والخدمات المطلوبة' : 'Bookings and requested services', format: 'CSV', key: 'spa' },
    { icon: '📊', title: locale === 'ar' ? 'قياسات الأعضاء' : 'Member Measurements', desc: locale === 'ar' ? 'الوزن، الدهون، العضلات، القياسات' : 'Weight, Fat, Muscle, Body Measurements', format: 'Excel', key: 'measurements' },
  ];

  const handleExport = (key) => {
    setExporting(key);
    setTimeout(() => setExporting(''), 2000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💾</span> {locale === 'ar' ? 'النسخ الاحتياطي والتصدير' : 'Backup & Export'}</h1>
        <button className="btn btn-primary">🔄 {locale === 'ar' ? 'نسخ احتياطي الآن' : 'Backup Now'}</button>
      </div>

      {/* System Status */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { icon: '💾', value: '23.5 MB', label: locale === 'ar' ? 'حجم آخر نسخة' : 'Last Backup Size' },
          { icon: '📅', value: locale === 'ar' ? 'اليوم 2:00م' : 'Today 2:00PM', label: locale === 'ar' ? 'آخر نسخة' : 'Last Backup' },
          { icon: '🔄', value: locale === 'ar' ? 'يومي' : 'Daily', label: locale === 'ar' ? 'النسخ التلقائي' : 'Auto Backup' },
          { icon: '✅', value: locale === 'ar' ? 'آمن' : 'Secure', label: locale === 'ar' ? 'حالة النظام' : 'System Status' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Backup History */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 {locale === 'ar' ? 'سجل النسخ الاحتياطية' : 'Backup History'}</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th>{locale === 'ar' ? 'الحجم' : 'Size'}</th>
                  <th>{locale === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>{b.date}</td>
                    <td>{b.size}</td>
                    <td><span className={`badge ${b.type === 'يدوي' || b.type === 'Manual' ? 'badge-warning' : 'badge-info'}`}>{b.type}</span></td>
                    <td><span className="badge badge-success">✓ {locale === 'ar' ? 'ناجح' : 'Success'}</span></td>
                    <td><button className="btn btn-ghost btn-sm">📥 {locale === 'ar' ? 'تحميل' : 'Download'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auto Backup Settings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>⚙️ {locale === 'ar' ? 'إعدادات النسخ التلقائي' : 'Auto Backup Settings'}</h3>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">{locale === 'ar' ? 'تكرار النسخ' : 'Backup Frequency'}</label>
            <select className="form-select" defaultValue="daily">
              <option value="hourly">{locale === 'ar' ? 'كل ساعة' : 'Hourly'}</option>
              <option value="daily">{locale === 'ar' ? 'يومياً' : 'Daily'}</option>
              <option value="weekly">{locale === 'ar' ? 'أسبوعياً' : 'Weekly'}</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">{locale === 'ar' ? 'وقت النسخ' : 'Backup Time'}</label>
            <input className="form-input" type="time" defaultValue="14:00" dir="ltr" />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">{locale === 'ar' ? 'الاحتفاظ بالنسخ' : 'Retention'}</label>
            <select className="form-select" defaultValue="30">
              <option value="7">{locale === 'ar' ? '7 أيام' : '7 days'}</option>
              <option value="14">{locale === 'ar' ? '14 يوم' : '14 days'}</option>
              <option value="30">{locale === 'ar' ? '30 يوم' : '30 days'}</option>
              <option value="90">{locale === 'ar' ? '90 يوم' : '90 days'}</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>💾 {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</button>
        </div>
      </div>

      {/* Export Data */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>📤 {locale === 'ar' ? 'تصدير البيانات' : 'Export Data'}</h3>
        <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
          {exports.map((exp, i) => (
            <div key={i} style={{ padding: 'var(--space-4)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{exp.icon}</div>
              <h4 style={{ marginBottom: '4px' }}>{exp.title}</h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginBottom: 'var(--space-3)' }}>{exp.desc}</p>
              <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={() => handleExport(exp.key)} disabled={exporting === exp.key}>
                {exporting === exp.key ? (locale === 'ar' ? '⏳ جاري...' : '⏳ Exporting...') : `📥 ${exp.format}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
