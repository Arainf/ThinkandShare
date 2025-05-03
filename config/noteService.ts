// noteService.js
import { supabase } from '@/config/supabaseClient';
import { uploadImage } from '@/config/supabaseStorage';
import { addTagsToNote, removeAllTagsFromNote } from './tagsService';

// Create a new note with tags
export const createNote = async (noteData, imageUri = null) => {
  try {
    // Get the current user ID
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    let coverImageUrl = null;
    
    // Upload image if provided
    if (imageUri) {
      coverImageUrl = await uploadImage(imageUri, userId);
    }
    
    // Extract tags from noteData for separate handling
    const { tags: tagIds, ...noteFields } = noteData;
    
    // Insert the note
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...noteFields,
        user_id: userId,
        cover_image_url: coverImageUrl,
        created_at: new Date(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // If we have tags, add them to the note
    if (tagIds && tagIds.length > 0) {
      await addTagsToNote(data.id, tagIds);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Get a note by ID with its tags
export const getNoteById = async (noteId) => {
  try {
    // Get the note
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();
    
    if (error) throw error;
    
    // Get the tags for this note
    const { data: noteTags, error: tagsError } = await supabase
      .from('note_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('note_id', noteId);
    
    if (tagsError) throw tagsError;
    
    // Format the response
    const tags = noteTags.map(item => ({
      id: item.tags.id,
      name: item.tags.name,
      color: item.tags.color
    }));
    
    return { ...note, tags };
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
};

// Update an existing note
export const updateNote = async (noteId, noteData, imageUri = null) => {
  try {
    // Get the current user ID
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // First check if the note belongs to the user
    const { data: existingNote, error: noteError } = await supabase
      .from('notes')
      .select('user_id, cover_image_url')
      .eq('id', noteId)
      .single();
    
    if (noteError) throw noteError;
    
    if (existingNote.user_id !== userId) {
      throw new Error('Not authorized to update this note');
    }
    
    // Extract tags for separate handling
    const { tags: tagIds, ...noteFields } = noteData;
    
    let coverImageUrl = existingNote.cover_image_url;
    
    // Handle image updates
    if (imageUri === null && existingNote.cover_image_url) {
      // User wants to remove the image
      coverImageUrl = null;
    } else if (imageUri && imageUri !== existingNote.cover_image_url) {
      // User wants to update the image
      coverImageUrl = await uploadImage(imageUri, userId);
    }
    
    // Update the note
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...noteFields,
        cover_image_url: coverImageUrl,
        updated_at: new Date()
      })
      .eq('id', noteId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Handle tags - first remove all existing tags
    await removeAllTagsFromNote(noteId);
    
    // Then add the new tags
    if (tagIds && tagIds.length > 0) {
      await addTagsToNote(noteId, tagIds);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Get all notes for the current user
export const getUserNotes = async (limit = 10, offset = 0) => {
  try {
    // Get the current user ID
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // Get notes
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // For each note, get its tags
    const notesWithTags = await Promise.all(notes.map(async (note) => {
      const { data: noteTags, error: tagsError } = await supabase
        .from('note_tags')
        .select('tag_id, tags(id, name, color)')
        .eq('note_id', note.id);
      
      if (tagsError) throw tagsError;
      
      const tags = noteTags.map(item => ({
        id: item.tags.id,
        name: item.tags.name,
        color: item.tags.color
      }));
      
      return { ...note, tags };
    }));
    
    return notesWithTags;
  } catch (error) {
    console.error('Error fetching user notes:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId) => {
  try {
    // Get the current user ID
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // Check if the note belongs to the user
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single();
    
    if (noteError) throw noteError;
    
    if (note.user_id !== userId) {
      throw new Error('Not authorized to delete this note');
    }
    
    // Delete the note (note_tags will be deleted automatically via cascade)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};