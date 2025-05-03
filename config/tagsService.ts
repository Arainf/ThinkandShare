// tagsService.js
import { supabase } from '@/config/supabaseClient';

// Interface for the tags table
// We'll set up a table with predefined tags and colors
// SQL for creating the table in Supabase:
/*
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data
INSERT INTO tags (name, color) VALUES 
  ('Technology', '#3B82F6'),
  ('Personal', '#10B981'),
  ('Work', '#F59E0B'),
  ('Ideas', '#8B5CF6'),
  ('Health', '#EC4899'),
  ('Finance', '#6366F1'),
  ('Travel', '#14B8A6'),
  ('Education', '#F97316'),
  ('Books', '#A855F7'),
  ('Projects', '#EF4444');
*/

// Get all predefined tags
export const fetchAllTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

// We also need to create a junction table for note_tags
// SQL for creating the junction table:
/*
CREATE TABLE note_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, tag_id)
);

-- Add index for better performance
CREATE INDEX note_tags_note_id_idx ON note_tags(note_id);
CREATE INDEX note_tags_tag_id_idx ON note_tags(tag_id);
*/

// Add tags to a note
interface NoteTag {
   note_id: string;
   tag_id: string;
}

export const addTagsToNote = async (noteId: string, tagIds: string[]): Promise<NoteTag[]> => {
   try {
      const tagRows: NoteTag[] = tagIds.map(tagId => ({
         note_id: noteId,
         tag_id: tagId
      }));
      
      const { data, error } = await supabase
         .from<NoteTag>('note_tags')
         .insert(tagRows);
      
      if (error) throw error;
      return data || [];
   } catch (error) {
      console.error('Error adding tags to note:', error);
      throw error;
   }
};

// Get tags for a specific note
interface NoteTagWithTag {
   tags: {
      id: string;
      name: string;
      color: string;
      created_at: string;
   };
}

export const getTagsForNote = async (noteId: string): Promise<NoteTagWithTag['tags'][]> => {
   try {
      const { data, error } = await supabase
         .from<NoteTagWithTag>('note_tags')
         .select('tags(*)')
         .eq('note_id', noteId);
      
      if (error) throw error;
      // Flatten the response to get just the tags
      return data?.map(item => item.tags) || [];
   } catch (error) {
      console.error('Error fetching note tags:', error);
      throw error;
   }
};

// Remove all tags from a note (useful when updating)
interface RemoveTagsResponse {
   data: any; // Replace `any` with the appropriate type if known
   error: any; // Replace `any` with the appropriate type if known
}

export const removeAllTagsFromNote = async (noteId: string): Promise<boolean> => {
   try {
      const { data, error }: RemoveTagsResponse = await supabase
         .from('note_tags')
         .delete()
         .eq('note_id', noteId);
      
      if (error) throw error;
      return true;
   } catch (error) {
      console.error('Error removing tags from note:', error);
      throw error;
   }
};