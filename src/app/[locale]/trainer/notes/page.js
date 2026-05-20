'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getTenantDocuments, addTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTrainerClients } from '@/lib/hooks/useTrainerClients';
import toast from 'react-hot-toast';

export default function TrainerSessionNotesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useTrainerClients();
  const [selectedClient, setSelectedClient] = useState(0);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteForm, setNoteForm] = useState({ muscle: '', duration: '', energy: '', mood: '💪', trainerNote: '' });

  const client = clients[selectedClient];

  useEffect(() => {
    async function load() {
      if (!tenantId || !client) return;
      setLoading(true);
      try {
        const { data } = await getTenantDocuments(tenantId, 'session-notes',
          [{ field: 'memberId', operator: '==', value: client.id }],
          { field: 'createdAt', direction: 'desc' }, 20);
        setNotes(data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [tenantId, client]);

  const handleSaveNote = async () => {
    if (!tenantId || !client || !noteForm.trainerNote) return;
    setSaving(true);
    try {
      await addTenantDocument(tenantId, 'session-notes', {
        memberId: client.id,
        memberName: client.fullName,
        trainerId: user?.uid,
        type: 'session',
        muscle: noteForm.muscle,
        duration: Number(noteForm.duration) || 0,
        energy: Number(noteForm.energy) || 0,
        mood: noteForm.mood,
        trainerNote: noteForm.trainerNote,
      });
      toast.success(isAr ? 'تم حفظ الملاحظة ✅' : 'Note saved ✅');
      setShowNoteModal(false);
      setNoteForm({ muscle: '', duration: '', energy: '', mood: '💪', trainerNote: '' });
      // Reload
      const { data } = await getTenantDocuments(tenantId, 'session-notes',
        [{ field: 'memberId', operator: '==', value: client.id }],
        { field: 'createdAt', direction: 'desc' }, 20);
      setNotes(data || []);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Error');
    }
    setSaving(false);
  };

  if (clientsLoading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📝</span> {isAr ? 'ملاحظات الحصص' : 'Session Notes'}</h1>
        {clients.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}>+ {isAr ? 'ملاحظة جديدة' : 'New Note'}</button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📝</div>
          <h3>{isAr ? 'لا يوجد عملاء مخصصين لك بعد' : 'No clients assigned yet'}</h3>
        </div>
      ) : (
        <>
          {/* Client Selector */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {clients.map((c, i) => {
              const name = c.fullName?.[locale] || c.fullName?.ar || '';
              return (
                <button key={c.id} onClick={() => setSelectedClient(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                    background: selectedClient === i ? 'rgba(245,197,24,0.1)' : 'var(--pt-darker)',
                    border: selectedClient === i ? '2px solid var(--pt-gold)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.12)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>{name.charAt(0)}</div>
                  <div style={{ fontWeight: 700 }}>{name}</div>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div></div>
          ) : notes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📝</div>
              <h3>{isAr ? 'لا توجد ملاحظات بعد' : 'No notes yet'}</h3>
              <p style={{ color: 'var(--pt-gray-500)' }}>{isAr ? 'أضف أول ملاحظة حصة لهذا العميل' : 'Add your first session note for this client'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {notes.map((note, i) => (
                <div key={note.id || i} className="card" style={{ borderInlineStart: '4px solid var(--pt-gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏋️</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{note.muscle || (isAr ? 'حصة تدريب' : 'Training Session')}</div>
                        <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>📅 {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px' }}>
                      {note.duration > 0 && <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>⏱️ {note.duration}{isAr ? 'د' : 'm'}</span>}
                      {note.energy > 0 && <span style={{ padding: '2px 6px', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)' }}>⚡ {note.energy}/10</span>}
                      {note.mood && <span style={{ fontSize: '1rem' }}>{note.mood}</span>}
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', background: 'rgba(245,197,24,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,197,24,0.1)', fontSize: 'var(--font-size-xs)', lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--pt-gold)' }}>💬 {isAr ? 'ملاحظة المدرب:' : 'Trainer Note:'} </span>
                    {note.trainerNote}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>📝 {isAr ? 'ملاحظة حصة جديدة' : 'New Session Note'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">{isAr ? 'العميل' : 'Client'}</label>
                <select className="form-select" value={selectedClient} onChange={e => setSelectedClient(Number(e.target.value))}>
                  {clients.map((c, i) => <option key={c.id} value={i}>{c.fullName?.[locale] || c.fullName?.ar}</option>)}
                </select>
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'العضلات' : 'Muscles'}</label>
                  <input className="form-input" value={noteForm.muscle} onChange={e => setNoteForm(f => ({ ...f, muscle: e.target.value }))} placeholder={isAr ? 'صدر + ترايسبس' : 'Chest + Triceps'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                  <input className="form-input" type="number" dir="ltr" value={noteForm.duration} onChange={e => setNoteForm(f => ({ ...f, duration: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'ملاحظات المدرب' : 'Trainer Notes'} *</label>
                <textarea className="form-input" rows={3} value={noteForm.trainerNote} onChange={e => setNoteForm(f => ({ ...f, trainerNote: e.target.value }))} style={{ resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveNote} disabled={saving || !noteForm.trainerNote}>
                {saving ? '⏳' : '📝'} {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
