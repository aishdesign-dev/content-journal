import { useState } from 'react'
import { supabase } from './supabase.js'

export default function Login() {
  const [mode, setMode]               = useState('login') // 'login' | 'signup'
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSignupSuccess(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setError(null)
    setSignupSuccess(false)
  }

  const inputStyle = {
    width: '100%',
    background: '#FAFAF7',
    border: '2px solid #e0ddd6',
    borderRadius: '10px',
    padding: '11px 13px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: '#1a1a2e',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            background: '#8B5CF6',
            borderRadius: '12px',
            border: '2px solid #1a1a2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '3px 3px 0px #1a1a2e',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.3px' }}>
            Content Journal
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: '2px solid #1a1a2e',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '4px 4px 0px #1a1a2e',
        }}>

          {signupSuccess ? (
            /* ── Email confirmation state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 10px' }}>
                check your email
              </h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888', lineHeight: 1.6, margin: '0 0 24px' }}>
                we sent a confirmation link to <strong style={{ color: '#1a1a2e' }}>{email}</strong>.
                click it to activate your account, then come back and log in.
              </p>
              <button
                onClick={() => switchMode('login')}
                style={{
                  width: '100%',
                  background: '#8B5CF6',
                  color: '#fff',
                  border: '2px solid #1a1a2e',
                  borderRadius: '12px',
                  padding: '13px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px #1a1a2e',
                }}
              >go to login</button>
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
                {mode === 'login' ? 'welcome back' : 'create your account'}
              </h1>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#888', margin: '0 0 28px' }}>
                {mode === 'login' ? 'log in to your journal' : 'your content, your data, fully yours'}
              </p>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700,
                      color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px',
                      marginBottom: '7px',
                    }}>email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#8B5CF6'}
                      onBlur={e => e.target.style.borderColor = '#e0ddd6'}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700,
                      color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px',
                      marginBottom: '7px',
                    }}>password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder={mode === 'signup' ? 'min 6 characters' : '••••••••'}
                      minLength={6}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#8B5CF6'}
                      onBlur={e => e.target.style.borderColor = '#e0ddd6'}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: '#FF6B6B1a',
                    border: '2px solid #FF6B6B',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#cc2222',
                  }}>{error}</div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#d4d1cc' : '#8B5CF6',
                    color: loading ? '#888' : '#fff',
                    border: '2px solid #1a1a2e',
                    borderRadius: '12px',
                    padding: '13px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '3px 3px 0px #1a1a2e',
                    transition: 'all 0.15s',
                  }}
                >
                  {loading ? '...' : mode === 'login' ? 'log in' : 'create account'}
                </button>
              </form>

              {/* Mode toggle */}
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#888', textAlign: 'center', margin: '20px 0 0' }}>
                {mode === 'login' ? "don't have an account? " : 'already have an account? '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#8B5CF6', fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px', fontWeight: 700, padding: 0,
                  }}
                >
                  {mode === 'login' ? 'sign up' : 'log in'}
                </button>
              </p>
            </>
          )}
        </div>

        {/* Footer credit */}
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#bbb', textAlign: 'center', marginTop: '24px' }}>
          made with love by{' '}
          <a href="https://x.com/aishdesign" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', fontWeight: 700 }}>
            @aishdesign
          </a>
        </p>
      </div>
    </div>
  )
}
