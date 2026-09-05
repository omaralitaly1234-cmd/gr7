'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTenantDocuments, updateTenantDocument, getTenantCollectionCount, getTenantPaginatedDocuments } from '@/lib/firebase/firestore';
import { logAuditClient } from '@/lib/firebase/audit';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';
import styles from './members.module.css';

const PAGE_SIZE = 25;

export default function MembersPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const { tenantId } = useTenant();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [counts, setCounts] = useState({ total: 0, active: 0, expired: 0, frozen: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  // Inline row edit: id of the row being edited, plus the working values.
  // Only the two fields the desk actually fixes on the fly — name (ar) and
  // phone — are editable here; the full edit page still owns everything else.
  const [editingRowId, setEditingRowId] = useState(null);
  const [editDraft, setEditDraft] = useState({ fullNameAr: '', phone: '' });
  const [savingRow, setSavingRow] = useState(false);
  // Edit subscription dates from the members list — same feature as the
  // subscriptions page, but reachable from wherever the desk is working.
  const [editDatesMember, setEditDatesMember] = useState(null);
  const [editDatesSub, setEditDatesSub] = useState(null);
  const [editStartInput, setEditStartInput] = useState('');
  const [editEndInput, setEditEndInput] = useState('');
  const [loadingDatesSub, setLoadingDatesSub] = useState(false);
  const [savingDates, setSavingDates] = useState(false);

  // Server-side paging cursors. pageStack[i] is the Firestore doc to start
  // page i after; index 0 is the first page (no cursor).
  const [pageStack, setPageStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Debounce typing so we don't fire a query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter change resets paging back to the first page.
  useEffect(() => {
    setPageStack([null]);
    setPageIndex(0);
  }, [searchQuery, genderFilter, statusFilter]);

  // Stat cards come from count() aggregations — the server returns a number,
  // not 4996 documents.
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      const [all, active, expired, frozen] = await Promise.all([
        getTenantCollectionCount(tenantId, 'members'),
        getTenantCollectionCount(tenantId, 'members', [{ field: 'status', operator: '==', value: 'active' }]),
        getTenantCollectionCount(tenantId, 'members', [{ field: 'status', operator: '==', value: 'expired' }]),
        getTenantCollectionCount(tenantId, 'members', [{ field: 'status', operator: '==', value: 'frozen' }]),
      ]);
      if (cancelled) return;
      setCounts({
        total: all.count || 0,
        active: active.count || 0,
        expired: expired.count || 0,
        frozen: frozen.count || 0,
      });
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      try {
        const filters = [];
        if (statusFilter !== 'all') {
          filters.push({ field: 'status', operator: '==', value: statusFilter });
        }
        if (genderFilter !== 'all') {
          filters.push({ field: 'gender', operator: '==', value: genderFilter });
        }

        let data = [];
        let lastDoc = null;
        let more = false;

        if (searchQuery) {
          // Firestore has no substring search. Membership number and phone are
          // matched by prefix (range query, index-friendly); the name is matched
          // by prefix too. We run them as separate queries and merge, because
          // Firestore can't OR across different fields in one query.
          const end = searchQuery + '';
          const prefixQueries = [
            [{ field: 'membershipNumber', operator: '>=', value: searchQuery },
             { field: 'membershipNumber', operator: '<=', value: end }],
            [{ field: 'phone', operator: '>=', value: searchQuery },
             { field: 'phone', operator: '<=', value: end }],
            [{ field: 'fullName.ar', operator: '>=', value: searchQuery },
             { field: 'fullName.ar', operator: '<=', value: end }],
          ];
          const results = await Promise.all(
            prefixQueries.map(f => getTenantDocuments(tenantId, 'members', f, null, PAGE_SIZE))
          );
          const seen = new Set();
          data = results.flatMap(r => r.data || []).filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
          // Apply the dropdown filters to the merged search hits in JS — the set
          // is at most 3 × PAGE_SIZE rows, not the whole collection.
          if (statusFilter !== 'all') data = data.filter(m => m.status === statusFilter);
          if (genderFilter !== 'all') data = data.filter(m => m.gender === genderFilter);
          data = data.slice(0, PAGE_SIZE);
        } else {
          const res = await getTenantPaginatedDocuments(
            tenantId, 'members', filters,
            { field: 'createdAt', direction: 'desc' },
            PAGE_SIZE, pageStack[pageIndex],
          );
          data = res.data || [];
          lastDoc = res.lastDoc;
          more = res.hasMore;
        }

        if (cancelled) return;
        setMembers(data);
        setHasMore(more);
        // Remember the cursor so "next" can continue from here.
        if (lastDoc && pageStack.length === pageIndex + 1) {
          setPageStack(prev => [...prev, lastDoc]);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      }
      if (!cancelled) setLoading(false);
    }

    loadPage();
    return () => { cancelled = true; };
    // pageStack is intentionally omitted — it is appended to inside this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, pageIndex, searchQuery, genderFilter, statusFilter]);

  // Archived members are hidden; everything else is already filtered server-side.
  const filteredMembers = members.filter(m => m.status !== 'archived');

  const getStatusBadge = (status) => {
    const map = {
      active: { class: 'badge-success', label: t('common.active') },
      expired: { class: 'badge-danger', label: t('common.expired') },
      frozen: { class: 'badge-frozen', label: t('common.frozen') },
      inactive: { class: 'badge-warning', label: t('common.inactive') },
    };
    return map[status] || { class: 'badge-info', label: status };
  };

  const startInlineEdit = (member) => {
    setEditingRowId(member.id);
    setEditDraft({
      fullNameAr: member.fullName?.ar || '',
      phone: member.phone || '',
    });
  };

  const cancelInlineEdit = () => {
    setEditingRowId(null);
    setEditDraft({ fullNameAr: '', phone: '' });
  };

  const saveInlineEdit = async (member) => {
    if (!tenantId || !member?.id) return;
    const nameAr = (editDraft.fullNameAr || '').trim();
    const phone = (editDraft.phone || '').trim();
    if (!nameAr || !phone) return;

    setSavingRow(true);
    try {
      const updated = {
        // Keep the English name aligned with Arabic when there's no explicit
        // English variant — mirrors what the full edit page does.
        fullName: {
          ...(member.fullName || {}),
          ar: nameAr,
          en: member.fullName?.en || nameAr,
        },
        phone,
        // Only overwrite whatsapp when it was defaulting to the old phone.
        ...(member.whatsapp === member.phone || !member.whatsapp ? { whatsapp: phone } : {}),
      };
      const { error } = await updateTenantDocument(tenantId, 'members', member.id, updated);
      if (error) throw new Error(error);

      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...updated } : m));
      logAuditClient({
        action: 'update', entity: 'member', entityId: member.id, tenantId,
        details: { description: { en: 'Inline edit (name/phone)', ar: 'تعديل سريع (اسم/هاتف)' } },
      });
      cancelInlineEdit();
    } catch (err) {
      console.error('Inline save failed:', err);
    }
    setSavingRow(false);
  };

  // ---- Edit subscription dates from a member row ----

  const toDateInput = (d) => {
    if (!d) return '';
    const dt = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d));
    if (isNaN(dt.getTime())) return '';
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };
  const fromDateInput = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const openEditDates = async (member) => {
    if (!tenantId || !member?.id) return;
    setEditDatesMember(member);
    setEditDatesSub(null);
    setEditStartInput('');
    setEditEndInput('');
    setLoadingDatesSub(true);
    try {
      // The newest sub is the one the desk means — same rule used elsewhere
      // (member profile, scanner). Uses the deployed memberId+createdAt index.
      const { data } = await getTenantDocuments(tenantId, 'subscriptions',
        [{ field: 'memberId', operator: '==', value: member.id }],
        { field: 'createdAt', direction: 'desc' }, 1);
      const sub = data?.[0] || null;
      setEditDatesSub(sub);
      if (sub) {
        setEditStartInput(toDateInput(sub.startDate));
        setEditEndInput(toDateInput(sub.endDate || member.endDate));
      } else {
        // No sub doc — fall back to editing the denormalised member.endDate.
        setEditStartInput('');
        setEditEndInput(toDateInput(member.endDate));
      }
    } catch (err) {
      console.error('openEditDates:', err);
    }
    setLoadingDatesSub(false);
  };

  const closeEditDates = () => {
    if (savingDates) return;
    setEditDatesMember(null);
    setEditDatesSub(null);
    setEditStartInput('');
    setEditEndInput('');
  };

  // Shifting the start date should carry the end date with it — that's the
  // "wrong day picked" fix. The admin can still edit the end date directly.
  const handleStartChange = (value) => {
    const oldStart = fromDateInput(editStartInput);
    const newStart = fromDateInput(value);
    const oldEnd = fromDateInput(editEndInput);
    setEditStartInput(value);
    if (oldStart && newStart && oldEnd) {
      const delta = newStart.getTime() - oldStart.getTime();
      setEditEndInput(toDateInput(new Date(oldEnd.getTime() + delta)));
    }
  };

  const handleSaveDates = async () => {
    if (!editDatesMember || !tenantId || savingDates) return;
    const start = fromDateInput(editStartInput);
    const end = fromDateInput(editEndInput);
    if (!end) return;
    if (start && end.getTime() <= start.getTime()) return;

    setSavingDates(true);
    try {
      const endTs = Timestamp.fromDate(end);

      if (editDatesSub && start) {
        const startTs = Timestamp.fromDate(start);
        const { error } = await updateTenantDocument(tenantId, 'subscriptions', editDatesSub.id, {
          startDate: startTs,
          endDate: endTs,
          ...(editDatesSub.originalEndDate && editDatesSub.endDate
            && editDatesSub.originalEndDate?.toMillis?.() === editDatesSub.endDate?.toMillis?.()
            ? { originalEndDate: endTs }
            : {}),
          datesEditedAt: Timestamp.fromDate(new Date()),
          datesEditedBy: 'admin',
        });
        if (error) throw new Error(error);
      }

      // Always refresh the denormalised endDate on the member doc — every page
      // that shows expiry (list, dashboard, scanner card) reads it directly.
      await updateTenantDocument(tenantId, 'members', editDatesMember.id, {
        endDate: endTs,
        ...(editDatesMember.currentPlan
          ? { 'currentPlan.endDate': endTs }
          : {}),
      });

      logAuditClient({
        action: 'update',
        entity: 'member',
        entityId: editDatesMember.id,
        tenantId,
        details: {
          description: {
            en: `Edited subscription dates for ${editDatesMember.fullName?.ar || editDatesMember.id}: ends ${editEndInput}${start ? ` (starts ${editStartInput})` : ''}`,
            ar: `تعديل تواريخ اشتراك ${editDatesMember.fullName?.ar || editDatesMember.id}: ينتهي ${editEndInput}${start ? ` (يبدأ ${editStartInput})` : ''}`,
          },
        },
      });

      // Reflect in the on-screen row so the admin sees the change immediately.
      setMembers(prev => prev.map(m =>
        m.id === editDatesMember.id ? { ...m, endDate: endTs } : m
      ));
      closeEditDates();
    } catch (err) {
      console.error('handleSaveDates:', err);
    }
    setSavingDates(false);
  };

  const handleDelete = async (memberId) => {
    if (!tenantId) return;
    // Soft-delete: archive the member and cancel their active/frozen
    // subscriptions. Payments and attendance are kept as financial history
    // (a hard delete would orphan them).
    const { error } = await updateTenantDocument(tenantId, 'members', memberId, {
      status: 'archived',
      archivedAt: Timestamp.fromDate(new Date()),
    });
    if (!error) {
      try {
        const { data: subs } = await getTenantDocuments(tenantId, 'subscriptions',
          [{ field: 'memberId', operator: '==', value: memberId }]);
        for (const s of (subs || [])) {
          if (s.status === 'active' || s.status === 'frozen') {
            await updateTenantDocument(tenantId, 'subscriptions', s.id, { status: 'cancelled' });
          }
        }
      } catch (e) { console.error('subscription cleanup failed:', e); }
      logAuditClient({ action: 'delete', entity: 'member', entityId: memberId, tenantId, severity: 'warning', details: { description: { en: 'Archived member', ar: 'أرشفة عضو' } } });
      setMembers(members.filter(m => m.id !== memberId));
      setCounts(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
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
            <div className="stat-value">{counts.total.toLocaleString()}</div>
            <div className="stat-label">{t('common.all')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{counts.active.toLocaleString()}</div>
            <div className="stat-label">{t('common.active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-info">
            <div className="stat-value">{counts.expired.toLocaleString()}</div>
            <div className="stat-label">{t('common.expired')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">❄️</div>
          <div className="stat-info">
            <div className="stat-value">{counts.frozen.toLocaleString()}</div>
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
              <th>{locale === 'ar' ? 'المتبقي' : 'Balance'}</th>
              <th>{t('members.totalVisits')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--pt-gray-500)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
                  <div>{t('common.loading')}</div>
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--pt-gray-500)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📭</div>
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member, index) => {
                const statusInfo = getStatusBadge(member.status);
                const isEditing = editingRowId === member.id;
                const canSave = (editDraft.fullNameAr || '').trim() && (editDraft.phone || '').trim();
                return (
                  <tr key={member.id} style={isEditing ? { background: 'var(--pt-gold-glow)' } : undefined}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className={styles.memberAvatar}>
                          {(member.fullName[locale] || member.fullName.ar).charAt(0)}
                        </div>
                        {isEditing ? (
                          <input
                            className="form-input"
                            type="text"
                            value={editDraft.fullNameAr}
                            onChange={e => setEditDraft(d => ({ ...d, fullNameAr: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && canSave) saveInlineEdit(member);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            autoFocus
                            style={{ minWidth: 160 }}
                          />
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600 }}>{member.fullName[locale] || member.fullName.ar}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                              {member.gender === 'male' ? '♂' : '♀'} {t(`common.${member.gender}`)}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>
                      {isEditing ? (
                        <input
                          className="form-input"
                          type="tel"
                          dir="ltr"
                          value={editDraft.phone}
                          onChange={e => setEditDraft(d => ({ ...d, phone: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && canSave) saveInlineEdit(member);
                            if (e.key === 'Escape') cancelInlineEdit();
                          }}
                          style={{ minWidth: 140 }}
                        />
                      ) : member.phone}
                    </td>
                    <td><code className={styles.memberCode}>{member.membershipNumber}</code></td>
                    <td>
                      <span className={`badge ${(member.planName || member.currentPlan?.type || '').includes('diamond') || (member.planName || '').includes('ماسي') ? 'badge-diamond' : 'badge-gold'}`}>
                        {member.planName || member.currentPlan?.planName || '-'}
                      </span>
                    </td>
                    <td><span className={`badge ${statusInfo.class}`}>● {statusInfo.label}</span></td>
                    <td>{member.endDate?.toDate ? member.endDate.toDate().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (member.endDate || '-')}</td>
                    <td>
                      {member.balanceDue > 0 ? (
                        <span className="badge badge-warning" dir="ltr">
                          {member.balanceDue.toLocaleString()} {t('common.egp')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--pt-gray-600)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--pt-gold)' }}>{member.totalVisits}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => saveInlineEdit(member)}
                            disabled={savingRow || !canSave}
                            title={t('common.save')}
                          >
                            {savingRow ? '⏳' : '✅'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={cancelInlineEdit}
                            disabled={savingRow}
                            title={t('common.cancel')}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Link href={`/${locale}/admin/members/${member.id}`} className="btn btn-ghost btn-sm" title={t('common.details')}>
                            👁️
                          </Link>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => startInlineEdit(member)}
                            title={locale === 'ar' ? 'تعديل سريع (اسم/هاتف)' : 'Quick edit (name/phone)'}
                          >
                            ⚡
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditDates(member)}
                            title={locale === 'ar' ? 'تعديل تاريخ الاشتراك' : 'Edit subscription dates'}
                          >
                            📅
                          </button>
                          <Link href={`/${locale}/admin/members/${member.id}/edit`} className="btn btn-ghost btn-sm" title={t('common.edit')}>
                            ✏️
                          </Link>
                          <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(member.id)} title={t('common.delete')} style={{ color: 'var(--pt-danger)' }}>
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + results count */}
      <div style={{
        marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <div style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
          {searchQuery
            ? (locale === 'ar' ? `${filteredMembers.length} نتيجة بحث` : `${filteredMembers.length} search results`)
            : (locale === 'ar'
                ? `صفحة ${pageIndex + 1} — عرض ${filteredMembers.length} من ${counts.total.toLocaleString()} عضو`
                : `Page ${pageIndex + 1} — showing ${filteredMembers.length} of ${counts.total.toLocaleString()} members`)}
        </div>

        {!searchQuery && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPageIndex(i => Math.max(0, i - 1))}
              disabled={pageIndex === 0 || loading}
            >
              {locale === 'ar' ? '→ السابق' : '← Previous'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPageIndex(i => i + 1)}
              disabled={!hasMore || loading}
            >
              {locale === 'ar' ? 'التالي ←' : 'Next →'}
            </button>
          </div>
        )}
      </div>

      {/* Edit subscription dates modal — reachable from any member row */}
      {editDatesMember && (() => {
        const parsedStart = fromDateInput(editStartInput);
        const parsedEnd = fromDateInput(editEndInput);
        const durationDays = (parsedStart && parsedEnd)
          ? Math.max(0, Math.round((parsedEnd.getTime() - parsedStart.getTime()) / 86400000))
          : null;
        const canSave = !!parsedEnd
          && (!parsedStart || parsedEnd.getTime() > parsedStart.getTime());
        const isAr = locale === 'ar';
        return (
          <div className="modal-overlay" onClick={closeEditDates}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="modal-header">
                <h2>📅 {isAr ? 'تعديل تواريخ الاشتراك' : 'Edit subscription dates'}</h2>
                <button onClick={closeEditDates} style={{ fontSize: '1.2rem' }} disabled={savingDates}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: 'var(--space-4)', color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                  <strong>{editDatesMember.fullName?.[locale] || editDatesMember.fullName?.ar}</strong>
                  {editDatesMember.membershipNumber ? ` — ${editDatesMember.membershipNumber}` : ''}
                </p>

                {loadingDatesSub ? (
                  <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p>
                ) : (
                  <>
                    {!editDatesSub && (
                      <div style={{
                        marginBottom: 'var(--space-3)', padding: 'var(--space-3)',
                        background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-400)',
                      }}>
                        {isAr
                          ? 'مفيش وثيقة اشتراك — التعديل هيغيّر تاريخ النهاية على بيانات العضو بس.'
                          : 'No subscription doc — this will only update the member\'s end date field.'}
                      </div>
                    )}

                    {editDatesSub && (
                      <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                        <label className="form-label">{isAr ? 'تاريخ البداية' : 'Start date'}</label>
                        <input
                          className="form-input"
                          type="date"
                          dir="ltr"
                          value={editStartInput}
                          onChange={e => handleStartChange(e.target.value)}
                        />
                        <small style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                          {isAr
                            ? 'لو غيّرت البداية، النهاية بتتحرك تلقائياً بنفس عدد الأيام.'
                            : 'Changing the start shifts the end by the same delta.'}
                        </small>
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                      <label className="form-label">{isAr ? 'تاريخ النهاية' : 'End date'} *</label>
                      <input
                        className="form-input"
                        type="date"
                        dir="ltr"
                        value={editEndInput}
                        onChange={e => setEditEndInput(e.target.value)}
                      />
                    </div>

                    {durationDays !== null && (
                      <div style={{
                        padding: 'var(--space-3)', background: 'var(--pt-darker)',
                        borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--pt-gray-400)' }}>{isAr ? 'المدة الجديدة' : 'New duration'}</span>
                          <strong dir="ltr">{durationDays} {isAr ? 'يوم' : 'days'}</strong>
                        </div>
                      </div>
                    )}

                    {parsedEnd && parsedEnd.getTime() < Date.now() && (
                      <p style={{ color: 'var(--pt-warning)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-3)' }}>
                        ⚠️ {isAr
                          ? 'تاريخ النهاية في الماضي — الاشتراك هيبقى منتهي.'
                          : 'The new end date is in the past — the subscription will be expired.'}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditDates} disabled={savingDates}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveDates}
                  disabled={savingDates || loadingDatesSub || !canSave}
                >
                  {savingDates ? '⏳' : '💾'} {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
