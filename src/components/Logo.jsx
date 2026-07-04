// "Placed" logo — an orange play mark, a tapering audio waveform, and the
// wordmark. Rebuilt as inline SVG + text so it stays crisp at any size and uses
// the app's font.
export default function Logo({ height = 40, showTagline = true }) {
  const blue = '#4a60dc'
  const orange = '#e88a3a'
  // waveform bars: x, height (centered on y=20)
  const bars = [
    [34, 16],
    [42, 28],
    [50, 22],
    [58, 14],
    [66, 10],
    [74, 7],
  ]
  return (
    <div className="brand-logo">
      <svg className="brand-icon" viewBox="0 0 104 40" height={Math.round(height * 0.66)} role="img" aria-label="Placed">
        {/* play triangle */}
        <path d="M4 8 L4 32 L26 20 Z" fill={orange} stroke={orange} strokeWidth="4" strokeLinejoin="round" />
        {/* tapering waveform */}
        {bars.map(([x, h]) => (
          <rect key={x} x={x} y={20 - h / 2} width="4.2" height={h} rx="2.1" fill={blue} />
        ))}
        <circle cx="83" cy="20" r="2.3" fill={blue} opacity="0.7" />
        <circle cx="91" cy="20" r="1.7" fill={blue} opacity="0.45" />
        <circle cx="99" cy="20" r="2.8" fill={orange} />
      </svg>
      <div className="brand-word">
        <span className="brand-placed">Placed</span>
        {showTagline && <span className="brand-tag">From Pitched to Placed</span>}
      </div>
    </div>
  )
}
