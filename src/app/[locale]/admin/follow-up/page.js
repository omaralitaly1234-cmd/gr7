'use client';

// ============================================
// Follow-up desk — turns the "الاشتراكات المنتهية و غير مجددة" sheet the gym
// used to chase by hand into a call list, and adds the members who are still
// paid up but stopped coming.
//
// Every list here is a bounded, indexed page (PAGE_SIZE rows + "load more");
// nothing reads a whole collection. Who counts as lapsed/absent, and the
// WhatsApp text, live in lib/follow-up.js (unit-tested).
// ============================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import {
  getTenantPaginatedDocuments, getTenantDocumentsByIds, getTenantDocuments,
  getTenantCollectionCount, addTenantDocument,
} from '@/lib/firebase/firestore';
import { loadGymProfile } from '@/lib/firebase/gym-settings';
import { gymName as gymNameOf } from '@/lib/gym-profile';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/lib/format';
import {
  FOLLOW_UPS_COLLECTION, FOLLOW_UP_OUTCOMES, RECENT_CONTACT_DAYS,
  LAPSED_WINDOWS, DEFAULT_ABSENT_DAYS,
  buildLapsedRows, buildAbsentRows, latestFollowUpByMember, isRecentlyContacted,
  daysAgoStart, daysSince, outcomeLabel, telHref, whatsappHref,
} from '@/lib/follow-up';

const PAGE_SIZE = 50;
const MS_PER_DAY = 86400000;
// How far back the "last follow-up" column looks. Bounded so the per-page
// follow-up lookup stays a small indexed range query.
const FOLLOW_UP_LOOKBACK_DAYS = 60;

const planLabel = (name, locale) =>
  (name && typeof name === 'object' ? (name[locale] || name.ar || name.en) : name) || '—';

export default function FollowUpPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user, userData } = useAuth();

  const [tab, setTab] = useState('lapsed');            // 'lapsed' | 'absent'
  const [windowDays, setWindowDays] = useState(30);
  const [absentDays, setAbsentDays] = useState(DEFAULT_ABSENT_DAYS);
  const [absentDaysInput, setAbsentDaysInput] = useState(String(DEFAULT_ABSENT_DAYS));
  const [absentMode, setAbsentMode] = useState('stale'); // 'stale' | 'never'
  const [hideContacted, setHideContacted] = useState(true);

  const [rows, setRows] = useState([]);
  const [followUps, setFollowUps] = useState(new Map()); // memberId -> latest follow-up
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [totalCount, setTotalCount] = useState(null);
  const [callsThisWeek, setCallsThisWeek] = useState(null);
  const [gymName, setGymName] = useState('');

  const [noteRow, setNoteRow] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Members already listed on earlier pages of the current list — a member
  // with two expired subs in the window must appear once.
  const seenRef = useRef(new Set());
  // Bumped on every reset so a slow page from the previous filter can't land
  // in the new list.
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (!tenantId) return;
    loadGymProfile(tenantId).then(p => setGymName(gymNameOf(p, locale)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    resetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, tab, windowDays, absentDays, absentMode]);

  /** The query for the current tab — filters, sort, and the matching count filters. */
  const currentQuery = () => {
    const now = Date.now();
    if (tab === 'lapsed') {
      // Index: subscriptions (status ASC, endDate DESC) — the expired export's.
      const filters = [
        { field: 'status', operator: '==', value: 'expired' },
        { field: 'endDate', operator: '>=', value: Timestamp.fromDate(daysAgoStart(windowDays, now)) },
        { field: 'endDate', operator: '<=', value: Timestamp.fromDate(new Date(now)) },
      ];
      return { collection: 'subscriptions', filters, sort: { field: 'endDate', direction: 'desc' } };
    }
    const cutoff = Timestamp.fromDate(new Date(now - absentDays * MS_PER_DAY));
    if (absentMode === 'never') {
      // Never checked in, and joined more than N days ago.
      // Index: members (status ASC, lastVisit ASC, createdAt DESC).
      const filters = [
        { field: 'status', operator: '==', value: 'active' },
        { field: 'lastVisit', operator: '==', value: null },
        { field: 'createdAt', operator: '<=', value: cutoff },
      ];
      return { collection: 'members', filters, sort: { field: 'createdAt', direction: 'desc' } };
    }
    // Most recently gone first: they are the easiest to bring back.
    // Index: members (status ASC, lastVisit DESC).
    const filters = [
      { field: 'status', operator: '==', value: 'active' },
      { field: 'lastVisit', operator: '<', value: cutoff },
    ];
    return { collection: 'members', filters, sort: { field: 'lastVisit', direction: 'desc' } };
  };

  /** Latest follow-up for each member on a page — one small indexed query per 30 ids. */
  const loadFollowUpsFor = async (memberIds) => {
    const ids = [...new Set(memberIds.filter(Boolean))];
    if (ids.length === 0) return [];
    const since = Timestamp.fromDate(new Date(Date.now() - FOLLOW_UP_LOOKBACK_DAYS * MS_PER_DAY));
    const chunks = [];
    for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
    // Index: follow_ups (memberId ASC, createdAt DESC).
    const results = await Promise.all(chunks.map(chunk => getTenantDocuments(tenantId, FOLLOW_UPS_COLLECTION, [
      { field: 'memberId', operator: 'in', value: chunk },
      { field: 'createdAt', operator: '>=', value: since },
    ])));
    const failed = results.find(r => r.error);
    if (failed) console.warn('[FollowUp] follow-up lookup failed (index deployed?):', failed.error);
    return results.flatMap(r => r.data || []);
  };

  const loadPage = async (startAfterDoc, loadId) => {
    const q = currentQuery();
    const res = await getTenantPaginatedDocuments(tenantId, q.collection, q.filters, q.sort, PAGE_SIZE, startAfterDoc);
    if (res.error) throw new Error(res.error);
    const nowMs = Date.now();

    let pageRows;
    if (tab === 'lapsed') {
      const memberMap = await getTenantDocumentsByIds(tenantId, 'members', res.data.map(s => s.memberId));
      pageRows = buildLapsedRows(res.data, memberMap, { nowMs, seen: seenRef.current });
    } else {
      pageRows = buildAbsentRows(res.data, { nowMs, seen: seenRef.current });
    }
    const fus = await loadFollowUpsFor(pageRows.map(r => r.memberId));
    if (loadId !== loadIdRef.current) return;

    setRows(prev => (startAfterDoc ? [...prev, ...pageRows] : pageRows));
    setFollowUps(prev => {
      const merged = new Map(startAfterDoc ? prev : []);
      for (const [id, f] of latestFollowUpByMember(fus)) merged.set(id, f);
      return merged;
    });
    setCursor(res.lastDoc);
    setHasMore(res.hasMore);
  };

  const resetAndLoad = async () => {
    if (!tenantId) { setLoading(false); return; }
    const loadId = ++loadIdRef.current;
    seenRef.current = new Set();
    setLoading(true);
    setLoadError('');
    setRows([]);
    setTotalCount(null);
    try {
      const q = currentQuery();
      // Counts are aggregation queries: one read per 1000 index entries.
      getTenantCollectionCount(tenantId, q.collection, q.filters).then(r => {
        if (loadId === loadIdRef.current && !r.error) setTotalCount(r.count);
      });
      getTenantCollectionCount(tenantId, FOLLOW_UPS_COLLECTION, [
        { field: 'createdAt', operator: '>=', value: Timestamp.fromDate(daysAgoStart(RECENT_CONTACT_DAYS - 1)) },
      ]).then(r => { if (!r.error) setCallsThisWeek(r.count); });
      await loadPage(null, loadId);
    } catch (err) {
      console.error('[FollowUp] load failed:', err);
      if (loadId === loadIdRef.current) {
        setLoadError(isAr
          ? 'تعذّر تحميل القائمة — غالباً الفهرس (index) لسه ما اتعملش في Firestore.'
          : 'Could not load the list — the Firestore index is probably not deployed yet.');
        setHasMore(false);
      }
    }
    if (loadId === loadIdRef.current) setLoading(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      await loadPage(cursor, loadIdRef.current);
    } catch (err) {
      console.error('[FollowUp] load more failed:', err);
      toast.error(isAr ? 'تعذّر تحميل المزيد' : 'Could not load more');
    }
    setLoadingMore(false);
  };

  const nowMs = Date.now();
  const visibleRows = useMemo(
    () => (hideContacted ? rows.filter(r => !isRecentlyContacted(followUps.get(r.memberId), nowMs)) : rows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, followUps, hideContacted],
  );
  const hiddenCount = rows.length - visibleRows.length;

  const openNote = (row) => {
    setNoteRow(row);
    setOutcome('');
    setNote('');
  };

  const saveFollowUp = async () => {
    if (!noteRow || !outcome || saving) return;
    setSaving(true);
    const m = noteRow.member || {};
    const record = {
      memberId: noteRow.memberId,
      memberName: m.fullName?.ar || m.fullName?.en || '',
      memberCode: m.membershipNumber || '',
      kind: noteRow.kind,
      outcome,
      note: note.trim(),
      subscriptionId: noteRow.subscriptionId || null,
      byUid: user?.uid || null,
      byName: userData?.displayName || userData?.name || user?.email || '',
    };
    const { error } = await addTenantDocument(tenantId, FOLLOW_UPS_COLLECTION, record);
    setSaving(false);
    if (error) {
      console.error('[FollowUp] save failed:', error);
      toast.error(isAr ? 'تعذّر حفظ المتابعة' : 'Could not save the follow-up');
      return;
    }
    setFollowUps(prev => new Map(prev).set(noteRow.memberId, { ...record, createdAt: new Date() }));
    setCallsThisWeek(c => (c == null ? c : c + 1));
    toast.success(isAr ? 'اتسجلت المتابعة ✅' : 'Follow-up saved ✅');
    setNoteRow(null);
  };

  const applyAbsentDays = () => {
    const n = Math.round(Number(absentDaysInput));
    if (!Number.isFinite(n) || n < 1 || n > 365) {
      setAbsentDaysInput(String(absentDays));
      return;
    }
    setAbsentDays(n);
  };

  const dateHeader = tab === 'lapsed'
    ? (isAr ? 'انتهى في' : 'Ended')
    : absentMode === 'never'
      ? (isAr ? 'اتسجل في' : 'Joined')
      : (isAr ? 'آخر زيارة' : 'Last visit');

  const dateCell = (row) => {
    if (tab === 'absent' && absentMode === 'never') {
      const joined = row.member?.joinDate || row.member?.createdAt;
      const d = daysSince(joined, nowMs);
      return (
        <>
          <div>{formatDate(joined, locale)}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-danger)' }}>
            {isAr ? 'ما سجلش حضور خالص' : 'Never checked in'}{d != null ? (isAr ? ` · من ${d} يوم` : ` · ${d}d ago`) : ''}
          </div>
        </>
      );
    }
    return (
      <>
        <div>{formatDate(row.date, locale)}</div>
        {row.days != null && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: row.days > 30 ? 'var(--pt-danger)' : 'var(--pt-warning)' }}>
            {tab === 'lapsed'
              ? (isAr ? `من ${row.days} يوم` : `${row.days} days ago`)
              : (isAr ? `غايب ${row.days} يوم` : `Away ${row.days} days`)}
          </div>
        )}
        {tab === 'absent' && row.endDate && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
            {isAr ? 'ينتهي' : 'Ends'} {formatDate(row.endDate, locale)}
          </div>
        )}
      </>
    );
  };

  const lastFollowUpCell = (row) => {
    const f = followUps.get(row.memberId);
    if (!f) return <span style={{ color: 'var(--pt-gray-500)' }}>—</span>;
    const recent = isRecentlyContacted(f, nowMs);
    const d = daysSince(f.createdAt, nowMs);
    return (
      <div style={{ maxWidth: 220 }}>
        <span className={`badge ${recent ? 'badge-info' : ''}`} style={{ fontSize: 'var(--font-size-xs)' }}>
          {outcomeLabel(f.outcome, locale)}
        </span>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)', marginTop: 2 }}>
          {d === 0 ? (isAr ? 'النهارده' : 'today') : (isAr ? `من ${d} يوم` : `${d}d ago`)}
          {f.byName ? ` · ${f.byName}` : ''}
        </div>
        {f.note && (
          <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.note}>
            📝 {f.note}
          </div>
        )}
      </div>
    );
  };

  const tabButton = (key, label) => (
    <button
      className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
    >{label}</button>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📞</span> {isAr ? 'متابعة الأعضاء' : 'Member follow-up'}</h1>
        <button className="btn btn-ghost btn-sm" onClick={resetAndLoad} disabled={loading}>🔄 {isAr ? 'تحديث' : 'Refresh'}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon danger">{tab === 'lapsed' ? '⌛' : '🚶'}</div>
          <div className="stat-info">
            <div className="stat-value">{totalCount == null ? '…' : totalCount.toLocaleString()}</div>
            <div className="stat-label">
              {tab === 'lapsed'
                // Raw count of expired subs — includes members who renewed since,
                // which the list itself drops.
                ? (isAr ? `اشتراك انتهى في آخر ${windowDays} يوم (قبل استبعاد اللي جددوا)` : `Subscriptions ended in the last ${windowDays} days (before removing renewals)`)
                : absentMode === 'never'
                  ? (isAr ? 'نشط وما جاش خالص' : 'Active, never checked in')
                  : (isAr ? `نشط وغايب أكتر من ${absentDays} يوم` : `Active, away over ${absentDays} days`)}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📋</div>
          <div className="stat-info">
            <div className="stat-value">{rows.length}</div>
            <div className="stat-label">{isAr ? 'في القائمة دلوقتي' : 'Loaded in the list'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">☎️</div>
          <div className="stat-info">
            <div className="stat-value">{callsThisWeek == null ? '…' : callsThisWeek}</div>
            <div className="stat-label">{isAr ? `متابعات آخر ${RECENT_CONTACT_DAYS} أيام` : `Follow-ups, last ${RECENT_CONTACT_DAYS} days`}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(66,165,245,0.1)' }}>🙈</div>
          <div className="stat-info">
            <div className="stat-value">{hiddenCount}</div>
            <div className="stat-label">{isAr ? 'اتكلموا الأسبوع ده (مخفيين)' : 'Contacted this week (hidden)'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {tabButton('lapsed', isAr ? '⌛ منتهي ومجددش' : '⌛ Lapsed, not renewed')}
        {tabButton('absent', isAr ? '🚶 غايب' : '🚶 Absent')}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        {tab === 'lapsed' ? (
          <select className="form-select" value={windowDays} onChange={e => setWindowDays(Number(e.target.value))} style={{ width: 'auto' }}>
            {LAPSED_WINDOWS.map(d => (
              <option key={d} value={d}>{isAr ? `انتهى في آخر ${d} يوم` : `Ended in the last ${d} days`}</option>
            ))}
          </select>
        ) : (
          <>
            <select className="form-select" value={absentMode} onChange={e => setAbsentMode(e.target.value)} style={{ width: 'auto' }}>
              <option value="stale">{isAr ? 'آخر زيارة من زمان' : 'Last visit is old'}</option>
              <option value="never">{isAr ? 'ما سجلش حضور خالص' : 'Never checked in'}</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
              {absentMode === 'never'
                ? (isAr ? 'متسجل من أكتر من' : 'Joined more than')
                : (isAr ? 'غايب أكتر من' : 'Away more than')}
              <input
                className="form-input" type="number" min="1" max="365" dir="ltr"
                value={absentDaysInput}
                onChange={e => setAbsentDaysInput(e.target.value)}
                onBlur={applyAbsentDays}
                onKeyDown={e => { if (e.key === 'Enter') applyAbsentDays(); }}
                style={{ width: 80 }}
              />
              {isAr ? 'يوم' : 'days'}
            </label>
          </>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hideContacted} onChange={e => setHideContacted(e.target.checked)} />
          {isAr ? `اخفي اللي اتكلمنا معاهم في آخر ${RECENT_CONTACT_DAYS} أيام` : `Hide members contacted in the last ${RECENT_CONTACT_DAYS} days`}
        </label>
      </div>

      {loadError && (
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', color: 'var(--pt-danger)' }}>
          ⚠️ {loadError}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isAr ? 'العضو' : 'Member'}</th>
              <th>{isAr ? 'الكود' : 'Code'}</th>
              <th>{isAr ? 'التليفون' : 'Phone'}</th>
              <th>{isAr ? 'الباقة' : 'Plan'}</th>
              <th>{dateHeader}</th>
              <th>{isAr ? 'آخر متابعة' : 'Last follow-up'}</th>
              <th>{isAr ? 'تواصل' : 'Contact'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{isAr ? 'جاري التحميل…' : 'Loading…'}</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--pt-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🎉</div>
                {hasMore
                  ? (isAr ? 'كل اللي في الصفحة دي اتكلموا — حمّل المزيد' : 'Everyone on this page was contacted — load more')
                  : (isAr ? 'مفيش حد محتاج متابعة هنا' : 'Nobody to follow up here')}
              </td></tr>
            ) : (
              visibleRows.map((row, i) => {
                const m = row.member || {};
                const name = m.fullName?.[locale] || m.fullName?.ar || '—';
                const tel = telHref(m.phone);
                const wa = whatsappHref(row, { gymName, locale });
                const recent = isRecentlyContacted(followUps.get(row.memberId), nowMs);
                return (
                  <tr key={row.key} style={recent ? { opacity: 0.6 } : undefined}>
                    <td style={{ color: 'var(--pt-gray-500)' }}>{i + 1}</td>
                    <td>
                      <Link href={`/${locale}/admin/members/${row.memberId}`} style={{ fontWeight: 600 }}>{name}</Link>
                    </td>
                    <td dir="ltr">{m.membershipNumber || '—'}</td>
                    <td dir="ltr" style={{ whiteSpace: 'nowrap' }}>{m.phone || '—'}</td>
                    <td>{planLabel(row.planName, locale)}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>{dateCell(row)}</td>
                    <td>{lastFollowUpCell(row)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {tel ? (
                          <a href={tel} className="btn btn-ghost btn-sm" title={isAr ? 'اتصال' : 'Call'} onClick={() => openNote(row)}>📞</a>
                        ) : null}
                        {wa ? (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"
                            style={{ color: '#25D366' }} title={isAr ? 'واتساب' : 'WhatsApp'} onClick={() => openNote(row)}>💬</a>
                        ) : null}
                        <button className="btn btn-ghost btn-sm" onClick={() => openNote(row)} title={isAr ? 'سجّل متابعة' : 'Log follow-up'}>📝</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
          {isAr
            ? `ظاهر ${visibleRows.length} من ${rows.length} محمّلين${hiddenCount ? ` (${hiddenCount} مخفيين)` : ''}`
            : `Showing ${visibleRows.length} of ${rows.length} loaded${hiddenCount ? ` (${hiddenCount} hidden)` : ''}`}
        </div>
        {hasMore && !loading && (
          <button className="btn btn-secondary btn-sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (isAr ? 'جاري التحميل…' : 'Loading…') : (isAr ? `حمّل ${PAGE_SIZE} كمان` : `Load ${PAGE_SIZE} more`)}
          </button>
        )}
      </div>

      {/* Follow-up note modal */}
      {noteRow && (
        <div className="modal-overlay" onClick={() => !saving && setNoteRow(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>📝 {isAr ? 'تسجيل متابعة' : 'Log follow-up'}</h2>
              <button onClick={() => !saving && setNoteRow(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-3)' }}>
                <strong>{noteRow.member?.fullName?.[locale] || noteRow.member?.fullName?.ar}</strong>
                {noteRow.member?.membershipNumber ? <span style={{ color: 'var(--pt-gray-500)' }}> — {noteRow.member.membershipNumber}</span> : null}
              </p>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label">{isAr ? 'النتيجة' : 'Outcome'}</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {FOLLOW_UP_OUTCOMES.map(o => (
                    <button
                      key={o.key}
                      type="button"
                      className={`btn btn-sm ${outcome === o.key ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setOutcome(o.key)}
                      aria-pressed={outcome === o.key}
                    >{o.icon} {isAr ? o.ar : o.en}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'ملاحظة (اختياري)' : 'Note (optional)'}</label>
                <textarea
                  className="form-input" rows={3} maxLength={500}
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder={isAr ? 'مثلاً: هيعدي يجدد يوم الخميس' : 'e.g. coming in Thursday to renew'}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNoteRow(null)} disabled={saving}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={saveFollowUp} disabled={!outcome || saving}>
                {saving ? (isAr ? 'جاري الحفظ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
