'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemberData } from '@/lib/hooks/useMemberData';

export default function ClientratetrainerPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { memberData, loading } = useMemberData();

  if (loading) return (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div><p style={{ color: 'var(--pt-gray-500)' }}>{t('common.loading')}</p></div></div>);

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1><span>⭐</span> {isAr ? 'تقييم المدرب' : 'Rate Trainer'}</h1></div>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⭐</div>
        <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--pt-gray-300)' }}>{isAr ? 'لا يوجد مدرب مخصص لتقييمه' : 'No trainer assigned to rate'}</h3>
        <p style={{ color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>{isAr ? 'سيتم تخصيص مدرب لك' : 'A trainer will be assigned to you'}</p>
      </div>
    </div>
  );
}
