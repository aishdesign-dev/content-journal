import { useState, useRef } from 'react'

const DEFAULT_TAGS = ['CT', 'AI', 'vibecoding', 'design', 'motion graphics', 'video content']

const DEFAULT_TONE = `I am a soft, bubbly graphic designer based in India. I work in crypto.
I do design, illustrations, motion graphics, and make videos.
I vibe code apps with original designs. Always write in lowercase,
short punchy lines, casual tone like texting a friend.`

const TAG_PALETTE = ['#8B5CF6', '#FF6B6B', '#6BFFB8', '#FFD93D', '#8B5CF6', '#FF6B6B', '#6BFFB8', '#FFD93D']

function tagColor(i) {
  return TAG_PALETTE[i % TAG_PALETTE.length]
}

function tagTextColor(color) {
  return color === '#FFD93D' ? '#9a7000' : color
}

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

function Toast({ visible }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      background: '#6BFFB8',
      border: '2px solid #1a1a2e',
      borderRadius: '14px',
      padding: '13px 20px',
      boxShadow: '4px 4px 0px #1a1a2e',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: '14px',
      color: '#1a1a2e',
      zIndex: 9999,
      transition: 'opacity 0.25s, transform 0.25s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      pointerEvents: 'none',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      settings saved
    </div>
  )
}

export default function Settings() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cj_apiKey') || '')
  const [topics, setTopics] = useState(() => {
    const saved = localStorage.getItem('cj_topics')
    return saved ? JSON.parse(saved) : DEFAULT_TAGS
  })
  const [tone, setTone] = useState(() => localStorage.getItem('cj_tone') || DEFAULT_TONE)
  const [tagInput, setTagInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  const toastTimer = useRef(null)
  const saveTimer = useRef(null)

  function triggerToast() {
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500)
  }

  function persistAll(newApiKey, newTopics, newTone) {
    localStorage.setItem('cj_apiKey', newApiKey)
    localStorage.setItem('cj_topics', JSON.stringify(newTopics))
    localStorage.setItem('cj_tone', newTone)
    triggerToast()
  }

  // Debounce saves for text fields so toast doesn't fire every keystroke
  function debouncedPersist(newApiKey, newTopics, newTone) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persistAll(newApiKey, newTopics, newTone), 800)
  }

  function handleApiKeyChange(val) {
    setApiKey(val)
    debouncedPersist(val, topics, tone)
  }

  function handleToneChange(val) {
    setTone(val)
    debouncedPersist(apiKey, topics, val)
  }

  function commitTag(raw) {
    const tag = raw.trim().replace(/,$/, '').trim()
    if (!tag || topics.includes(tag)) {
      setTagInput('')
      return
    }
    const next = [...topics, tag]
    setTopics(next)
    setTagInput('')
    persistAll(apiKey, next, tone)
  }

  function removeTag(tag) {
    const next = topics.filter(t => t !== tag)
    setTopics(next)
    persistAll(apiKey, next, tone)
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && topics.length > 0) {
      removeTag(topics[topics.length - 1])
    }
  }

  return (
    <div>
      <Toast visible={toastVisible} />

      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>Settings</h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#888', margin: '0 0 32px', fontSize: '14px' }}>your journal, your rules</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '580px' }}>

        {/* ── Claude API Key ── */}
        <Section label="claude api key" hint="stored in localStorage · never sent anywhere except the claude api">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder="sk-ant-api03-..."
              spellCheck={false}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontFamily: 'DM Mono, monospace, DM Sans, sans-serif',
                fontSize: '14px',
                color: '#1a1a2e',
                background: 'transparent',
                letterSpacing: apiKey && !showApiKey ? '0.12em' : 'normal',
              }}
            />
            <button
              onClick={() => setShowApiKey(v => !v)}
              title={showApiKey ? 'Hide key' : 'Show key'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#aaa',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
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
        </Section>

        {/* ── My Topics ── */}
        <Section label="my topics" hint="press enter or , to add · backspace removes the last tag">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              cursor: 'text',
            }}
            onClick={e => e.currentTarget.querySelector('input')?.focus()}
          >
            {topics.map((tag, i) => {
              const c = tagColor(i)
              return (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: c + '1a',
                    border: `2px solid ${c}`,
                    borderRadius: '10px',
                    padding: '4px 10px 4px 12px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: tagTextColor(c),
                    userSelect: 'none',
                  }}
                >
                  {tag}
                  <button
                    onClick={e => { e.stopPropagation(); removeTag(tag) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0 0 0 2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tagTextColor(c),
                      opacity: 0.6,
                      fontSize: '16px',
                      lineHeight: 1,
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
                border: 'none',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#1a1a2e',
                background: 'transparent',
                minWidth: '110px',
                flex: '1',
              }}
            />
          </div>
        </Section>

        {/* ── Tone Guide ── */}
        <Section label="my tone guide" hint="used as context when generating content ideas or captions">
          <textarea
            value={tone}
            onChange={e => handleToneChange(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#1a1a2e',
              background: 'transparent',
              lineHeight: 1.75,
              boxSizing: 'border-box',
            }}
          />
        </Section>

      </div>
    </div>
  )
}
