import { PIPELINE_STATUSES, formatDate, daysBetween, today } from '../lib/constants'

// ─── Stats Bar ───
export default function StatsBar({ cues }) {
  const pipeline = cues.filter((c) => PIPELINE_STATUSES.includes(c.status))
  const accepted = cues.filter((c) => c.status === 'accepted' && c.exclusivity !== 'Available')
  const aired = cues.filter((c) => c.status === 'aired')
  const available = cues.filter((c) => c.status === 'available' || (c.status === 'accepted' && c.exclusivity === 'Available'))
  const activeDates = pipeline.filter((c) => c.dueDate).map((c) => c.dueDate).sort()
  const nearest = activeDates[0] || null
  const dl = nearest ? daysBetween(today(), nearest) : null

  return (
    <div className="stats">
      <div className="stat"><div className="stat-value" style={{ color: 'var(--dark)' }}>{cues.length}</div><div className="stat-label">Total Cues</div></div>
      <div className="stat"><div className="stat-value" style={{ color: 'var(--orange)' }}>{pipeline.length}</div><div className="stat-label">In Pipeline</div></div>
      <div className="stat"><div className="stat-value" style={{ color: 'var(--blue)' }}>{accepted.length}</div><div className="stat-label">Accepted</div></div>
      <div className="stat"><div className="stat-value" style={{ color: 'var(--green)' }}>{aired.length}</div><div className="stat-label">Aired</div></div>
      <div className="stat"><div className="stat-value" style={{ color: 'var(--purple)' }}>{available.length}</div><div className="stat-label">Available</div></div>
      {dl !== null && (
        <div className="stat"><div className="stat-value" style={{ color: dl <= 0 ? 'var(--red)' : dl <= 2 ? 'var(--orange)' : 'var(--blue)' }}>{dl}d</div><div className="stat-label">Next Due {formatDate(nearest)}</div></div>
      )}
    </div>
  )
}
