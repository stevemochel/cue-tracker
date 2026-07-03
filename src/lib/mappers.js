// Translate between Supabase rows (snake_case columns) and the in-app cue/batch
// objects (camelCase) that the ported UI components expect.
//
// The `cues` table columns are: title, status, show, genre, publisher,
// exclusivity, tunesat, ascap, on_disco, air_network, air_show, air_episode,
// first_air_date, musical_key, bpm, duration, pitched_to (jsonb), notes,
// due_date, batch_id — plus id and user_id.
//
// The `batches` table columns are: name, sign_up, deliver — plus id, user_id.

export function rowToCue(row) {
  return {
    id: row.id,
    title: row.title || '',
    status: row.status || 'need-to-start',
    show: row.show || '',
    genre: row.genre || '',
    publisher: row.publisher || '',
    exclusivity: row.exclusivity || '',
    placement: row.placement || '',
    tuneSat: !!row.tunesat,
    ascap: !!row.ascap,
    onDisco: !!row.on_disco,
    airNetwork: row.air_network || '',
    airShow: row.air_show || '',
    airEpisode: row.air_episode || '',
    firstAirDate: row.first_air_date || '',
    // Multiple broadcasts per cue. If the row predates this column, synthesize
    // one airing from the legacy single air_* fields so nothing is lost.
    airings: airingsFromRow(row),
    musicalKey: row.musical_key || '',
    bpm: row.bpm ?? '',
    duration: row.duration || '',
    pitchedTo: Array.isArray(row.pitched_to) ? row.pitched_to : [],
    notes: row.notes || '',
    dueDate: row.due_date || '',
    batchId: row.batch_id || null,
  }
}

function airingsFromRow(row) {
  if (Array.isArray(row.airings) && row.airings.length) return row.airings
  const hasLegacy = row.air_network || row.air_show || row.air_episode || row.first_air_date
  if (hasLegacy) {
    return [
      {
        id: row.id + ':legacy',
        network: row.air_network || '',
        show: row.air_show || '',
        episode: row.air_episode || '',
        date: row.first_air_date || '',
      },
    ]
  }
  return []
}

// Build an insert/update payload. Empty strings become null so date/number
// columns don't choke. `user_id` is stamped for Row Level Security.
export function cueToRow(cue, userId) {
  const nn = (v) => (v === '' || v === undefined ? null : v)
  // `airings` is the source of truth for broadcasts; keep the legacy single
  // air_* columns synced to the first airing for CSV export / older readers.
  const airings = Array.isArray(cue.airings) ? cue.airings : []
  const first = airings[0] || null
  return {
    title: (cue.title || '').trim(),
    status: cue.status || 'need-to-start',
    show: nn(cue.show),
    genre: nn(cue.genre),
    publisher: nn(cue.publisher),
    exclusivity: nn(cue.exclusivity),
    placement: nn(cue.placement),
    tunesat: !!cue.tuneSat,
    ascap: !!cue.ascap,
    on_disco: !!cue.onDisco,
    airings,
    air_network: nn(first ? first.network : cue.airNetwork),
    air_show: nn(first ? first.show : cue.airShow),
    air_episode: nn(first ? first.episode : cue.airEpisode),
    first_air_date: nn(first ? first.date : cue.firstAirDate),
    musical_key: nn(cue.musicalKey),
    // `bpm` is a text column, so keep it a string rather than coercing to a number.
    bpm: cue.bpm === '' || cue.bpm == null ? null : String(cue.bpm),
    duration: nn(cue.duration),
    pitched_to: Array.isArray(cue.pitchedTo) ? cue.pitchedTo : [],
    notes: nn(cue.notes),
    due_date: nn(cue.dueDate),
    batch_id: cue.batchId || null,
    user_id: userId,
  }
}

export function rowToBatch(row) {
  return {
    id: row.id,
    name: row.name || '',
    signUp: row.sign_up || '',
    deliver: row.deliver || '',
  }
}

export function batchToRow(batch, userId) {
  return {
    name: (batch.name || '').trim(),
    sign_up: batch.signUp || null,
    deliver: batch.deliver || null,
    user_id: userId,
  }
}
