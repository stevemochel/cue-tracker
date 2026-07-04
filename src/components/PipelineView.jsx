import {
  showColor,
  PIPELINE_STATUSES,
  PIPELINE_LABELS,
  PIPELINE_COLORS,
  formatDate,
  daysBetween,
  today,
} from '../lib/constants'

// ─── Cue Card (Pipeline) ───
function CueCard({ cue, batch, onMove, onDelete, onEdit, onAccept, onReject }) {
  const color = showColor(cue.show)
  const statusIdx = PIPELINE_STATUSES.indexOf(cue.status)
  const dl = cue.dueDate ? daysBetween(today(), cue.dueDate) : null
  const dueColor = dl !== null && dl < 0 ? 'var(--red)' : dl !== null && dl <= 2 ? 'var(--orange)' : 'var(--text-secondary)'
  const isDelivered = cue.status === 'delivered'

  return (
    <div className="cue-card" style={{ borderLeftColor: color }}>
      <div className="cue-card-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span
              className="cue-card-title"
              onClick={() => onEdit(cue)}
              style={{ cursor: 'pointer', borderBottom: '1px dashed transparent', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => (e.target.style.borderBottomColor = 'var(--blue)')}
              onMouseLeave={(e) => (e.target.style.borderBottomColor = 'transparent')}
            >
              {cue.title}
            </span>
            {cue.dueDate && (
              <span className="cue-card-due" style={{ color: dueColor }}>
                {formatDate(cue.dueDate)}
                {dl !== null && (
                  <span style={{ fontWeight: 500, marginLeft: 3, opacity: 0.7 }}>
                    ({dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'today' : `${dl}d`})
                  </span>
                )}
              </span>
            )}
          </div>
          {cue.genre && <div className="cue-card-genre">{cue.genre}</div>}
        </div>
        <div className="cue-card-actions">
          <button className="btn-icon" onClick={() => onEdit(cue)} title="Edit" style={{ fontSize: 11 }}>✎</button>
          {statusIdx > 0 && <button className="btn-icon" onClick={() => onMove(cue.id, PIPELINE_STATUSES[statusIdx - 1])} title="Back">◂</button>}
          {statusIdx < PIPELINE_STATUSES.length - 1 && <button className="btn-icon" onClick={() => onMove(cue.id, PIPELINE_STATUSES[statusIdx + 1])} title="Forward">▸</button>}
          <button className="btn-icon" onClick={() => onDelete(cue.id)} title="Delete" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>
      </div>
      <div className="cue-card-tags">
        <span className="tag" style={{ background: color + '10', color: color, borderColor: color + '25' }}>{cue.show}</span>
        {batch && <span className="tag" style={{ background: 'var(--bg)', color: '#64748b', borderColor: 'var(--border)' }}>{batch.name}</span>}
      </div>
      {cue.notes && <div className="cue-card-notes">{cue.notes}</div>}
      {isDelivered && (
        <div className="cue-card-submission">
          <button className="btn btn-green btn-sm" onClick={() => onAccept(cue)}>✓ Accepted</button>
          <button className="btn btn-red-outline btn-sm" onClick={() => onReject(cue)}>✗ Not Placed</button>
        </div>
      )}
    </div>
  )
}

// ─── Pipeline View ───
export default function PipelineView({ cues, batches, onMove, onDelete, onEdit, onAccept, onReject, groupBy }) {
  const getBatch = (id) => batches.find((b) => b.id === id)
  const pipelineCues = cues.filter((c) => PIPELINE_STATUSES.includes(c.status))
  const grouped = {}
  if (groupBy === 'show') {
    ;[...new Set(pipelineCues.map((c) => c.show))].forEach((s) => {
      grouped[s || 'No Show'] = pipelineCues.filter((c) => c.show === s)
    })
  } else {
    batches.forEach((b) => {
      const bc = pipelineCues.filter((c) => c.batchId === b.id)
      if (bc.length) grouped[b.name] = bc
    })
    const unbatched = pipelineCues.filter((c) => !c.batchId)
    if (unbatched.length) grouped['No Batch'] = unbatched
  }

  if (pipelineCues.length === 0)
    return (
      <div className="empty">
        <div className="empty-title">No cues in the pipeline</div>
        <div className="empty-text">Add your first cue to get started.</div>
      </div>
    )

  return (
    <div>
      {Object.entries(grouped).map(([group, groupCues]) => (
        <div key={group} className="kanban-group">
          <div className="kanban-group-header">
            {groupBy === 'show' && <div className="kanban-group-dot" style={{ background: showColor(group) }} />}
            <div className="kanban-group-title">{group}</div>
            <div className="kanban-group-count">{groupCues.length}</div>
          </div>
          <div className="kanban-cols">
            {PIPELINE_STATUSES.map((status) => {
              const sc = PIPELINE_COLORS[status]
              const statusCues = groupCues.filter((c) => c.status === status)
              return (
                <div key={status} className="kanban-col" style={{ borderTopColor: sc.border }}>
                  <div className="kanban-col-header">
                    <span className="kanban-col-title" style={{ color: sc.text }}>{PIPELINE_LABELS[status]}</span>
                    <span className="kanban-col-count">{statusCues.length}</span>
                  </div>
                  <div className="kanban-col-cards">
                    {statusCues.map((cue) => (
                      <CueCard key={cue.id} cue={cue} batch={getBatch(cue.batchId)} onMove={onMove} onDelete={onDelete} onEdit={onEdit} onAccept={onAccept} onReject={onReject} />
                    ))}
                    {statusCues.length === 0 && <div className="kanban-empty">No cues</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
