// This file contains the Supabase backend implementation for the NotePosting component

// 1. First, let's set up the Supabase bucket for image storage
// Create a file called 'supabaseStorage.js' in your config folder

// supabaseStorage.js
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';

// Initialize the storage bucket (run this once in your app initialization)
export const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'note-images') ?? false;
    
    if (!bucketExists) {
      // Create the bucket with public access
      const { data, error } = await supabase.storage.createBucket('note-images', {
        public: true, // Makes files publicly accessible
        fileSizeLimit: 5242880, // 5MB limit per file
      });
      
      if (error) throw error;
      console.log('Created note-images bucket:', data);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Helper function to get MIME type
const getMimeType = (uri: string): string => {
   const extension = uri?.split('.').pop()?.toLowerCase();
   switch (extension) {
      case 'jpg':
      case 'jpeg':
         return 'image/jpeg';
      case 'png':
         return 'image/png';
      case 'gif':
         return 'image/gif';
      default:
         return 'application/octet-stream';
   }
};

// Helper function to upload images
export const uploadImage = async (uri: string, userId: string): Promise<string> => {
   try {
      // Get file info to verify it exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('Image file not found');

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
         encoding: FileSystem.EncodingType.Base64
      });

      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const contentType = getMimeType(uri);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
         .from('note-images')
         .upload(filePath, decode(base64), {
            contentType,
            upsert: true
         });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
         .from('note-images')
         .getPublicUrl(uploadData.path);

      return urlData.publicUrl;
   } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
   }
};