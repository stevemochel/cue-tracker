import { useState } from 'react'
import { formatDate } from '../lib/constants'

// ─── Catalog View ───
export default function CatalogView({ cues, onUpdate, onEdit, onAired, onAddPitch, onRemoveAiring }) {
  const [tab, setTab] = useState('all')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const accepted = cues.filter((c) => c.status === 'accepted' && c.exclusivity !== 'Available')
  const aired = cues.filter((c) => c.status === 'aired')
  const available = cues.filter((c) => c.status === 'available' || (c.status === 'accepted' && c.exclusivity === 'Available'))
  // Every catalog cue, once each, for the combined "All" view.
  const allCatalog = cues.filter((c) => ['accepted', 'aired', 'available'].includes(c.status))

  // Which catalog bucket a cue belongs to (matches the individual tabs' rules).
  const bucketOf = (c) => {
    if (c.status === 'aired') return 'aired'
    if (c.status === 'available' || (c.status === 'accepted' && c.exclusivity === 'Available')) return 'available'
    return 'accepted'
  }
  const BUCKET_COLOR = { accepted: 'var(--blue)', aired: 'var(--green)', available: 'var(--purple)' }
  const BUCKET_LABEL = { accepted: 'Accepted', aired: 'Aired', available: 'Available' }

  // One row per airing: flatten each aired cue across its airings.
  const airItems = aired.flatMap((cue) => {
    const list = Array.isArray(cue.airings) && cue.airings.length ? cue.airings : [null]
    return list.map((airing) => ({ cue, airing }))
  })

  const airItemValue = (item, key) => {
    if (key === 'title') return item.cue.title
    if (key === 'publisher') return item.cue.publisher
    if (key === 'tuneSat' || key === 'ascap' || key === 'onDisco') return item.cue[key]
    return item.airing ? item.airing[key] : '' // network / show / episode / date
  }

  const sortAirItems = (items) => {
    if (!sortKey) return items
    return [...items].sort((a, b) => {
      let va = airItemValue(a, sortKey) || ''
      let vb = airItemValue(b, sortKey) || ''
      if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0 }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const toggleField = (cue, field) => onUpdate({ ...cue, [field]: !cue[field] })
  const titleCell = () => ({ fontWeight: 600, color: 'var(--dark)', cursor: 'pointer' })

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortCues = (list) => {
    if (!sortKey) return list
    return [...list].sort((a, b) => {
      let va = a[sortKey] || ''
      let vb = b[sortKey] || ''
      if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0 }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const SortTh = ({ field, children, style }) => {
    const active = sortKey === field
    const arrow = active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
    return (
      <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...(style || {}) }} onClick={() => handleSort(field)}>
        {children}
        <span style={{ fontSize: 10, color: active ? 'var(--blue)' : 'var(--text-muted)' }}>{arrow}</span>
      </th>
    )
  }

  const switchTab = (t) => { setTab(t); setSortKey(null); setSortDir('asc') }

  return (
    <div>
      <div className="catalog-tabs">
        <button className={`catalog-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => switchTab('all')}>All ({allCatalog.length})</button>
        <button className={`catalog-tab ${tab === 'accepted' ? 'active' : ''}`} onClick={() => switchTab('accepted')}>Accepted ({accepted.length})</button>
        <button className={`catalog-tab ${tab === 'aired' ? 'active' : ''}`} onClick={() => switchTab('aired')}>Aired ({aired.length})</button>
        <button className={`catalog-tab ${tab === 'available' ? 'active' : ''}`} onClick={() => switchTab('available')}>Available ({available.length})</button>
      </div>

      {tab === 'all' &&
        (allCatalog.length === 0 ? (
          <div className="empty"><div className="empty-title">No catalog cues yet</div><div className="empty-text">Accept delivered cues from the pipeline to build your catalog.</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortTh field="title">Title</SortTh>
                  <SortTh field="status">Status</SortTh>
                  <SortTh field="publisher">Publisher</SortTh>
                  <SortTh field="exclusivity">Excl.</SortTh>
                  <SortTh field="genre">Genre</SortTh>
                  <SortTh field="tuneSat">TuneSat</SortTh>
                  <SortTh field="ascap">ASCAP</SortTh>
                  <SortTh field="onDisco">On Disco</SortTh>
                </tr>
              </thead>
              <tbody>
                {sortCues(allCatalog).map((cue) => {
                  const bucket = bucketOf(cue)
                  return (
                    <tr key={cue.id}>
                      <td style={titleCell()} onClick={() => onEdit(cue)} onMouseEnter={(e) => (e.target.style.color = 'var(--blue)')} onMouseLeave={(e) => (e.target.style.color = 'var(--dark)')}>{cue.title}</td>
                      <td>
                        <span className="tag" style={{ background: BUCKET_COLOR[bucket] + '18', color: BUCKET_COLOR[bucket], borderColor: BUCKET_COLOR[bucket] + '40' }}>{BUCKET_LABEL[bucket]}</span>
                      </td>
                      <td><span className="tag" style={{ background: 'var(--green)10', color: 'var(--green)', borderColor: 'var(--green)25' }}>{cue.publisher || '—'}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{cue.exclusivity || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{cue.genre || '—'}</td>
                      <td><button className={`check-btn ${cue.tuneSat ? 'checked' : ''}`} onClick={() => toggleField(cue, 'tuneSat')}>{cue.tuneSat ? '✓' : ''}</button></td>
                      <td><button className={`check-btn ${cue.ascap ? 'checked' : ''}`} onClick={() => toggleField(cue, 'ascap')}>{cue.ascap ? '✓' : ''}</button></td>
                      <td><button className={`check-btn ${cue.onDisco ? 'checked' : ''}`} onClick={() => toggleField(cue, 'onDisco')}>{cue.onDisco ? '✓' : ''}</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'accepted' &&
        (accepted.length === 0 ? (
          <div className="empty"><div className="empty-title">No accepted cues</div><div className="empty-text">Accept delivered cues from the pipeline to see them here.</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortTh field="title">Title</SortTh>
                  <SortTh field="publisher">Publisher</SortTh>
                  <SortTh field="exclusivity">Excl.</SortTh>
                  <SortTh field="genre">Genre</SortTh>
                  <SortTh field="tuneSat">TuneSat</SortTh>
                  <SortTh field="ascap">ASCAP</SortTh>
                  <SortTh field="onDisco">On Disco</SortTh>
                  <th>Notes</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortCues(accepted).map((cue) => (
                  <tr key={cue.id}>
                    <td style={titleCell()} onClick={() => onEdit(cue)} onMouseEnter={(e) => (e.target.style.color = 'var(--blue)')} onMouseLeave={(e) => (e.target.style.color = 'var(--dark)')}>{cue.title}</td>
                    <td><span className="tag" style={{ background: 'var(--green)10', color: 'var(--green)', borderColor: 'var(--green)25' }}>{cue.publisher || '—'}</span></td>
                    <td><span className="tag" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>{cue.exclusivity || '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cue.genre}</td>
                    <td><button className={`check-btn ${cue.tuneSat ? 'checked' : ''}`} onClick={() => toggleField(cue, 'tuneSat')}>{cue.tuneSat ? '✓' : ''}</button></td>
                    <td><button className={`check-btn ${cue.ascap ? 'checked' : ''}`} onClick={() => toggleField(cue, 'ascap')}>{cue.ascap ? '✓' : ''}</button></td>
                    <td><button className={`check-btn ${cue.onDisco ? 'checked' : ''}`} onClick={() => toggleField(cue, 'onDisco')}>{cue.onDisco ? '✓' : ''}</button></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 140, fontSize: 12 }}>{cue.notes}</td>
                    <td><button className="btn btn-green btn-sm" onClick={() => onAired(cue)}>📡 Aired</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'aired' &&
        (airItems.length === 0 ? (
          <div className="empty"><div className="empty-title">No aired cues yet</div><div className="empty-text">When TuneSat detects a broadcast, mark accepted cues as aired.</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortTh field="title">Title</SortTh>
                  <SortTh field="publisher">Publisher</SortTh>
                  <SortTh field="network">Network</SortTh>
                  <SortTh field="show">Show</SortTh>
                  <SortTh field="episode">Episode</SortTh>
                  <SortTh field="date">Air Date</SortTh>
                  <SortTh field="tuneSat">TuneSat</SortTh>
                  <SortTh field="ascap">ASCAP</SortTh>
                  <SortTh field="onDisco">On Disco</SortTh>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortAirItems(airItems).map(({ cue, airing }) => (
                  <tr key={cue.id + ':' + (airing ? airing.id : 'none')}>
                    <td style={titleCell()} onClick={() => onEdit(cue)} onMouseEnter={(e) => (e.target.style.color = 'var(--blue)')} onMouseLeave={(e) => (e.target.style.color = 'var(--dark)')}>{cue.title}</td>
                    <td><span className="tag" style={{ background: 'var(--green)10', color: 'var(--green)', borderColor: 'var(--green)25' }}>{cue.publisher || '—'}</span></td>
                    <td style={{ fontWeight: 600 }}>{airing?.network || '—'}</td>
                    <td>{airing?.show || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{airing?.episode || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{formatDate(airing?.date) || '—'}</td>
                    <td><button className={`check-btn ${cue.tuneSat ? 'checked' : ''}`} onClick={() => toggleField(cue, 'tuneSat')}>{cue.tuneSat ? '✓' : ''}</button></td>
                    <td><button className={`check-btn ${cue.ascap ? 'checked' : ''}`} onClick={() => toggleField(cue, 'ascap')}>{cue.ascap ? '✓' : ''}</button></td>
                    <td><button className={`check-btn ${cue.onDisco ? 'checked' : ''}`} onClick={() => toggleField(cue, 'onDisco')}>{cue.onDisco ? '✓' : ''}</button></td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => onAired(cue)} title="Add another airing">+ Airing</button>
                      {airing && onRemoveAiring && (
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => onRemoveAiring(cue, airing.id)} title="Remove this airing">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'available' &&
        (available.length === 0 ? (
          <div className="empty"><div className="empty-title">No available cues</div><div className="empty-text">Set a cue's Exclusivity to "Available" or reject from the pipeline to see it here.</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortTh field="title">Title</SortTh>
                  <SortTh field="publisher">Publisher</SortTh>
                  <SortTh field="genre">Genre</SortTh>
                  <SortTh field="musicalKey">Key</SortTh>
                  <SortTh field="bpm">BPM</SortTh>
                  <SortTh field="duration">Duration</SortTh>
                  <th>Pitched To</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortCues(available).map((cue) => (
                  <tr key={cue.id}>
                    <td style={titleCell()} onClick={() => onEdit(cue)} onMouseEnter={(e) => (e.target.style.color = 'var(--blue)')} onMouseLeave={(e) => (e.target.style.color = 'var(--dark)')}>{cue.title}</td>
                    <td><span className="tag" style={{ background: 'var(--green)10', color: 'var(--green)', borderColor: 'var(--green)25' }}>{cue.publisher || '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cue.genre}</td>
                    <td style={{ fontWeight: 600 }}>{cue.musicalKey || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{cue.bpm || '—'}</td>
                    <td>{cue.duration || '—'}</td>
                    <td>
                      {cue.pitchedTo && cue.pitchedTo.length > 0 ? (
                        cue.pitchedTo.map((p) => (
                          <span key={p.id} className="pitch-badge" style={{ background: 'var(--blue)10', color: 'var(--blue)', border: '1px solid var(--blue)20' }}>{p.publisher} · {formatDate(p.date)}</span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not pitched yet</span>
                      )}
                    </td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => onAddPitch(cue)}>+ Pitch</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  )
}
