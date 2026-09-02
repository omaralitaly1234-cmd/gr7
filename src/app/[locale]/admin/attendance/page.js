'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, getTenantCollectionCount } from '@/lib/firebase/firestore';
import { logAuditClient } from '@/lib/firebase/audit';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AttendanceLogsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { tenantRole, isSuperAdmin } = useAuth();
  const canDelete = tenantRole === 'owner' || tenantRole === 'admin' || isSuperAdmin;

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [genderFilter, setGenderFilter] = useState('all');
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

      // Counts come from count() aggregations. This used to download every
      // check-in of the last seven days — thousands of documents at a busy gym —
      // purely to call .length on them and filter for today.
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
      const [week, today] = await Promise.all([
        getTenantCollectionCount(tenantId, 'attendance',
          [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(weekStart) }]),
        getTenantCollectionCount(tenantId, 'attendance',
          [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(todayStart) }]),
      ]);
      setWeekCount(week.count || 0);
      setTodayCount(today.count || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredData = attendance.filter(a => {
    if (genderFilter !== 'all' && a.gender !== genderFilter) return false;
    return true;
  });

  // Delete an attendance record. If the check-in had deducted a session from
  // an active subscription, put that session back — otherwise the delete would
  // silently cost the member a session. Also decrement the member's totalVisits
  // counter so the profile stays consistent. All three in one transaction: if
  // the sub or member docs vanished we still nuke the attendance row.
  const handleDelete = async (att) => {
    if (!tenantId || !att?.id || deleting) return;
    setDeleting(true);
    try {
      const attRef = doc(db, `tenants/${tenantId}/attendance/${att.id}`);
      const memberRef = att.memberId ? doc(db, `tenants/${tenantId}/members/${att.memberId}`) : null;
      const subRef = (att.sessionDeducted && att.subscriptionId)
        ? doc(db, `tenants/${tenantId}/subscriptions/${att.subscriptionId}`)
        : null;

      await runTransaction(db, async (tx) => {
        const attSnap = await tx.get(attRef);
        if (!attSnap.exists()) return;

        if (subRef) {
          const subSnap = await tx.get(subRef);
          if (subSnap.exists()) {
            const sub = subSnap.data();
            if (sub.totalSessions !== null && sub.totalSessions !== undefined) {
              tx.update(subRef, {
                usedSessions: Math.max(0, (sub.usedSessions || 0) - 1),
                remainingSessions: (sub.remainingSessions || 0) + 1,
              });
            }
          }
        }

        if (memberRef) {
          const memberSnap = await tx.get(memberRef);
          if (memberSnap.exists()) {
            const cur = memberSnap.data().totalVisits || 0;
            tx.update(memberRef, { totalVisits: Math.max(0, cur - 1) });
          }
        }

        tx.delete(attRef);
      });

      logAuditClient({
        action: 'delete', entity: 'attendance', entityId: att.id, tenantId,
        severity: 'warning',
        details: {
          description: {
            en: `Deleted attendance for ${att.memberName || att.memberId}`,
            ar: `حذف حضور ${att.memberName || att.memberId}`,
          },
          sessionRestored: !!subRef,
        },
      });

      setAttendance(prev => prev.filter(a => a.id !== att.id));

      // Same-day deletes reduce today/week counters shown at the top.
      const checkInDate = att.checkIn?.toDate ? att.checkIn.toDate() : null;
      if (checkInDate) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
        if (checkInDate >= todayStart) setTodayCount(c => Math.max(0, c - 1));
        if (checkInDate >= weekStart) setWeekCount(c => Math.max(0, c - 1));
      }

      toast.success(t('attendance.attendanceDeleted'));
    } catch (err) {
      console.error('Delete attendance failed:', err);
      toast.error(isAr ? 'حصل خطأ أثناء الحذف' : 'Delete failed');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

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
              <th>{t('members.gender')}</th>
              <th>{isAr ? 'الطريقة' : 'Method'}</th>
              {canDelete && <th style={{ width: 80 }}>{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>{t('common.noData')}
              </td></tr>
            ) : (
              filteredData.map((att, i) => {
                const checkIn = att.checkIn?.toDate ? att.checkIn.toDate() : null;
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
                        {att.visitSlot === 2 && (
                          <span className="badge badge-info" style={{ fontSize: 10 }}>
                            {t('attendance.visit')} 2
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{checkIn ? checkIn.toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</td>
                    <td dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>
                      {checkIn ? checkIn.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td>{att.gender === 'male' ? '♂️' : '♀️'} {t(`common.${att.gender}`)}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{att.method === 'qr_scan' ? '📱 QR' : '✍️'}</span></td>
                    {canDelete && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteTarget(att)}
                          title={t('attendance.deleteAttendance')}
                          style={{ color: 'var(--pt-danger)' }}
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>🗑️ {t('attendance.deleteAttendance')}</h2>
              <button onClick={() => !deleting && setDeleteTarget(null)} style={{ fontSize: '1.2rem' }} disabled={deleting}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                {deleteTarget.memberName}
              </p>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                {t('attendance.confirmDeleteAttendance')}
              </p>
              {deleteTarget.sessionDeducted && (
                <p style={{ color: 'var(--pt-success)', fontSize: 'var(--font-size-sm)' }}>
                  {isAr ? '↩ هيتم إرجاع الحصة للاشتراك' : '↩ The session will be restored to the subscription'}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteTarget)} disabled={deleting}>
                {deleting ? (isAr ? '... جاري الحذف' : 'Deleting...') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
