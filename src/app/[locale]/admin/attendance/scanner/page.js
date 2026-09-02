'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, getTenantCollectionCount } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import ScannedMemberPanel from '@/components/ScannedMemberPanel';
import { findMemberByCode } from '@/lib/firebase/member-codes';
import { Timestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  // Today's tally + the five most recent scans. The count is a server-side
  // aggregation and the list is capped at five: this used to download every
  // check-in of the day just to call .length and slice(0, 5) off it, on a page
  // the front desk leaves open from open to close.
  useEffect(() => {
    async function loadTodayCount() {
      if (!tenantId) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filter = [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(today) }];
      const [countRes, recentRes] = await Promise.all([
        getTenantCollectionCount(tenantId, 'attendance', filter),
        getTenantDocuments(tenantId, 'attendance', filter, { field: 'checkIn', direction: 'desc' }, 5),
      ]);
      setTodayCount(countRes.count || 0);
      setRecentScans(recentRes.data || []);
    }
    loadTodayCount();
  }, [tenantId]);

  const handleScan = useCallback(async (qrData) => {
    if (!tenantId || !qrData) return;

    try {
      // Matches membershipNumber and qrCode, raw and normalised, so a code
      // typed in a different case still opens the door.
      const member = await findMemberByCode(tenantId, qrData);
      if (!member) {
        setScanResult(isAr ? 'لا يوجد عضو بهذا الرمز' : 'No member found with this code');
        setResultType('error');
        setMemberData(null);
        setMemberHistory([]);
        setMemberSub(null);
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
  // nor their phone number. Prefix search on the Arabic name — Firestore has no
  // substring search, so this matches from the start of the name.
  const runNameSearch = useCallback(async (raw) => {
    const term = raw.trim();
    if (!tenantId || term.length < 2) { setNameResults([]); return; }
    setNameSearching(true);
    try {
      const { data, error } = await getTenantDocuments(tenantId, 'members', [
        { field: 'fullName.ar', operator: '>=', value: term },
        { field: 'fullName.ar', operator: '<=', value: term + '' },
      ], null, 8);
      if (error) console.error('[Scanner] name search:', error);
      setNameResults((data || []).filter(m => m.status !== 'archived'));
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

  const processCheckIn = async (member) => {
    setMemberData(member);
    loadMemberContext(member.id);

    // Check subscription status
    if (member.status === 'expired') {
      setScanResult(t('attendance.subscriptionExpired'));
      setResultType('expired');
      return;
    }

    if (member.status === 'frozen') {
      setScanResult(t('attendance.subscriptionFrozen'));
      setResultType('frozen');
      return;
    }

    // Pre-resolve the active subscription (query outside the transaction — the
    // transaction re-reads it by id for a consistent decrement).
    let activeSubId = null;
    if (member.currentPlan?.type !== 'diamond') {
      const { data: activeSubs } = await getTenantDocuments(tenantId, 'subscriptions', [
        { field: 'memberId', operator: '==', value: member.id },
        { field: 'status', operator: '==', value: 'active' },
      ]);
      activeSubId = activeSubs?.[0]?.id || null;
    }

    // Atomic check-in with up to TWO slots per day (morning + evening). Slot 1
    // uses the legacy id `{memberId}_{dateStr}` so older records keep working;
    // slot 2 uses `{memberId}_{dateStr}_2`. Reading both by id keeps this in a
    // transaction — a rapid double-scan still can't create three rows or
    // double-deduct a session on the same slot.
    const dateStr = new Date().toISOString().split('T')[0];
    const slot1Ref = doc(db, `tenants/${tenantId}/attendance/${member.id}_${dateStr}`);
    const slot2Ref = doc(db, `tenants/${tenantId}/attendance/${member.id}_${dateStr}_2`);
    const memberRef = doc(db, `tenants/${tenantId}/members/${member.id}`);
    const subRef = activeSubId ? doc(db, `tenants/${tenantId}/subscriptions/${activeSubId}`) : null;

    let attendanceRef = slot1Ref;
    let visitSlot = 1;

    try {
      await runTransaction(db, async (tx) => {
        const [slot1Snap, slot2Snap] = await Promise.all([tx.get(slot1Ref), tx.get(slot2Ref)]);
        if (slot1Snap.exists() && slot2Snap.exists()) throw new Error('already_checked_in_twice');
        if (slot1Snap.exists()) { attendanceRef = slot2Ref; visitSlot = 2; }

        let sessionDeducted = false;
        if (subRef) {
          const subSnap = await tx.get(subRef);
          const sub = subSnap.exists() ? subSnap.data() : null;
          if (sub && sub.totalSessions !== null) {
            if ((sub.remainingSessions || 0) <= 0) throw new Error('no_sessions');
            tx.update(subRef, {
              usedSessions: (sub.usedSessions || 0) + 1,
              remainingSessions: (sub.remainingSessions || 1) - 1,
            });
            sessionDeducted = true;
          }
        }

        tx.set(attendanceRef, {
          memberId: member.id,
          memberName: member.fullName?.[locale] || member.fullName?.ar,
          gender: member.gender,
          checkIn: Timestamp.fromDate(new Date()),
          method: 'qr_scan',
          subscriptionId: activeSubId || member.currentPlan?.planId || '',
          subscriptionStatus: member.status,
          sessionDeducted,
          visitSlot,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
        tx.update(memberRef, {
          lastVisit: Timestamp.fromDate(new Date()),
          totalVisits: (member.totalVisits || 0) + 1,
        });
      });
    } catch (err) {
      if (err.message === 'already_checked_in_twice') {
        setScanResult(t('attendance.alreadyCheckedInTwice'));
        setResultType('warning');
        return;
      }
      if (err.message === 'no_sessions') {
        setScanResult(t('attendance.noSessionsLeft'));
        setResultType('error');
        return;
      }
      console.error('Check-in error:', err);
      setScanResult(isAr ? 'خطأ في تسجيل الحضور' : 'Check-in error');
      setResultType('error');
      return;
    }

    setScanResult(t('attendance.checkInSuccess'));
    setResultType('success');
    setTodayCount(prev => prev + 1);

    // The history query was issued before this check-in existed — fold today's
    // visit in rather than paying for a second read.
    const nowTs = Timestamp.fromDate(new Date());
    const newAttId = visitSlot === 2 ? `${member.id}_${dateStr}_2` : `${member.id}_${dateStr}`;
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
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <span className="badge badge-info" style={{ fontSize: 'var(--font-size-md)', padding: '8px 16px' }}>
            👥 {todayCount} {isAr ? 'زيارة اليوم' : 'visits today'}
          </span>
        </div>
      </div>

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
              </div>
            </div>
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
              onClose={() => { setMemberData(null); setMemberHistory([]); setMemberSub(null); }}
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
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-success)' }}>✓ {isAr ? 'حاضر' : 'Present'}</div>
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
