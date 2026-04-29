'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function AttendanceLogsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [genderFilter, setGenderFilter] = useState('all');
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  useEffect(() => { loadData(); }, [tenantId, dateFilter]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const now = new Date();
      let startDate;
      if (dateFilter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        startDate = new Date(now); startDate.setDate(startDate.getDate() - 7);
      } else if (dateFilter === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(2020, 0, 1);
      }

      const filters = [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(startDate) }];
      const { data } = await getTenantDocuments(tenantId, 'attendance', filters,
        { field: 'checkIn', direction: 'desc' }, 200);
      setAttendance(data || []);

      // Counts
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
      const { data: allRecent } = await getTenantDocuments(tenantId, 'attendance',
        [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(weekStart) }]);
      setWeekCount(allRecent?.length || 0);
      setTodayCount((allRecent || []).filter(a => {
        const d = a.checkIn?.toDate ? a.checkIn.toDate() : null;
        return d && d >= todayStart;
      }).length);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredData = attendance.filter(a => {
    if (genderFilter !== 'all' && a.gender !== genderFilter) return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>✅</span> {t('attendance.title')}</h1>
        <Link href={`/${locale}/admin/attendance/scanner`} className="btn btn-primary">📱 {t('attendance.scanQR')}</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{todayCount}</div>
            <div className="stat-label">{t('attendance.totalVisitsToday')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📊</div>
          <div className="stat-info">
            <div className="stat-value">{weekCount}</div>
            <div className="stat-label">{isAr ? 'زيارات الأسبوع' : 'This Week'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📋</div>
          <div className="stat-info">
            <div className="stat-value">{filteredData.length}</div>
            <div className="stat-label">{isAr ? 'نتائج العرض' : 'Showing'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 'auto' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="today">{t('common.today')}</option>
          <option value="week">{t('common.thisWeek')}</option>
          <option value="month">{t('common.thisMonth')}</option>
          <option value="all">{t('common.all')}</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
          <option value="all">{t('common.all')} — {isAr ? 'النوع' : 'Gender'}</option>
          <option value="male">{t('common.male')} ♂</option>
          <option value="female">{t('common.female')} ♀</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 {t('common.refresh')}</button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('members.fullName')}</th>
              <th>{t('common.date')}</th>
              <th>{t('attendance.checkIn')}</th>
              <th>{t('attendance.checkOut')}</th>
              <th>{isAr ? 'المدة' : 'Duration'}</th>
              <th>{t('members.gender')}</th>
              <th>{isAr ? 'الطريقة' : 'Method'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>{t('common.noData')}
              </td></tr>
            ) : (
              filteredData.map((att, i) => {
                const checkIn = att.checkIn?.toDate ? att.checkIn.toDate() : null;
                const checkOut = att.checkOut?.toDate ? att.checkOut.toDate() : null;
                const duration = checkIn && checkOut ? Math.round((checkOut - checkIn) / (1000 * 60)) : null;
                return (
                  <tr key={att.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-full)',
                          background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-xs)',
                        }}>
                          {(att.memberName || '?').charAt(0)}
                        </div>
                        {att.memberName}
                      </div>
                    </td>
                    <td>{checkIn ? checkIn.toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                    <td dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>
                      {checkIn ? checkIn.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>
                      {checkOut ? checkOut.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>{duration ? `${duration} ${isAr ? 'دقيقة' : 'min'}` : '—'}</td>
                    <td>{att.gender === 'male' ? '♂️' : '♀️'} {t(`common.${att.gender}`)}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{att.method === 'qr_scan' ? '📱 QR' : '✍️'}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
