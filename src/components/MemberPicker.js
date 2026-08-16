'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getTenantDocuments } from '@/lib/firebase/firestore';

const LIMIT = 15;

/**
 * Type-to-search member selector.
 *
 * Replaces the `<select>` elements that were populated by loading the ENTIRE
 * members collection — fine at 2 members, a multi-megabyte download at 5k.
 * Queries run server-side by prefix on the Arabic name, the phone, and the
 * membership number, and are debounced so typing doesn't hammer Firestore.
 */
export default function MemberPicker({
  tenantId,
  value,               // selected member id
  onChange,            // (memberId, memberDoc|null) => void
  isAr = true,
  placeholder,
  disabled = false,
}) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    if (!tenantId || !debounced) { setResults([]); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Firestore can't OR across fields, so run one prefix query per field
        // and merge. Each is capped at LIMIT rows.
        const queries = [
          [{ field: 'fullName.ar', operator: '>=', value: debounced },
           { field: 'fullName.ar', operator: '<=', value: debounced + '' }],
          [{ field: 'phone', operator: '>=', value: debounced },
           { field: 'phone', operator: '<=', value: debounced + '' }],
          [{ field: 'membershipNumber', operator: '>=', value: debounced },
           { field: 'membershipNumber', operator: '<=', value: debounced + '' }],
        ];
        const res = await Promise.all(
          queries.map(f => getTenantDocuments(tenantId, 'members', f, null, LIMIT))
        );
        if (cancelled) return;
        const seen = new Set();
        const merged = res.flatMap(r => r.data || []).filter(m => {
          if (seen.has(m.id) || m.status === 'archived') return false;
          seen.add(m.id);
          return true;
        });
        setResults(merged.slice(0, LIMIT));
      } catch (err) {
        console.error('Member search failed:', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tenantId, debounced]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const nameOf = (m) => m.fullName?.ar || m.fullName?.en || '—';

  const select = (m) => {
    setSelectedLabel(`${nameOf(m)} — ${m.membershipNumber || ''}`);
    setTerm('');
    setOpen(false);
    onChange?.(m.id, m);
  };

  const clear = () => {
    setSelectedLabel('');
    setTerm('');
    onChange?.('', null);
  };

  const ph = placeholder || (isAr ? 'ابحث بالاسم أو الهاتف أو رقم العضوية' : 'Search by name, phone or membership #');

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      {value && selectedLabel ? (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div className="form-input" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {selectedLabel}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear} disabled={disabled}>
            ✕
          </button>
        </div>
      ) : (
        <input
          className="form-input"
          type="text"
          value={term}
          disabled={disabled}
          placeholder={ph}
          onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      )}

      {open && !value && (term || loading) && (
        <div style={{
          position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, top: '100%',
          marginTop: 4, zIndex: 40, maxHeight: 260, overflowY: 'auto',
          background: 'var(--pt-darker)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        }}>
          {loading ? (
            <div style={{ padding: 'var(--space-4)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
              {isAr ? 'جاري البحث…' : 'Searching…'}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', color: 'var(--pt-gray-500)', fontSize: 'var(--font-size-sm)' }}>
              {isAr ? 'لا توجد نتائج' : 'No results'}
            </div>
          ) : results.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => select(m)}
              style={{
                display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left',
                padding: '10px 12px', background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--glass-border)', cursor: 'pointer',
                color: 'var(--pt-gray-200)', fontSize: 'var(--font-size-sm)',
              }}
            >
              <div style={{ fontWeight: 600 }}>{nameOf(m)}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }} dir="ltr">
                {m.membershipNumber} · {m.phone}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
