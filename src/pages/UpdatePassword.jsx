import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Shown when the user arrives via a password-reset email link.
export default function UpdatePassword() {
  const { updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setSubmitting(true)
    const { error: err } = await updatePassword(password)
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    // On success, recovery mode clears and the app shows the signed-in dashboard.
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-title" style={{ fontSize: 26 }}>
            <span style={{ color: 'var(--blue)' }}>CUE</span> <span style={{ color: 'var(--orange)' }}>TRACKER</span>
          </div>
          <div className="brand-sub" style={{ marginTop: 4 }}>Set a new password</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">New password</label>
            <input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
          </div>
          <div className="field">
            <label className="label">Confirm new password</label>
            <input type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" className="auth-link" onClick={signOut}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
