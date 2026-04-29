'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, deleteTenantDocument, getTenantCollectionCount } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import styles from './members.module.css';

export default function MembersPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const { tenantId } = useTenant();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  useEffect(() => {
    async function loadMembers() {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await getTenantDocuments(tenantId, 'members', [],
          { field: 'createdAt', direction: 'desc' });
        setMembers(data || []);
        const { count } = await getTenantCollectionCount(tenantId, 'members');
        setTotalCount(count);
      } catch (err) {
        console.error('Failed to load members:', err);
      }
      setLoading(false);
    }
    loadMembers();
  }, [tenantId]);

  const filteredMembers = members.filter((member) => {
    const name = member.fullName[locale] || member.fullName.ar;
    const matchesSearch = searchQuery === '' ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      member.membershipNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || member.gender === genderFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesGender && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const map = {
      active: { class: 'badge-success', label: t('common.active') },
      expired: { class: 'badge-danger', label: t('common.expired') },
      frozen: { class: 'badge-frozen', label: t('common.frozen') },
      inactive: { class: 'badge-warning', label: t('common.inactive') },
    };
    return map[status] || { class: 'badge-info', label: status };
  };

  const handleDelete = async (memberId) => {
    if (!tenantId) return;
    const { error } = await deleteTenantDocument(tenantId, 'members', memberId);
    if (!error) {
      setMembers(members.filter(m => m.id !== memberId));
      setTotalCount(prev => prev - 1);
    }
    setShowDeleteModal(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h1><span>👥</span> {t('members.title')}</h1>
        <Link href={`/${locale}/admin/members/new`} className="btn btn-primary">
          + {t('members.addMember')}
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon gold">👥</div>
          <div className="stat-info">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">{t('common.all')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{members.filter(m => m.status === 'active').length}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-info">
            <div className="stat-value">{members.filter(m => m.status === 'expired').length}</div>
            <div className="stat-label">{t('common.expired')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">❄️</div>
          <div className="stat-info">
            <div className="stat-value">{members.filter(m => m.status === 'frozen').length}</div>
            <div className="stat-label">{t('common.frozen')}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={locale === 'ar' ? 'بحث بالاسم أو الهاتف أو رقم العضوية...' : 'Search by name, phone or membership #...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <select className="form-select" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">{t('common.all')} — {locale === 'ar' ? 'النوع' : 'Gender'}</option>
            <option value="male">{t('common.male')}</option>
            <option value="female">{t('common.female')}</option>
          </select>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">{t('common.all')} — {locale === 'ar' ? 'الحالة' : 'Status'}</option>
            <option value="active">{t('common.active')}</option>
            <option value="expired">{t('common.expired')}</option>
            <option value="frozen">{t('common.frozen')}</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('members.fullName')}</th>
              <th>{t('members.phone')}</th>
              <th>{t('members.membershipNumber')}</th>
              <th>{locale === 'ar' ? 'الخطة' : 'Plan'}</th>
              <th>{t('members.status')}</th>
              <th>{t('subscriptions.endDate')}</th>
              <th>{t('members.totalVisits')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--pt-gray-500)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member, index) => {
                const statusInfo = getStatusBadge(member.status);
                return (
                  <tr key={member.id}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className={styles.memberAvatar}>
                          {(member.fullName[locale] || member.fullName.ar).charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.fullName[locale] || member.fullName.ar}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                            {member.gender === 'male' ? '♂' : '♀'} {t(`common.${member.gender}`)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>{member.phone}</td>
                    <td><code className={styles.memberCode}>{member.membershipNumber}</code></td>
                    <td>
                      <span className={`badge ${(member.planName || member.currentPlan?.type || '').includes('diamond') || (member.planName || '').includes('ماسي') ? 'badge-diamond' : 'badge-gold'}`}>
                        {member.planName || member.currentPlan?.planName || '-'}
                      </span>
                    </td>
                    <td><span className={`badge ${statusInfo.class}`}>● {statusInfo.label}</span></td>
                    <td>{member.endDate?.toDate ? member.endDate.toDate().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (member.endDate || '-')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--pt-gold)' }}>{member.totalVisits}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Link href={`/${locale}/admin/members/${member.id}`} className="btn btn-ghost btn-sm" title={t('common.details')}>
                          👁️
                        </Link>
                        <Link href={`/${locale}/admin/members/${member.id}/edit`} className="btn btn-ghost btn-sm" title={t('common.edit')}>
                          ✏️
                        </Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(member.id)} title={t('common.delete')} style={{ color: 'var(--pt-danger)' }}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div style={{ marginTop: 'var(--space-4)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
        {locale === 'ar' ? `عرض ${filteredMembers.length} من ${totalCount} عضو` : `Showing ${filteredMembers.length} of ${totalCount} members`}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>⚠️ {t('common.confirm')}</h2>
              <button onClick={() => setShowDeleteModal(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🗑️</div>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                {locale === 'ar' ? 'هل أنت متأكد من حذف هذا العضو؟' : 'Are you sure you want to delete this member?'}
              </p>
              <p style={{ color: 'var(--pt-danger)', fontSize: 'var(--font-size-sm)' }}>
                {locale === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteModal)}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
