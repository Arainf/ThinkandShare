import type { Note } from '@/config/notesService';
import { fetchNoteById } from '@/config/notesService';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostDetails() {
  const { id } = useGlobalSearchParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadNote = async () => {
      if (!id) return;
      try {
        const noteData = await fetchNoteById(id as string);
        setNote(noteData);
      } catch (error) {
        console.error('Error loading note:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [id]);

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentCard}>
      <Image source={{ uri: item.profileImage }} style={styles.commentImage} />
      <View style={styles.commentContent}>
        <Text style={styles.commentAuthor}>{item.author}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Note not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(feed)')}>
          <Ionicons name="arrow-back-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        {note.cover_image_url && (
          <Image source={{ uri: note.cover_image_url }} style={styles.postImage} />
        )}
        <Text style={styles.postTitle}>{note.title}</Text>
        <Text style={styles.postText}>{note.content}</Text>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <Ionicons name="chatbubble-outline" size={20} color="#374151" />
          <Text style={styles.commentsTitle}>Comments</Text>
          <Text style={styles.commentsCount}>{note.comments}</Text>
        </View>

        {/* Add Comment */}
        <View style={styles.addCommentSection}>
          <TextInput
            style={styles.addCommentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
    
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  postContent: {
    padding: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  postText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  commentsSection: {
    flex: 1,
    padding: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  commentsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  commentsList: {
    paddingBottom: 16,
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  commentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addCommentInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});