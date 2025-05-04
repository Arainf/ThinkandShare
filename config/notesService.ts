// notesService.ts
import { supabase } from '@/config/supabaseClient'

export interface FloatingNote {
  id: string
  text: string
  profileImage?: string
  position?: {
    x: number
    y: number
  }
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
  author_profile_image?: string
  is_saved?: boolean
  is_archived?: boolean
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
  currentUserId?: string
}): Promise<Note[]> {
  const { feedType, userId, limit = 20, offset = 0, tagId, currentUserId } = options

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
      ),
      comments:comments (
        id
      ),
      floatingNotes:floating_notes (
        id,
        text,
        position_x,
        position_y,
        profiles:user_id (
          profile_image
        )
      )
    `)

  // Add conditions based on feed type
  switch (feedType) {
    case FeedType.MAIN:
      // Public notes for main feed
      console.log('Fetching main feed - showing all public posts')
      query = query.eq('is_public', true).eq('is_archived', false)
      break
    case FeedType.USER:
      // Notes from a specific user
      if (!userId) throw new Error('userId is required for user feed');
      console.log('Fetching notes for user:', userId);
      query = query.eq('user_id', userId).eq('is_archived', false);
      break
    case FeedType.SAVED:
      // For saved notes, we'd need a junction table
      if (!userId) throw new Error('userId is required for saved feed')
      // This assumes you have a saved_notes table with user_id and note_id columns
      query = query
        .eq('is_archived', false)
        .in('id', (await supabase
          .from('saved_notes')
          .select('note_id')
          .eq('user_id', userId)
        ).data?.map(item => item.note_id) || [])
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
    const tagNoteIds = (await supabase
      .from('note_tags')
      .select('note_id')
      .eq('tag_id', tagId)
    ).data?.map(item => item.note_id) || [];

    query = query.in('id', tagNoteIds);
    
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

  // If we have a currentUserId, check which notes are saved
  let savedNoteIds: string[] = []
  if (currentUserId) {
    const { data: savedData } = await supabase
      .from('saved_notes')
      .select('note_id')
      .eq('user_id', currentUserId)
    
    if (savedData) {
      savedNoteIds = savedData.map(item => item.note_id)
    }
  }

  // Transform the data to match your Note interface
  const notes: Note[] = data.map((item: any) => {
    // Get author info from the profiles relation
    const authorInfo = item.profiles || {}
    // Get tag info from the note_tags relation
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

    // Map floating notes
    const floatingNotes: FloatingNote[] = item.floatingNotes?.map((note: any) => ({
      id: note.id,
      text: note.text,
      emoji: note.emoji,
      profileImage: note.profiles?.profile_image,
      position: {
        x: note.position_x || 0,
        y: note.position_y || 0
      }
    })) || []

    const note = {
      id: item.id,
      title: item.title || 'Untitled Note',
      content: item.content || '',
      author_profile_image: authorInfo.profile_image || 'default_profile_image.png',
      author: authorInfo.full_name || 'Unknown Author',
      date: formattedDate,
      likes: item.likes || 0,
      comments: item.comments?.length || 0,
      shares: item.shares || 0,
      tag: tagInfo.name || 'default',
      cover_image_url: item.cover_image_url,
      is_public: item.is_public,
      user_id: item.user_id,
      floatingNotes,
      backgroundColor: item.background_color || tagInfo.color || '#3b82f6',
      created_at: item.created_at,
      is_archived: item.is_archived || false,
      is_saved: currentUserId ? savedNoteIds.includes(item.id) : false
    }
    console.log('Transformed note:', note)
    return note
  })

  console.log('Total notes returned:', notes.length)
  return notes
}

// Function to fetch a single note by ID
export async function fetchNoteById(noteId: string, currentUserId?: string): Promise<Note | null> {
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
      ),
      comments:comments (
        id
      ),
      floatingNotes:floating_notes (
        id,
        text,
        position_x,
        position_y,
        profiles:user_id (
          profile_image
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

  // Check if this note is saved by the current user
  let isSaved = false
  if (currentUserId) {
    const { data: savedData, error: savedError } = await supabase
      .from('saved_notes')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('note_id', noteId)
      .single()
    
    if (!savedError && savedData) {
      isSaved = true
    }
  }

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

  // Map floating notes
  const floatingNotes: FloatingNote[] = data.floatingNotes?.map((note: any) => ({
    id: note.id,
    text: note.text,
    profileImage: note.profiles?.profile_image,
    position: {
      x: note.position_x || 0,
      y: note.position_y || 0
    }
  })) || []

  return {
    id: data.id,
    title: data.title || 'Untitled Note',
    content: data.content || '',
    author: authorInfo.full_name || 'Unknown Author',
    author_profile_image: authorInfo.profile_image || 'default_profile_image.png',
    date: formattedDate,
    likes: data.likes || 0,
    comments: data.comments?.length || 0,
    shares: data.shares || 0,
    tag: tagInfo.name,
    cover_image_url: data.cover_image_url,
    is_public: data.is_public,
    user_id: data.user_id,
    floatingNotes,
    backgroundColor: data.background_color || tagInfo.color || '#3b82f6',
    created_at: data.created_at,
    is_archived: data.is_archived || false,
    is_saved: isSaved
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

  if (error) {
    console.error('Error saving note:', error)
    return false
  }
  
  return true
}

// Function to unsave a note
export async function unsaveNote(userId: string, noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_notes')
    .delete()
    .eq('user_id', userId)
    .eq('note_id', noteId)

  if (error) {
    console.error('Error unsaving note:', error)
    return false
  }

  return true
}

// Function to archive a note
export async function archiveNote(noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .update({ is_archived: true })
    .eq('id', noteId)

  if (error) {
    console.error('Error archiving note:', error)
    return false
  }

  return true
}

// Function to unarchive a note
export async function unarchiveNote(noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .update({ is_archived: false })
    .eq('id', noteId)

  if (error) {
    console.error('Error unarchiving note:', error)
    return false
  }

  return true
}

// Function to like a note
export async function likeNote(noteId: string): Promise<boolean> {
  // First, get the current likes count
  const { data, error: fetchError } = await supabase
    .from('notes')
    .select('likes')
    .eq('id', noteId)
    .single()

  if (fetchError) {
    console.error('Error fetching note likes:', fetchError)
    return false
  }

  // Increment the likes count
  const newLikes = (data.likes || 0) + 1
  const { error: updateError } = await supabase
    .from('notes')
    .update({ likes: newLikes })
    .eq('id', noteId)

  if (updateError) {
    console.error('Error updating note likes:', updateError)
    return false
  }

  return true
}

// Function to unlike a note
export async function unlikeNote(noteId: string): Promise<boolean> {
  // First, get the current likes count
  const { data, error: fetchError } = await supabase
    .from('notes')
    .select('likes')
    .eq('id', noteId)
    .single()

  if (fetchError) {
    console.error('Error fetching note likes:', fetchError)
    return false
  }

  // Decrement the likes count, but ensure it doesn't go below 0
  const newLikes = Math.max(0, (data.likes || 0) - 1)
  const { error: updateError } = await supabase
    .from('notes')
    .update({ likes: newLikes })
    .eq('id', noteId)

  if (updateError) {
    console.error('Error updating note likes:', updateError)
    return false
  }

  return true
}

// Function to increment share count
export async function incrementShareCount(noteId: string): Promise<boolean> {
  // First, get the current shares count
  const { data, error: fetchError } = await supabase
    .from('notes')
    .select('shares')
    .eq('id', noteId)
    .single()

  if (fetchError) {
    console.error('Error fetching note shares:', fetchError)
    return false
  }

  // Increment the shares count
  const newShares = (data.shares || 0) + 1
  const { error: updateError } = await supabase
    .from('notes')
    .update({ shares: newShares })
    .eq('id', noteId)

  if (updateError) {
    console.error('Error updating note shares:', updateError)
    return false
  }

  return true
}

// Function to update a note
export async function updateNote(noteId: string, updatedData: Partial<Note>): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .update(updatedData)
    .eq('id', noteId);

  if (error) {
    console.error('Error updating note:', error);
    return false;
  }

  return true;
}

// Function to delete a note
export async function deleteNote(noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
}