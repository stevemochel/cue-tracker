import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CUE_STATUSES, EXCLUSIVITY_OPTIONS, MUSICAL_KEYS } from '../lib/constants'

// Build a clean form state from an existing cue (or blanks for a new one).
function toFormState(cue) {
  return {
    title: cue?.title ?? '',
    status: cue?.status ?? CUE_STATUSES[0],
    show: cue?.show ?? '',
    genre: cue?.genre ?? '',
    publisher: cue?.publisher ?? '',
    exclusivity: cue?.exclusivity ?? '',
    tunesat: cue?.tunesat ?? false,
    ascap: cue?.ascap ?? false,
    on_disco: cue?.on_disco ?? false,
    air_network: cue?.air_network ?? '',
    air_show: cue?.air_show ?? '',
    air_episode: cue?.air_episode ?? '',
    first_air_date: cue?.first_air_date ?? '',
    musical_key: cue?.musical_key ?? '',
    bpm: cue?.bpm ?? '',
    duration: cue?.duration ?? '',
    pitched_to: cue?.pitched_to ?? '',
    notes: cue?.notes ?? '',
    due_date: cue?.due_date ?? '',
    batch_id: cue?.batch_id ?? '',
  }
}

// Turn form strings into a DB-ready payload (empty strings -> null, numbers parsed).
function toPayload(form, userId) {
  const nullable = (v) => (v === '' || v === undefined ? null : v)
  return {
    title: form.title.trim(),
    status: nullable(form.status),
    show: nullable(form.show),
    genre: nullable(form.genre),
    publisher: nullable(form.publisher),
    exclusivity: nullable(form.exclusivity),
    tunesat: !!form.tunesat,
    ascap: !!form.ascap,
    on_disco: !!form.on_disco,
    air_network: nullable(form.air_network),
    air_show: nullable(form.air_show),
    air_episode: nullable(form.air_episode),
    first_air_date: nullable(form.first_air_date),
    musical_key: nullable(form.musical_key),
    bpm: form.bpm === '' ? null : Number(form.bpm),
    duration: nullable(form.duration),
    pitched_to: nullable(form.pitched_to),
    notes: nullable(form.notes),
    due_date: nullable(form.due_date),
    batch_id: form.batch_id === '' ? null : form.batch_id,
    user_id: userId,
  }
}

export default function CueForm({ cue, batches, onSaved, onCancel }) {
  const { user } = useAuth()
  const [form, setForm] = useState(() => toFormState(cue))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (name) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    setError(null)
    setSaving(true)

    const payload = toPayload(form, user.id)

    let result
    if (cue?.id) {
      result = await supabase.from('cues').update(payload).eq('id', cue.id).select().single()
    } else {
      result = await supabase.from('cues').insert(payload).select().single()
    }

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved(result.data)
  }

  return (
    <form className="cue-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field span-2">
          <span className="field-label">Title *</span>
          <input value={form.title} onChange={set('title')} required autoFocus />
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <select value={form.status} onChange={set('status')}>
            {CUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Batch</span>
          <select value={form.batch_id ?? ''} onChange={set('batch_id')}>
            <option value="">— None —</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Show</span>
          <input value={form.show} onChange={set('show')} />
        </label>

        <label className="field">
          <span className="field-label">Genre</span>
          <input value={form.genre} onChange={set('genre')} />
        </label>

        <label className="field">
          <span className="field-label">Publisher</span>
          <input value={form.publisher} onChange={set('publisher')} />
        </label>

        <label className="field">
          <span className="field-label">Exclusivity</span>
          <select value={form.exclusivity} onChange={set('exclusivity')}>
            <option value="">—</option>
            {EXCLUSIVITY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Musical Key</span>
          <input
            list="musical-keys"
            value={form.musical_key}
            onChange={set('musical_key')}
            placeholder="e.g. A minor"
          />
          <datalist id="musical-keys">
            {MUSICAL_KEYS.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span className="field-label">BPM</span>
          <input type="number" min="0" value={form.bpm} onChange={set('bpm')} />
        </label>

        <label className="field">
          <span className="field-label">Duration</span>
          <input value={form.duration} onChange={set('duration')} placeholder="e.g. 2:34" />
        </label>

        <label className="field">
          <span className="field-label">Pitched To</span>
          <input value={form.pitched_to} onChange={set('pitched_to')} />
        </label>

        <label className="field">
          <span className="field-label">Due Date</span>
          <input type="date" value={form.due_date} onChange={set('due_date')} />
        </label>

        <fieldset className="field span-full checkbox-row">
          <span className="field-label">Registration</span>
          <div className="checks">
            <label className="check">
              <input type="checkbox" checked={form.tunesat} onChange={set('tunesat')} /> TuneSat
            </label>
            <label className="check">
              <input type="checkbox" checked={form.ascap} onChange={set('ascap')} /> ASCAP
            </label>
            <label className="check">
              <input type="checkbox" checked={form.on_disco} onChange={set('on_disco')} /> On Disco
            </label>
          </div>
        </fieldset>

        <div className="form-section span-full">Airing details</div>

        <label className="field">
          <span className="field-label">Air Network</span>
          <input value={form.air_network} onChange={set('air_network')} />
        </label>

        <label className="field">
          <span className="field-label">Air Show</span>
          <input value={form.air_show} onChange={set('air_show')} />
        </label>

        <label className="field">
          <span className="field-label">Air Episode</span>
          <input value={form.air_episode} onChange={set('air_episode')} />
        </label>

        <label className="field">
          <span className="field-label">First Air Date</span>
          <input type="date" value={form.first_air_date} onChange={set('first_air_date')} />
        </label>

        <label className="field span-full">
          <span className="field-label">Notes</span>
          <textarea rows={3} value={form.notes} onChange={set('notes')} />
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : cue?.id ? 'Save changes' : 'Add cue'}
        </button>
      </div>
    </form>
  )
}
