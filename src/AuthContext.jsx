import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(undefined) // undefined = not yet loaded
  const [authLoading, setAuthLoading] = useState(true)
  const initialised   = useRef(false)  // true once getSession() has resolved
  const currentUserId = useRef(null)   // tracks loaded user so tab-focus SIGNED_IN is a no-op

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
      currentUserId.current = u?.id ?? null
      if (u) {
        await fetchProfile(u.id)
      } else {
        setProfile(null)
      }
      initialised.current = true
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      // Let getSession() handle startup; skip events that fire before it resolves.
      if (!initialised.current) return
      // Only act on explicit sign-in/sign-out; ignore TOKEN_REFRESHED and everything else.
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return

      if (event === 'SIGNED_OUT') {
        currentUserId.current = null
        setUser(null)
        setProfile(null)
        return
      }

      // SIGNED_IN: if it's the same user (e.g. tab refocus), do nothing — profile
      // is already loaded and we never want to trigger a loading state again.
      const u = session?.user ?? null
      if (!u || u.id === currentUserId.current) return

      // Genuinely different user — update silently without ever setting profile to undefined.
      currentUserId.current = u.id
      setUser(u)
      fetchProfile(u.id)
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
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, authLoading, signOut, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
