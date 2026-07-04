import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const clearNotices = () => {
    setError(null)
    setMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearNotices()
    setSubmitting(true)

    if (mode === 'reset') {
      const { error: resetErr } = await resetPassword(email)
      setSubmitting(false)
      if (resetErr) {
        setError(resetErr.message)
        return
      }
      setMessage('If that email has an account, a password-reset link is on its way. Check your inbox.')
      return
    }

    const action = mode === 'signin' ? signIn : signUp
    const { data, error: authError } = await action(email, password)
    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }
    if (mode === 'signup' && !data.session) {
      setMessage('Check your email to confirm your account, then sign in.')
      setMode('signin')
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-title" style={{ fontSize: 26 }}>
            <span style={{ color: 'var(--blue)' }}>CUE</span> <span style={{ color: 'var(--orange)' }}>TRACKER</span>
          </div>
          <div className="brand-sub" style={{ marginTop: 4 }}>Library Music Pipeline</div>
        </div>

        {mode !== 'reset' && (
          <div className="auth-tabs">
            <button className={mode === 'signin' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('signin'); clearNotices() }} type="button">
              Sign in
            </button>
            <button className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('signup'); clearNotices() }} type="button">
              Create account
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <p className="auth-subtitle" style={{ marginBottom: 18 }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {mode !== 'reset' && (
            <div className="field">
              <label className="label">Password</label>
              <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-info">{message}</div>}

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'signin' && (
            <button type="button" className="auth-link" onClick={() => { setMode('reset'); clearNotices() }}>
              Forgot password?
            </button>
          )}
          {mode === 'reset' && (
            <button type="button" className="auth-link" onClick={() => { setMode('signin'); clearNotices() }}>
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
