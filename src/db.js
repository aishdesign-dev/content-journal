import { supabase } from './supabase.js'

// ── Journal entries ────────────────────────────────────────────────────────────

export async function getJournalEntry(date, userId) {
  console.log('[db] getJournalEntry date:', date, 'userId:', userId)
  if (!userId) { console.error('[db] getJournalEntry called with no userId'); return null }
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('date', date)
    .eq('user_id', userId)
    .limit(1)
  if (error) console.error('getJournalEntry error:', error)
  console.log('[db] getJournalEntry result:', data?.[0] ? 'row found' : 'no row', '| generated_ideas:', data?.[0]?.generated_ideas ? 'present' : 'null')
  return data?.[0] ?? null
}

export async function upsertJournalEntry(date, fields, userId) {
  console.log('[db] upsertJournalEntry date:', date, 'userId:', userId, 'fields:', Object.keys(fields))
  if (!userId) throw new Error('upsertJournalEntry called with no userId — user not authenticated')

  const { data: rows, error: selErr } = await supabase
    .from('journal_entries')
    .select('date')
    .eq('date', date)
    .eq('user_id', userId)
    .limit(1)

  if (selErr) throw new Error('db select: ' + selErr.message)

  const exists = (rows?.length ?? 0) > 0
  console.log('[db] upsertJournalEntry row exists:', exists)

  if (exists) {
    const { error } = await supabase
      .from('journal_entries')
      .update(fields)
      .eq('date', date)
      .eq('user_id', userId)
    if (error) throw new Error('db update: ' + error.message)
    console.log('[db] upsertJournalEntry updated ok')
  } else {
    const { error } = await supabase
      .from('journal_entries')
      .insert({ entry_text: '', date, user_id: userId, ...fields })
    if (error) throw new Error('db insert: ' + error.message)
    console.log('[db] upsertJournalEntry inserted ok')
  }
}

export async function getAllJournalEntries(userId) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) console.error('getAllJournalEntries:', error)
  return data ?? []
}

// ── Ideas ─────────────────────────────────────────────────────────────────────

export async function getIdeas(userId) {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) console.error('getIdeas:', error)
  return data ?? []
}

export async function insertIdea(idea, userId) {
  const { error } = await supabase.from('ideas').insert({ ...idea, user_id: userId })
  if (error) { console.error('insertIdea:', error); throw error }
}

export async function updateIdea(id, fields, userId) {
  let q = supabase.from('ideas').update(fields).eq('id', id)
  if (userId) q = q.eq('user_id', userId)
  const { error } = await q
  if (error) console.error('updateIdea:', error)
}

export async function deleteIdea(id, userId) {
  let q = supabase.from('ideas').delete().eq('id', id)
  if (userId) q = q.eq('user_id', userId)
  const { error } = await q
  if (error) console.error('deleteIdea:', error)
}

// ── Calendar posts ────────────────────────────────────────────────────────────

export async function getCalendarPosts(userId) {
  const { data, error } = await supabase
    .from('calendar_posts')
    .select('*')
    .eq('user_id', userId)
  if (error) console.error('getCalendarPosts:', error)
  return data ?? []
}

export async function insertCalendarPost(post, userId) {
  const { error } = await supabase.from('calendar_posts').insert({ ...post, user_id: userId })
  if (error) console.error('insertCalendarPost:', error)
}

export async function updateCalendarPost(id, fields, userId) {
  let q = supabase.from('calendar_posts').update(fields).eq('id', id)
  if (userId) q = q.eq('user_id', userId)
  const { error } = await q
  if (error) console.error('updateCalendarPost:', error)
}

export async function deleteCalendarPost(id, userId) {
  let q = supabase.from('calendar_posts').delete().eq('id', id)
  if (userId) q = q.eq('user_id', userId)
  const { error } = await q
  if (error) console.error('deleteCalendarPost:', error)
}
