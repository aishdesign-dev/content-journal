import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(undefined) // undefined = not yet loaded
  const [authLoading, setAuthLoading] = useState(true)
  const initialised = useRef(false) // true once getSession() has resolved

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data ?? null) // null = user exists but no profile row yet
    return data
  }

  useEffect(() => {
    let mounted = true

    // getSession() is the single source of truth for the initial auth state.
    // authLoading goes true → false exactly once, here, and never again.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await fetchProfile(u.id)
      } else {
        setProfile(null)
      }
      initialised.current = true
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      // Let getSession() handle startup; skip any events that fire before it resolves.
      if (!initialised.current) return
      // TOKEN_REFRESHED fires silently on tab focus — nothing meaningful has changed.
      if (event === 'TOKEN_REFRESHED') return

      const u = session?.user ?? null
      setUser(u)
      if (u) {
        // Don't reset profile to undefined (which shows the spinner) if we already
        // have this user's profile loaded. SIGNED_IN can re-fire on tab focus for
        // an already-authenticated user — in that case keep the existing profile
        // visible and let fetchProfile update it silently in the background.
        setProfile(prev => (prev?.id === u.id ? prev : undefined))
        await fetchProfile(u.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function updateProfile(updates) {
    if (!user) return { error: new Error('not authenticated') }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single()
    if (!error && data) setProfile(data)
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, authLoading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
