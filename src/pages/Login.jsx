import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/cues" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const action = mode === 'signin' ? signIn : signUp
    const { data, error: authError } = await action(email, password)

    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    // If email confirmation is enabled, sign-up returns a user but no session.
    if (mode === 'signup' && !data.session) {
      setMessage('Check your email to confirm your account, then sign in.')
      setMode('signin')
    }
    // On success with a session, the auth listener redirects automatically.
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <span className="brand-mark large">♪</span>
          <h1 className="auth-title">Cue Tracker</h1>
          <p className="auth-subtitle">Track your library music cues, batches, and placements.</p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === 'signin' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-info">{message}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
