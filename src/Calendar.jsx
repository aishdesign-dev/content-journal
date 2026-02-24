import { useState, useRef, useEffect } from 'react'
import {
  getCalendarPosts,
  getIdeas,
  updateCalendarPost,
  deleteCalendarPost,
  updateIdea,
} from './db.js'
import { useAuth } from './AuthContext.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS   = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']

const TODAY_STR = new Date().toISOString().slice(0, 10)

function buildDayMap(entries, ideas) {
  const byId = Object.fromEntries(ideas.map(i => [i.id, i]))
  const map = {}
  for (const e of entries) {
    const idea = byId[e.idea_id]
    const enriched = {
      ...e,
      body:         idea?.body        ?? e.label ?? '',
      image_idea:   idea?.image_idea  ?? '',
      content_type: e.type ?? idea?.content_type ?? 'building',
    }
    if (!map[e.date]) map[e.date] = []
    map[e.date].push(enriched)
  }
  return map
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ visible, message, accent = '#6BFFB8' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32,
      background: accent, border: '2px solid #1a1a2e', borderRadius: 14,
      padding: '12px 18px', boxShadow: '4px 4px 0px #1a1a2e',
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

// ── Post chip ─────────────────────────────────────────────────────────────────
function PostChip({ entry, isSelected, isDragging, onClick, onDragStart, onDragEnd }) {
  const { color, text } = cfg(entry.content_type)
  const posted = !!entry.posted
  return (
    <button
      draggable
      onClick={onClick}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', entry.id)
        onDragStart(entry.id)
      }}
      onDragEnd={onDragEnd}
      style={{
        display: 'block', width: '100%',
        background: posted ? '#f0ede8' : color + '22',
        border: `1.5px solid ${posted ? '#d0cdc8' : color}`,
        borderRadius: 6, padding: '3px 7px',
        fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
        color: posted ? '#ccc' : text,
        cursor: isDragging ? 'grabbing' : 'grab',
        textAlign: 'left',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: posted ? 'line-through' : 'none',
        outline: isSelected ? `2px solid ${color}` : 'none',
        outlineOffset: 1,
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 0.12s',
      }}
    >
      {(entry.body ?? entry.label ?? '').slice(0, 32) || '—'}
    </button>
  )
}

// ── Day cell ──────────────────────────────────────────────────────────────────
function DayCell({
  day, dateStr, dayEntries, isToday, isCurrentMonth,
  selectedId, draggingId,
  isDragOver, isDragOverFull,
  onChipClick, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}) {
  const isFull   = dayEntries.length >= 2
  const visible  = dayEntries.slice(0, 2)
  const overflow = dayEntries.length - 2

  let borderColor = isToday ? '#8B5CF6' : '#e8e5e0'
  let bg          = isToday ? '#8B5CF60d' : isCurrentMonth ? '#fff' : '#FAFAF7'
  let boxShadow   = 'none'

  if (isDragOver) {
    borderColor = isDragOverFull ? '#FB923C' : '#8B5CF6'
    bg          = isDragOverFull ? '#FB923C08' : '#8B5CF608'
    boxShadow   = `0 0 0 2px ${isDragOverFull ? '#FB923C' : '#8B5CF6'}`
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(dateStr) }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(dateStr) }}
      style={{
        minHeight: 88,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        background: bg,
        boxShadow,
        padding: '7px 7px 6px',
        display: 'flex', flexDirection: 'column', gap: 3,
        opacity: isCurrentMonth ? 1 : 0.38,
        boxSizing: 'border-box',
        transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{
          fontFamily: isToday ? 'Syne, sans-serif' : 'DM Sans, sans-serif',
          fontSize: 12, fontWeight: isToday ? 800 : 500,
          color: isToday ? '#8B5CF6' : isCurrentMonth ? '#1a1a2e' : '#bbb',
          width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%',
          background: isToday ? '#8B5CF61a' : 'transparent',
        }}>{day}</span>

        {(isFull || (isDragOver && isDragOverFull)) && (
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 8, fontWeight: 700,
            color: '#FB923C', background: '#FB923C14',
            border: '1px solid #FB923C66',
            borderRadius: 4, padding: '1px 4px',
            textTransform: 'uppercase', letterSpacing: '0.4px',
          }}>full</span>
        )}
      </div>

      {visible.map(e => (
        <PostChip
          key={e.id}
          entry={e}
          isSelected={selectedId === e.id}
          isDragging={draggingId === e.id}
          onClick={() => onChipClick(e)}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}

      {overflow > 0 && (
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: '#bbb', paddingLeft: 4 }}>
          +{overflow} more
        </span>
      )}

      {isDragOver && visible.length === 0 && (
        <div style={{
          flex: 1, border: `1.5px dashed ${isDragOverFull ? '#FB923C' : '#8B5CF6'}`,
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 28,
        }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: isDragOverFull ? '#FB923C' : '#8B5CF6' }}>drop here</span>
        </div>
      )}
    </div>
  )
}

// ── Side panel ────────────────────────────────────────────────────────────────
function SidePanel({ entry, onClose, onTogglePosted, onRemove }) {
  const { color, text, label } = cfg(entry.content_type)
  const posted = !!entry.posted
  const [copied, setCopied] = useState(false)

  function copyPost() {
    navigator.clipboard.writeText(entry.body || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const el = document.createElement('textarea')
      el.value = entry.body || ''
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div style={{
      width: 320, flexShrink: 0,
      background: '#fff',
      border: '2px solid #1a1a2e',
      borderRadius: 20,
      padding: '22px 20px',
      boxShadow: '4px 4px 0px #e0ddd6',
      position: 'sticky', top: 0,
      height: 'fit-content',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          background: color + '1a', border: `2px solid ${color}`,
          borderRadius: 8, padding: '3px 11px',
          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700,
          color: text, textTransform: 'uppercase', letterSpacing: '0.6px',
        }}>{label}</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a1a2e'}
          onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#aaa', margin: '0 0 14px' }}>
        {dateLabel}
      </p>

      <div style={{
        background: '#FAFAF7', border: '2px solid #1a1a2e',
        borderRadius: 12, padding: '14px 16px', marginBottom: 10,
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 14,
          color: posted ? '#b0adb8' : '#1a1a2e',
          lineHeight: 1.75, margin: 0,
          textDecoration: posted ? 'line-through' : 'none',
        }}>{entry.body || '—'}</p>
      </div>

      {entry.image_idea && (
        <div style={{
          background: '#FAFAF7', border: '1.5px dashed #d0cdc8',
          borderRadius: 10, padding: '10px 13px',
          marginBottom: 18, display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: '#888', fontStyle: 'italic', lineHeight: 1.55,
          }}>{entry.image_idea}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={copyPost}
          style={{
            background: copied ? '#6BFFB8' : '#1a1a2e',
            color: copied ? '#1a1a2e' : '#fff',
            border: '2px solid #1a1a2e',
            borderRadius: 10, padding: '10px 16px',
            fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s, color 0.2s',
            boxShadow: copied ? 'none' : '3px 3px 0px #55555533',
          }}
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              copied!
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              copy post
            </>
          )}
        </button>

        <button
          onClick={() => onTogglePosted(entry.id)}
          style={{
            background: posted ? '#f0ede8' : '#FFD93D',
            color: posted ? '#888' : '#1a1a2e',
            border: `2px solid ${posted ? '#d0cdc8' : '#1a1a2e'}`,
            borderRadius: 10, padding: '10px 16px',
            fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
            boxShadow: posted ? 'none' : '3px 3px 0px #1a1a2e',
          }}
        >
          {posted ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              posted — undo?
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
              mark as posted
            </>
          )}
        </button>

        <button
          onClick={() => onRemove(entry.id, entry.idea_id)}
          style={{
            background: 'transparent', color: '#FF6B6B',
            border: '2px solid #FF6B6B',
            borderRadius: 10, padding: '10px 16px',
            fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FF6B6B14'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          remove from calendar
        </button>
      </div>
    </div>
  )
}

// ── Nav button ────────────────────────────────────────────────────────────────
function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '2px solid #1a1a2e',
        borderRadius: 10, width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#1a1a2e',
        boxShadow: '2px 2px 0px #1a1a2e',
        flexShrink: 0,
      }}
    >{children}</button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Calendar() {
  const { user } = useAuth()

  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [entries, setEntries] = useState([])
  const [ideas,   setIdeas]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId,  setSelectedId]  = useState(null)
  const [dragOverDate, setDragOverDate] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const draggingId = useRef(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getCalendarPosts(user.id), getIdeas(user.id)]).then(([posts, ideasData]) => {
      setEntries(posts)
      setIdeas(ideasData)
      setIsLoading(false)
    })
  }, [user])

  function showToast(msg) {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const firstDayOfWeek  = new Date(year, month, 1).getDay()
  const daysInMonth     = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const totalCells      = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7

  function cellInfo(i) {
    let day, m, y, isCurrent
    if (i < firstDayOfWeek) {
      day = daysInPrevMonth - firstDayOfWeek + i + 1
      m   = month === 0 ? 12 : month
      y   = month === 0 ? year - 1 : year
      isCurrent = false
    } else if (i >= firstDayOfWeek + daysInMonth) {
      day = i - firstDayOfWeek - daysInMonth + 1
      m   = month === 11 ? 1 : month + 2
      y   = month === 11 ? year + 1 : year
      isCurrent = false
    } else {
      day = i - firstDayOfWeek + 1
      m   = month + 1
      y   = year
      isCurrent = true
    }
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return { day, dateStr, isCurrent }
  }

  const dayMap = buildDayMap(entries, ideas)

  const enrichedSelected = (() => {
    if (!selectedId) return null
    for (const list of Object.values(dayMap)) {
      const found = list.find(e => e.id === selectedId)
      if (found) return found
    }
    return null
  })()

  function handleChipClick(entry) {
    setSelectedId(prev => prev === entry.id ? null : entry.id)
  }

  function handleDragStart(entryId) {
    draggingId.current = entryId
  }

  function handleDragEnd() {
    draggingId.current = null
    setDragOverDate(null)
  }

  function handleDragOver(dateStr) {
    if (dragOverDate !== dateStr) setDragOverDate(dateStr)
  }

  function handleDrop(targetDate) {
    const id = draggingId.current
    draggingId.current = null
    setDragOverDate(null)

    if (!id) return
    const entry = entries.find(e => e.id === id)
    if (!entry || entry.date === targetDate) return

    const existing = (dayMap[targetDate] ?? []).filter(e => e.id !== id)

    const next = entries.map(e => e.id === id ? { ...e, date: targetDate } : e)
    setEntries(next)

    updateCalendarPost(id, { date: targetDate }, user?.id)
    updateIdea(entry.idea_id, { scheduled_date: targetDate }, user?.id)

    setIdeas(prev => prev.map(i =>
      i.id === entry.idea_id ? { ...i, scheduled_date: targetDate } : i
    ))

    if (existing.length >= 2) {
      showToast('moved! that day is pretty packed now 🗓')
    } else {
      const label = new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      showToast(`moved to ${label}`)
    }
  }

  function handleTogglePosted(entryId) {
    const entry = entries.find(e => e.id === entryId)
    const newPosted = !entry.posted
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, posted: newPosted } : e))
    updateCalendarPost(entryId, { posted: newPosted }, user?.id)
  }

  function handleRemove(entryId, ideaId) {
    setEntries(prev => prev.filter(e => e.id !== entryId))
    deleteCalendarPost(entryId, user?.id)

    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, scheduled_date: null } : i
    ))
    updateIdea(ideaId, { scheduled_date: null }, user?.id)

    setSelectedId(null)
    showToast('removed from calendar')
  }

  const postedCount    = entries.filter(e => e.posted).length
  const scheduledCount = entries.length

  return (
    <div>
      <Toast visible={toast.visible} message={toast.message} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            Calendar
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#888', margin: 0, fontSize: 14 }}>
            {isLoading
              ? 'loading...'
              : `${scheduledCount} scheduled${postedCount > 0 ? ` · ${postedCount} posted` : ''}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NavBtn onClick={prevMonth}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </NavBtn>

          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
            color: '#1a1a2e', minWidth: 155, textAlign: 'center',
          }}>{MONTHS[month]} {year}</span>

          <NavBtn onClick={nextMonth}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </NavBtn>

          {(year !== now.getFullYear() || month !== now.getMonth()) && (
            <button
              onClick={goToday}
              style={{
                background: '#FAFAF7', border: '2px solid #1a1a2e',
                borderRadius: 10, padding: '6px 14px',
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12,
                cursor: 'pointer', color: '#1a1a2e',
                boxShadow: '2px 2px 0px #1a1a2e',
              }}
            >today</button>
          )}
        </div>
      </div>

      <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {!isLoading && entries.length === 0 && (
          <div style={{
            border: '2px dashed #d0cdc8', borderRadius: 16,
            padding: '28px 24px', marginBottom: 24, maxWidth: 480,
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#bbb',
              margin: 0, lineHeight: 1.6,
            }}>
              no posts scheduled yet — go to <strong style={{ color: '#8B5CF6' }}>Idea Bank</strong> and hit "add to calendar" on any idea.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 5 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{
                  textAlign: 'center',
                  fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700,
                  color: '#aaa', padding: '4px 0',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {Array.from({ length: totalCells }, (_, i) => {
                const { day, dateStr, isCurrent } = cellInfo(i)
                const dayEntries = dayMap[dateStr] ?? []
                const targetCount = draggingId.current
                  ? dayEntries.filter(e => e.id !== draggingId.current).length
                  : dayEntries.length
                const isDragOver     = dragOverDate === dateStr
                const isDragOverFull = isDragOver && targetCount >= 2

                return (
                  <DayCell
                    key={dateStr + i}
                    day={day}
                    dateStr={dateStr}
                    dayEntries={dayEntries}
                    isToday={dateStr === TODAY_STR}
                    isCurrentMonth={isCurrent}
                    selectedId={enrichedSelected?.id ?? null}
                    draggingId={draggingId.current}
                    isDragOver={isDragOver}
                    isDragOverFull={isDragOverFull}
                    onChipClick={handleChipClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={handleDrop}
                  />
                )
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', marginTop: 20 }}>
              {Object.entries(TYPE_CONFIG).map(([type, { color, label }]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color + '44', border: `1.5px solid ${color}` }} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#aaa' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {enrichedSelected && (
            <SidePanel
              entry={enrichedSelected}
              onClose={() => setSelectedId(null)}
              onTogglePosted={handleTogglePosted}
              onRemove={handleRemove}
            />
          )}
        </div>
      </div>
    </div>
  )
}
