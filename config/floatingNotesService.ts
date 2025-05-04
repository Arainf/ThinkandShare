// floatingNotesService.ts
import { supabase } from '@/config/supabaseClient'
import { FloatingNote } from './notesService'

// Fetch floating notes for a specific note
export async function fetchFloatingNotes(noteId: string): Promise<FloatingNote[]> {
  const { data, error } = await supabase
    .from('floating_notes')
    .select(`
      *,
      profiles:user_id (
        profile_image
      )
    `)
    .eq('note_id', noteId)

  if (error) {
    console.error('Error fetching floating notes:', error)
    return []
  }

  // Transform the data to match your FloatingNote interface
  const floatingNotes: FloatingNote[] = data.map((item: any) => {
    // Get profile info from the profiles relation
    const profileInfo = item.profiles || {}
    
    return {
      id: item.id,
      text: item.text,
      emoji: item.emoji,
      profileImage: profileInfo.profile_image || null,
      position: {
        x: item.position_x || 0,
        y: item.position_y || 0
      }
    }
  })

  return floatingNotes
}

// Add a new floating note
export async function addFloatingNote(
  noteId: string,
  userId: string,
  text: string,
  position: { x: number, y: number },
  emoji?: string
): Promise<FloatingNote | null> {
  const { data, error } = await supabase
    .from('floating_notes')
    .insert({
      note_id: noteId,
      user_id: userId,
      text,
      position_x: position.x,
      position_y: position.y,
      emoji
    })
    .select(`
      *,
      profiles:user_id (
        profile_image
      )
    `)
    .single()

  if (error) {
    console.error('Error adding floating note:', error)
    return null
  }

  // Get profile info from the profiles relation
  const profileInfo = data.profiles || {}
  
  return {
    id: data.id,
    text: data.text,
    emoji: data.emoji,
    profileImage: profileInfo.profile_image || null,
    position: {
      x: data.position_x || 0,
      y: data.position_y || 0
    }
  }
}

// Delete a floating note
export async function deleteFloatingNote(floatingNoteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('floating_notes')
    .delete()
    .eq('id', floatingNoteId)

  return !error
}

// Update a floating note position
export async function updateFloatingNotePosition(
  floatingNoteId: string,
  position: { x: number, y: number }
): Promise<boolean> {
  const { error } = await supabase
    .from('floating_notes')
    .update({
      position_x: position.x,
      position_y: position.y
    })
    .eq('id', floatingNoteId)

  return !error
}