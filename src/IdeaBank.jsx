import { useState, useRef, useEffect, useCallback } from 'react'
import {
  getIdeas,
  insertIdea as dbInsertIdea,
  updateIdea as dbUpdateIdea,
  deleteIdea as dbDeleteIdea,
  getCalendarPosts,
  insertCalendarPost,
  deleteCalendarPost as dbDeleteCalendarPost,
} from './db.js'
import { useAuth } from './AuthContext.jsx'

// ── Type config ───────────────────────────────────────────────────────────────
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
  return TYPE_CONFIG[type] ?? { color: '#8B5CF6', text: '#6d35d9', label: type ?? '—' }
}

const ALL_TYPES = Object.keys(TYPE_CONFIG)

// ── Auto-resize textarea ──────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, style }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{
        width: '100%',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        background: 'transparent',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 14,
        color: '#1a1a2e',
        lineHeight: 1.7,
        padding: 0,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

// ── Calendar popover ──────────────────────────────────────────────────────────
function CalendarPopover({ currentDate, onConfirm, onClose, calendarPosts = [] }) {
  const [date, setDate] = useState(currentDate || '')
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const countOnDate = date ? calendarPosts.filter(p => p.date === date).length : 0
  const isFull = countOnDate >= 2
  const isNew  = date !== currentDate

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      background: '#fff',
      border: '2px solid #1a1a2e',
      borderRadius: 14,
      padding: '16px 18px',
      boxShadow: '4px 4px 0px #1a1a2e',
      zIndex: 200,
      minWidth: 230,
    }}>
      <p style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: 12, margin: '0 0 10px', color: '#1a1a2e',
        textTransform: 'uppercase', letterSpacing: '0.6px',
      }}>schedule for</p>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        style={{
          width: '100%',
          border: `2px solid ${isFull && isNew ? '#FB923C' : '#1a1a2e'}`,
          borderRadius: 8,
          padding: '7px 10px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          color: '#1a1a2e',
          background: '#FAFAF7',
          boxSizing: 'border-box',
          marginBottom: isFull && isNew ? 6 : 10,
          outline: 'none',
        }}
      />
      {isFull && isNew && (
        <div style={{
          background: '#FB923C14', border: '1.5px solid #FB923C',
          borderRadius: 8, padding: '6px 10px', marginBottom: 10,
          display: 'flex', gap: 6, alignItems: 'flex-start',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9a3412', lineHeight: 1.5 }}>
            this day already has 2 posts — it'll be a busy one!
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => date && onConfirm(date)}
          disabled={!date}
          style={{
            flex: 1,
            background: date ? '#8B5CF6' : '#e0ddd6',
            color: date ? '#fff' : '#aaa',
            border: '2px solid #1a1a2e',
            borderRadius: 8,
            padding: '7px 0',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: 12,
            cursor: date ? 'pointer' : 'not-allowed',
            boxShadow: date ? '2px 2px 0px #1a1a2e' : 'none',
          }}
        >confirm</button>
        <button
          onClick={onClose}
          style={{
            background: '#FAFAF7',
            border: '2px solid #ddd',
            borderRadius: 8,
            padding: '7px 12px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            color: '#888',
          }}
        >cancel</button>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ visible, message, accent = '#6BFFB8' }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 32, right: 32,
      background: accent,
      border: '2px solid #1a1a2e',
      borderRadius: 14,
      padding: '12px 18px',
      boxShadow: '4px 4px 0px #1a1a2e',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
      color: '#1a1a2e',
      zIndex: 9999, pointerEvents: 'none',
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

// ── Tag pill ──────────────────────────────────────────────────────────────────
function TypeTag({ type }) {
  const { color, text, label } = cfg(type)
  return (
    <span style={{
      background: color + '1a',
      border: `2px solid ${color}`,
      borderRadius: 8,
      padding: '3px 10px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 11, fontWeight: 700,
      color: text,
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function SourceTag({ source }) {
  const isJournal = source === 'journal' || !source
  return (
    <span style={{
      background: '#FAFAF7',
      border: '1.5px solid #e0ddd6',
      borderRadius: 8,
      padding: '3px 9px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 11, fontWeight: 500,
      color: '#aaa',
      whiteSpace: 'nowrap',
    }}>
      {isJournal ? '✍ from journal' : '🔥 from trending'}
    </span>
  )
}

// ── Single idea card ──────────────────────────────────────────────────────────
function IdeaCard({ idea, onUpdate, onDelete, onSchedule, calendarPosts }) {
  const [showCalendar, setShowCalendar] = useState(false)
  const calRef = useRef(null)

  function field(key, val) {
    onUpdate(idea.id, { [key]: val })
  }

  const scheduled = idea.scheduled_date
    ? new Date(idea.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #1a1a2e',
      borderRadius: 16,
      padding: '18px 20px',
      boxShadow: '4px 4px 0px #e0ddd6',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
    }}>
      {/* top row: type + source + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <TypeTag type={idea.content_type} />
        <SourceTag source={idea.source} />
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onDelete(idea.id)}
          title="Delete idea"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', padding: 4, display: 'flex', alignItems: 'center',
            borderRadius: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#FF6B6B'}
          onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      {/* Post copy — editable */}
      <div>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
          color: '#c0bdb8', textTransform: 'uppercase', letterSpacing: '0.6px',
          margin: '0 0 4px',
        }}>post copy</p>
        <AutoTextarea
          value={idea.body || ''}
          onChange={val => field('body', val)}
          placeholder="write your post copy..."
          style={{ fontWeight: 400 }}
        />
      </div>

      {/* Image idea — editable */}
      <div style={{
        background: '#FAFAF7',
        border: '1.5px dashed #d8d5d0',
        borderRadius: 10,
        padding: '8px 12px',
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
          color: '#c0bdb8', textTransform: 'uppercase', letterSpacing: '0.6px',
          margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c0bdb8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          image idea
        </p>
        <AutoTextarea
          value={idea.image_idea || ''}
          onChange={val => field('image_idea', val)}
          placeholder="describe the visual..."
          style={{ fontSize: 13, color: '#555', fontStyle: 'italic' }}
        />
      </div>

      {/* Bottom row: schedule button + scheduled badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative' }} ref={calRef}>
        <button
          onClick={() => setShowCalendar(v => !v)}
          style={{
            background: scheduled ? '#8B5CF61a' : '#FAFAF7',
            border: `2px solid ${scheduled ? '#8B5CF6' : '#ddd'}`,
            borderRadius: 10,
            padding: '6px 13px',
            fontFamily: 'Syne, sans-serif',
            fontSize: 12, fontWeight: 700,
            color: scheduled ? '#6d35d9' : '#888',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: scheduled ? '2px 2px 0px #8B5CF644' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {scheduled ? scheduled : 'add to calendar'}
        </button>

        {scheduled && (
          <button
            onClick={() => onSchedule(idea.id, null)}
            title="Remove from calendar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ccc', padding: 2, display: 'flex', alignItems: 'center',
              fontSize: 16, lineHeight: 1,
            }}
          >×</button>
        )}

        {showCalendar && (
          <CalendarPopover
            currentDate={idea.scheduled_date || ''}
            onConfirm={(date) => {
              onSchedule(idea.id, date)
              setShowCalendar(false)
            }}
            onClose={() => setShowCalendar(false)}
            calendarPosts={calendarPosts}
          />
        )}
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ active, counts, onChange }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
      <button
        onClick={() => onChange(null)}
        style={{
          background: active === null ? '#1a1a2e' : '#fff',
          color: active === null ? '#fff' : '#888',
          border: '2px solid #1a1a2e',
          borderRadius: 10,
          padding: '6px 14px',
          fontFamily: 'Syne, sans-serif',
          fontSize: 12, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: active === null ? '2px 2px 0px #55555544' : 'none',
          transition: 'all 0.12s',
        }}
      >all {total > 0 ? `(${total})` : ''}</button>

      {ALL_TYPES.map(type => {
        const { color, text, label } = cfg(type)
        const isActive = active === type
        const count = counts[type] || 0
        if (count === 0) return null
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              background: isActive ? color : color + '1a',
              color: isActive ? '#fff' : text,
              border: `2px solid ${color}`,
              borderRadius: 10,
              padding: '6px 14px',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isActive ? `2px 2px 0px ${color}88` : 'none',
              transition: 'all 0.12s',
            }}
          >
            {label} ({count})
          </button>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function IdeaBank() {
  const { user } = useAuth()

  const [ideas, setIdeas]               = useState([])
  const [calendarPosts, setCalendarPosts] = useState([])
  const [filter, setFilter]             = useState(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [toast, setToast]               = useState({ visible: false, message: '' })

  const updateTimers = useRef(new Map())

  useEffect(() => {
    if (!user) return
    Promise.all([getIdeas(user.id), getCalendarPosts(user.id)]).then(([ideasData, postsData]) => {
      setIdeas(ideasData)
      setCalendarPosts(postsData)
      setIsLoading(false)
    })
  }, [user])

  function showToast(msg) {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200)
  }

  const handleUpdate = useCallback((id, patch) => {
    setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, ...patch } : idea))
    if (updateTimers.current.has(id)) clearTimeout(updateTimers.current.get(id))
    updateTimers.current.set(id, setTimeout(() => {
      dbUpdateIdea(id, patch, user?.id)
      updateTimers.current.delete(id)
    }, 500))
  }, [user])

  function handleDelete(id) {
    const idea = ideas.find(i => i.id === id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    dbDeleteIdea(id, user?.id)
    if (idea?.scheduled_date) {
      const post = calendarPosts.find(p => p.idea_id === id)
      if (post) dbDeleteCalendarPost(post.id, user?.id)
      setCalendarPosts(prev => prev.filter(p => p.idea_id !== id))
    }
    showToast('idea deleted')
  }

  function scheduleIdea(id, date) {
    const idea = ideas.find(i => i.id === id)

    setIdeas(prev => prev.map(i => i.id === id ? { ...i, scheduled_date: date } : i))
    dbUpdateIdea(id, { scheduled_date: date }, user?.id)

    const existingPost = calendarPosts.find(p => p.idea_id === id)
    if (existingPost) {
      dbDeleteCalendarPost(existingPost.id, user?.id)
      setCalendarPosts(prev => prev.filter(p => p.idea_id !== id))
    }

    if (date) {
      const newPost = {
        id: `${id}_${date}`,
        idea_id: id,
        date,
        label: idea?.body?.slice(0, 60) ?? 'idea',
        type: idea?.content_type ?? 'building',
        posted: false,
      }
      setCalendarPosts(prev => [newPost, ...prev])
      insertCalendarPost(newPost, user?.id)
      showToast('added to calendar!')
    }
  }

  const counts = ideas.reduce((acc, idea) => {
    const t = idea.content_type || 'building'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const visible = filter ? ideas.filter(i => i.content_type === filter) : ideas

  return (
    <div>
      <Toast visible={toast.visible} message={toast.message} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
          Idea Bank
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#888', margin: 0, fontSize: 14 }}>
          {isLoading
            ? 'loading...'
            : ideas.length > 0
              ? `${ideas.length} idea${ideas.length !== 1 ? 's' : ''} · click any field to edit`
              : 'capture everything, filter later'}
        </p>
      </div>

      <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {ideas.length > 0 && (
          <FilterBar active={filter} counts={counts} onChange={setFilter} />
        )}

        {!isLoading && ideas.length === 0 && (
          <div style={{
            border: '2px dashed #d0cdc8',
            borderRadius: 20,
            padding: '56px 32px',
            textAlign: 'center',
            maxWidth: 440,
            marginTop: 12,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💡</div>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
              color: '#bbb', margin: '0 0 8px',
            }}>no ideas yet — go journal your day!</p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 13,
              color: '#ccc', margin: 0, lineHeight: 1.6,
            }}>write in your journal and hit "generate ideas →"<br />to start building your bank</p>
          </div>
        )}

        {ideas.length > 0 && visible.length === 0 && (
          <div style={{
            border: '2px dashed #d0cdc8', borderRadius: 16,
            padding: '36px 24px', textAlign: 'center', maxWidth: 360,
          }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#bbb', margin: 0 }}>
              no {filter} ideas yet
            </p>
          </div>
        )}

        {visible.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}>
            {visible.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onSchedule={scheduleIdea}
                calendarPosts={calendarPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
