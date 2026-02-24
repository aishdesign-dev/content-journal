import { useState, useEffect, useRef } from 'react'
import { getJournalEntry, upsertJournalEntry, insertIdea } from './db.js'
import { useAuth } from './AuthContext.jsx'

const TODAY_KEY = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

const TYPE_META = {
  building:  { color: '#8B5CF6', label: 'building' },
  learning:  { color: '#FFD93D', label: 'learning' },
  design:    { color: '#FF6B6B', label: 'design' },
  video:     { color: '#6BFFB8', label: 'video' },
  life:      { color: '#8B5CF6', label: 'life' },
  'ct-ai':   { color: '#FF6B6B', label: 'ct · ai' },
  fun:       { color: '#FFD93D', label: 'fun' },
}

function typeMeta(type) {
  return TYPE_META[type] ?? { color: '#8B5CF6', label: type }
}

function textColor(hex) {
  return hex === '#FFD93D' ? '#9a7000' : hex === '#6BFFB8' ? '#1a7a50' : hex
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18, colorBorder = '#ffffff55', colorTop = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2.5px solid ${colorBorder}`,
      borderTopColor: colorTop,
      borderRadius: '50%',
      animation: 'cj-spin 0.65s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible, accent = '#6BFFB8' }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      background: accent,
      border: '2px solid #1a1a2e',
      borderRadius: 14,
      padding: '12px 18px',
      boxShadow: '4px 4px 0px #1a1a2e',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: 14,
      color: '#1a1a2e',
      zIndex: 9999,
      pointerEvents: 'none',
      transition: 'opacity 0.25s, transform 0.25s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  )
}

// ── Idea card ─────────────────────────────────────────────────────────────────
function IdeaCard({ idea, index, onSave, saved }) {
  const meta = typeMeta(idea.content_type)
  const tc = textColor(meta.color)

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #1a1a2e',
      borderRadius: 16,
      padding: '20px 22px',
      boxShadow: '4px 4px 0px #e0ddd6',
      animation: `cj-fadeup 0.3s ease ${index * 0.08}s both`,
    }}>
      {/* top row: type tag + save button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
        <span style={{
          background: meta.color + '1a',
          border: `2px solid ${meta.color}`,
          borderRadius: 8,
          padding: '3px 11px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: tc,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          whiteSpace: 'nowrap',
        }}>{meta.label}</span>

        <button
          onClick={onSave}
          disabled={saved}
          style={{
            background: saved ? '#6BFFB8' : '#FAFAF7',
            border: `2px solid ${saved ? '#1a1a2e' : '#ddd'}`,
            borderRadius: 10,
            padding: '5px 13px',
            fontFamily: 'Syne, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#1a1a2e',
            cursor: saved ? 'default' : 'pointer',
            boxShadow: saved ? '2px 2px 0px #1a1a2e' : 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {saved ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              saved
            </>
          ) : 'save to idea bank'}
        </button>
      </div>

      {/* post copy */}
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 15,
        color: '#1a1a2e',
        lineHeight: 1.75,
        margin: '0 0 14px',
      }}>{idea.post_copy}</p>

      {/* image idea */}
      <div style={{
        background: '#FAFAF7',
        border: '1.5px dashed #d0cdc8',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          color: '#888',
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}>{idea.image_idea}</span>
      </div>
    </div>
  )
}

// ── Error pill ────────────────────────────────────────────────────────────────
function ErrorPill({ message }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: '#FF6B6B1a',
      border: '2px solid #FF6B6B',
      borderRadius: 12,
      padding: '8px 14px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 13,
      color: '#cc3333',
      maxWidth: '100%',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Journal() {
  const { user, profile } = useAuth()

  const [entry, setEntry]     = useState('')
  const [ideas, setIdeas]     = useState([])
  const [saved, setSaved]     = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [toast, setToast]     = useState({ visible: false, message: '' })

  // Skip the first debounce save triggered by loading data from DB
  const skipNextSave = useRef(true)

  // Load today's entry on mount
  useEffect(() => {
    if (!user) return
    getJournalEntry(TODAY_KEY, user.id).then(row => {
      if (row) {
        skipNextSave.current = true
        setEntry(row.entry_text || '')
        setIdeas(row.generated_ideas || [])
        setSaved(row.saved_indices || {})
      }
      setIsLoading(false)
    })
  }, [user])

  // Debounced persist of entry text
  useEffect(() => {
    if (!user || skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    const timer = setTimeout(() => {
      upsertJournalEntry(TODAY_KEY, { entry_text: entry }, user.id)
    }, 800)
    return () => clearTimeout(timer)
  }, [entry, user])

  function showToast(message) {
    setToast({ visible: true, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }

  async function generateIdeas() {
    const apiKey   = (profile?.api_key   || '').trim()
    const toneGuide = (profile?.tone_guide || '').trim()

    if (!apiKey) {
      setError('no api key found — add it in settings first')
      return
    }
    if (!entry.trim()) {
      setError("write something first — i need something to work with!")
      return
    }

    setError(null)
    setLoading(true)
    setIdeas([])
    setSaved({})

    const topics = profile?.topics?.length ? profile.topics.join(', ') : ''
    const userMessage =
      `here is what happened today: ${entry.trim()}.\n\n` +
      `Read everything carefully and extract as many distinct tweet ideas as possible — minimum 5, more if the content supports it. Cover every interesting angle, story, insight, or moment.\n\n` +
      `Mix up the formats. include:\n` +
      `- raw honest moments from the day (what i built, learned, struggled with)\n` +
      `- at least 2 meme-style posts with relatable, self-aware energy\n` +
      `- punchy one-liners that feel like texting a friend, not a linkedin post\n` +
      `- reactive takes on anything interesting mentioned in my day\n` +
      (topics ? `- content that connects to my topics: ${topics}\n` : '') +
      `\nFor each idea return JSON with: post_copy, image_idea, content_type.\n` +
      `content_type must be one of: building, learning, design, video, life, ct-ai, fun.\n` +
      `Respond with valid JSON array only, no markdown.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          system: toneGuide || 'You are a helpful content assistant.',
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || `api error ${res.status}`)
      }

      const raw = data.content?.[0]?.text?.trim() ?? ''
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      const jsonMatch = clean.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new SyntaxError('no json array in response')
      const parsed = JSON.parse(jsonMatch[0])
      const newIdeas = Array.isArray(parsed) ? parsed : [parsed]
      setIdeas(newIdeas)
      setSaved({})
      await upsertJournalEntry(TODAY_KEY, { generated_ideas: newIdeas, saved_indices: {} }, user.id)
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('got a weird response — try again?')
      } else {
        setError(e.message || 'something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveIdeaToBank(idea, idx) {
    const newIdea = {
      id: String(Date.now() + idx),
      title: idea.post_copy.length > 60
        ? idea.post_copy.slice(0, 60).trimEnd() + '…'
        : idea.post_copy,
      body: idea.post_copy,
      image_idea: idea.image_idea,
      status: 'Draft',
      status_color: '#FFD93D',
      content_type: idea.content_type,
      source: 'journal',
      saved_at: new Date().toISOString(),
      from_date: TODAY_KEY,
    }
    try {
      await insertIdea(newIdea, user.id)
      const nextSaved = { ...saved, [idx]: true }
      setSaved(nextSaved)
      upsertJournalEntry(TODAY_KEY, { saved_indices: nextSaved }, user.id)
      showToast('saved to idea bank!')
    } catch {
      setError('failed to save — check your connection and try again')
    }
  }

  const today = new Date()
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' })
  const fullDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0

  return (
    <div>
      <style>{`
        @keyframes cj-spin { to { transform: rotate(360deg); } }
        @keyframes cj-fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Toast visible={toast.visible} message={toast.message} />

      {/* Date header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: '#8B5CF6',
          margin: '0 0 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.9px',
        }}>{weekday}</p>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#1a1a2e',
          margin: 0,
        }}>{fullDate}</h1>
      </div>

      <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {/* Journal textarea */}
        <div style={{
          background: '#fff',
          border: '2px solid #1a1a2e',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '4px 4px 0px #e0ddd6',
          marginBottom: 16,
          maxWidth: 680,
        }}>
          <textarea
            value={entry}
            onChange={e => setEntry(e.target.value)}
            placeholder="what happened today? just dump it all here..."
            rows={10}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              color: '#1a1a2e',
              background: 'transparent',
              lineHeight: 1.8,
              boxSizing: 'border-box',
            }}
          />
          {/* word count */}
          {wordCount > 0 && (
            <div style={{
              textAlign: 'right',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: '#c0bdb8',
              marginTop: 4,
            }}>{wordCount} word{wordCount !== 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Generate button + error */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36, maxWidth: 680, flexWrap: 'wrap' }}>
          <button
            onClick={generateIdeas}
            disabled={loading}
            style={{
              background: loading ? '#d4d1cc' : '#8B5CF6',
              color: loading ? '#888' : '#fff',
              border: '2px solid #1a1a2e',
              borderRadius: 12,
              padding: '12px 22px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '4px 4px 0px #1a1a2e',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.15s',
            }}
          >
            {loading
              ? <><Spinner size={16} colorBorder="#88888844" colorTop="#888" />generating...</>
              : 'generate ideas →'}
          </button>

          {error && <ErrorPill message={error} />}
        </div>

        {/* Ideas */}
        {ideas.length > 0 && (
          <div style={{ maxWidth: 680 }}>
            <p style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: '#aaa',
              textTransform: 'uppercase',
              letterSpacing: '0.9px',
              margin: '0 0 14px',
            }}>
              {ideas.length} idea{ideas.length !== 1 ? 's' : ''} generated
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ideas.map((idea, i) => (
                <IdeaCard
                  key={i}
                  idea={idea}
                  index={i}
                  onSave={() => saveIdeaToBank(idea, i)}
                  saved={!!saved[i]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
