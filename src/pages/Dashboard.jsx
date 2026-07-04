import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { rowToCue, cueToRow, rowToBatch, batchToRow, rowToRoyalty, royaltyToRow } from '../lib/mappers'
import { PIPELINE_STATUSES, today, parseCsv, newId, SHOWS, PUBLISHERS } from '../lib/constants'
import Logo from '../components/Logo'
import StatsBar from '../components/StatsBar'
import PipelineView from '../components/PipelineView'
import CatalogView from '../components/CatalogView'
import RoyaltiesView from '../components/RoyaltiesView'
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
  const [royalties, setRoyalties] = useState([])
  const [royaltiesEnabled, setRoyaltiesEnabled] = useState(false)
  const [listOptions, setListOptions] = useState([]) // {kind, value}
  const [optionsEnabled, setOptionsEnabled] = useState(false)
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

  // Which optional columns the DB has yet. Missing ones are dropped from writes
  // so nothing errors on an older schema. Ref for fresh reads inside callbacks;
  // `audioEnabled` state drives whether the upload UI is shown.
  const capsRef = useRef({ airings: true, audio: true, collab: true })
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [collabEnabled, setCollabEnabled] = useState(false)

  // Build a DB payload, dropping columns the DB doesn't have yet.
  const toRow = useCallback(
    (cue) => {
      const row = cueToRow(cue, user.id)
      if (!capsRef.current.airings) delete row.airings
      if (!capsRef.current.audio) delete row.audio_path
      if (!capsRef.current.collab) {
        delete row.collaborators
        delete row.split_sheet
      }
      return row
    },
    [user.id]
  )

  // ── Load everything for the signed-in user (RLS scopes it automatically) ──
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      // Detect optional columns (each errors only if it doesn't exist).
      const [airProbe, audProbe, collabProbe] = await Promise.all([
        supabase.from('cues').select('airings').limit(1),
        supabase.from('cues').select('audio_path').limit(1),
        supabase.from('cues').select('collaborators').limit(1),
      ])
      if (active) {
        capsRef.current = { airings: !airProbe.error, audio: !audProbe.error, collab: !collabProbe.error }
        setAudioEnabled(!audProbe.error)
        setCollabEnabled(!collabProbe.error)
      }
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

      // Royalties are optional — the table may not exist on an older schema.
      const royRes = await supabase.from('royalty_entries').select('*')
      if (active && !royRes.error) {
        setRoyalties(royRes.data.map(rowToRoyalty))
        setRoyaltiesEnabled(true)
      }

      // Custom show/publisher options (optional table).
      const optRes = await supabase.from('list_options').select('kind, value')
      if (active && !optRes.error) {
        setListOptions(optRes.data)
        setOptionsEnabled(true)
      }
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
      const { data, error: e } = await supabase.from('cues').insert(toRow(cue)).select().single()
      if (e) return fail('Could not add cue', e)
      setCues((prev) => [...prev, rowToCue(data)])
      return true
    },
    [toRow]
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
      const { data, error: e } = await supabase.from('cues').update(toRow(updated)).eq('id', updated.id).select().single()
      if (e) return fail('Could not save cue', e)
      setCues((prev) => prev.map((c) => (c.id === updated.id ? rowToCue(data) : c)))
      return true
    },
    [toRow]
  )

  // Persist a cue's audio file path (upload/remove happens in AudioControls).
  const saveAudio = useCallback((cue, path) => updateCue({ ...cue, audioPath: path }), [updateCue])

  // ── Royalties ──
  const addRoyalty = useCallback(
    async (entry) => {
      const { data, error: e } = await supabase.from('royalty_entries').insert(royaltyToRow(entry, user.id)).select().single()
      if (e) return fail('Could not add royalty entry', e)
      setRoyalties((prev) => [...prev, rowToRoyalty(data)])
      return true
    },
    [user.id]
  )

  const deleteRoyalty = useCallback(async (id) => {
    if (!window.confirm('Delete this royalty entry?')) return
    const { error: e } = await supabase.from('royalty_entries').delete().eq('id', id)
    if (e) return fail('Could not delete royalty entry', e)
    setRoyalties((prev) => prev.filter((r) => r.id !== id))
    return true
  }, [])

  const importRoyalties = useCallback(
    async (entries) => {
      const { data, error: e } = await supabase.from('royalty_entries').insert(entries.map((r) => royaltyToRow(r, user.id))).select()
      if (e) {
        fail('Royalty import failed', e)
        return null
      }
      setRoyalties((prev) => [...prev, ...data.map(rowToRoyalty)])
      return data.length
    },
    [user.id]
  )

  // ── Custom show / publisher options ──
  const addOption = useCallback(
    async (kind, value) => {
      const v = (value || '').trim()
      if (!v) return false
      // Skip the insert if we already know this value (avoids a dup-key error).
      if (listOptions.some((o) => o.kind === kind && o.value.toLowerCase() === v.toLowerCase())) return true
      const { error: e } = await supabase.from('list_options').insert({ user_id: user.id, kind, value: v })
      if (e && e.code !== '23505') return fail('Could not add option', e) // 23505 = unique violation
      setListOptions((prev) => [...prev, { kind, value: v }])
      return true
    },
    [user.id, listOptions]
  )

  const optionList = (kind, defaults) =>
    [...new Set([
      ...defaults,
      ...listOptions.filter((o) => o.kind === kind).map((o) => o.value),
      ...cues.map((c) => (kind === 'show' ? c.show : c.publisher)).filter(Boolean),
    ])]

  const showOptions = useMemo(() => optionList('show', SHOWS), [listOptions, cues])
  const publisherOptions = useMemo(() => optionList('publisher', PUBLISHERS), [listOptions, cues])

  // Total earned per cue, for the per-cue "earned" figures.
  const earnedByCue = useMemo(() => {
    const m = {}
    royalties.forEach((r) => {
      if (r.cueId) m[r.cueId] = (m[r.cueId] || 0) + (r.amount || 0)
    })
    return m
  }, [royalties])

  // Saving a cue as aired; block a 2nd airing if the column isn't ready yet.
  const saveAired = useCallback(
    async (cue) => {
      if (!capsRef.current.airings && (cue.airings?.length || 0) > 1) {
        window.alert(
          'Storing more than one airing per cue needs the "airings" column added to the database first — this airing was not saved.'
        )
        return false
      }
      return updateCue(cue)
    },
    [updateCue]
  )

  const removeAiring = useCallback(
    async (cue, airingId) => {
      if (!window.confirm('Remove this airing?')) return
      const airings = (cue.airings || []).filter((a) => a.id !== airingId)
      // If that was the only airing, the cue is no longer "aired".
      const updated = { ...cue, airings, status: airings.length ? 'aired' : 'accepted' }
      return updateCue(updated)
    },
    [updateCue]
  )

  // ── CSV export / import ──
  const exportCSV = () => {
    const headers = ['Title', 'Status', 'Show', 'Genre', 'Publisher', 'Exclusivity', 'Placement', 'TuneSat', 'ASCAP', 'On Disco', 'Key', 'BPM', 'Duration', 'Network', 'Air Show', 'Episode', 'First Air Date', 'Collaborators', 'Split Sheet', 'Notes', 'Batch', 'Due Date', 'Pitched To']
    const rows = [headers.join(',')]
    cues.forEach((c) => {
      const pitched = (c.pitchedTo || []).map((p) => `${p.publisher} (${p.date})`).join('; ')
      const batch = batches.find((b) => b.id === c.batchId)
      const row = [c.title, c.status, c.show, c.genre, c.publisher, c.exclusivity, c.placement || '', c.tuneSat ? 'Yes' : 'No', c.ascap ? 'Yes' : 'No', c.onDisco ? 'Yes' : 'No', c.musicalKey, c.bpm, c.duration, c.airNetwork || '', c.airShow || '', c.airEpisode || '', c.firstAirDate || '', c.collaborators || '', c.splitSheet ? 'Yes' : 'No', c.notes, batch ? batch.name : '', c.dueDate, pitched].map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"')
      rows.push(row.join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cue_export_' + today() + '.csv'
    a.click()
  }

  // Downloadable starter template for bulk-adding placed / back-catalog cues.
  const downloadTemplate = () => {
    const headers = ['Title', 'Status', 'Publisher', 'Exclusivity', 'Placement', 'Genre', 'Key', 'BPM', 'Duration', 'TuneSat', 'ASCAP', 'On Disco', 'Network', 'Air Show', 'Episode', 'First Air Date', 'Collaborators', 'Split Sheet', 'Show', 'Due Date', 'Notes']
    const examples = [
      ['Example — Aired placement (edit or delete this row)', 'aired', 'Atomica Music', 'Exclusive', 'Bravo: BDMED S10', 'Drama, Tension', 'A minor', '90', '2:30', 'Yes', 'Yes', 'Yes', 'Bravo', 'Below Deck Mediterranean', 'Bubble Trouble', '2026-01-26', '', 'No', '', '', 'Back-catalog placement'],
      ['Example — Co-write with split sheet (edit or delete this row)', 'accepted', 'Pond5, ThatPitch', 'Non-Exclusive', '', 'Chill, Pop', 'C major', '110', '2:15', 'Yes', 'No', 'Yes', '', '', '', '', 'Trevis T.', 'Yes', '', '', 'Co-written'],
      ['Example — Available to repitch (edit or delete this row)', 'available', '', 'Available', '', 'Ambient', '', '120', '2:00', 'No', 'No', 'No', '', '', '', '', '', 'No', '', '', 'Available'],
    ]
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const csv = [headers, ...examples].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cue_import_template.csv'
    a.click()
  }

  const importCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const rows = parseCsv(ev.target.result)
      if (rows.length < 2) return
      const headers = rows[0].map((h) => h.trim())
      const col = (name) => headers.indexOf(name)
      const hasAirShow = col('Air Show') >= 0
      const yesno = (v) => String(v || '').trim().toLowerCase() === 'yes'

      const newCues = []
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        const get = (name) => {
          const idx = col(name)
          return idx >= 0 ? (r[idx] || '').trim() : ''
        }
        const title = get('Title')
        if (!title) continue // skip blank/trailing rows
        // If the file has no dedicated "Air Show" column, its "Show" column is
        // the broadcast show (as in the raw catalog export), so route it there.
        const network = get('Network')
        const airShow = get('Air Show') || get('Show')
        const episode = get('Episode')
        const airDate = get('First Air Date')
        const airings =
          network || airShow || episode || airDate
            ? [{ id: newId(), network, show: airShow, episode, date: airDate }]
            : []
        newCues.push({
          title,
          show: hasAirShow ? get('Show') : '',
          batchId: null,
          genre: get('Genre'),
          notes: get('Notes'),
          dueDate: get('Due Date'),
          status: get('Status') || 'accepted',
          publisher: get('Publisher'),
          exclusivity: get('Exclusivity') || get('Exclusive/Non-Exclusive'),
          placement: get('Placement') || get('Placements'),
          tuneSat: yesno(get('TuneSat')),
          ascap: yesno(get('ASCAP')),
          onDisco: yesno(get('On Disco?') || get('On Disco')),
          musicalKey: get('Key'),
          bpm: get('BPM'),
          duration: get('Duration'),
          airings,
          airNetwork: network,
          airShow,
          airEpisode: episode,
          firstAirDate: airDate,
          collaborators: get('Collaborators'),
          splitSheet: yesno(get('Split Sheet') || get('Signed Split Sheet')),
          pitchedTo: [],
        })
      }
      if (newCues.length === 0) {
        window.alert('No rows with a Title found in that CSV.')
        return
      }
      const { data, error: err } = await supabase.from('cues').insert(newCues.map(toRow)).select()
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
          <Logo height={42} />
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>🖨</button>
          <button className="btn btn-ghost" onClick={exportCSV}>↓ Export</button>
          <button className="btn btn-ghost" onClick={downloadTemplate} title="Download a blank cue-import template">⤓ Template</button>
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
        {royaltiesEnabled && (
          <button className={`nav-btn ${view === 'royalties' ? 'active' : ''}`} onClick={() => setView('royalties')}>
            Royalties {royalties.length > 0 && <span className="badge" style={{ background: 'var(--green)' }}>{royalties.length}</span>}
          </button>
        )}
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
        <CatalogView cues={cues} onUpdate={updateCue} onEdit={(c) => setEditCue(c)} onAired={(c) => setAiredCue(c)} onAddPitch={(c) => setPitchCue(c)} onRemoveAiring={removeAiring} userId={user.id} audioEnabled={audioEnabled} onSaveAudio={saveAudio} earnedByCue={earnedByCue} royaltiesEnabled={royaltiesEnabled} />
      )}

      {view === 'royalties' && royaltiesEnabled && (
        <RoyaltiesView royalties={royalties} cues={cues} onImport={importRoyalties} onAdd={addRoyalty} onDelete={deleteRoyalty} />
      )}

      {showAddCue && <AddCueModal batches={batches} onAdd={addCue} onAddBatch={addBatch} onClose={() => setShowAddCue(false)} showOptions={showOptions} onAddOption={addOption} optionsEnabled={optionsEnabled} collabEnabled={collabEnabled} />}
      {acceptCue && <AcceptModal cue={acceptCue} onAccept={updateCue} onClose={() => setAcceptCue(null)} publisherOptions={publisherOptions} onAddOption={addOption} optionsEnabled={optionsEnabled} />}
      {rejectCue && <RejectModal cue={rejectCue} onReject={updateCue} onClose={() => setRejectCue(null)} />}
      {pitchCue && <AddPitchModal cue={pitchCue} onSave={updateCue} onClose={() => setPitchCue(null)} publisherOptions={publisherOptions} onAddOption={addOption} optionsEnabled={optionsEnabled} />}
      {editCue && <EditCueModal cue={editCue} batches={batches} onSave={updateCue} onAddBatch={addBatch} onClose={() => setEditCue(null)} userId={user.id} audioEnabled={audioEnabled} onSaveAudio={saveAudio} earned={earnedByCue[editCue.id] || 0} royaltiesEnabled={royaltiesEnabled} showOptions={showOptions} publisherOptions={publisherOptions} onAddOption={addOption} optionsEnabled={optionsEnabled} collabEnabled={collabEnabled} />}
      {airedCue && <AiredModal cue={airedCue} onSave={saveAired} onClose={() => setAiredCue(null)} />}
    </div>
  )
}
