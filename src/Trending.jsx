import { useState } from 'react'
import { insertIdea } from './db.js'

// ── Shared config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  building: { color: '#8B5CF6', text: '#6d35d9', label: 'building' },
  learning:  { color: '#6BFFB8', text: '#1a7a50', label: 'learning' },
  design:    { color: '#FF6B6B', text: '#cc2222', label: 'design'   },
  video:     { color: '#FFD93D', text: '#9a7000', label: 'video'    },
  life:      { color: '#38BDF8', text: '#0369a1', label: 'life'     },
  'ct-ai':   { color: '#FB923C', text: '#9a3412', label: 'ct · ai'  },
  fun:       { color: '#F472B6', text: '#9d174d', label: 'fun'      },
}
function cfg(type) {
  return TYPE_CONFIG[type] ?? { color: '#8B5CF6', text: '#6d35d9', label: type ?? '?' }
}

const TAG_PALETTE = ['#8B5CF6','#FF6B6B','#6BFFB8','#FFD93D','#38BDF8','#FB923C','#F472B6']
const TAG_TEXT    = ['#6d35d9','#cc2222','#1a7a50','#9a7000','#0369a1','#9a3412','#9d174d']

const DEFAULT_TOPICS = ['CT', 'AI', 'vibecoding', 'design', 'motion graphics', 'video content']

function loadSettings() {
  return {
    apiKey:    (localStorage.getItem('cj_apiKey')  || '').trim(),
    toneGuide: (localStorage.getItem('cj_tone')    || '').trim(),
    topics:    JSON.parse(localStorage.getItem('cj_topics') || 'null') ?? DEFAULT_TOPICS,
  }
}

async function saveIdeaToBank(idea, idx) {
  await insertIdea({
    id:           String(Date.now() + idx),
    title:        (idea.post_copy || '').slice(0, 60),
    body:         idea.post_copy  || '',
    image_idea:   idea.image_idea || '',
    status:       'Draft',
    status_color: '#FFD93D',
    content_type: idea.content_type,
    source:       'trending',
    trend_source: idea.trend_source,
    saved_at:     new Date().toISOString(),
  })
}

function formatTs(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 18, border = '#ffffff55', top = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      border: `2.5px solid ${border}`,
      borderTopColor: top,
      borderRadius: '50%',
      animation: 'cj-spin 0.65s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ visible, message }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32,
      background: '#6BFFB8', border: '2px solid #1a1a2e',
      borderRadius: 14, padding: '12px 18px',
      boxShadow: '4px 4px 0px #1a1a2e',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
      color: '#1a1a2e', zIndex: 9999, pointerEvents: 'none',
      transition: 'opacity 0.25s, transform 0.25s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  )
}

// ── Topic tag pill ────────────────────────────────────────────────────────────
function TopicPill({ label, index }) {
  const color = TAG_PALETTE[index % TAG_PALETTE.length]
  const text  = TAG_TEXT[index % TAG_TEXT.length]
  return (
    <span style={{
      background: color + '1a',
      border: `2px solid ${color}`,
      borderRadius: 10,
      padding: '5px 13px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 13, fontWeight: 600,
      color: text,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ idea, index, onSave, saved }) {
  const { color, text, label } = cfg(idea.content_type)

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #1a1a2e',
      borderRadius: 16,
      padding: '20px 22px',
      boxShadow: '4px 4px 0px #e0ddd6',
      animation: `cj-fadeup 0.3s ease ${index * 0.07}s both`,
    }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{
          background: color + '1a', border: `2px solid ${color}`,
          borderRadius: 8, padding: '3px 11px',
          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700,
          color: text, textTransform: 'uppercase', letterSpacing: '0.6px',
          whiteSpace: 'nowrap',
        }}>{label}</span>

        {idea.trend_source && (
          <span style={{
            background: '#FB923C14', border: '1.5px solid #FB923C88',
            borderRadius: 8, padding: '3px 10px',
            fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
            color: '#9a3412',
            display: 'flex', alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 260,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{idea.trend_source}</span>
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={onSave}
          disabled={saved}
          style={{
            background: saved ? '#6BFFB8' : '#FAFAF7',
            border: `2px solid ${saved ? '#1a1a2e' : '#ddd'}`,
            borderRadius: 10, padding: '5px 13px',
            fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
            color: '#1a1a2e', cursor: saved ? 'default' : 'pointer',
            boxShadow: saved ? '2px 2px 0px #1a1a2e' : 'none',
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          {saved ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              saved
            </>
          ) : 'save to idea bank'}
        </button>
      </div>

      {/* post copy */}
      <p style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: 15,
        color: '#1a1a2e', lineHeight: 1.75, margin: '0 0 14px',
      }}>{idea.post_copy}</p>

      {/* image idea */}
      {idea.image_idea && (
        <div style={{
          background: '#FAFAF7', border: '1.5px dashed #d8d5d0',
          borderRadius: 10, padding: '9px 13px',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 13,
            color: '#888', fontStyle: 'italic', lineHeight: 1.55,
          }}>{idea.image_idea}</span>
        </div>
      )}
    </div>
  )
}

// ── Loading animation dots ────────────────────────────────────────────────────
function ResearchingState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 20,
      padding: '52px 24px',
      background: '#fff', border: '2px solid #1a1a2e',
      borderRadius: 20, boxShadow: '4px 4px 0px #e0ddd6',
      maxWidth: 480,
    }}>
      {/* Animated search icon */}
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '3px solid #8B5CF633',
          borderTopColor: '#8B5CF6',
          animation: 'cj-spin 0.9s linear infinite',
        }} />
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        >
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16,
          color: '#1a1a2e', margin: '0 0 6px',
        }}>researching trends...</p>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 13,
          color: '#aaa', margin: 0, lineHeight: 1.6,
        }}>searching the web and writing ideas in your voice</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Trending() {
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('cj_trending_results')
    return saved ? JSON.parse(saved) : []
  })
  const [lastResearched, setLastResearched] = useState(
    () => localStorage.getItem('cj_trending_last') || null
  )
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [saved,    setSaved]    = useState({})
  const [toast,    setToast]    = useState({ visible: false, message: '' })

  // Read fresh from localStorage each render so Settings changes are reflected
  const { topics } = loadSettings()

  function showToast(msg) {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200)
  }

  async function research() {
    const { apiKey, toneGuide, topics: currentTopics } = loadSettings()

    if (!apiKey) {
      setError('no api key — add it in settings first')
      return
    }
    if (!currentTopics.length) {
      setError('no topics set — add some in settings')
      return
    }

    setError(null)
    setLoading(true)
    setResults([])
    setSaved({})

    const topicsStr   = currentTopics.join(', ')
    const userMessage =
      `search for what is actually trending RIGHT NOW today in these topics: ${topicsStr}.\n\n` +
      `Find real specific things — model drops, company news, viral moments, price moves, tool releases, anything blowing up.\n\n` +
      `Then generate 5-7 tweet ideas reacting to these trends in my voice. Mix these formats:\n` +
      `- meme-style reactive posts: "[specific thing that just happened] and i can't keep up 😭 meanwhile i'm just here [my personal thing]"\n` +
      `- the chaos contrast: big wild world news vs my quiet grind designing/coding/animating from india\n` +
      `- hot takes on what the trend means for design, crypto, or building in public\n` +
      `- relatable overwhelm at how fast things are moving in AI/CT/tech\n` +
      `- punchy lowercase lines that feel like texting a friend who's also into this stuff\n\n` +
      `the energy i want: self-aware, a little chaotic, grounded in my actual life, never corporate, always lowercase.\n\n` +
      `example of the exact vibe:\n` +
      `"AI is getting wild rn and i can't keep up 😭 gemini 3.1 with 1M token context. spacex + xAI merging into a $1.25T company. apple rebuilding siri from scratch. meanwhile i'm just here using it to vibe code crypto dashboards and animate stuff at 2am from india"\n\n` +
      `For each idea return JSON with: post_copy, image_idea, content_type, trend_source.\n` +
      `trend_source should be the specific thing you found trending (e.g. "Gemini 3.1 launch", "xAI + SpaceX merger").\n` +
      `content_type must be one of: building, learning, design, video, life, ct-ai, fun.\n` +
      `Respond with valid JSON array only, no markdown backticks.\n\n` +
      `only include trends, news and topics from the last 14 days. do not reference anything older than 2 weeks. if you cannot find recent content on a topic, skip it and focus on what is actually trending right now.`

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
          max_tokens: 3000,
          system: toneGuide || 'You are a helpful content assistant.',
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || `api error ${res.status}`)
      }

      // Extract all text from content blocks — model puts final answer in the last text block
      const allText = (data.content ?? [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join(' ')
        .trim()

      // Find the JSON array in the response (robust against surrounding prose)
      const jsonMatch = allText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new SyntaxError('no json array found in response')

      const parsed = JSON.parse(jsonMatch[0])
      const ideas  = Array.isArray(parsed) ? parsed : [parsed]

      const ts = new Date().toISOString()
      setResults(ideas)
      setLastResearched(ts)
      localStorage.setItem('cj_trending_results', JSON.stringify(ideas))
      localStorage.setItem('cj_trending_last',    ts)
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('couldn\'t parse the response — try again?')
      } else {
        setError(e.message || 'something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(idea, idx) {
    try {
      await saveIdeaToBank(idea, idx)
      setSaved(prev => ({ ...prev, [idx]: true }))
      showToast('saved to idea bank!')
    } catch {
      setError('failed to save — check your connection and try again')
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <style>{`
        @keyframes cj-spin   { to { transform: rotate(360deg); } }
        @keyframes cj-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <Toast visible={toast.visible} message={toast.message} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
          Trending
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#888', margin: 0, fontSize: 14 }}>
          research what's hot and turn it into content ideas
        </p>
      </div>

      {/* Topics */}
      <div style={{
        background: '#fff', border: '2px solid #1a1a2e',
        borderRadius: 16, padding: '18px 20px',
        boxShadow: '4px 4px 0px #e0ddd6',
        marginBottom: 20,
      }}>
        <p style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11,
          color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px',
          margin: '0 0 12px',
        }}>your topics</p>
        {topics.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topics.map((t, i) => <TopicPill key={t} label={t} index={i} />)}
          </div>
        ) : (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ccc', margin: 0 }}>
            no topics set — head to settings to add some
          </p>
        )}
      </div>

      {/* Last researched */}
      {lastResearched && !loading && (
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 12,
          color: '#b0adb8', margin: '0 0 16px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          last researched {formatTs(lastResearched)}
        </p>
      )}

      {/* Research button + error */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
        <button
          onClick={research}
          disabled={loading}
          style={{
            background: loading ? '#d4d1cc' : '#FF6B6B',
            color: loading ? '#888' : '#fff',
            border: '2px solid #1a1a2e',
            borderRadius: 14,
            padding: '14px 28px',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '4px 4px 0px #1a1a2e',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'all 0.15s',
            letterSpacing: '-0.2px',
          }}
        >
          {loading ? (
            <>
              <Spinner size={17} border="#88888855" top="#888" />
              researching trends...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              research trends now
            </>
          )}
        </button>

        {error && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FF6B6B1a', border: '2px solid #FF6B6B',
            borderRadius: 12, padding: '8px 14px',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#cc2222',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Loading visual */}
      {loading && <ResearchingState />}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <p style={{
            fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
            color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.9px',
            margin: '0 0 14px',
          }}>
            {results.length} idea{results.length !== 1 ? 's' : ''} generated
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {results.map((idea, i) => (
              <ResultCard
                key={i}
                idea={idea}
                index={i}
                onSave={() => handleSave(idea, i)}
                saved={!!saved[i]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
