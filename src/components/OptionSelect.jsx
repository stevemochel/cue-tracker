import { useState } from 'react'

// A <select> that also offers "+ Add new…", revealing an inline input to add a
// value (persisted via onAddOption). The current value is always selectable
// even if it isn't in the options list.
export default function OptionSelect({
  value,
  onChange,
  options,
  onAddOption,
  canAdd = true,
  allowEmpty = false,
  emptyLabel = '—',
  placeholder = 'New name',
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const cancel = () => {
    setAdding(false)
    setDraft('')
  }
  const commit = async () => {
    const v = draft.trim()
    if (!v) return
    setBusy(true)
    const ok = await onAddOption(v)
    setBusy(false)
    if (ok !== false) {
      onChange(v)
      cancel()
    }
  }

  if (adding) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              cancel()
            }
          }}
        />
        <button type="button" className="btn btn-outline btn-sm" disabled={!draft.trim() || busy} onClick={commit}>
          {busy ? '…' : 'Add'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>
          ✕
        </button>
      </div>
    )
  }

  const known = value && options.includes(value)
  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value
        if (v === '__add__') setAdding(true)
        else onChange(v)
      }}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {value && !known && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      {canAdd && <option value="__add__">+ Add new…</option>}
    </select>
  )
}
