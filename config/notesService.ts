// notesService.ts
import { supabase } from '@/config/supabaseClient'

export interface FloatingNote {
  id: string
  text: string
  emoji?: string
  profileImage?: string
}

export interface Note {
  id: string
  title: string
  content: string
  author: string
  date: string
  likes: number
  comments: number
  shares?: number
  tag: string
  cover_image_url?: string
  is_public: boolean
  user_id: string
  floatingNotes?: FloatingNote[]
  backgroundColor?: string
  created_at: string
}

export enum FeedType {
  MAIN = 'main',        // All public notes
  USER = 'user',        // Notes from a specific user
  SAVED = 'saved',      // Saved notes (would need a saved_notes junction table)
  ARCHIVED = 'archived' // Archived notes (would need an is_archived field)
}

export async function fetchNotes(options: {
  feedType: FeedType
  userId?: string
  limit?: number
  offset?: number
  tagId?: string
}): Promise<Note[]> {
  const { feedType, userId, limit = 20, offset = 0, tagId } = options

  console.log('Fetching notes with options:', { feedType, userId, limit, offset, tagId })

  // Start building the query
  let query = supabase
    .from('notes')
    .select(`
      *,
      profiles:user_id (
        full_name,
        display_name,
        profile_image
      ),
      note_tags (
        tag_id,
        tags (
          name,
          color
        )
      )
    `)

  // Add conditions based on feed type
  switch (feedType) {
    case FeedType.MAIN:
      // Public notes for main feed
      console.log('Fetching main feed - showing all public posts')
      query = query.eq('is_public', true)
      break
    case FeedType.USER:
      // Notes from a specific user
      if (!userId) throw new Error('userId is required for user feed')
      query = query.eq('user_id', userId)
      break
    case FeedType.SAVED:
      // For saved notes, we'd need a junction table
      if (!userId) throw new Error('userId is required for saved feed')
      // This assumes you have a saved_notes table with user_id and note_id columns
      query = query
        .eq('notes.id', supabase
          .from('saved_notes')
          .select('note_id')
          .eq('user_id', userId)
        )
      break
    case FeedType.ARCHIVED:
      // For archived notes, we'd need an is_archived field
      if (!userId) throw new Error('userId is required for archive feed')
      query = query
        .eq('user_id', userId)
        .eq('is_archived', true)
      break
  }

  // Filter by tag if provided
  if (tagId) {
    query = query.exists('note_tags', { tag_id: tagId })
  }

  // Add pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Execute the query
  const { data, error } = await query

  if (error) {
    console.error('Error fetching notes:', error)
    return []
  }

  console.log('Raw data from database:', data)

  // Transform the data to match your Note interface
  const notes: Note[] = data.map((item: any) => {
    // Get author info from the profiles relation
    const authorInfo = item.profiles || {}
    // Make tag info optional
    const tagInfo = item.note_tags?.[0]?.tags || { name: 'default', color: '#3b82f6' }

    // Format the date (you can adjust this based on your needs)
    const date = new Date(item.created_at)
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })

    const note = {
      id: item.id,
      title: item.title || 'Untitled Note',
      content: item.content || '',
      author_profile_image: authorInfo.profile_image || 'default_profile_image.png',
      author: authorInfo.full_name || 'Unknown Author',
      date: formattedDate,
      likes: item.likes || 0,
      comments: item.comments || 0,
      shares: item.shares || 0,
      tag: tagInfo.name || 'default',
      cover_image_url: item.cover_image_url,
      is_public: item.is_public,
      user_id: item.user_id,
      floatingNotes: [],
      backgroundColor: item.background_color || tagInfo.color || '#3b82f6',
      created_at: item.created_at
    }
    console.log('Transformed note:', note)
    return note
  })

  console.log('Total notes returned:', notes.length)
  return notes
}

// Function to fetch a single note by ID
export async function fetchNoteById(noteId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles:user_id (
        full_name,
        display_name,
        profile_image
      ),
      note_tags (
        tag_id,
        tags (
          name,
          color
        )
      )
    `)
    .eq('id', noteId)
    .single()

  if (error) {
    console.error('Error fetching note:', error)
    return null
  }

  if (!data) return null

  // Format similarly to the fetchNotes function
  const authorInfo = data.profiles || {}
  const tagInfo = data.note_tags?.[0]?.tags || { name: 'default', color: '#3b82f6' }

  const date = new Date(data.created_at)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })

  // Placeholder for floating notes
  const floatingNotes: FloatingNote[] = []

  return {
    id: data.id,
    title: data.title || 'Untitled Note',
    content: data.content || '',
    author: authorInfo.full_name || 'Unknown Author',
    date: formattedDate,
    likes: data.likes || 0,
    comments: data.comments || 0,
    shares: data.shares || 0,
    tag: tagInfo.name,
    cover_image_url: data.cover_image_url,
    is_public: data.is_public,
    user_id: data.user_id,
    floatingNotes,
    backgroundColor: data.background_color || tagInfo.color || '#3b82f6',
    created_at: data.created_at
  }
}

// Function to handle image URLs from the note_images bucket
export function getNoteImageUrl(path: string): string {
  const { data } = supabase.storage.from('note_images').getPublicUrl(path)
  return data.publicUrl
}

// Function to upload an image to the note_images bucket
export async function uploadNoteImage(file: File, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('note_images')
    .upload(path, file)

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  return getNoteImageUrl(data.path)
}

// Function to save a note
export async function saveNote(userId: string, noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_notes')
    .insert({ user_id: userId, note_id: noteId })

  return !error
}

// Function to unsave a note
export async function unsaveNote(userId: string, noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_notes')
    .delete()
    .eq('user_id', userId)
    .eq('note_id', noteId)

  return !error
}

// Function to archive a note (assuming you add an is_archived column)
export async function archiveNote(noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .update({ is_archived: true })
    .eq('id', noteId)

  return !error
}

// Function to unarchive a note
export async function unarchiveNote(noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .update({ is_archived: false })
    .eq('id', noteId)

  return !error
}