// commentsService.ts
import { supabase } from '@/config/supabaseClient'

export interface Comment {
  id: string
  note_id: string
  user_id: string
  content: string
  created_at: string
  author_name?: string
  author_profile_image?: string
  timestamp?: string; // Add this field
}

// Fetch comments for a specific note
export async function fetchComments(noteId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        full_name,
        profile_image
      )
    `)
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Transform the data to match your Comment interface
  const comments: Comment[] = data.map((item: any) => {
    // Get author info from the profiles relation
    const authorInfo = item.profiles || {}
    
    // Format the date
    const timestamp = formatTimestamp(new Date(item.created_at))

    return {
      id: item.id,
      note_id: item.note_id,
      user_id: item.user_id,
      content: item.content,
      created_at: item.created_at,
      author_name: authorInfo.full_name || 'Unknown User',
      author_profile_image: authorInfo.profile_image || null,
      timestamp // Add a formatted timestamp for display
    }
  })

  return comments
}

// Add a new comment
export async function addComment(
  noteId: string,
  userId: string,
  content: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      note_id: noteId,
      user_id: userId,
      content
    })
    .select(`
      *,
      profiles:user_id (
        full_name,
        profile_image
      )
    `)
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return null
  }

  // Format the comment for return
  const authorInfo = data.profiles || {}
  const timestamp = formatTimestamp(new Date(data.created_at))
  
  return {
    id: data.id,
    note_id: data.note_id,
    user_id: data.user_id,
    content: data.content,
    created_at: data.created_at,
    author_name: authorInfo.full_name || 'Unknown User',
    author_profile_image: authorInfo.profile_image || null,
    timestamp
  }
}

// Delete a comment
export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  return !error
}

// Function to update a comment
export async function updateComment(commentId: string, updatedContent: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ content: updatedContent })
    .eq('id', commentId);

  if (error) {
    console.error('Error updating comment:', error);
    return false;
  }

  return true;
}

// Get comment count for a note
export async function getCommentCount(noteId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('note_id', noteId)

  if (error) {
    console.error('Error getting comment count:', error)
    return 0
  }

  return count || 0
}

// Helper function to format timestamps in a human-readable way
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'Just now'
  } else if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}