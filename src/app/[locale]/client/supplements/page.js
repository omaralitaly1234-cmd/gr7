'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClientSupplementsPage() {
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [showModal, setShowModal] = useState(false);

  const supplements = [
    { name: locale === 'ar' ? 'واي بروتين' : 'Whey Protein', brand: 'Optimum Nutrition', dose: locale === 'ar' ? '30g سكوب واحد' : '30g one scoop', timing: locale === 'ar' ? 'بعد التمرين مباشرة' : 'Post-workout', frequency: locale === 'ar' ? 'أيام التمرين' : 'Training days', icon: '🥛', stock: 18, totalDoses: 30, color: '#4FC3F7', notes: locale === 'ar' ? 'خلط مع 200ml ماء بارد' : 'Mix with 200ml cold water' },
    { name: locale === 'ar' ? 'كرياتين مونوهيدرات' : 'Creatine Monohydrate', brand: 'MuscleTech', dose: '5g', timing: locale === 'ar' ? 'يومياً — أي وقت' : 'Daily — any time', frequency: locale === 'ar' ? 'يومياً' : 'Daily', icon: '💊', stock: 45, totalDoses: 60, color: 'var(--pt-gold)', notes: locale === 'ar' ? 'مع كوب ماء كبير' : 'With full glass of water' },
    { name: locale === 'ar' ? 'أوميجا 3' : 'Omega 3 Fish Oil', brand: 'NOW Foods', dose: locale === 'ar' ? '2 كبسولة' : '2 capsules', timing: locale === 'ar' ? 'مع الغداء' : 'With lunch', frequency: locale === 'ar' ? 'يومياً' : 'Daily', icon: '🐟', stock: 38, totalDoses: 60, color: '#00C853', notes: locale === 'ar' ? 'مع الأكل لتجنب اضطراب المعدة' : 'Take with food to avoid stomach upset' },
    { name: locale === 'ar' ? 'فيتامين D3' : 'Vitamin D3', brand: 'Nature Made', dose: locale === 'ar' ? '5000 IU كبسولة' : '5000 IU capsule', timing: locale === 'ar' ? 'الصباح مع الفطار' : 'Morning with breakfast', frequency: locale === 'ar' ? 'يومياً' : 'Daily', icon: '☀️', stock: 55, totalDoses: 90, color: '#FFD740', notes: locale === 'ar' ? 'مع أكل يحتوي دهون صحية' : 'Take with fat-containing meal' },
    { name: locale === 'ar' ? 'BCAA' : 'BCAA', brand: 'Xtend', dose: locale === 'ar' ? '10g مع الماء' : '10g with water', timing: locale === 'ar' ? 'أثناء التمرين' : 'During workout', frequency: locale === 'ar' ? 'أيام التمرين' : 'Training days', icon: '💧', stock: 12, totalDoses: 30, color: '#7C4DFF', notes: locale === 'ar' ? 'في شيكر مع 500ml ماء' : 'In shaker with 500ml water' },
    { name: locale === 'ar' ? 'زنك + مغنيسيوم (ZMA)' : 'ZMA (Zinc + Magnesium)', brand: 'Universal', dose: locale === 'ar' ? '3 كبسولات' : '3 capsules', timing: locale === 'ar' ? 'قبل النوم بساعة' : '1 hour before bed', frequency: locale === 'ar' ? 'يومياً' : 'Daily', icon: '🌙', stock: 22, totalDoses: 30, color: '#E040FB', notes: locale === 'ar' ? 'على معدة فارغة — لا تأخذه مع الكالسيوم' : 'Empty stomach — don\'t combine with calcium' },
  ];

  const dailySchedule = [
    { time: '07:00', items: [locale === 'ar' ? '☀️ فيتامين D3' : '☀️ Vitamin D3'] },
    { time: '13:30', items: [locale === 'ar' ? '🐟 أوميجا 3' : '🐟 Omega 3'] },
    { time: locale === 'ar' ? 'أي وقت' : 'Anytime', items: [locale === 'ar' ? '💊 كرياتين 5g' : '💊 Creatine 5g'] },
    { time: locale === 'ar' ? 'أثناء التمرين' : 'During', items: [locale === 'ar' ? '💧 BCAA 10g' : '💧 BCAA 10g'] },
    { time: locale === 'ar' ? 'بعد التمرين' : 'Post-WO', items: [locale === 'ar' ? '🥛 واي بروتين' : '🥛 Whey Protein'] },
    { time: '22:00', items: [locale === 'ar' ? '🌙 ZMA' : '🌙 ZMA'] },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>💊</span> {locale === 'ar' ? 'متتبع المكملات' : 'Supplement Tracker'}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {locale === 'ar' ? 'مكمل جديد' : 'Add Supplement'}</button>
      </div>

      {/* Daily Schedule */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', borderTop: '3px solid var(--pt-gold)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>⏰ {locale === 'ar' ? 'جدول اليوم' : "Today's Schedule"}</h3>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {dailySchedule.map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 120, padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pt-gold)', marginBottom: '4px', fontFamily: 'monospace' }}>{s.time}</div>
              {s.items.map((item, j) => (
                <div key={j} style={{ fontSize: '11px', fontWeight: 600 }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Supplements Grid */}
      <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
        {supplements.map((s, i) => {
          const stockPct = Math.round((s.stock / s.totalDoses) * 100);
          const lowStock = stockPct <= 40;
          return (
            <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{s.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{s.brand}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)', fontSize: '10px' }}>
                    <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>💊 {s.dose}</span>
                    <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>⏰ {s.timing}</span>
                    <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>🔄 {s.frequency}</span>
                  </div>
                  {s.notes && <div style={{ fontSize: '10px', color: 'var(--pt-gray-500)', marginTop: 'var(--space-1)', fontStyle: 'italic' }}>💬 {s.notes}</div>}
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '2px' }}>
                      <span style={{ color: lowStock ? '#FF5252' : 'var(--pt-gray-600)' }}>{lowStock ? (locale === 'ar' ? '⚠️ مخزون منخفض' : '⚠️ Low stock') : (locale === 'ar' ? '📦 المخزون' : '📦 Stock')}</span>
                      <span style={{ fontWeight: 700, color: lowStock ? '#FF5252' : s.color }}>{s.stock}/{s.totalDoses}</span>
                    </div>
                    <div style={{ background: 'var(--pt-darker)', borderRadius: 'var(--radius-full)', height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${stockPct}%`, height: '100%', background: lowStock ? '#FF5252' : s.color, borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>💊 {locale === 'ar' ? 'إضافة مكمل' : 'Add Supplement'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group"><label className="form-label">{locale === 'ar' ? 'الاسم' : 'Name'}</label><input className="form-input" /></div>
                <div className="form-group"><label className="form-label">{locale === 'ar' ? 'الماركة' : 'Brand'}</label><input className="form-input" /></div>
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group"><label className="form-label">{locale === 'ar' ? 'الجرعة' : 'Dosage'}</label><input className="form-input" /></div>
                <div className="form-group"><label className="form-label">{locale === 'ar' ? 'التوقيت' : 'Timing'}</label><input className="form-input" /></div>
              </div>
              <div className="form-group"><label className="form-label">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label><textarea className="form-input" rows={2} style={{ resize: 'none' }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>💊 {locale === 'ar' ? 'إضافة' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
