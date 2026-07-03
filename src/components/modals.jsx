import { useState } from 'react'
import {
  SHOWS,
  PUBLISHERS,
  EXCLUSIVITY_OPTIONS,
  KEY_OPTIONS,
  formatDate,
  today,
  generatePitchId,
} from '../lib/constants'

// ─── Add Cue Modal ───
export function AddCueModal({ batches, onAdd, onAddBatch, onClose }) {
  const [title, setTitle] = useState('')
  const [show, setShow] = useState(SHOWS[0])
  const [batchId, setBatchId] = useState('')
  const [genre, setGenre] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [creatingBatch, setCreatingBatch] = useState(false)
  const [newBatchName, setNewBatchName] = useState(`Batch ${String(batches.length + 1).padStart(2, '0')}`)
  const [newBatchSignUp, setNewBatchSignUp] = useState('')
  const [newBatchDeliver, setNewBatchDeliver] = useState('')
  const [saving, setSaving] = useState(false)

  const handleBatchChange = (v) => {
    if (v === '__new__') {
      setCreatingBatch(true)
      setBatchId('')
    } else {
      setBatchId(v)
      setCreatingBatch(false)
      const b = batches.find((b) => b.id === v)
      if (b) setDueDate(b.deliver)
    }
  }
  const handleCreateBatch = async () => {
    const b = await onAddBatch({ name: newBatchName, signUp: newBatchSignUp, deliver: newBatchDeliver })
    if (b) {
      setBatchId(b.id)
      setDueDate(newBatchDeliver)
      setCreatingBatch(false)
    }
  }

  const handleAdd = async () => {
    setSaving(true)
    const ok = await onAdd({
      title: title.trim(),
      show,
      batchId: batchId || null,
      genre,
      notes,
      dueDate,
      status: 'need-to-start',
      publisher: '',
      exclusivity: '',
      tuneSat: false,
      ascap: false,
      onDisco: false,
      musicalKey: '',
      bpm: '',
      duration: '',
      pitchedTo: [],
      airNetwork: '',
      airShow: '',
      airEpisode: '',
      firstAirDate: '',
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add New Cue</div>
        <div className="field">
          <label className="label">Cue Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BD_S12_DramaTension_01" autoFocus />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label">Show</label>
            <select value={show} onChange={(e) => setShow(e.target.value)}>
              {SHOWS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Batch (optional)</label>
            <select value={creatingBatch ? '__new__' : batchId} onChange={(e) => handleBatchChange(e.target.value)}>
              <option value="">None</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {formatDate(b.deliver)}</option>
              ))}
              <option value="__new__">+ New Batch...</option>
            </select>
          </div>
        </div>
        {creatingBatch && (
          <div className="batch-creator">
            <div className="batch-creator-title">New Batch</div>
            <div className="field-row">
              <div className="field"><label className="label" style={{ fontSize: 10 }}>Name</label><input value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} /></div>
              <div className="field"><label className="label" style={{ fontSize: 10 }}>Sign-Up</label><input type="date" value={newBatchSignUp} onChange={(e) => setNewBatchSignUp(e.target.value)} /></div>
              <div className="field"><label className="label" style={{ fontSize: 10 }}>Deliver</label><input type="date" value={newBatchDeliver} onChange={(e) => setNewBatchDeliver(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCreatingBatch(false); setBatchId('') }}>Cancel</button>
              <button className="btn btn-outline btn-sm" disabled={!newBatchName || !newBatchSignUp || !newBatchDeliver} style={{ opacity: newBatchName && newBatchSignUp && newBatchDeliver ? 1 : 0.4 }} onClick={handleCreateBatch}>Create</button>
            </div>
          </div>
        )}
        <div className="field-row">
          <div className="field"><label className="label">Due Date *</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="field"><label className="label">Genre / Style</label><input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Drama/Tension" /></div>
        </div>
        <div className="field"><label className="label">Notes</label><textarea style={{ height: 56, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reference notes..." /></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!title.trim() || !dueDate || saving} style={{ opacity: title.trim() && dueDate && !saving ? 1 : 0.4 }} onClick={handleAdd}>
            {saving ? 'Adding…' : 'Add Cue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Ensure a stored value is always selectable, even if it isn't a preset option.
function withValue(options, value) {
  return value && !options.includes(value) ? [value, ...options] : options
}

// ─── Accept into Catalog Modal ───
export function AcceptModal({ cue, onAccept, onClose }) {
  const [publisher, setPublisher] = useState(cue.publisher || PUBLISHERS[0])
  const [exclusivity, setExclusivity] = useState(cue.exclusivity || EXCLUSIVITY_OPTIONS[0])
  const [tuneSat, setTuneSat] = useState(cue.tuneSat || false)
  const [ascap, setAscap] = useState(cue.ascap || false)
  const [onDisco, setOnDisco] = useState(cue.onDisco || false)
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    const ok = await onAccept({ ...cue, status: 'accepted', publisher, exclusivity, tuneSat, ascap, onDisco })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Accept into Catalog</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Moving <strong style={{ color: 'var(--dark)' }}>{cue.title}</strong> into publisher catalog.
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label">Publisher</label>
            <select value={publisher} onChange={(e) => setPublisher(e.target.value)}>
              {withValue(PUBLISHERS, publisher).map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div className="field">
            <label className="label">Exclusivity</label>
            <select value={exclusivity} onChange={(e) => setExclusivity(e.target.value)}>
              {withValue(EXCLUSIVITY_OPTIONS, exclusivity).map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>
        </div>
        <div className="modal-section">Registrations</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['TuneSat', tuneSat, setTuneSat], ['ASCAP', ascap, setAscap], ['On Disco', onDisco, setOnDisco]].map(([label, val, setter]) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <button type="button" className={`check-btn ${val ? 'checked' : ''}`} onClick={() => setter(!val)}>{val ? '✓' : ''}</button>
              {label}
            </label>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-blue" disabled={saving} onClick={handle}>{saving ? 'Saving…' : 'Move to Accepted'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Aired Modal ───
export function AiredModal({ cue, onSave, onClose }) {
  const [airNetwork, setAirNetwork] = useState(cue.airNetwork || '')
  const [airShow, setAirShow] = useState(cue.airShow || '')
  const [airEpisode, setAirEpisode] = useState(cue.airEpisode || '')
  const [firstAirDate, setFirstAirDate] = useState(cue.firstAirDate || today())
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    const ok = await onSave({ ...cue, status: 'aired', airNetwork, airShow, airEpisode, firstAirDate })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Mark as Aired</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--dark)' }}>{cue.title}</strong> — TuneSat detected a broadcast.
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label">Network / Channel</label>
            <input value={airNetwork} onChange={(e) => setAirNetwork(e.target.value)} placeholder="e.g. Bravo, Food Network" autoFocus />
          </div>
          <div className="field">
            <label className="label">First Air Date</label>
            <input type="date" value={firstAirDate} onChange={(e) => setFirstAirDate(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label">Show</label>
            <input value={airShow} onChange={(e) => setAirShow(e.target.value)} placeholder="e.g. Below Deck Mediterranean" />
          </div>
          <div className="field">
            <label className="label">Episode</label>
            <input value={airEpisode} onChange={(e) => setAirEpisode(e.target.value)} placeholder="e.g. Bubble Trouble (S10 E4)" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!airNetwork || saving} style={{ opacity: airNetwork && !saving ? 1 : 0.4 }} onClick={handle}>
            {saving ? 'Saving…' : 'Mark as Aired'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reject → Available Modal ───
export function RejectModal({ cue, onReject, onClose }) {
  const [musicalKey, setMusicalKey] = useState(cue.musicalKey || '')
  const [bpm, setBpm] = useState(cue.bpm || '')
  const [duration, setDuration] = useState(cue.duration || '')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    const ok = await onReject({ ...cue, status: 'available', musicalKey, bpm, duration })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Move to Available</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--dark)' }}>{cue.title}</strong> wasn't placed — add metadata so you can repitch it.
        </div>
        <div className="modal-section">Catalog Metadata</div>
        <div className="field-row">
          <div className="field">
            <label className="label">Key</label>
            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)}>
              <option value="">—</option>
              {KEY_OPTIONS.map((k) => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>
          <div className="field">
            <label className="label">BPM</label>
            <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="128" />
          </div>
          <div className="field">
            <label className="label">Duration</label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2:30" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red-outline" disabled={saving} onClick={handle}>{saving ? 'Saving…' : 'Move to Available'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Pitch Modal ───
export function AddPitchModal({ cue, onSave, onClose }) {
  const [publisher, setPublisher] = useState(PUBLISHERS[0])
  const [date, setDate] = useState(today())
  const [pitchNotes, setPitchNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    const updated = { ...cue, pitchedTo: [...cue.pitchedTo, { id: generatePitchId(), publisher, date, notes: pitchNotes }] }
    const ok = await onSave(updated)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-title">Log Pitch</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Pitching <strong style={{ color: 'var(--dark)' }}>{cue.title}</strong></div>
        <div className="field-row">
          <div className="field"><label className="label">Publisher</label>
            <select value={publisher} onChange={(e) => setPublisher(e.target.value)}>{PUBLISHERS.map((p) => (<option key={p}>{p}</option>))}</select>
          </div>
          <div className="field"><label className="label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="field"><label className="label">Notes</label><input value={pitchNotes} onChange={(e) => setPitchNotes(e.target.value)} placeholder="Brief, context..." /></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handle}>{saving ? 'Saving…' : 'Log Pitch'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Cue Modal ───
export function EditCueModal({ cue, batches, onSave, onAddBatch, onClose }) {
  const [title, setTitle] = useState(cue.title)
  const [show, setShow] = useState(cue.show)
  const [batchId, setBatchId] = useState(cue.batchId || '')
  const [genre, setGenre] = useState(cue.genre || '')
  const [notes, setNotes] = useState(cue.notes || '')
  const [dueDate, setDueDate] = useState(cue.dueDate || '')
  const [publisher, setPublisher] = useState(cue.publisher || '')
  const [exclusivity, setExclusivity] = useState(cue.exclusivity || '')
  const [placement, setPlacement] = useState(cue.placement || '')
  const [tuneSat, setTuneSat] = useState(cue.tuneSat || false)
  const [ascap, setAscap] = useState(cue.ascap || false)
  const [onDisco, setOnDisco] = useState(cue.onDisco || false)
  const [musicalKey, setMusicalKey] = useState(cue.musicalKey || '')
  const [bpm, setBpm] = useState(cue.bpm || '')
  const [duration, setDuration] = useState(cue.duration || '')
  const [airNetwork, setAirNetwork] = useState(cue.airNetwork || '')
  const [airShow, setAirShow] = useState(cue.airShow || '')
  const [airEpisode, setAirEpisode] = useState(cue.airEpisode || '')
  const [firstAirDate, setFirstAirDate] = useState(cue.firstAirDate || '')
  const [creatingBatch, setCreatingBatch] = useState(false)
  const [newBatchName, setNewBatchName] = useState(`Batch ${String(batches.length + 1).padStart(2, '0')}`)
  const [newBatchSignUp, setNewBatchSignUp] = useState('')
  const [newBatchDeliver, setNewBatchDeliver] = useState('')
  const [saving, setSaving] = useState(false)

  const isAccepted = cue.status === 'accepted'
  const isAired = cue.status === 'aired'
  const isAvailable = cue.status === 'available'
  const isCatalog = isAccepted || isAired || isAvailable

  const handleBatchChange = (v) => {
    if (v === '__new__') {
      setCreatingBatch(true)
      setBatchId('')
    } else {
      setBatchId(v)
      setCreatingBatch(false)
    }
  }
  const handleCreateBatch = async () => {
    const b = await onAddBatch({ name: newBatchName, signUp: newBatchSignUp, deliver: newBatchDeliver })
    if (b) {
      setBatchId(b.id)
      setCreatingBatch(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const ok = await onSave({
      ...cue, title: title.trim(), show, batchId: batchId || null, genre, notes, dueDate,
      publisher, exclusivity, placement, tuneSat, ascap, onDisco, musicalKey, bpm, duration,
      airNetwork, airShow, airEpisode, firstAirDate,
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Edit Cue</div>
        <div className="field">
          <label className="label">Cue Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label">Show</label>
            <select value={show} onChange={(e) => setShow(e.target.value)}>
              {SHOWS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="field">
            <label className="label">Batch (optional)</label>
            <select value={creatingBatch ? '__new__' : batchId} onChange={(e) => handleBatchChange(e.target.value)}>
              <option value="">None</option>
              {batches.map((b) => (<option key={b.id} value={b.id}>{b.name} — {formatDate(b.deliver)}</option>))}
              <option value="__new__">+ New Batch...</option>
            </select>
          </div>
        </div>
        {creatingBatch && (
          <div className="batch-creator">
            <div className="batch-creator-title">New Batch</div>
            <div className="field-row">
              <div className="field"><label className="label" style={{ fontSize: 10 }}>Name</label><input value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} /></div>
              <div className="field"><label className="label" style={{ fontSize: 10 }}>Sign-Up</label><input type="date" value={newBatchSignUp} onChange={(e) => setNewBatchSignUp(e.target.value)} /></div>
              <div className="field"><label className="label" style={{ fontSize: 10 }}>Deliver</label><input type="date" value={newBatchDeliver} onChange={(e) => setNewBatchDeliver(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCreatingBatch(false); setBatchId('') }}>Cancel</button>
              <button className="btn btn-outline btn-sm" disabled={!newBatchName || !newBatchSignUp || !newBatchDeliver} style={{ opacity: newBatchName && newBatchSignUp && newBatchDeliver ? 1 : 0.4 }} onClick={handleCreateBatch}>Create</button>
            </div>
          </div>
        )}
        <div className="field-row">
          <div className="field"><label className="label">Due Date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="field"><label className="label">Genre / Style</label><input value={genre} onChange={(e) => setGenre(e.target.value)} /></div>
        </div>
        <div className="field"><label className="label">Notes</label><textarea style={{ height: 56, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

        {isCatalog && (
          <>
            <div className="modal-section">Catalog Details</div>
            <div className="field-row">
              <div className="field">
                <label className="label">Publisher</label>
                <select value={publisher} onChange={(e) => setPublisher(e.target.value)}>
                  <option value="">—</option>
                  {withValue(PUBLISHERS, publisher).map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div className="field">
                <label className="label">Exclusivity</label>
                <select value={exclusivity} onChange={(e) => setExclusivity(e.target.value)}>
                  <option value="">—</option>
                  {withValue(EXCLUSIVITY_OPTIONS, exclusivity).map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label">Placement</label>
              <input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="e.g. Bravo: BDMED 10" />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
              {[['TuneSat', tuneSat, setTuneSat], ['ASCAP', ascap, setAscap], ['On Disco', onDisco, setOnDisco]].map(([label, val, setter]) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <button type="button" className={`check-btn ${val ? 'checked' : ''}`} onClick={() => setter(!val)}>{val ? '✓' : ''}</button>
                  {label}
                </label>
              ))}
            </div>
          </>
        )}

        {isAired && (
          <>
            <div className="modal-section">Air Info</div>
            <div className="field-row">
              <div className="field"><label className="label">Network</label><input value={airNetwork} onChange={(e) => setAirNetwork(e.target.value)} placeholder="e.g. Bravo" /></div>
              <div className="field"><label className="label">First Air Date</label><input type="date" value={firstAirDate} onChange={(e) => setFirstAirDate(e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label className="label">Show</label><input value={airShow} onChange={(e) => setAirShow(e.target.value)} /></div>
              <div className="field"><label className="label">Episode</label><input value={airEpisode} onChange={(e) => setAirEpisode(e.target.value)} /></div>
            </div>
          </>
        )}

        {isCatalog && (
          <>
            <div className="modal-section">Metadata</div>
            <div className="field-row">
              <div className="field">
                <label className="label">Key</label>
                <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)}>
                  <option value="">—</option>
                  {KEY_OPTIONS.map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </div>
              <div className="field"><label className="label">BPM</label><input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="128" /></div>
              <div className="field"><label className="label">Duration</label><input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2:30" /></div>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-blue" disabled={!title.trim() || saving} style={{ opacity: title.trim() && !saving ? 1 : 0.4 }} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
