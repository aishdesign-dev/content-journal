import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import Login from './Login.jsx'
import Onboarding from './Onboarding.jsx'
import Settings from './Settings.jsx'
import Journal from './Journal.jsx'
import IdeaBank from './IdeaBank.jsx'
import CalendarPage from './Calendar.jsx'
import Trending from './Trending.jsx'

const NAV_ITEMS = [
  {
    id: 'journal',
    label: 'Journal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    accent: '#8B5CF6',
  },
  {
    id: 'ideas',
    label: 'Idea Bank',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
    ),
    accent: '#FFD93D',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    accent: '#6BFFB8',
  },
  {
    id: 'trending',
    label: 'Trending',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    accent: '#FF6B6B',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    accent: '#8B5CF6',
  },
]

const VIEWS = {
  journal:  Journal,
  ideas:    IdeaBank,
  calendar: CalendarPage,
  trending: Trending,
  settings: Settings,
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #8B5CF633',
        borderTopColor: '#8B5CF6',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const { user, profile, authLoading, signOut } = useAuth()
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem('cj_active_view')
    return saved && VIEWS[saved] ? saved : 'journal'
  })

  function navigate(view) {
    setActive(view)
    localStorage.setItem('cj_active_view', view)
  }

  if (authLoading || profile === undefined) return <LoadingScreen />
  if (!user) return <Login />
  if (!profile || !profile.onboarding_complete) return <Onboarding />

  const ActiveView = VIEWS[active]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAF7' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        minHeight: '100vh',
        background: '#fff',
        borderRight: '2px solid #1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '36px', paddingLeft: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#8B5CF6',
              borderRadius: '10px',
              border: '2px solid #1a1a2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px #1a1a2e',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.3px' }}>Content<br/>Journal</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: isActive ? `2px solid #1a1a2e` : '2px solid transparent',
                  background: isActive ? item.accent : 'transparent',
                  color: isActive ? (item.accent === '#FFD93D' ? '#1a1a2e' : '#fff') : '#666',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '3px 3px 0px #1a1a2e' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout button */}
        <button
          onClick={signOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '2px solid #e0ddd6',
            background: 'transparent',
            color: '#aaa',
            fontFamily: 'Syne, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
            marginBottom: '10px',
            marginTop: '8px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#FF6B6B'
            e.currentTarget.style.color = '#FF6B6B'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e0ddd6'
            e.currentTarget.style.color = '#aaa'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          log out
        </button>

        {/* Credit tag */}
        <div style={{
          background: '#FFD93D',
          border: '2px solid #1a1a2e',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: '3px 3px 0px #1a1a2e',
        }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#1a1a2e' }}>
            made with love by{' '}
            <a
              href="https://x.com/aishdesign"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1a1a2e', fontWeight: 700, textDecoration: 'underline' }}
            >@aishdesign</a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <ActiveView />
      </main>
    </div>
  )
}
