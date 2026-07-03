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
  'Pond5, ThatPitch, Tunedge',
  'Other',
]

export const EXCLUSIVITY_OPTIONS = ['Exclusive', 'Non-Exclusive', 'Available', 'Pitched']

export const KEY_OPTIONS = [
  'C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'Eb', 'Ebm', 'E', 'Em', 'F', 'Fm',
  'F#', 'F#m', 'G', 'Gm', 'Ab', 'Abm', 'A', 'Am', 'Bb', 'Bbm', 'B', 'Bm',
]

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

export function generatePitchId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'p_' + Math.random().toString(36).slice(2)
}

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
