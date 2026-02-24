import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const TAG_PALETTE = ['#8B5CF6', '#FF6B6B', '#6BFFB8', '#FFD93D', '#38BDF8', '#FB923C', '#F472B6']
const TAG_TEXT    = ['#6d35d9', '#cc2222', '#1a7a50', '#9a7000', '#0369a1', '#9a3412', '#9d174d']

function tagColor(i) { return TAG_PALETTE[i % TAG_PALETTE.length] }
function tagText(i)  { return TAG_TEXT[i % TAG_TEXT.length] }

function Section({ label, hint, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '2px solid #1a1a2e',
      borderRadius: '16px',
      padding: '20px 22px',
      boxShadow: '4px 4px 0px #e0ddd6',
    }}>
      <label style={{
        display: 'block',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '11px',
        color: '#aaa',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
      }}>{label}</label>
      {children}
      {hint && (
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          color: '#c0bdb8',
          margin: '10px 0 0',
        }}>{hint}</p>
      )}
    </div>
  )
}

export default function Onboarding() {
  const { updateProfile } = useAuth()

  const [toneGuide, setToneGuide] = useState('')
  const [topics, setTopics]       = useState([])
  const [tagInput, setTagInput]   = useState('')
  const [apiKey, setApiKey]       = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  function commitTag(raw) {
    const tag = raw.trim().replace(/,$/, '').trim()
    if (!tag || topics.includes(tag)) { setTagInput(''); return }
    setTopics(prev => [...prev, tag])
    setTagInput('')
  }

  function removeTag(tag) {
    setTopics(prev => prev.filter(t => t !== tag))
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && topics.length > 0) {
      removeTag(topics[topics.length - 1])
    }
  }

  async function handleComplete() {
    if (!apiKey.trim()) {
      setError('please enter your Claude API key to continue')
      return
    }
    setError(null)
    setSaving(true)
    const { error: saveError } = await updateProfile({
      tone_guide: toneGuide,
      topics,
      api_key: apiKey.trim(),
      onboarding_complete: true,
    })
    if (saveError) {
      setError(saveError.message || 'failed to save — try again?')
      setSaving(false)
    }
    // On success, AuthContext updates profile → App unmounts Onboarding automatically
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF7',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 24px 60px',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
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

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
          let's set up your journal
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888', margin: '0 0 32px', lineHeight: 1.6 }}>
          this takes 2 minutes and can always be changed in settings.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Tone Guide ── */}
          <Section label="your tone guide" hint="used as context when Claude generates your content ideas — describe yourself as a creator">
            <textarea
              value={toneGuide}
              onChange={e => setToneGuide(e.target.value)}
              rows={5}
              placeholder="describe your writing style, tone, and who you are as a creator"
              style={{
                width: '100%', border: 'none', outline: 'none', resize: 'vertical',
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#1a1a2e',
                background: 'transparent', lineHeight: 1.75, boxSizing: 'border-box',
              }}
            />
          </Section>

          {/* ── Topics ── */}
          <Section label="your topics" hint="press enter or comma to add · used when researching trending content">
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', cursor: 'text' }}
              onClick={e => e.currentTarget.querySelector('input')?.focus()}
            >
              {topics.map((tag, i) => {
                const c = tagColor(i)
                const t = tagText(i)
                return (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: c + '1a', border: `2px solid ${c}`,
                    borderRadius: '10px', padding: '4px 10px 4px 12px',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600,
                    color: t, userSelect: 'none',
                  }}>
                    {tag}
                    <button
                      onClick={e => { e.stopPropagation(); removeTag(tag) }}
                      style={{
                        background: 'none', border: 'none', padding: '0 0 0 2px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        color: t, opacity: 0.6, fontSize: '16px', lineHeight: 1,
                      }}
                    >×</button>
                  </span>
                )
              })}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput.trim() && commitTag(tagInput)}
                placeholder={topics.length === 0 ? 'add a topic...' : ''}
                style={{
                  border: 'none', outline: 'none',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                  color: '#1a1a2e', background: 'transparent',
                  minWidth: '110px', flex: '1',
                }}
              />
            </div>
          </Section>

          {/* ── Claude API Key ── */}
          <Section label="claude api key *">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                spellCheck={false}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontFamily: 'DM Mono, monospace, DM Sans, sans-serif',
                  fontSize: '14px', color: '#1a1a2e', background: 'transparent',
                  letterSpacing: apiKey && !showApiKey ? '0.12em' : 'normal',
                }}
              />
              <button
                onClick={() => setShowApiKey(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#aaa', display: 'flex', alignItems: 'center' }}
              >
                {showApiKey ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Explanation box */}
            <div style={{
              background: '#8B5CF60d',
              border: '1.5px solid #8B5CF633',
              borderRadius: '10px',
              padding: '12px 14px',
            }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6d35d9', margin: 0, lineHeight: 1.65 }}>
                <strong>why do I need this?</strong> Content Journal uses the Claude API to generate content ideas from your journal entries and research trending topics. your key is only ever sent directly to Anthropic's API. get yours at{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6d35d9', fontWeight: 600 }}>
                  console.anthropic.com
                </a>.
              </p>
            </div>
          </Section>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FF6B6B1a',
              border: '2px solid #FF6B6B',
              borderRadius: '12px',
              padding: '12px 16px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#cc2222',
            }}>{error}</div>
          )}

          {/* Submit */}
          <button
            onClick={handleComplete}
            disabled={saving}
            style={{
              background: saving ? '#d4d1cc' : '#8B5CF6',
              color: saving ? '#888' : '#fff',
              border: '2px solid #1a1a2e',
              borderRadius: '14px',
              padding: '15px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '4px 4px 0px #1a1a2e',
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'saving...' : "let's go →"}
          </button>

        </div>
      </div>
    </div>
  )
}
