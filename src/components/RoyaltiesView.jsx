import { useMemo, useState } from 'react'
import { parseCsv, periodToDate, money } from '../lib/constants'

const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')

// ASCAP work titles that differ from the cue title beyond a substring match.
const TITLE_ALIASES = { 'high school crush': 'Cruise Control (HS Crush - ASCAP)' }

const parseAmount = (s) => Number(String(s || '').replace(/[\s,$]/g, '')) || 0

// "MM-DD-YYYY" or "YYYY-MM-DD" -> "YYYY Qn"
function dateToPeriod(dstr) {
  let y, mo
  let m = /(\d{4})[-/](\d{1,2})[-/]\d{1,2}/.exec(dstr || '')
  if (m) {
    y = +m[1]
    mo = +m[2]
  } else if ((m = /(\d{1,2})[-/]\d{1,2}[-/](\d{4})/.exec(dstr || ''))) {
    mo = +m[1]
    y = +m[2]
  }
  if (!y) return ''
  return `${y} Q${Math.floor((mo - 1) / 3) + 1}`
}

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

  // Match an ASCAP work title to a cue (aliases + exact + substring either way).
  const matchCueId = (work) => {
    const w = norm(work)
    if (!w) return null
    if (TITLE_ALIASES[w]) return cueIdByTitle[norm(TITLE_ALIASES[w])] || null
    if (cueIdByTitle[w]) return cueIdByTitle[w]
    for (const c of cues) {
      const nc = norm(c.title)
      if (nc && (w.includes(nc) || nc.includes(w))) return c.id
    }
    return null
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const rows = parseCsv(ev.target.result)
      if (rows.length < 2) {
        window.alert('That CSV looks empty.')
        return
      }
      const headers = rows[0].map((h) => h.trim())
      const has = (n) => headers.includes(n)
      const col = (n) => headers.indexOf(n)
      const body = rows.slice(1)
      const cell = (r, n) => {
        const j = col(n)
        return j >= 0 ? (r[j] || '').trim() : ''
      }

      let entries = []

      if (has('Source') && has('Amount')) {
        // The app's own royalty-import format (one row per entry).
        entries = body
          .filter((r) => cell(r, 'Source') || cell(r, 'Work') || cell(r, 'Amount'))
          .map((r) => {
            const cueName = cell(r, 'Cue')
            const period = cell(r, 'Period')
            return {
              source: cell(r, 'Source'),
              sourceType: cell(r, 'Type'),
              period,
              periodSort: periodToDate(period),
              workTitle: cell(r, 'Work'),
              cueId: cueName ? cueIdByTitle[norm(cueName)] || null : matchCueId(cell(r, 'Work')),
              category: cell(r, 'Category'),
              plays: cell(r, 'Plays'),
              amount: cell(r, 'Amount'),
            }
          })
      } else if (has('Work Title') && has('Dollars')) {
        // Raw ASCAP domestic detail: aggregate per work per distribution quarter.
        const agg = {}
        for (const r of body) {
          const work = cell(r, 'Work Title')
          if (!work) continue
          const period = `${cell(r, 'DistributionYear')} Q${cell(r, 'Distribution Quarter')}`.trim()
          const key = work + '|' + period
          agg[key] = agg[key] || { work, period, amount: 0, plays: 0 }
          agg[key].amount += parseAmount(cell(r, 'Dollars'))
          agg[key].plays += parseInt(cell(r, 'Number of Plays') || '0', 10) || 0
        }
        entries = Object.values(agg).map((a) => ({
          source: 'ASCAP',
          sourceType: 'PRO',
          period: a.period,
          periodSort: periodToDate(a.period),
          workTitle: a.work,
          cueId: matchCueId(a.work),
          category: 'Performance',
          plays: a.plays,
          amount: a.amount.toFixed(5),
        }))
      } else if (has('Work Title') && has('$ Amount')) {
        // Raw ASCAP international: aggregate per work / period / revenue class.
        const agg = {}
        for (const r of body) {
          const work = cell(r, 'Work Title')
          if (!work) continue
          const cat = cell(r, 'Revenue Class Description') || 'Performance'
          const period = dateToPeriod(cell(r, 'Performance Start Date') || cell(r, 'Distribution Date'))
          const key = work + '|' + period + '|' + cat
          agg[key] = agg[key] || { work, period, cat, amount: 0 }
          agg[key].amount += parseAmount(cell(r, '$ Amount'))
        }
        entries = Object.values(agg).map((a) => ({
          source: 'ASCAP',
          sourceType: 'PRO',
          period: a.period,
          periodSort: periodToDate(a.period),
          workTitle: a.work,
          cueId: matchCueId(a.work),
          category: a.cat,
          plays: '',
          amount: a.amount.toFixed(5),
        }))
      } else if (has('Track') && has('Net earnings (USD)')) {
        // Raw LANDR distributor report: aggregate per track per payment month.
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const agg = {}
        for (const r of body) {
          const track = cell(r, 'Track')
          if (!track) continue
          const ym = /(\d{4})-(\d{2})/.exec(cell(r, 'Payment Date'))
          const period = ym ? `${MONTHS[+ym[2] - 1]} ${ym[1]}` : ''
          const periodSort = ym ? `${ym[1]}-${ym[2]}-01` : null
          const key = track + '|' + period
          agg[key] = agg[key] || { track, period, periodSort, amount: 0, plays: 0 }
          agg[key].amount += parseAmount(cell(r, 'Net earnings (USD)'))
          agg[key].plays += parseInt(cell(r, 'Quantity of sales or streams') || '0', 10) || 0
        }
        entries = Object.values(agg).map((a) => ({
          source: 'LANDR',
          sourceType: 'Distributor',
          period: a.period,
          periodSort: a.periodSort,
          workTitle: a.track,
          cueId: matchCueId(a.track),
          category: 'Streaming/Sales',
          plays: a.plays,
          amount: a.amount.toFixed(5),
        }))
      } else if (has('song_name') && has('amount')) {
        // Raw Songtrust statement: aggregate per song / period / royalty group.
        const agg = {}
        for (const r of body) {
          const song = cell(r, 'song_name')
          if (!song) continue
          const period = cell(r, 'period')
          const group = /^mechanical/i.test(cell(r, 'royalty_type')) ? 'Mechanical' : 'Performance'
          const key = song + '|' + period + '|' + group
          agg[key] = agg[key] || { song, period, group, amount: 0, plays: 0 }
          agg[key].amount += parseAmount(cell(r, 'amount'))
          agg[key].plays += parseInt(cell(r, 'units') || '0', 10) || 0
        }
        entries = Object.values(agg).map((a) => ({
          source: 'Songtrust',
          sourceType: 'Publishing',
          period: a.period,
          periodSort: periodToDate(a.period),
          workTitle: a.song,
          cueId: matchCueId(a.song),
          category: a.group,
          plays: a.plays,
          amount: a.amount.toFixed(5),
        }))
      } else {
        window.alert(
          'Unrecognized CSV. Upload an ASCAP, LANDR, or Songtrust statement export, or the app’s royalty-import format.'
        )
        return
      }

      entries = entries.filter((en) => parseAmount(en.amount) !== 0)
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
