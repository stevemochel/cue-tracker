// ── Domain constants (ported from the original Cue Tracker build) ──

export const SHOWS = ['Below Deck', 'The Challenge', 'Ad-Hoc Brief']

export const SHOW_COLORS = {
  'Below Deck': '#4a60dc',
  'The Challenge': '#dc2626',
  'Ad-Hoc Brief': '#7c3aed',
}

export const PUBLISHERS = [
  'Paint The Noise',
  'Atomica Music',
  'FlavorLab',
  'Tunedge',
  'Pond5',
  'ThatPitch',
  'Pond5, ThatPitch',
  'Pond5, Tunedge',
  'Pond5, ThatPitch, Tunedge',
  'Other',
]

export const EXCLUSIVITY_OPTIONS = ['Exclusive', 'Non-Exclusive', 'Available', 'Pitched']

export const KEY_OPTIONS = [
  'C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'Eb', 'Ebm', 'E', 'Em', 'F', 'Fm',
  'F#', 'F#m', 'G', 'Gm', 'Ab', 'Abm', 'A', 'Am', 'Bb', 'Bbm', 'B', 'Bm',
]

// Colors for shows not in SHOW_COLORS — assigned deterministically by name so a
// given custom show always gets the same color.
const SHOW_PALETTE = ['#4a60dc', '#dc2626', '#7c3aed', '#e88a3a', '#16a34a', '#0891b2', '#db2777', '#ca8a04', '#4f46e5', '#059669']
export function showColor(name) {
  if (!name) return '#64748b'
  if (SHOW_COLORS[name]) return SHOW_COLORS[name]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return SHOW_PALETTE[h % SHOW_PALETTE.length]
}

export const PIPELINE_STATUSES = ['need-to-start', 'in-progress', 'delivered']
export const PIPELINE_LABELS = {
  'need-to-start': 'Need to Start',
  'in-progress': 'In Progress',
  delivered: 'Delivered',
}
export const PIPELINE_COLORS = {
  'need-to-start': { border: '#ef4444', text: '#dc2626' },
  'in-progress': { border: '#e88a3a', text: '#c97a2e' },
  delivered: { border: '#22c55e', text: '#16a34a' },
}

export const CATALOG_STATUSES = ['accepted', 'aired', 'available']

// ── Small helpers ──

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id_' + Math.random().toString(36).slice(2)
}

// Kept for existing pitch code; same behavior as newId().
export const generatePitchId = newId

export function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysBetween(d1, d2) {
  return Math.round((new Date(d2 + 'T00:00:00') - new Date(d1 + 'T00:00:00')) / 864e5)
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

// Turn a statement period like "2025 Q4" into a sortable date (first day of the
// quarter). Falls back to Jan 1 of any 4-digit year found, else null.
export function periodToDate(period) {
  const q = /(\d{4})\s*Q\s*([1-4])/i.exec(period || '')
  if (q) return `${q[1]}-${String((Number(q[2]) - 1) * 3 + 1).padStart(2, '0')}-01`
  const y = /(20\d{2})/.exec(period || '')
  return y ? `${y[1]}-01-01` : null
}

// Currency formatter — always two decimal places for a clean, aligned display.
export function money(n) {
  return (Number(n) || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Parse CSV text into an array of row arrays. Handles quoted fields that
// contain commas, escaped double-quotes (""), and CR/LF line endings —
// which a naive split(',') / split('\n') gets wrong.
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let started = false // did the current row have any content?

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
    started = false
  }

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
      started = true
    } else if (c === ',') {
      started = true
      endField()
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      // Only close a row that actually has content, so blank lines are skipped.
      if (started || field !== '' || row.length) endRow()
    } else {
      started = true
      field += c
    }
  }
  if (started || field !== '' || row.length) endRow()
  return rows
}
