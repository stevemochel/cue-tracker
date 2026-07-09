// The Placed brand, using the actual uploaded assets:
//  - default: the square icon + "Placed / From Pitched to Placed" wordmark
//    (compact horizontal lockup for the app header)
//  - full: the complete stacked logo image (for the login / splash screens)
export default function Logo({ height = 40, full = false }) {
  if (full) {
    return <img className="brand-full" src="/placed-logo.png" alt="Placed — From Pitched to Placed" style={{ height }} />
  }
  return (
    <div className="brand-logo">
      <img className="brand-mark" src="/placed-icon.png" alt="" style={{ height, width: height }} />
      <div className="brand-word">
        <span className="brand-placed" style={{ fontSize: Math.round(height * 0.6) }}>Placed</span>
        <span className="brand-tag">From Pitched to Placed</span>
      </div>
    </div>
  )
}
