import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { rowToCue, cueToRow, rowToBatch, batchToRow } from '../lib/mappers'
import { PIPELINE_STATUSES, today } from '../lib/constants'
import StatsBar from '../components/StatsBar'
import PipelineView from '../components/PipelineView'
import CatalogView from '../components/CatalogView'
import {
  AddCueModal,
  EditCueModal,
  AcceptModal,
  AiredModal,
  RejectModal,
  AddPitchModal,
} from '../components/modals'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  const [cues, setCues] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [view, setView] = useState('pipeline')
  const [groupBy, setGroupBy] = useState('show')
  const [showAddCue, setShowAddCue] = useState(false)
  const [acceptCue, setAcceptCue] = useState(null)
  const [rejectCue, setRejectCue] = useState(null)
  const [pitchCue, setPitchCue] = useState(null)
  const [editCue, setEditCue] = useState(null)
  const [airedCue, setAiredCue] = useState(null)

  // ── Load everything for the signed-in user (RLS scopes it automatically) ──
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [cuesRes, batchesRes] = await Promise.all([
        supabase.from('cues').select('*').order('created_at', { ascending: true }),
        supabase.from('batches').select('*'),
      ])
      if (!active) return
      if (cuesRes.error) {
        // Fall back to an unordered fetch if there's no created_at column.
        const retry = await supabase.from('cues').select('*')
        if (retry.error) setError(retry.error.message)
        else setCues(retry.data.map(rowToCue))
      } else {
        setCues(cuesRes.data.map(rowToCue))
      }
      if (batchesRes.error) setError((e) => e || batchesRes.error.message)
      else setBatches(batchesRes.data.map(rowToBatch))
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const fail = (label, e) => {
    console.error(label, e)
    window.alert(`${label}: ${e.message || e}`)
    return false
  }

  // ── Mutations (return a truthy value on success so modals can close) ──
  const addCue = useCallback(
    async (cue) => {
      const { data, error: e } = await supabase.from('cues').insert(cueToRow(cue, user.id)).select().single()
      if (e) return fail('Could not add cue', e)
      setCues((prev) => [...prev, rowToCue(data)])
      return true
    },
    [user.id]
  )

  const addBatch = useCallback(
    async (batchData) => {
      const { data, error: e } = await supabase.from('batches').insert(batchToRow(batchData, user.id)).select().single()
      if (e) return fail('Could not create batch', e)
      const mapped = rowToBatch(data)
      setBatches((prev) => [...prev, mapped])
      return mapped
    },
    [user.id]
  )

  const moveCue = useCallback(async (id, status) => {
    const { data, error: e } = await supabase.from('cues').update({ status }).eq('id', id).select().single()
    if (e) return fail('Could not move cue', e)
    setCues((prev) => prev.map((c) => (c.id === id ? rowToCue(data) : c)))
    return true
  }, [])

  const deleteCue = useCallback(async (id) => {
    if (!window.confirm('Delete this cue? This cannot be undone.')) return
    const { error: e } = await supabase.from('cues').delete().eq('id', id)
    if (e) return fail('Could not delete cue', e)
    setCues((prev) => prev.filter((c) => c.id !== id))
    return true
  }, [])

  const updateCue = useCallback(
    async (updated) => {
      const { data, error: e } = await supabase.from('cues').update(cueToRow(updated, user.id)).eq('id', updated.id).select().single()
      if (e) return fail('Could not save cue', e)
      setCues((prev) => prev.map((c) => (c.id === updated.id ? rowToCue(data) : c)))
      return true
    },
    [user.id]
  )

  // ── CSV export / import ──
  const exportCSV = () => {
    const headers = ['Title', 'Status', 'Show', 'Genre', 'Publisher', 'Exclusivity', 'TuneSat', 'ASCAP', 'On Disco', 'Key', 'BPM', 'Duration', 'Network', 'Air Show', 'Episode', 'First Air Date', 'Notes', 'Batch', 'Due Date', 'Pitched To']
    const rows = [headers.join(',')]
    cues.forEach((c) => {
      const pitched = (c.pitchedTo || []).map((p) => `${p.publisher} (${p.date})`).join('; ')
      const batch = batches.find((b) => b.id === c.batchId)
      const row = [c.title, c.status, c.show, c.genre, c.publisher, c.exclusivity, c.tuneSat ? 'Yes' : 'No', c.ascap ? 'Yes' : 'No', c.onDisco ? 'Yes' : 'No', c.musicalKey, c.bpm, c.duration, c.airNetwork || '', c.airShow || '', c.airEpisode || '', c.firstAirDate || '', c.notes, batch ? batch.name : '', c.dueDate, pitched].map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"')
      rows.push(row.join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cue_export_' + today() + '.csv'
    a.click()
  }

  const importCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target.result
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim())
      const newCues = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/("([^"]*("")*)*"|[^,]*)/g) || []
        const clean = vals.map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim())
        const get = (name) => {
          const idx = headers.indexOf(name)
          return idx >= 0 ? clean[idx] || '' : ''
        }
        const yesno = (v) => v.toLowerCase() === 'yes'
        const title = get('Title')
        if (!title) continue
        newCues.push({
          title,
          show: get('Show'),
          batchId: null,
          genre: get('Genre'),
          notes: get('Notes'),
          dueDate: get('Due Date'),
          status: get('Status') || 'accepted',
          publisher: get('Publisher'),
          exclusivity: get('Exclusivity') || get('Exclusive/Non-Exclusive'),
          tuneSat: yesno(get('TuneSat')),
          ascap: yesno(get('ASCAP')),
          onDisco: yesno(get('On Disco?') || get('On Disco')),
          musicalKey: get('Key'),
          bpm: get('BPM'),
          duration: get('Duration'),
          airNetwork: get('Network'),
          airShow: get('Air Show'),
          airEpisode: get('Episode'),
          firstAirDate: get('First Air Date'),
          pitchedTo: [],
        })
      }
      if (newCues.length === 0) {
        window.alert('No rows with a Title found in that CSV.')
        return
      }
      const { data, error: err } = await supabase.from('cues').insert(newCues.map((c) => cueToRow(c, user.id))).select()
      if (err) {
        fail('Import failed', err)
        return
      }
      setCues((prev) => [...prev, ...data.map(rowToCue)])
      window.alert('Imported ' + data.length + ' cues!')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const pipelineCount = cues.filter((c) => PIPELINE_STATUSES.includes(c.status)).length
  const catalogCount = cues.filter((c) => ['accepted', 'aired', 'available'].includes(c.status)).length

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <div>
            <div className="brand-title">
              <span style={{ color: 'var(--blue)' }}>CUE</span> <span style={{ color: 'var(--orange)' }}>TRACKER</span>
            </div>
            <div className="brand-sub">Library Music Pipeline</div>
          </div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>🖨</button>
          <button className="btn btn-ghost" onClick={exportCSV}>↓ Export</button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0 }}>
            ↑ Import
            <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-primary" onClick={() => setShowAddCue(true)}>+ Add Cue</button>
          <div className="account-menu">
            <span className="account-email" title={user?.email}>{user?.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <StatsBar cues={cues} />

      <div className="nav no-print">
        <button className={`nav-btn ${view === 'pipeline' ? 'active' : ''}`} onClick={() => setView('pipeline')}>
          Pipeline {pipelineCount > 0 && <span className="badge">{pipelineCount}</span>}
        </button>
        <button className={`nav-btn ${view === 'catalog' ? 'active' : ''}`} onClick={() => setView('catalog')}>
          Catalog {catalogCount > 0 && <span className="badge" style={{ background: 'var(--blue)' }}>{catalogCount}</span>}
        </button>
      </div>

      {view === 'pipeline' && (
        <>
          <div className="toolbar no-print">
            <div className="pill-group">
              {[['show', 'By Show'], ['batch', 'By Batch']].map(([g, label]) => (
                <button key={g} className={`pill ${groupBy === g ? 'active' : ''}`} onClick={() => setGroupBy(g)}>{label}</button>
              ))}
            </div>
          </div>
          <PipelineView
            cues={cues}
            batches={batches}
            onMove={moveCue}
            onDelete={deleteCue}
            onEdit={(c) => setEditCue(c)}
            onAccept={(c) => setAcceptCue(c)}
            onReject={(c) => setRejectCue(c)}
            groupBy={groupBy}
          />
        </>
      )}

      {view === 'catalog' && (
        <CatalogView cues={cues} onUpdate={updateCue} onEdit={(c) => setEditCue(c)} onAired={(c) => setAiredCue(c)} onAddPitch={(c) => setPitchCue(c)} />
      )}

      {showAddCue && <AddCueModal batches={batches} onAdd={addCue} onAddBatch={addBatch} onClose={() => setShowAddCue(false)} />}
      {acceptCue && <AcceptModal cue={acceptCue} onAccept={updateCue} onClose={() => setAcceptCue(null)} />}
      {rejectCue && <RejectModal cue={rejectCue} onReject={updateCue} onClose={() => setRejectCue(null)} />}
      {pitchCue && <AddPitchModal cue={pitchCue} onSave={updateCue} onClose={() => setPitchCue(null)} />}
      {editCue && <EditCueModal cue={editCue} batches={batches} onSave={updateCue} onAddBatch={addBatch} onClose={() => setEditCue(null)} />}
      {airedCue && <AiredModal cue={airedCue} onSave={updateCue} onClose={() => setAiredCue(null)} />}
    </div>
  )
}
