import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]     = useState('login')   // 'login' | 'signup'
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = mode === 'login'
      ? await signIn(email, pass)
      : await signUp(email, pass)
    setLoading(false)
    if (err) { setError(err.message); return }
    if (mode === 'signup') setDone(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>FitCoach</h1>
        <p>{mode === 'login' ? 'Sign in to your schedule' : 'Create your account'}</p>

        {done ? (
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            <strong>Check your email!</strong><br />
            We sent a confirmation link to <em>{email}</em>.<br />
            Click it then come back to sign in.
            <br /><br />
            <button className="btn" onClick={() => { setMode('login'); setDone(false) }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} required minLength={6} />
            </div>
            {error && (
              <div style={{ fontSize: 12, color: 'var(--coral)', marginBottom: 10 }}>{error}</div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', padding: '9px', marginBottom: 12 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button type="button" className="btn btn-sm" onClick={() => setMode('signup')}>Sign up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" className="btn btn-sm" onClick={() => setMode('login')}>Sign in</button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
