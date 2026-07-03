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

  if (user) return <Navigate to="/" replace />

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

        <div className="auth-tabs">
          <button className={mode === 'signin' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('signin'); setError(null) }} type="button">
            Sign in
          </button>
          <button className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('signup'); setError(null) }} type="button">
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-info">{message}</div>}

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
