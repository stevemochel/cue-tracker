import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CUE_STATUSES } from '../lib/constants'
import Modal from '../components/Modal'
import CueForm from '../components/CueForm'

function statusClass(status) {
  return 'badge badge-' + (status || 'none').toLowerCase().replace(/[^a-z]+/g, '-')
}

export default function Cues() {
  const [cues, setCues] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')

  const [editing, setEditing] = useState(null) // cue object, {} for new, or null (closed)

  const loadData = async () => {
    setLoading(true)
    const [cuesRes, batchesRes] = await Promise.all([
      supabase.from('cues').select('*').order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('batches').select('id, name').order('name'),
    ])
    if (cuesRes.error) setError(cuesRes.error.message)
    else setCues(cuesRes.data)
    if (!batchesRes.error) setBatches(batchesRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const batchName = useMemo(() => {
    const map = {}
    batches.forEach((b) => {
      map[b.id] = b.name
    })
    return map
  }, [batches])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cues.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (batchFilter && String(c.batch_id) !== batchFilter) return false
      if (!q) return true
      return [c.title, c.show, c.genre, c.publisher, c.pitched_to]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    })
  }, [cues, search, statusFilter, batchFilter])

  const handleSaved = (saved) => {
    setCues((prev) => {
      const exists = prev.some((c) => c.id === saved.id)
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]
    })
    setEditing(null)
  }

  const handleDelete = async (cue) => {
    if (!window.confirm(`Delete “${cue.title}”? This can't be undone.`)) return
    const { error: delError } = await supabase.from('cues').delete().eq('id', cue.id)
    if (delError) {
      window.alert('Could not delete: ' + delError.message)
      return
    }
    setCues((prev) => prev.filter((c) => c.id !== cue.id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cues</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${filtered.length} of ${cues.length} cue${cues.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          + New Cue
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search title, show, genre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {CUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && filtered.length === 0 ? (
        <div className="empty">
          <p>No cues to show.</p>
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            Add your first cue
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Show</th>
                <th>Genre</th>
                <th>Batch</th>
                <th>Duration</th>
                <th>Due</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setEditing(c)} className="row-clickable">
                  <td className="cell-title">{c.title}</td>
                  <td>
                    <span className={statusClass(c.status)}>{c.status || '—'}</span>
                  </td>
                  <td>{c.show || '—'}</td>
                  <td>{c.genre || '—'}</td>
                  <td>{c.batch_id ? batchName[c.batch_id] || '—' : '—'}</td>
                  <td>{c.duration || '—'}</td>
                  <td>{c.due_date || '—'}</td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <Modal
          title={editing.id ? 'Edit Cue' : 'New Cue'}
          onClose={() => setEditing(null)}
          wide
        >
          <CueForm
            cue={editing.id ? editing : null}
            batches={batches}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}
