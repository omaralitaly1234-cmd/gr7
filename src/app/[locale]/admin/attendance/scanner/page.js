'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { Timestamp } from 'firebase/firestore';

export default function AttendanceScannerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [scanResult, setScanResult] = useState(null);
  const [resultType, setResultType] = useState(null); // success, error, expired, frozen
  const [memberData, setMemberData] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  // Load today's attendance count
  useEffect(() => {
    async function loadTodayCount() {
      if (!tenantId) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await getTenantDocuments(tenantId, 'attendance',
        [{ field: 'checkIn', operator: '>=', value: Timestamp.fromDate(today) }]);
      setTodayCount(data?.length || 0);
      setRecentScans(data?.slice(0, 5) || []);
    }
    loadTodayCount();
  }, [tenantId]);

  const handleScan = useCallback(async (qrData) => {
    if (!tenantId || !qrData) return;

    try {
      // Find member by QR code or membership number
      const { data: members } = await getTenantDocuments(tenantId, 'members',
        [{ field: 'membershipNumber', operator: '==', value: qrData.trim() }]);

      if (!members || members.length === 0) {
        // Try by qrCode field
        const { data: membersQR } = await getTenantDocuments(tenantId, 'members',
          [{ field: 'qrCode', operator: '==', value: qrData.trim() }]);
        
        if (!membersQR || membersQR.length === 0) {
          setScanResult(isAr ? 'لا يوجد عضو بهذا الرمز' : 'No member found with this code');
          setResultType('error');
          setMemberData(null);
          return;
        }
        return processCheckIn(membersQR[0]);
      }
      
      return processCheckIn(members[0]);
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult(isAr ? 'خطأ في المسح' : 'Scan error');
      setResultType('error');
    }
  }, [tenantId, isAr]);

  const processCheckIn = async (member) => {
    setMemberData(member);

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

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: existing } = await getTenantDocuments(tenantId, 'attendance', [
      { field: 'memberId', operator: '==', value: member.id },
      { field: 'checkIn', operator: '>=', value: Timestamp.fromDate(today) },
    ]);

    if (existing && existing.length > 0) {
      setScanResult(t('attendance.alreadyCheckedIn'));
      setResultType('warning');
      return;
    }

    // Check session-based subscription
    if (member.currentPlan?.type !== 'diamond') {
      const { data: activeSubs } = await getTenantDocuments(tenantId, 'subscriptions', [
        { field: 'memberId', operator: '==', value: member.id },
        { field: 'status', operator: '==', value: 'active' },
      ]);

      const activeSub = activeSubs?.[0];
      if (activeSub && activeSub.totalSessions !== null) {
        if ((activeSub.remainingSessions || 0) <= 0) {
          setScanResult(t('attendance.noSessionsLeft'));
          setResultType('error');
          return;
        }
        // Deduct session
        await updateTenantDocument(tenantId, 'subscriptions', activeSub.id, {
          usedSessions: (activeSub.usedSessions || 0) + 1,
          remainingSessions: (activeSub.remainingSessions || 1) - 1,
        });
      }
    }

    // Log attendance
    await addTenantDocument(tenantId, 'attendance', {
      memberId: member.id,
      memberName: member.fullName?.[locale] || member.fullName?.ar,
      gender: member.gender,
      checkIn: Timestamp.fromDate(new Date()),
      checkOut: null,
      duration: null,
      method: 'qr_scan',
      subscriptionId: member.currentPlan?.planId || '',
      subscriptionStatus: member.status,
      sessionDeducted: member.currentPlan?.sessions != null,
    });

    // Update member last visit
    await updateTenantDocument(tenantId, 'members', member.id, {
      lastVisit: Timestamp.fromDate(new Date()),
      totalVisits: (member.totalVisits || 0) + 1,
    });

    setScanResult(t('attendance.checkInSuccess'));
    setResultType('success');
    setTodayCount(prev => prev + 1);

    // Auto-reset after 4 seconds
    setTimeout(() => {
      setScanResult(null);
      setResultType(null);
      setMemberData(null);
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
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 'var(--radius-full)',
                      background: 'var(--pt-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', fontWeight: 900, color: 'var(--pt-gold)', margin: '0 auto var(--space-3)',
                      border: `3px solid ${resultColors[resultType]?.border}`,
                    }}>
                      {(memberData.fullName?.[locale] || memberData.fullName?.ar || '?').charAt(0)}
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-1)' }}>
                      {memberData.fullName?.[locale] || memberData.fullName?.ar}
                    </h3>
                    <p style={{ color: 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                      🎫 {memberData.membershipNumber} • {memberData.planName || memberData.currentPlan?.planName}
                    </p>
                    <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                      {memberData.gender === 'male' ? '♂️' : '♀️'} {t(`common.${memberData.gender}`)} •
                      📊 {memberData.totalVisits || 0} {isAr ? 'زيارة' : 'visits'}
                    </p>
                  </div>
                )}
              </div>
            </div>
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
