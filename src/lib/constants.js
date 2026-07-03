// Workflow statuses for a cue as it moves through a library-music pipeline.
// Stored as plain text in the `cues.status` column.
export const CUE_STATUSES = [
  'In Progress',
  'Demo',
  'Pitched',
  'Signed',
  'Placed',
  'Aired',
  'On Hold',
]

export const EXCLUSIVITY_OPTIONS = ['Exclusive', 'Non-Exclusive']

// Musical keys for the optional dropdown.
export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
].flatMap((root) => [`${root} major`, `${root} minor`])
