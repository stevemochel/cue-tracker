import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function BatchForm({ batch, onSaved, onCancel }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: batch?.name ?? '',
    sign_up: batch?.sign_up ?? '',
    deliver: batch?.deliver ?? '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    setError(null)
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      sign_up: form.sign_up === '' ? null : form.sign_up,
      deliver: form.deliver === '' ? null : form.deliver,
      user_id: user.id,
    }

    let result
    if (batch?.id) {
      result = await supabase.from('batches').update(payload).eq('id', batch.id).select().single()
    } else {
      result = await supabase.from('batches').insert(payload).select().single()
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
        <label className="field span-full">
          <span className="field-label">Name *</span>
          <input value={form.name} onChange={set('name')} required autoFocus />
        </label>
        <label className="field">
          <span className="field-label">Sign-up Date</span>
          <input type="date" value={form.sign_up} onChange={set('sign_up')} />
        </label>
        <label className="field">
          <span className="field-label">Deliver Date</span>
          <input type="date" value={form.deliver} onChange={set('deliver')} />
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : batch?.id ? 'Save changes' : 'Add batch'}
        </button>
      </div>
    </form>
  )
}
