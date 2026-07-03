import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import BatchForm from '../components/BatchForm'

export default function Batches() {
  const [batches, setBatches] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const loadData = async () => {
    setLoading(true)
    const [batchesRes, cuesRes] = await Promise.all([
      supabase.from('batches').select('*').order('deliver', { ascending: true, nullsFirst: false }),
      supabase.from('cues').select('batch_id'),
    ])
    if (batchesRes.error) setError(batchesRes.error.message)
    else setBatches(batchesRes.data)

    if (!cuesRes.error) {
      const c = {}
      cuesRes.data.forEach((row) => {
        if (row.batch_id != null) c[row.batch_id] = (c[row.batch_id] || 0) + 1
      })
      setCounts(c)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaved = (saved) => {
    setBatches((prev) => {
      const exists = prev.some((b) => b.id === saved.id)
      return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved]
    })
    setEditing(null)
  }

  const handleDelete = async (batch) => {
    const n = counts[batch.id] || 0
    const warning = n
      ? `Delete “${batch.name}”? ${n} cue${n === 1 ? '' : 's'} will be unassigned or affected.`
      : `Delete “${batch.name}”?`
    if (!window.confirm(warning)) return
    const { error: delError } = await supabase.from('batches').delete().eq('id', batch.id)
    if (delError) {
      window.alert('Could not delete: ' + delError.message)
      return
    }
    setBatches((prev) => prev.filter((b) => b.id !== batch.id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${batches.length} batch${batches.length === 1 ? '' : 'es'}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          + New Batch
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && batches.length === 0 ? (
        <div className="empty">
          <p>No batches yet.</p>
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            Add your first batch
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {batches.map((b) => (
            <div key={b.id} className="batch-card">
              <div className="batch-card-head">
                <h3 className="batch-name">{b.name}</h3>
                <span className="chip">{counts[b.id] || 0} cues</span>
              </div>
              <dl className="batch-dates">
                <div>
                  <dt>Sign-up</dt>
                  <dd>{b.sign_up || '—'}</dd>
                </div>
                <div>
                  <dt>Deliver</dt>
                  <dd>{b.deliver || '—'}</dd>
                </div>
              </dl>
              <div className="batch-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(b)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Edit Batch' : 'New Batch'} onClose={() => setEditing(null)}>
          <BatchForm
            batch={editing.id ? editing : null}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}
