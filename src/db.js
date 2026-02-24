import { supabase } from './supabase.js'

// ── Journal entries ────────────────────────────────────────────────────────────

export async function getJournalEntry(date) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('date', date)
    .maybeSingle()
  if (error) console.error('getJournalEntry:', error)
  return data
}

export async function upsertJournalEntry(date, fields) {
  const { error } = await supabase
    .from('journal_entries')
    .upsert({ date, ...fields, updated_at: new Date().toISOString() })
  if (error) console.error('upsertJournalEntry:', error)
}

export async function getAllJournalEntries() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('date', { ascending: false })
  if (error) console.error('getAllJournalEntries:', error)
  return data ?? []
}

// ── Ideas ─────────────────────────────────────────────────────────────────────

export async function getIdeas() {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) console.error('getIdeas:', error)
  return data ?? []
}

export async function insertIdea(idea) {
  const { error } = await supabase.from('ideas').insert(idea)
  if (error) { console.error('insertIdea:', error); throw error }
}

export async function updateIdea(id, fields) {
  const { error } = await supabase.from('ideas').update(fields).eq('id', id)
  if (error) console.error('updateIdea:', error)
}

export async function deleteIdea(id) {
  const { error } = await supabase.from('ideas').delete().eq('id', id)
  if (error) console.error('deleteIdea:', error)
}

// ── Calendar posts ────────────────────────────────────────────────────────────

export async function getCalendarPosts() {
  const { data, error } = await supabase.from('calendar_posts').select('*')
  if (error) console.error('getCalendarPosts:', error)
  return data ?? []
}

export async function insertCalendarPost(post) {
  const { error } = await supabase.from('calendar_posts').insert(post)
  if (error) console.error('insertCalendarPost:', error)
}

export async function updateCalendarPost(id, fields) {
  const { error } = await supabase.from('calendar_posts').update(fields).eq('id', id)
  if (error) console.error('updateCalendarPost:', error)
}

export async function deleteCalendarPost(id) {
  const { error } = await supabase.from('calendar_posts').delete().eq('id', id)
  if (error) console.error('deleteCalendarPost:', error)
}
