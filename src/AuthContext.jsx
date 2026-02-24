import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(undefined) // undefined = not yet loaded
  const [authLoading, setAuthLoading] = useState(true)

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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await fetchProfile(u.id)
      } else {
        setProfile(null)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        setProfile(undefined) // show loading screen while profile fetches, not Onboarding
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
