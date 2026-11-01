'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, getTenantDocument, getTenantCollectionCount, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import ScannedMemberPanel from '@/components/ScannedMemberPanel';
import RenewSubscriptionModal from '@/components/RenewSubscriptionModal';
import { searchMembers } from '@/lib/firebase/member-search';
import { Timestamp, doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  DEFAULT_EXPIRY_WARNING, toExpiryWarningSettings, computeExpiryWarning,
  expiryWarningText, expiryNotificationId,
} from '@/lib/expiry-warning';
import {
  SERVER_TIMEOUT_MS, findMemberByCodeFromServer, recentSubsFromServer, writeCheckIn, buildRoster, replayQueue,
} from '@/lib/firebase/checkin';
import {
  ROSTER_MAX_AGE_MS, pickActiveSub, toRosterEntry, rosterEntryToMember, findInRoster, searchRoster,
  offlineVerdict, rosterAfterVisit, makeQueueEntry, visitsTodayFor, visitsAfter,
  loadRoster, saveRoster, loadQueue, saveQueue, loadIssues, saveIssues, loadVisits, saveVisits,
  isNetworkError, withTimeout,
} from '@/lib/offline-checkin';

// localStorage, or null where the browser refuses it (private window, policy).
function deviceStorage() {
  try { return window.localStorage; } catch { return null; }
}

const ISSUE_TEXT = {
  expired: { ar: 'اشتراكه كان منتهي وقت ما دخل', en: 'Subscription had expired' },
  frozen: { ar: 'اشتراكه كان متجمد وقت ما دخل', en: 'Subscription was frozen' },
  no_sessions: { ar: 'مكانش فاضله حصص — اتسجل من غير خصم', en: 'No classes left — recorded without one' },
  not_found: { ar: 'الكود ده مش لأي عضو', en: 'Code belongs to no member' },
  third_visit: { ar: 'زيارة تالتة في نفس اليوم — ما اتسجلتش', en: 'Third visit that day — not recorded' },
  error: { ar: 'حصل خطأ وهو بيترفع', en: 'Upload failed' },
};

export default function AttendanceScannerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { tenantRole, isSuperAdmin } = useAuth();

  const [scanResult, setScanResult] = useState(null);
  const [resultType, setResultType] = useState(null); // success, error, expired, frozen
  const [memberData, setMemberData] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [scanning, setScanning] = useState(false);
  // Full profile shown beside the scanner for the member just scanned.
  const [memberHistory, setMemberHistory] = useState([]);
  const [memberSub, setMemberSub] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Check-in by name, for members who do not know their code.
  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const [nameSearching, setNameSearching] = useState(false);
  // "Subscription ending soon" for the member just checked in — stays up with
  // the member card, unlike the 4-second success banner.
  const [expiryWarning, setExpiryWarning] = useState(null);
  const warningSettingsRef = useRef(DEFAULT_EXPIRY_WARNING);
  // Renewal offered right at the desk: { sub, checkInAfter }. `checkInAfter`
  // is set when the scan was turned away (expired, or out of classes) — once
  // they have renewed, the check-in they came for goes through.
  const [renewTarget, setRenewTarget] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  // Whether the member's app was actually notified about the warning (it is
  // not while offline).
  const [expiryNotified, setExpiryNotified] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  // Offline mode. `online` flips off when a server read fails or times out,
  // and back on when the queue replays (or a probe read) succeeds. The ref is
  // what the scan handlers read — they are captured by the camera callback.
  const [online, setOnline] = useState(true);
  const onlineRef = useRef(true);
  const [queueCount, setQueueCount] = useState(0);
  const [issues, setIssues] = useState([]);
  const [rosterInfo, setRosterInfo] = useState({ count: 0, builtAt: 0 });
  const [syncing, setSyncing] = useState(false);
  // A code the offline roster does not know: { code, memberId, memberName }.
  const [unknownOffline, setUnknownOffline] = useState(null);
  const rosterRef = useRef({ builtAt: 0, members: {} });
  const syncingRef = useRef(false);
  const rosterBuildingRef = useRef(false);

  const markOnline = useCallback((value) => {
    onlineRef.current = value;
    setOnline(value);
  }, []);

  const setRoster = useCallback((roster) => {
    rosterRef.current = roster;
    saveRoster(deviceStorage(), tenantId, roster);
    setRosterInfo({ count: Object.keys(roster.members || {}).length, builtAt: roster.builtAt || 0 });
  }, [tenantId]);

  // Recorded Arabic voice clips for the front desk — one for a successful
  // check-in, one for an expired subscription. Routed through a Web Audio
  // GainNode so we can boost above the element's 100% cap (browsers hard-limit
  // <audio>.volume at 1.0, and the source clips were low-level, so playback
  // was too quiet for a noisy reception area).
  const successAudioRef = useRef(null);
  const expiredAudioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const AUDIO_GAIN = 3;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    successAudioRef.current = new Audio('/sounds/checkin-success.mp3');
    expiredAudioRef.current = new Audio('/sounds/checkin-expired.mp3');
    successAudioRef.current.preload = 'auto';
    expiredAudioRef.current.preload = 'auto';
    successAudioRef.current.volume = 1;
    expiredAudioRef.current.volume = 1;
  }, []);
  const playSound = useCallback((kind) => {
    const el = kind === 'success' ? successAudioRef.current : expiredAudioRef.current;
    if (!el) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !audioCtxRef.current) {
        audioCtxRef.current = new AC();
        for (const audio of [successAudioRef.current, expiredAudioRef.current]) {
          const src = audioCtxRef.current.createMediaElementSource(audio);
          const gain = audioCtxRef.current.createGain();
          gain.gain.value = AUDIO_GAIN;
          src.connect(gain).connect(audioCtxRef.current.destination);
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      el.currentTime = 0;
      el.play().catch(err => console.warn('audio blocked:', err));
    } catch {}
  }, []);

  // The gym's expiry-warning options (admin/settings → notifications). Read once
  // per page load; a missing document keeps the defaults.
  useEffect(() => {
    if (!tenantId) return;
    getTenantDocument(tenantId, 'config', 'settings')
      .then(({ data }) => { warningSettingsRef.current = toExpiryWarningSettings(data || {}); })
      .catch(err => console.warn('[Scanner] settings:', err));
  }, [tenantId]);

  // Today's tally + the five most recent scans. The count is a server-side
  // aggregation and the list is capped at five: this used to download every
  // check-in of the day just to call .length and slice(0, 5) off it, on a page
  // the front desk leaves open from open to close.
  const loadTodayCount = useCallback(async () => {
    if (!tenantId) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filter = [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(today) }];
    const [countRes, recentRes] = await Promise.all([
      getTenantCollectionCount(tenantId, 'attendance', filter),
      getTenantDocuments(tenantId, 'attendance', filter, { field: 'checkIn', direction: 'desc' }, 5),
    ]);
    if (countRes.error || recentRes.error) return;
    setTodayCount(countRes.count || 0);
    setRecentScans(recentRes.data || []);
  }, [tenantId]);
  useEffect(() => { loadTodayCount(); }, [loadTodayCount]);

  // ---- offline roster, queue and replay ----------------------------------

  const refreshRoster = useCallback(async () => {
    if (!tenantId || rosterBuildingRef.current) return;
    rosterBuildingRef.current = true;
    try {
      setRoster(await buildRoster(tenantId));
    } catch (err) {
      console.warn('[Scanner] offline roster:', err);
    }
    rosterBuildingRef.current = false;
  }, [tenantId, setRoster]);

  // Replay the offline queue. Also the "are we back?" probe: with nothing
  // queued it reads one small doc from the server.
  const syncQueue = useCallback(async () => {
    if (!tenantId || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const queue = loadQueue(deviceStorage(), tenantId);
      if (queue.length === 0) {
        if (!onlineRef.current) {
          await withTimeout(getDocFromServer(doc(db, `tenants/${tenantId}/config/settings`)), SERVER_TIMEOUT_MS);
          markOnline(true);
        }
      } else {
        const res = await replayQueue(tenantId, queue, { locale });
        // Re-read: scans made while the replay ran were appended meanwhile.
        const done = new Set(res.done);
        const left = loadQueue(deviceStorage(), tenantId).filter(e => !done.has(e.id));
        saveQueue(deviceStorage(), tenantId, left);
        setQueueCount(left.length);
        if (res.issues.length) {
          const all = [...loadIssues(deviceStorage(), tenantId), ...res.issues];
          saveIssues(deviceStorage(), tenantId, all);
          setIssues(all);
        }
        markOnline(!res.offline);
        if (res.done.length) loadTodayCount();
      }
    } catch (err) {
      if (!isNetworkError(err)) console.warn('[Scanner] sync:', err);
      markOnline(false);
    }
    syncingRef.current = false;
    setSyncing(false);
  }, [tenantId, locale, markOnline, loadTodayCount]);

  // Load what this device kept from last time, and rebuild a stale roster.
  useEffect(() => {
    if (!tenantId) return;
    const s = deviceStorage();
    const roster = loadRoster(s, tenantId);
    rosterRef.current = roster;
    setRosterInfo({ count: Object.keys(roster.members || {}).length, builtAt: roster.builtAt || 0 });
    setQueueCount(loadQueue(s, tenantId).length);
    setIssues(loadIssues(s, tenantId));
    if (typeof navigator !== 'undefined' && navigator.onLine === false) markOnline(false);
    // Upload anything left from before, then refresh the roster if it is old.
    syncQueue().then(() => {
      if (onlineRef.current && Date.now() - (rosterRef.current.builtAt || 0) > ROSTER_MAX_AGE_MS) refreshRoster();
    });
  }, [tenantId, markOnline, syncQueue, refreshRoster]);

  // The browser's own connectivity events, plus a 30-second retry while there
  // is something queued or the desk is offline.
  useEffect(() => {
    const goOffline = () => markOnline(false);
    const goOnline = () => syncQueue();
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    const timer = setInterval(() => {
      if (!onlineRef.current || loadQueue(deviceStorage(), tenantId).length > 0) syncQueue();
      else if (Date.now() - (rosterRef.current.builtAt || 0) > ROSTER_MAX_AGE_MS) refreshRoster();
    }, 30000);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      clearInterval(timer);
    };
  }, [tenantId, markOnline, syncQueue, refreshRoster]);

  const dismissIssue = (id) => {
    const next = id ? issues.filter(i => i.id !== id) : [];
    saveIssues(deviceStorage(), tenantId, next);
    setIssues(next);
  };

  const enqueue = (entry) => {
    const s = deviceStorage();
    const queue = [...loadQueue(s, tenantId), entry];
    saveQueue(s, tenantId, queue);
    setQueueCount(queue.length);
  };

  const countOfflineVisit = (memberId, memberName, gender, atMs) => {
    if (memberId) saveVisits(deviceStorage(), tenantId, visitsAfter(loadVisits(deviceStorage(), tenantId), memberId, atMs));
    setTodayCount(prev => prev + 1);
    setRecentScans(prev => [{ id: `local_${atMs}`, memberName, gender, checkIn: Timestamp.fromMillis(atMs), offline: true }, ...prev].slice(0, 5));
  };

  // Decide from the roster alone and queue the visit. `queued` is passed when
  // a live check-in timed out mid-write: its id is the one the transaction
  // used, so the replay can tell whether it actually committed.
  const offlineCheckIn = (entry, queued = null) => {
    const member = rosterEntryToMember(entry);
    const name = member.fullName?.[locale] || member.fullName?.ar || '';
    setUnknownOffline(null);
    setRenewTarget(null);
    setExpiryWarning(null);
    setMemberData(member);
    setMemberHistory([]);
    setHistoryLoading(false);
    setMemberSub(entry.sub ? { endDate: entry.sub.endMs, totalSessions: entry.sub.totalSessions, remainingSessions: entry.sub.remainingSessions } : null);

    const nowMs = Date.now();
    const verdict = offlineVerdict(entry, nowMs, visitsTodayFor(loadVisits(deviceStorage(), tenantId), entry.id, nowMs));
    if (!verdict.ok) {
      if (verdict.reason === 'expired') {
        setScanResult(t('attendance.subscriptionExpired'));
        setResultType('expired');
        playSound('expired');
      } else if (verdict.reason === 'frozen') {
        setScanResult(t('attendance.subscriptionFrozen'));
        setResultType('frozen');
      } else if (verdict.reason === 'no_sessions') {
        setScanResult(t('attendance.noSessionsLeft'));
        setResultType('error');
      } else {
        setScanResult(t('attendance.alreadyCheckedInTwice'));
        setResultType('warning');
      }
      return;
    }

    enqueue(queued || makeQueueEntry({ code: entry.membershipNumber, memberId: entry.id, memberName: name, atMs: nowMs }));
    const roster = rosterAfterVisit(rosterRef.current, entry.id);
    setRoster(roster);
    countOfflineVisit(entry.id, name, entry.gender, nowMs);

    const after = roster.members[entry.id];
    setMemberData(rosterEntryToMember(after));
    if (after.sub) setMemberSub({ endDate: after.sub.endMs, totalSessions: after.sub.totalSessions, remainingSessions: after.sub.remainingSessions });
    setScanResult(isAr ? 'تم تسجيل الحضور — من غير نت، هيترفع أول ما النت يرجع' : 'Checked in offline — uploads when the connection is back');
    setResultType('success');
    playSound('success');

    const counted = entry.planType !== 'diamond' && after.sub?.totalSessions !== null && after.sub?.totalSessions !== undefined;
    const warning = computeExpiryWarning({
      totalSessions: counted ? after.sub.totalSessions : null,
      remainingSessions: counted ? after.sub.remainingSessions : null,
      endDateMs: after.sub?.endMs || null,
      settings: warningSettingsRef.current,
    });
    setExpiryNotified(false);
    if (warning) setExpiryWarning(warning);

    setTimeout(() => {
      setScanResult(null);
      setResultType(null);
    }, 4000);
  };

  // A code the roster does not know (no live subscription when it was built,
  // or a member never seen). The desk decides; the replay checks it later.
  const showUnknownOffline = (code, member = null) => {
    setMemberData(member);
    setMemberHistory([]);
    setMemberSub(null);
    setExpiryWarning(null);
    setRenewTarget(null);
    setUnknownOffline({ code, memberId: member?.id || null, memberName: member?.fullName?.[locale] || member?.fullName?.ar || '' });
    setScanResult(isAr
      ? 'مفيش نت، والكود ده مش في النسخة المحفوظة — غالباً اشتراكه منتهي'
      : 'Offline, and this code is not in the saved copy — most likely expired');
    setResultType('warning');
  };

  const admitUnknownOffline = () => {
    if (!unknownOffline) return;
    const nowMs = Date.now();
    enqueue(makeQueueEntry({ ...unknownOffline, verified: false, atMs: nowMs }));
    countOfflineVisit(unknownOffline.memberId, unknownOffline.memberName || unknownOffline.code, memberData?.gender, nowMs);
    setUnknownOffline(null);
    setScanResult(isAr ? 'اتسجل مؤقتاً — هيتراجع أول ما النت يرجع' : 'Recorded for now — checked when the connection is back');
    setResultType('success');
    setTimeout(() => { setScanResult(null); setResultType(null); }, 4000);
  };

  const offlineScan = (code) => {
    const entry = findInRoster(rosterRef.current, code);
    if (entry) offlineCheckIn(entry);
    else showUnknownOffline(String(code).trim());
  };

  const handleScan = useCallback(async (qrData) => {
    if (!tenantId || !qrData) return;
    if (!onlineRef.current) return offlineScan(qrData);

    try {
      // Matches membershipNumber and qrCode, raw and normalised, so a code
      // typed in a different case still opens the door.
      let member;
      try {
        member = await withTimeout(findMemberByCodeFromServer(tenantId, qrData), SERVER_TIMEOUT_MS);
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        markOnline(false);
        return offlineScan(qrData);
      }
      if (!member) {
        setScanResult(isAr ? 'لا يوجد عضو بهذا الرمز' : 'No member found with this code');
        setResultType('error');
        setMemberData(null);
        setMemberHistory([]);
        setMemberSub(null);
        setExpiryWarning(null);
        setRenewTarget(null);
        setUnknownOffline(null);
        return;
      }
      return processCheckIn(member);
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult(isAr ? 'خطأ في المسح' : 'Scan error');
      setResultType('error');
    }
  }, [tenantId, isAr]);

  // Check in by name, for the members who turn up knowing neither their code
  // nor their phone number. Matches any word of the name ("النجار" finds
  // "عمر علي النجار"). Offline, it searches the saved roster instead.
  const runNameSearch = useCallback(async (raw) => {
    const term = raw.trim();
    if (!tenantId || term.length < 2) { setNameResults([]); return; }
    if (!onlineRef.current) {
      setNameResults(searchRoster(rosterRef.current, term, 8).map(rosterEntryToMember));
      return;
    }
    setNameSearching(true);
    try {
      setNameResults(await searchMembers(tenantId, term, 8));
    } catch (err) {
      console.error('[Scanner] name search:', err);
      setNameResults([]);
    }
    setNameSearching(false);
  }, [tenantId]);

  // The desk needs the member's history and subscription regardless of whether
  // the check-in itself succeeds — an expired or already-checked-in member is
  // exactly when the staff needs to look at the record.
  const loadMemberContext = useCallback(async (memberId) => {
    setHistoryLoading(true);
    setMemberHistory([]);
    setMemberSub(null);
    try {
      const [attRes, subRes] = await Promise.all([
        getTenantDocuments(tenantId, 'attendance',
          [{ field: 'memberId', operator: '==', value: memberId }],
          { field: 'checkIn', direction: 'desc' }, 60),
        getTenantDocuments(tenantId, 'subscriptions',
          [{ field: 'memberId', operator: '==', value: memberId }],
          { field: 'createdAt', direction: 'desc' }, 1),
      ]);
      if (attRes.error) console.error('[Scanner] attendance history:', attRes.error);
      if (subRes.error) console.error('[Scanner] subscription:', subRes.error);
      setMemberHistory(attRes.data || []);
      setMemberSub(subRes.data?.[0] || null);
    } catch (err) {
      console.error('[Scanner] member context:', err);
    }
    setHistoryLoading(false);
  }, [tenantId]);

  // Drop the member a notification in their app. Fire-and-forget: the id is
  // fixed per subscription and step, so a double-scan or a second visit the
  // same day finds it already there and does not send it again.
  const sendExpiryNotification = async (memberId, subscriptionId, warning) => {
    try {
      const text = expiryWarningText(warning);
      const ref = doc(db, `tenants/${tenantId}/notifications/${expiryNotificationId(subscriptionId, warning)}`);
      if ((await getDoc(ref)).exists()) return;
      const lang = isAr ? 'ar' : 'en';
      await setDoc(ref, {
        memberId,
        subscriptionId: subscriptionId || null,
        title: text.title[lang],
        body: text.body[lang],
        message: text.body[lang],
        type: 'renewal',
        target: 'individual',
        icon: '⏳',
        status: 'sent',
        read: false,
        source: 'checkin_expiry_warning',
        sentAt: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[Scanner] expiry notification:', err);
    }
  };

  const processCheckIn = async (member) => {
    if (!onlineRef.current) {
      const entry = rosterRef.current.members?.[member.id];
      return entry ? offlineCheckIn(entry) : showUnknownOffline(member.membershipNumber || '', member);
    }
    setMemberData(member);
    setExpiryWarning(null);
    setRenewTarget(null);
    setUnknownOffline(null);
    loadMemberContext(member.id);

    // The member doc's `status` field is denormalised — it can drift out of
    // sync with reality: the nightly expiry cron marks a sub expired against
    // one memberId while another (renewed) sub is still valid, a renewal
    // write races with a stale read, or someone edits a member's endDate
    // without touching the sub. Filtering the subs by `status == 'active'`
    // isn't enough either — a sub's status field can also be stale.
    //
    // The source of truth is the ENDATE on the newest few subs: if ANY of
    // them is in the future, the member is really active (pickActiveSub).
    // Read from the server — a cached empty result would read as expired.
    let recentSubs;
    try {
      recentSubs = await withTimeout(recentSubsFromServer(tenantId, member.id), SERVER_TIMEOUT_MS);
    } catch (err) {
      if (isNetworkError(err)) {
        markOnline(false);
        return processCheckIn(member);
      }
      console.error('[Scanner] subscriptions:', err);
      setScanResult(isAr ? 'خطأ في تسجيل الحضور' : 'Check-in error');
      setResultType('error');
      return;
    }
    const activeSub = pickActiveSub(recentSubs, Date.now());
    const hasValidActive = !!activeSub;

    // Keep this device's offline copy current with what the server just said.
    {
      const members = { ...(rosterRef.current.members || {}) };
      if (activeSub) members[member.id] = toRosterEntry(member, activeSub);
      else delete members[member.id];
      setRoster({ ...rosterRef.current, members });
    }
    // If the winning sub's own status is stale, patch it too so tables that
    // filter by status='active' (subscriptions page, dashboard) stop showing
    // it in the wrong bucket.
    if (activeSub && activeSub.status !== 'active' && activeSub.status !== 'frozen') {
      updateTenantDocument(tenantId, 'subscriptions', activeSub.id, { status: 'active' })
        .catch(err => console.warn('subscription.status self-heal failed:', err));
    }

    let effectiveStatus;
    if (hasValidActive) {
      effectiveStatus = activeSub.status === 'frozen' ? 'frozen' : 'active';
    } else {
      effectiveStatus = 'expired';
    }

    // Fix a stale member.status in the background so the members list and
    // dashboard stop mis-labelling this person. Fire-and-forget: the check-in
    // itself must not wait on this write.
    if (effectiveStatus !== member.status) {
      updateTenantDocument(tenantId, 'members', member.id, { status: effectiveStatus })
        .catch(err => console.warn('member.status self-heal failed:', err));
      // Keep the on-screen card in sync with what we just decided.
      setMemberData(prev => (prev ? { ...prev, status: effectiveStatus } : prev));
    }

    if (effectiveStatus === 'frozen') {
      setScanResult(t('attendance.subscriptionFrozen'));
      setResultType('frozen');
      return;
    }
    if (effectiveStatus !== 'active') {
      // Renew from the newest term that was not cancelled; the old term is the
      // one the renewal closes and dates itself from.
      setRenewTarget({ sub: (recentSubs || []).find(s => s.status !== 'cancelled') || null, checkInAfter: true });
      setScanResult(t('attendance.subscriptionExpired'));
      setResultType('expired');
      playSound('expired');
      return;
    }

    // Atomic check-in, up to two visits a day (see writeCheckIn). The queue
    // entry is made up front: if the write times out it is queued under the
    // same id, so a write that did land is not recorded twice on replay.
    const queued = makeQueueEntry({
      code: member.membershipNumber || '', memberId: member.id,
      memberName: member.fullName?.[locale] || member.fullName?.ar || '',
    });
    let res;
    try {
      res = await withTimeout(writeCheckIn({
        tenantId, member, activeSub, subscriptionStatus: effectiveStatus, clientId: queued.id, locale,
      }), 2 * SERVER_TIMEOUT_MS);
    } catch (err) {
      if (err.message === 'already_checked_in_twice') {
        setScanResult(t('attendance.alreadyCheckedInTwice'));
        setResultType('warning');
        return;
      }
      if (err.message === 'no_sessions') {
        setRenewTarget({ sub: activeSub, checkInAfter: true });
        setScanResult(t('attendance.noSessionsLeft'));
        setResultType('error');
        return;
      }
      if (isNetworkError(err)) {
        markOnline(false);
        return offlineCheckIn(rosterRef.current.members[member.id], queued);
      }
      console.error('Check-in error:', err);
      setScanResult(isAr ? 'خطأ في تسجيل الحضور' : 'Check-in error');
      setResultType('error');
      return;
    }
    const { visitSlot, subTotalSessions, subRemainingAfter } = res;

    saveVisits(deviceStorage(), tenantId, visitsAfter(loadVisits(deviceStorage(), tenantId), member.id, Date.now()));
    if (res.sessionDeducted && rosterRef.current.members[member.id]?.sub) {
      const entry = rosterRef.current.members[member.id];
      setRoster({
        ...rosterRef.current,
        members: { ...rosterRef.current.members, [member.id]: { ...entry, sub: { ...entry.sub, remainingSessions: subRemainingAfter } } },
      });
    }

    setScanResult(t('attendance.checkInSuccess'));
    setResultType('success');
    playSound('success');
    setTodayCount(prev => prev + 1);

    const warning = computeExpiryWarning({
      totalSessions: subTotalSessions,
      remainingSessions: subRemainingAfter,
      endDateMs: activeSub?.endDate?.toDate ? activeSub.endDate.toDate().getTime() : null,
      settings: warningSettingsRef.current,
    });
    if (warning) {
      setExpiryWarning(warning);
      setExpiryNotified(true);
      setRenewTarget({ sub: activeSub, checkInAfter: false });
      sendExpiryNotification(member.id, activeSub?.id, warning);
    }

    // The history query was issued before this check-in existed — fold today's
    // visit in rather than paying for a second read.
    const nowTs = Timestamp.fromDate(new Date());
    const newAttId = res.attendanceId;
    setMemberHistory(prev => (
      prev.some(a => a.id === newAttId)
        ? prev
        : [{ id: newAttId, memberId: member.id, checkIn: nowTs, visitSlot }, ...prev]
    ));
    setMemberData(prev => (prev ? { ...prev, totalVisits: (prev.totalVisits || 0) + 1, lastVisit: nowTs } : prev));

    // Clear the banner after 4 seconds, but keep the member card up — the desk
    // reads it while the member is still standing there. The next scan (or the
    // card's ✕) replaces it.
    setTimeout(() => {
      setScanResult(null);
      setResultType(null);
    }, 4000);
  };

  // After a desk renewal: a turned-away member is checked in straight away;
  // otherwise just refresh the card so it shows the new term.
  const handleRenewed = ({ endDate, plan }) => {
    const target = renewTarget;
    setShowRenewModal(false);
    setExpiryWarning(null);
    setRenewTarget(null);
    if (!memberData) return;
    const renewed = {
      ...memberData,
      status: 'active',
      endDate: Timestamp.fromDate(endDate),
      planName: plan?.name?.[locale] || plan?.name?.ar || memberData.planName,
      currentPlan: { ...(memberData.currentPlan || {}), type: plan?.type, planId: plan?.planId || plan?.id },
    };
    if (target?.checkInAfter) {
      processCheckIn(renewed);
    } else {
      setMemberData(renewed);
      loadMemberContext(renewed.id);
    }
  };

  // Initialize camera scanner
  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCode.current = new Html5Qrcode('qr-reader');
      setScanning(true);
      
      await html5QrCode.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText);
          html5QrCode.current?.stop().catch(() => {});
          setScanning(false);
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCode.current) {
      html5QrCode.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => { return () => { stopScanner(); }; }, []);

  const resultColors = {
    success: { bg: 'rgba(0,200,83,0.1)', border: 'var(--pt-success)', color: 'var(--pt-success)', icon: '✅' },
    error: { bg: 'rgba(255,23,68,0.1)', border: 'var(--pt-danger)', color: 'var(--pt-danger)', icon: '❌' },
    expired: { bg: 'rgba(255,23,68,0.1)', border: 'var(--pt-danger)', color: 'var(--pt-danger)', icon: '🔴' },
    frozen: { bg: 'rgba(79,195,247,0.1)', border: 'var(--pt-frozen)', color: 'var(--pt-frozen)', icon: '❄️' },
    warning: { bg: 'rgba(255,145,0,0.1)', border: 'var(--pt-warning)', color: 'var(--pt-warning)', icon: '⚠️' },
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📱</span> {t('attendance.scanQR')}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${online ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 'var(--font-size-sm)', padding: '8px 14px' }}
            title={rosterInfo.builtAt
              ? `${isAr ? 'النسخة المحفوظة' : 'Saved copy'}: ${rosterInfo.count} — ${new Date(rosterInfo.builtAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
              : (isAr ? 'لسه مفيش نسخة محفوظة' : 'No saved copy yet')}>
            {online ? '🟢' : '🔴'} {online
              ? (isAr ? 'متصل' : 'Online')
              : (isAr ? `من غير نت — شغال من النسخة المحفوظة (${rosterInfo.count} عضو)` : `Offline — using the saved copy (${rosterInfo.count})`)}
          </span>
          {queueCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={syncQueue} disabled={syncing}>
              ⏳ {queueCount} {isAr ? 'حضور مستني يترفع' : 'waiting to upload'} {syncing ? '…' : (isAr ? '— ارفع دلوقتي' : '— upload now')}
            </button>
          )}
          <span className="badge badge-info" style={{ fontSize: 'var(--font-size-md)', padding: '8px 16px' }}>
            👥 {todayCount} {isAr ? 'زيارة اليوم' : 'visits today'}
          </span>
        </div>
      </div>

      {/* Offline visits that would not have passed at the door — for the desk to chase. */}
      {issues.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', border: '2px solid var(--pt-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--pt-warning)' }}>
              ⚠️ {isAr ? 'حضور اتسجل من غير نت ومحتاج مراجعة' : 'Offline visits that need a look'} ({issues.length})
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => dismissIssue(null)}>
              {isAr ? 'مسح الكل' : 'Clear all'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {issues.map(issue => (
              <div key={issue.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  <strong>{issue.memberName || issue.code || '—'}</strong>
                  {issue.membershipNumber && <code dir="ltr" style={{ marginInlineStart: 8, color: 'var(--pt-gold)', fontSize: 'var(--font-size-xs)' }}>{issue.membershipNumber}</code>}
                  <div style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-xs)' }}>
                    {(ISSUE_TEXT[issue.reason] || ISSUE_TEXT.error)[isAr ? 'ar' : 'en']} • <span dir="ltr">
                      {new Date(issue.at).toLocaleString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => dismissIssue(issue.id)} aria-label={isAr ? 'تم' : 'Done'}>✓</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
        {/* Scanner Area */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>📷 {isAr ? 'الكاميرا' : 'Camera'}</h3>
          
          <div id="qr-reader" ref={scannerRef} style={{
            width: '100%', maxWidth: 400, margin: '0 auto var(--space-4)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            background: 'var(--pt-darker)', minHeight: scanning ? 'auto' : 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!scanning && (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)', opacity: 0.5 }}>📷</div>
                <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
                  {t('attendance.scannerReady')}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            {!scanning ? (
              <button className="btn btn-primary btn-lg" onClick={startScanner}>
                📷 {isAr ? 'تشغيل الكاميرا' : 'Start Camera'}
              </button>
            ) : (
              <button className="btn btn-danger btn-lg" onClick={stopScanner}>
                ⏹️ {isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}
              </button>
            )}
          </div>

          {/* Manual Input */}
          <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-4)' }}>
            <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
              {isAr ? 'أو أدخل رقم العضوية يدوياً' : 'Or enter membership number manually'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: 360, margin: '0 auto' }}>
              <input className="form-input" type="text" dir="ltr" value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="PT-2026-0001"
                onKeyDown={e => { if (e.key === 'Enter') { handleScan(manualInput); setManualInput(''); }}}
              />
              <button className="btn btn-primary" onClick={() => { handleScan(manualInput); setManualInput(''); }}
                disabled={!manualInput}>
                🔍
              </button>
            </div>
          </div>

          {/* Check in by name — for members who know neither their code nor
              their number. */}
          <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-4)' }}>
            <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
              {isAr ? 'أو دوّر بالاسم' : 'Or search by name'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: 360, margin: '0 auto' }}>
              <input className="form-input" type="text" value={nameQuery}
                onChange={e => { setNameQuery(e.target.value); runNameSearch(e.target.value); }}
                placeholder={isAr ? 'أول الاسم — مثال: أحمد' : 'Start of the name'} />
            </div>

            {nameQuery.trim().length >= 2 && (
              <div style={{ maxWidth: 360, margin: 'var(--space-3) auto 0', textAlign: isAr ? 'right' : 'left' }}>
                {nameSearching ? (
                  <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{t('common.loading')}</p>
                ) : nameResults.length === 0 ? (
                  <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
                    {isAr ? 'مفيش نتائج — جرّب أول الاسم بالظبط' : 'No matches — try the exact start of the name'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {nameResults.map(m => (
                      <button key={m.id}
                        onClick={() => { setNameQuery(''); setNameResults([]); processCheckIn(m); }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)',
                          padding: '8px 12px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--glass-border)', cursor: 'pointer', width: '100%',
                          textAlign: isAr ? 'right' : 'left',
                        }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                          {m.fullName?.[locale] || m.fullName?.ar}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <code dir="ltr" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gold)' }}>
                            {m.membershipNumber}
                          </code>
                          <span className={`badge ${m.status === 'active' ? 'badge-success' : m.status === 'frozen' ? 'badge-frozen' : 'badge-danger'}`}
                            style={{ fontSize: 10 }}>
                            ● {t(`common.${m.status}`)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Result Area */}
        <div>
          {/* Scan Result */}
          {resultType && (
            <div className="card" style={{
              marginBottom: 'var(--space-4)',
              border: `2px solid ${resultColors[resultType]?.border}`,
              background: resultColors[resultType]?.bg,
              animation: 'slideUp 0.3s ease-out',
            }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-3)' }}>
                  {resultColors[resultType]?.icon}
                </div>
                <h2 style={{ color: resultColors[resultType]?.color, marginBottom: 'var(--space-2)' }}>
                  {scanResult}
                </h2>
                {memberData && (
                  <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                    {memberData.fullName?.[locale] || memberData.fullName?.ar} • 🎫 {memberData.membershipNumber}
                  </p>
                )}
                {memberData && online && renewTarget?.checkInAfter && (resultType === 'expired' || resultType === 'error') && (
                  <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}
                    onClick={() => setShowRenewModal(true)}>
                    🔄 {isAr ? 'جدد الاشتراك وسجّل الحضور' : 'Renew and check in'}
                  </button>
                )}
                {unknownOffline && resultType === 'warning' && (
                  <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={admitUnknownOffline}>
                    ✅ {isAr ? 'سجّل حضوره مؤقتاً' : 'Let in for now'}
                  </button>
                )}
                {!online && memberData && (resultType === 'expired' || resultType === 'error') && (
                  <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-3)' }}>
                    {isAr ? 'التجديد محتاج نت' : 'Renewing needs a connection'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Subscription ending soon — stays with the member card */}
          {expiryWarning && memberData && (
            <div className="card" style={{
              marginBottom: 'var(--space-4)',
              border: '2px solid var(--pt-warning)',
              background: 'rgba(255,145,0,0.12)',
              textAlign: 'center',
              animation: 'slideUp 0.3s ease-out',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>⏳</div>
              <h3 style={{ color: 'var(--pt-warning)', marginBottom: 'var(--space-1)' }}>
                {expiryWarningText(expiryWarning).desk[isAr ? 'ar' : 'en']}
              </h3>
              {expiryNotified && (
                <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-xs)' }}>
                  {isAr ? '🔔 اتبعتله إشعار في التطبيق' : '🔔 A notification was sent to their app'}
                </p>
              )}
              {online && renewTarget && !renewTarget.checkInAfter && (
                <button className="btn btn-primary" style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => setShowRenewModal(true)}>
                  🔄 {isAr ? 'جدد دلوقتي' : 'Renew now'}
                </button>
              )}
            </div>
          )}

          {showRenewModal && memberData && (
            <RenewSubscriptionModal
              tenantId={tenantId}
              locale={locale}
              member={memberData}
              currentSub={renewTarget?.sub || null}
              onClose={() => setShowRenewModal(false)}
              onRenewed={handleRenewed}
            />
          )}

          {/* Full record for the member just scanned */}
          {memberData && (
            <ScannedMemberPanel
              member={memberData}
              history={memberHistory}
              historyLoading={historyLoading}
              subscription={memberSub}
              locale={locale}
              canSeeCredentials={tenantRole === 'owner' || isSuperAdmin}
              onClose={() => { setMemberData(null); setMemberHistory([]); setMemberSub(null); setExpiryWarning(null); setRenewTarget(null); setUnknownOffline(null); }}
            />
          )}

          {/* Recent Scans */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>
              📋 {t('attendance.todayAttendance')}
            </h3>
            {recentScans.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--pt-gray-500)', padding: 'var(--space-6)' }}>
                {t('common.noData')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {recentScans.map((scan, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-full)',
                        background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'var(--pt-gold)', fontSize: 'var(--font-size-sm)',
                      }}>
                        {(scan.memberName || '?').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{scan.memberName}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                          {scan.gender === 'male' ? '♂' : '♀'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }} dir="ltr">
                        {scan.checkIn?.toDate ? scan.checkIn.toDate().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: scan.offline ? 'var(--pt-warning)' : 'var(--pt-success)' }}>
                        {scan.offline ? `⏳ ${isAr ? 'مستني يترفع' : 'Not uploaded yet'}` : `✓ ${isAr ? 'حاضر' : 'Present'}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
