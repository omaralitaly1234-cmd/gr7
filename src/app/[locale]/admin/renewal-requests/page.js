'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, updateTenantDocument, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function RenewalRequestsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data: reqs } = await getTenantDocuments(tenantId, 'renewal-requests', [],
        { field: 'createdAt', direction: 'desc' });
      const { data: mems } = await getTenantDocuments(tenantId, 'members');
      setRequests(reqs || []);
      setMembers(mems || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getMember = (memberId) => members.find(m => m.id === memberId);
  const getMemberName = (memberId) => {
    const m = getMember(memberId);
    return m?.fullName?.[locale] || m?.fullName?.ar || m?.memberName || '—';
  };
  const getMemberPhone = (memberId) => getMember(memberId)?.phone || '';

  const formatDate = (ts) => {
    if (!ts) return '-';
    if (ts.toDate) return ts.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return new Date(ts).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleApprove = async (req) => {
    setActionLoading(req.id);
    try {
      await updateTenantDocument(tenantId, 'renewal-requests', req.id, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
      // Send notification to the member
      if (req.memberId) {
        await addTenantDocument(tenantId, 'notifications', {
          memberId: req.memberId,
          type: 'renewal-approved',
          title: isAr ? 'تمت الموافقة على طلب التجديد' : 'Renewal Request Approved',
          body: isAr
            ? `تمت الموافقة على طلب تجديد اشتراكك (${req.currentPlan || '-'}). يرجى التواصل مع الإدارة لإتمام التجديد.`
            : `Your renewal request for (${req.currentPlan || '-'}) has been approved. Please contact management to finalize.`,
          icon: '✅',
          read: false,
        });
      }
      toast.success(isAr ? 'تمت الموافقة على طلب التجديد' : 'Renewal request approved');
      loadData();
    } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
    setActionLoading(null);
  };

  const handleReject = async (req) => {
    setActionLoading(req.id);
    try {
      await updateTenantDocument(tenantId, 'renewal-requests', req.id, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      });
      // Send notification to the member
      if (req.memberId) {
        await addTenantDocument(tenantId, 'notifications', {
          memberId: req.memberId,
          type: 'renewal-rejected',
          title: isAr ? 'تم رفض طلب التجديد' : 'Renewal Request Rejected',
          body: isAr
            ? `تم رفض طلب تجديد اشتراكك (${req.currentPlan || '-'}). يرجى التواصل مع الإدارة لمعرفة التفاصيل.`
            : `Your renewal request for (${req.currentPlan || '-'}) has been rejected. Please contact management for details.`,
          icon: '❌',
          read: false,
        });
      }
      toast.success(isAr ? 'تم رفض الطلب' : 'Request rejected');
      loadData();
    } catch (err) { console.error(err); toast.error(isAr ? 'حدث خطأ' : 'Error'); }
    setActionLoading(null);
  };

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const statusCounts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge badge-warning" style={{ fontSize: 'var(--font-size-xs)' }}>⏳ {isAr ? 'قيد المراجعة' : 'Pending'}</span>;
      case 'approved': return <span className="badge badge-success" style={{ fontSize: 'var(--font-size-xs)' }}>✅ {isAr ? 'تمت الموافقة' : 'Approved'}</span>;
      case 'rejected': return <span className="badge badge-danger" style={{ fontSize: 'var(--font-size-xs)' }}>❌ {isAr ? 'مرفوض' : 'Rejected'}</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🔄</span> {isAr ? 'طلبات تجديد الاشتراك' : 'Renewal Requests'}</h1>
        <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 {t('common.refresh')}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">📋</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.total}</div>
            <div className="stat-label">{isAr ? 'إجمالي الطلبات' : 'Total Requests'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255,167,38,0.1)' }}>⏳</div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: statusCounts.pending > 0 ? 'var(--pt-warning)' : 'inherit' }}>{statusCounts.pending}</div>
            <div className="stat-label">{isAr ? 'قيد المراجعة' : 'Pending'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.approved}</div>
            <div className="stat-label">{isAr ? 'تمت الموافقة' : 'Approved'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-info">
            <div className="stat-value">{statusCounts.rejected}</div>
            <div className="stat-label">{isAr ? 'مرفوض' : 'Rejected'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">{t('common.all')} — {isAr ? 'الحالة' : 'Status'}</option>
          <option value="pending">⏳ {isAr ? 'قيد المراجعة' : 'Pending'}</option>
          <option value="approved">✅ {isAr ? 'تمت الموافقة' : 'Approved'}</option>
          <option value="rejected">❌ {isAr ? 'مرفوض' : 'Rejected'}</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isAr ? 'العضو' : 'Member'}</th>
              <th>{isAr ? 'الخطة' : 'Plan'}</th>
              <th>{isAr ? 'السعر' : 'Price'}</th>
              <th>{isAr ? 'تاريخ الطلب' : 'Request Date'}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>
                {isAr ? 'لا توجد طلبات تجديد' : 'No renewal requests'}
              </td></tr>
            ) : (
              filtered.map((req, i) => (
                <tr key={req.id}>
                  <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{req.memberName?.[locale] || req.memberName?.ar || getMemberName(req.memberId)}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">{getMemberPhone(req.memberId)}</div>
                  </td>
                  <td>
                    <span className="badge badge-gold">🥇 {req.currentPlan || '-'}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>
                    {(req.price || 0).toLocaleString()} <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>{t('common.egp')}</span>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-sm)' }}>
                    {formatDate(req.requestedAt || req.createdAt)}
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      {req.status === 'pending' && (<>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(0,200,83,0.1)', color: 'var(--pt-success)', border: '1px solid rgba(0,200,83,0.3)' }}
                          disabled={actionLoading === req.id}
                          onClick={() => handleApprove(req)}
                          title={isAr ? 'موافقة' : 'Approve'}
                        >✅</button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(255,82,82,0.1)', color: 'var(--pt-danger)', border: '1px solid rgba(255,82,82,0.3)' }}
                          disabled={actionLoading === req.id}
                          onClick={() => handleReject(req)}
                          title={isAr ? 'رفض' : 'Reject'}
                        >❌</button>
                      </>)}
                      {req.status === 'approved' && req.memberId && (
                        <Link
                          href={`/${locale}/admin/members/new?renew=${req.memberId}`}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--pt-gold)' }}
                          title={isAr ? 'تجديد الاشتراك' : 'Renew Subscription'}
                        >🔄 {isAr ? 'تجديد' : 'Renew'}</Link>
                      )}
                      {req.memberId && (
                        <Link href={`/${locale}/admin/members/${req.memberId}`} className="btn btn-ghost btn-sm" title={t('common.details')}>👁️</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-4)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
        {isAr ? `عرض ${filtered.length} من ${requests.length} طلب` : `Showing ${filtered.length} of ${requests.length} requests`}
      </div>
    </div>
  );
}
