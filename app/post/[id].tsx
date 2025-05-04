import { addComment, fetchComments, type Comment } from '@/config/commentsService';
import type { Note } from '@/config/notesService';
import { fetchNoteById } from '@/config/notesService';
import { supabase } from '@/config/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Animated,
	FlatList,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';


export default function PostDetails() {
  const { id } = useGlobalSearchParams()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const router = useRouter()
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const commentInputRef = useRef(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsModalVisible, setCommentsModalVisible] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  
  // Animation value for the save button
  const saveAnimation = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loadComments = async () => {
      if (!id) {
        console.error('Error: Note ID is undefined');
        return;
      }

      try {
        console.log('Fetching comments for note ID:', id);
        const fetchedComments = await fetchComments(id as string);
        console.log('Fetched comments:', fetchedComments);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    const loadNote = async () => {
      if (!id) {
        console.error('Error: Note ID is undefined');
        return;
      }

      try {
        const noteData = await fetchNoteById(id as string);
        if (!noteData) {
          console.error('Error: No note data returned for ID:', id);
          return;
        }

        setNote(noteData);
      } catch (error) {
        console.error('Error loading note:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    loadNote();
    loadComments();
  }, [id]);

  const fetchUserData = async () => {
	const { data: session } = await supabase.auth.getSession()

	if (!session?.session) {
	  router.push('/login')
	  return
	}

	try {
	  const userId = session.session.user.id

	  const { data, error } = await supabase
		 .from('profiles')
		 .select('id, profile_image')
		 .eq('id', userId)
		 .single()

	  if (error) {
		 console.error('Error fetching user data:', error)
	  } else {
		 setProfileImage(data.profile_image)
		 setUserId(data.id)
	  }
	} catch (err) {
	  console.error('Unexpected error:', err)
	} finally {
    setLoading(false)
	}
 }

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };

    fetchUserId();
  }, []);

  // Function to check if a note is saved
  const checkIfNoteSaved = async (noteId: string) => {
    try {
      // This would typically use AsyncStorage
      // const savedNotes = await AsyncStorage.getItem('savedNotes')
      // const savedNotesArray = savedNotes ? JSON.parse(savedNotes) : []
      // setIsSaved(savedNotesArray.includes(noteId))
      
      // For now just simulate with false
      setIsSaved(false)
    } catch (error) {
      console.error('Error checking saved status:', error)
    }
  }

  // Function to toggle saved status
  const toggleSaveNote = async () => {
    try {
      // Animate the save button
      Animated.sequence([
        Animated.timing(saveAnimation, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(saveAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start()

      const noteId = id as string
      
      // This would typically use AsyncStorage
      // const savedNotes = await AsyncStorage.getItem('savedNotes')
      // const savedNotesArray = savedNotes ? JSON.parse(savedNotes) : []
      
      // if (savedNotesArray.includes(noteId)) {
      //   const filtered = savedNotesArray.filter(id => id !== noteId)
      //   await AsyncStorage.setItem('savedNotes', JSON.stringify(filtered))
      //   setIsSaved(false)
      // } else {
      //   savedNotesArray.push(noteId)
      //   await AsyncStorage.setItem('savedNotes', JSON.stringify(savedNotesArray))
      //   setIsSaved(true)
      // }
      
      // For now, just toggle the state
      setIsSaved(!isSaved)
      console.log(`Note ${noteId} ${!isSaved ? 'saved' : 'unsaved'}`)
    } catch (error) {
      console.error('Error toggling save status:', error)
    }
  }

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false)
      }
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const handleSubmitComment = async () => {
    if (comment.trim() === '' || !id || !currentUserId) {
      console.error('Error: Missing required data for submitting comment');
      return;
    }

    try {
      console.log('Submitting comment:', comment);
      const newComment = await addComment(id as string, currentUserId, comment);
      if (newComment) {
        console.log('New comment added:', newComment);
        setComments([newComment, ...comments]);
        setComment('');
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!note) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Note not found</Text>
      </View>
    )
  }

  // Format date for display - assuming note has a created_at field
  const formattedDate = note.created_at
    ? new Date(note.created_at).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    : ''

  function getTagStyles(tag: string) {
    const tagColors: Record<string, { backgroundColor: string; textColor: string }> = {
      // Development tags
      Frontend: { backgroundColor: 'rgba(59, 130, 246, 0.15)', textColor: 'rgba(59, 130, 246, 1)' },
      Backend: { backgroundColor: 'rgba(37, 99, 235, 0.15)', textColor: 'rgba(37, 99, 235, 1)' },
      Database: { backgroundColor: 'rgba(29, 78, 216, 0.15)', textColor: 'rgba(29, 78, 216, 1)' },
      DevOps: { backgroundColor: 'rgba(30, 64, 175, 0.15)', textColor: 'rgba(30, 64, 175, 1)' },

      // Design & UI tags
      Design: { backgroundColor: 'rgba(147, 51, 234, 0.15)', textColor: 'rgba(147, 51, 234, 1)' },
      UIUX: { backgroundColor: 'rgba(168, 85, 247, 0.15)', textColor: 'rgba(168, 85, 247, 1)' },

      // State related - Teal spectrum
      state: { backgroundColor: 'rgba(20, 184, 166, 0.15)', textColor: 'rgba(20, 184, 166, 1)' },
      
      // Default - distinct but complementary
      default: { backgroundColor: 'rgba(244, 63, 94, 0.15)', textColor: 'rgba(244, 63, 94, 1)' }
    }

    return tagColors[tag.toLowerCase()] || tagColors.default
  }
  
  // Comment Item Component for FlatList
  const CommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <Image
        source={{ uri: item.author_profile_image || 'https://via.placeholder.com/40' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author_name || 'Unknown User'}</Text>
          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(feed)')}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Fixed MaskedView part */}
          <View style={styles.fixedHeaderSection}>
            <MaskedView
              style={styles.maskedView}
              maskElement={
                <Svg width="100%" height="100%" viewBox="0 0 434 251">
                  <Path
                    d="M57.309 52.8729C64.2633 52.8729 69.9009 47.2353 69.9009 40.281V12.592C69.9009 5.63763 75.5385 9.97428e-06 82.4929 2.22782e-05L324.872 0.000451104H379.018H420.571C427.526 0.000451104 433.163 5.63806 433.163 12.5924V62.7503V125.5V213.224V238.408C433.163 245.362 427.526 251 420.571 251H276.183H12.5919C5.6376 251 0 245.362 0 238.408V125.5V65.4652C0 58.5109 5.63756 52.8733 12.5919 52.8732L57.309 52.8729Z"
                    fill="#D9D9D9"
                  />
                </Svg>
              }
            >
              <View style={styles.titleBackground}>
                {note.tag === "default" ? null : (
                  <View style={[styles.followButton, { backgroundColor: getTagStyles(note.tag || 'default').backgroundColor }]}>
                    <Text style={[styles.followButtonText, { color: getTagStyles(note.tag || 'default').textColor }]}>
                      {note.tag === "default" ? "" : note.tag}
                    </Text>
                  </View>
                )}

                <View style={styles.profileInfo}>
                  <Image
                    source={{
                      uri: note.author_profile_image || 'https://via.placeholder.com/40',
                    }}
                    style={styles.profileImage}
                  />
                  <View style={styles.authorContainer}>
                    <Text style={styles.authorName}>{note.author || 'Author'}</Text>
                    <Text style={styles.timestamp}>{formattedDate || 'Time'}</Text>
                  </View>
                </View>
                
                {/* Image container with dark overlay */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: note.cover_image_url }}
                    style={styles.postImage}
                  />
                  <View style={styles.darkOverlay} />
                </View>
                
                <Text style={styles.titleText}>{note.title || 'Title Holder'}</Text>
              </View>
            </MaskedView>
          </View>

          {/* Scrollable content section */}
          <ScrollView style={styles.scrollableContent}>
            <View style={styles.cardContainer}>
              {/* Post content */}
              <View style={styles.postContent}>
                <Text style={styles.contentText}>
                  {note.content ||
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}
                </Text>
              </View>

              {/* Comments counter - now a button to open modal */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 }}>
                <TouchableOpacity 
                  style={styles.commentsCounter}
                  onPress={() => setCommentsModalVisible(true)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#000" />
                  <Text style={styles.commentsText}>Comments</Text>
                  <Text style={styles.commentsCount}>{comments.length}</Text>
                </TouchableOpacity>

                {/* Save button */}
                <Animated.View style={{ transform: [{ scale: saveAnimation }] }}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={toggleSaveNote}
                  >
                    <Ionicons 
                      name={isSaved ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={isSaved ? "#3b82f6" : "#000"} 
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
             
              {/* Divider */}
              <View style={styles.divider} />

              {/* Preview of latest comment */}
              {comments.length > 0 && (
                <CommentItem item={comments[0]} />
              )}
              
              {/* Extra space at the bottom to ensure all content is scrollable past the comment input */}
              <View style={styles.bottomSpace} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={commentsModalVisible}
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {comments.length === 0 ? (
                <View style={styles.noCommentsContainer}>
                  <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  renderItem={({ item }) => <CommentItem item={item} />}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.commentsList}
                />
              )}
              
              {/* Comment input in modal */}
              <View style={[
                styles.modalCommentInputContainer, 
                keyboardVisible && styles.commentModalKeyboardOpen
              ]}>
                <Image
                  source={{ uri:profileImage || 'https://via.placeholder.com/40' }}
                  style={styles.commentInputAvatar}
                />
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendButton, comment.length > 0 ? styles.sendButtonActive : {}]} 
                  onPress={handleSubmitComment}
                  disabled={comment.length === 0}
                >
                  <Ionicons
                    name="send"
                    size={24}
                    color={comment.length > 0 ? "#3b82f6" : "#ccc"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comment input at bottom when modal is not open */}
      <View style={[styles.commentModal, keyboardVisible && styles.commentModalKeyboardOpen]}>
        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: profileImage|| 'https://via.placeholder.com/40' }}
            style={styles.commentInputAvatar}
          />
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, comment.length > 0 ? styles.sendButtonActive : {}]} 
            onPress={handleSubmitComment}
            disabled={comment.length === 0}
          >
            <Ionicons
              name="send"
              size={24}
              color={comment.length > 0 ? "#3b82f6" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  fixedHeaderSection: {
    zIndex: 10,
  },
  scrollableContent: {
    flex: 1,	
	 paddingTop: 10,
	 paddingBottom: 60, // Space for the comment input 	
    marginTop: -20, // This pushes content up slightly beneath the masked view
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(38, 38, 38, 0.34)', // Dark overlay with opacity
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 60, // Add some padding for the comment input
  },
  header: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    zIndex: 20,
    width: '100%',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#b8b8b8',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#b8b8b8',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    marginRight: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
    position: 'absolute',
    top: 5,
    left: 70,
    zIndex: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',
    marginRight: 10,
  },
  authorContainer: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#ffffff',
  },
  followButton: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
    position: 'absolute',
    top: 10,
    right: 16,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  maskedView: {
    width: '100%',
    height: 222,
    overflow: 'hidden',
    marginTop: 10,
  },
  titleBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5E5',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    bottom: 16,
    left: 16,
    padding: 8,
    borderRadius: 8,
    zIndex: 2, // Ensure title appears above the overlay
  },
  activityIcons: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
  },
  postContent: {
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  commentsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 8,
  },
  commentsCount: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  divider: {
    height: 4,
    backgroundColor: '#FF69B4', // Hot pink divider as shown in the design
    marginHorizontal: 16,
    marginVertical: 8,
  },
  commentCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666666',
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Comment modal styles
  commentModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  commentModalKeyboardOpen: {
    // This style will be applied when keyboard is open
    position: 'relative', // Changes from absolute to relative
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
  sendButtonActive: {
    opacity: 1,
  },
  // Comments Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 16,
    height: '75%', // Takes up 75% of the screen
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsList: {
    paddingBottom: 16,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalCommentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  bottomSpace: {
    height: 60, // Add extra space at the bottom to ensure content can be scrolled past the comment input
  }
});