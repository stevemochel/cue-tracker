import { useMemo, useState } from 'react'
import { parseCsv, periodToDate, money } from '../lib/constants'

const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')

// ─── Add / edit a single royalty entry ───
function RoyaltyModal({ cues, onSave, onClose }) {
  const [form, setForm] = useState({
    source: '',
    sourceType: 'PRO',
    period: '',
    cueId: '',
    category: '',
    plays: '',
    amount: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const ok = await onSave({ ...form, periodSort: periodToDate(form.period) })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-title">Add Royalty Entry</div>
        <form onSubmit={submit}>
          <div className="field-row">
            <div className="field"><label className="label">Source *</label><input value={form.source} onChange={set('source')} placeholder="e.g. ASCAP" required /></div>
            <div className="field">
              <label className="label">Type</label>
              <select value={form.sourceType} onChange={set('sourceType')}>
                <option value="PRO">PRO</option>
                <option value="Publisher">Publisher</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field"><label className="label">Period</label><input value={form.period} onChange={set('period')} placeholder="e.g. 2025 Q4" /></div>
            <div className="field"><label className="label">Category</label><input value={form.category} onChange={set('category')} placeholder="e.g. Performance" /></div>
          </div>
          <div className="field">
            <label className="label">Cue (optional)</label>
            <select value={form.cueId} onChange={set('cueId')}>
              <option value="">— Not linked to a cue —</option>
              {cues.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
            </select>
          </div>
          <div className="field-row">
            <div className="field"><label className="label">Plays</label><input type="number" value={form.plays} onChange={set('plays')} /></div>
            <div className="field"><label className="label">Amount (USD) *</label><input type="number" step="0.00001" value={form.amount} onChange={set('amount')} required /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.source.trim()}>{saving ? 'Saving…' : 'Add entry'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Royalties View ───
export default function RoyaltiesView({ royalties, cues, onImport, onAdd, onDelete }) {
  const [sourceFilter, setSourceFilter] = useState('')
  const [adding, setAdding] = useState(false)

  const cueTitle = useMemo(() => {
    const m = {}
    cues.forEach((c) => (m[c.id] = c.title))
    return m
  }, [cues])

  const cueIdByTitle = useMemo(() => {
    const m = {}
    cues.forEach((c) => (m[norm(c.title)] = c.id))
    return m
  }, [cues])

  const sources = useMemo(() => [...new Set(royalties.map((r) => r.source).filter(Boolean))].sort(), [royalties])

  const filtered = useMemo(() => {
    const list = sourceFilter ? royalties.filter((r) => r.source === sourceFilter) : royalties
    return [...list].sort((a, b) => (b.periodSort || '').localeCompare(a.periodSort || '') || b.amount - a.amount)
  }, [royalties, sourceFilter])

  const total = royalties.reduce((s, r) => s + (r.amount || 0), 0)
  const bySource = useMemo(() => {
    const m = {}
    royalties.forEach((r) => (m[r.source || '—'] = (m[r.source || '—'] || 0) + (r.amount || 0)))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [royalties])
  const linkedCount = royalties.filter((r) => r.cueId).length

  const handleImport = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const rows = parseCsv(ev.target.result)
      if (rows.length < 2) return
      const headers = rows[0].map((h) => h.trim())
      const col = (n) => headers.indexOf(n)
      const entries = []
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        const get = (n) => {
          const j = col(n)
          return j >= 0 ? (r[j] || '').trim() : ''
        }
        const source = get('Source')
        const work = get('Work')
        const amount = get('Amount')
        if (!source && !work && !amount) continue
        const cueName = get('Cue')
        const period = get('Period')
        entries.push({
          source,
          sourceType: get('Type'),
          period,
          periodSort: periodToDate(period),
          workTitle: work,
          cueId: cueName ? cueIdByTitle[norm(cueName)] || null : null,
          category: get('Category'),
          plays: get('Plays'),
          amount,
        })
      }
      if (!entries.length) {
        window.alert('No royalty rows found in that CSV.')
        return
      }
      const n = await onImport(entries)
      if (n != null) window.alert(`Imported ${n} royalty ${n === 1 ? 'entry' : 'entries'}.`)
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="stat-value" style={{ color: 'var(--green)' }}>{money(total)}</div><div className="stat-label">Total Royalties</div></div>
        <div className="stat"><div className="stat-value" style={{ color: 'var(--dark)' }}>{royalties.length}</div><div className="stat-label">Entries</div></div>
        <div className="stat"><div className="stat-value" style={{ color: 'var(--blue)' }}>{linkedCount}</div><div className="stat-label">Linked to Cues</div></div>
        <div className="stat"><div className="stat-value" style={{ color: 'var(--purple)' }}>{sources.length}</div><div className="stat-label">Sources</div></div>
      </div>

      {bySource.length > 0 && (
        <div className="toolbar" style={{ gap: 8 }}>
          {bySource.map(([s, amt]) => (
            <span key={s} className="chip" title={s}>{s}: {money(amt)}</span>
          ))}
        </div>
      )}

      <div className="toolbar">
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          {sources.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => setAdding(true)}>+ Add Entry</button>
        <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0 }}>
          ↑ Import
          <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No royalties yet</div>
          <div className="empty-text">Import a statement (CSV) or add an entry to start tracking earnings.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Period</th>
                <th>Cue / Work</th>
                <th>Category</th>
                <th>Plays</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.source || '—'}</td>
                  <td>{r.period || '—'}</td>
                  <td>
                    {r.cueId && cueTitle[r.cueId] ? (
                      <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{cueTitle[r.cueId]}</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>{r.workTitle || '—'}{r.workTitle ? ' (unlinked)' : ''}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.category || '—'}</td>
                  <td>{r.plays ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(r.amount)}</td>
                  <td><button className="btn btn-danger btn-sm" title="Delete" onClick={() => onDelete(r.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <RoyaltyModal cues={cues} onSave={onAdd} onClose={() => setAdding(false)} />}
    </div>
  )
}
