"use client"

import { addComment, type Comment, fetchComments } from "@/config/commentsService"
import { fetchFloatingNotes } from "@/config/floatingNotesService"
import { isFollowing as checkIsFollowing, followUser, unfollowUser } from "@/config/followService"
import { archiveNote, saveNote, unarchiveNote, unsaveNote } from "@/config/notesService"
import { supabase } from "@/config/supabaseClient"
import { Ionicons, Octicons } from "@expo/vector-icons"
import MaskedView from "@react-native-masked-view/masked-view"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
   ActivityIndicator,
   Alert,
   Animated,
   FlatList,
   Image,
   KeyboardAvoidingView,
   Modal,
   Platform,
   Share,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   View,
} from "react-native"
import Svg, { Path } from "react-native-svg"

interface FloatingNote {
  id: string
  text: string
  emoji?: string
  profileImage?: string
}

interface Note {
  id: string
  author: string
  author_id: string
  date: string
  content: string
  author_profile_image?: string
  likes: number
  comments: number
  shares?: number
  title: string
  tag: string
  floatingNotes?: FloatingNote[]
  backgroundColor?: string
  cover_image_url?: string
  is_saved?: boolean
  is_archived?: boolean
  user_id?: string
}

interface Profile {
  id: string
  full_name: string
  portrait_banner?: string
  profile_image?: string
}
export default function PostElementSkeleton({ note, currentUserId }: { note: Note; currentUserId?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [comment, setComment] = useState("")
  const [commentsModalVisible, setCommentsModalVisible] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [floatingNotes, setFloatingNotes] = useState<FloatingNote[]>([])
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const router = useRouter()
  const commentInputRef = useRef(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileImage, setProfileImage] = useState("")
  const [userId, setUserId] = useState("")

  // Check if current user is the author of the post
  const isAuthor = currentUserId && note.user_id && currentUserId === note.user_id

  // Animation values for floating notes
  const floatAnims = useRef(
    Array(5)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current

  useEffect(() => {
    if (currentUserId && note.author_id) {
      checkFollowStatus()
    }
    fetchUserData()
    loadComments()
    loadFloatingNotes()
  }, [currentUserId, note.id])

  const checkFollowStatus = async () => {
    if (currentUserId && note.author_id) {
      const following = await checkIsFollowing(currentUserId, note.author_id)
      setIsFollowing(following)
    }
  }

  const fetchUserData = async () => {
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session) {
      router.push("/login")
      return
    }

    try {
      const userId = session.session.user.id

      const { data, error } = await supabase.from("profiles").select("id, profile_image").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user data:", error)
      } else {
        setProfileImage(data.profile_image)
        setUserId(data.id)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setIsLoading(false)
    }
  }
  const handleFollow = async () => {
    if (!currentUserId || !note.author_id) return

    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, note.author_id)
      } else {
        await followUser(currentUserId, note.author_id)
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error("Error toggling follow status:", error)
    }
  }

  const loadComments = async () => {
    try {
      const fetchedComments = await fetchComments(note.id)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
    }
  }

  const loadFloatingNotes = async () => {
    try {
      const fetchedNotes = await fetchFloatingNotes(note.id)
      setFloatingNotes(fetchedNotes)
    } catch (error) {
      console.error("Error loading floating notes:", error)
    }
  }

  const SubmitComment = async () => {
    if (comment.trim() === "" || !note.id || !currentUserId) return

    try {
      // Call addComment to save the comment in the backend
      const newComment = await addComment(note.id as string, currentUserId, comment)
      if (newComment) {
        // Update the local comments state
        setComments([newComment, ...comments])
        setComment("")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const defaultBackgroundColor = note.backgroundColor || "#b3b3b3"

  const authorInitial = note.author ? note.author.charAt(0).toUpperCase() : "U"

  const formattedDate = note.date || "February 14 at 9:04 AM"

  const handleShare = async () => {
    setShareModalVisible(true)
  }

  const sharePost = async () => {
    try {
      const result = await Share.share({
        message: `Check out this post: "${note.title}" by ${note.author}`,
        title: note.title,
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared with: ${result.activityType}`)
        } else {
          console.log("Shared successfully")
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed")
      }
      setShareModalVisible(false)
    } catch (error) {
      console.error(error)
      setShareModalVisible(false)
    }
  }

  const handleSaveToggle = async () => {
    if (!currentUserId || !note.id) return

    try {
      if (note.is_saved) {
        await unsaveNote(currentUserId, note.id)
        // Update local state
        note.is_saved = false
      } else {
        await saveNote(currentUserId, note.id)
        // Update local state
        note.is_saved = true
      }
      setShareModalVisible(false)
    } catch (error) {
      console.error("Error toggling save status:", error)
    }
  }

  const CommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <Image
        source={{ uri: item.author_profile_image || "https://via.placeholder.com/40" }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author_name || "Unknown User"}</Text>
          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  )

  const handleArchiveToggle = async () => {
    // Only allow the author to archive/unarchive
    if (!isAuthor || !note.id) {
      Alert.alert("Permission Denied", "Only the author can archive this post")
      return
    }

    try {
      if (note.is_archived) {
        await unarchiveNote(note.id)
        // Update local state
        note.is_archived = false
      } else {
        await archiveNote(note.id)
        // Update local state
        note.is_archived = true
      }
      setShareModalVisible(false)
    } catch (error) {
      console.error("Error toggling archive status:", error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.authorContainer}>
          <TouchableOpacity style={styles.profilePlaceholder}>
            {note.author_profile_image ? (
              <Image source={{ uri: note.author_profile_image }} style={styles.profileImage} onLoad={handleImageLoad} />
            ) : (
              <Text style={styles.profileText}>{authorInitial}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.authorInfo}>
            <Text style={styles.fullName}>{note.author || "Adrian Rainier Fabian"}</Text>
            <Text style={styles.displayName}>{formattedDate}</Text>
          </View>
        </View>
        {currentUserId && note.author_id && (
          <TouchableOpacity onPress={handleFollow}>
            <Text style={styles.followButton}>{isFollowing ? "Unfollow" : "Follow"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tagHolder, { backgroundColor: getTagStyles(note.tag || "default").backgroundColor }]}>
        <Text style={[styles.tagText, { color: getTagStyles(note.tag || "default").textColor }]}>
          {note.tag || "tag"}
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.push({ pathname: "/post/[id]", params: { id: note.id } })}>
        <MaskedView
          style={styles.maskedView}
          maskElement={
            <Svg width="100%" height="100%" viewBox="0 0 419 351">
              <Path
                d="M217.82 57.5C224.547 57.5 230 52.0467 230 45.3198V12.1802C230 5.45328 235.453 0 242.18 0H314.25H366.625H406.82C413.547 0 419 5.45328 419 12.1802V60.6982V121.396V283.027C419 289.754 413.547 295.207 406.82 295.207H271.68C264.953 295.207 259.5 300.661 259.5 307.388V319.104V333.96C259.5 340.632 254.132 346.062 247.461 346.139L12.321 348.858C5.53947 348.936 0 343.46 0 336.678V121.396V69.6802C0 62.9533 5.45328 57.5 12.1802 57.5H217.82Z"
                fill="#D9D9D9"
              />
            </Svg>
          }
        >
          <View style={styles.contentWrapper}>
            {note.cover_image_url ? (
              <View style={styles.imageContainer}>
                {isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                  </View>
                )}
                <Image
                  source={{ uri: note.cover_image_url }}
                  style={styles.contentImage}
                  onLoadStart={() => setIsLoading(true)}
                  onLoad={handleImageLoad}
                />
                <View style={styles.imageOverlay} />
              </View>
            ) : (
              <View style={[styles.defaultBackground, { backgroundColor: defaultBackgroundColor }]}>
                <View style={styles.gradientOverlay} />
              </View>
            )}

            {floatingNotes.map((floatingNote, index) => {
              const topPosition = 60 + index * 60
              const rightPosition = 20 + (index % 2) * -15

              const translateY = floatAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4 - index],
              })

              return (
                <Animated.View
                  key={floatingNote.id}
                  style={[
                    styles.floatingNoteContainer,
                    {
                      bottom: topPosition,
                      right: rightPosition,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  <View style={styles.noteTextContainer}>
                    <Text style={styles.noteText}>{floatingNote.text}</Text>
                  </View>
                  {floatingNote.profileImage && (
                    <View style={styles.noteProfileContainer}>
                      <Image
                        source={{
                          uri: floatingNote.profileImage,
                        }}
                        style={styles.noteProfileImage}
                      />
                    </View>
                  )}
                </Animated.View>
              )
            })}

            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>{note.title || "Post title goes here"}</Text>
            </View>
          </View>
        </MaskedView>
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.commentsCounter} onPress={() => setCommentsModalVisible(true)}>
          <Octicons name="comment-discussion" size={24} color="black" />
          <Text style={styles.commentsCount}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="paper-plane-outline" size={24} color="#000" />
          <Text style={styles.actionText}>{note.shares || 0}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={commentsModalVisible}
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.commentsList}
                />
              )}

              <View style={[styles.modalCommentInputContainer, keyboardVisible && styles.commentModalKeyboardOpen]}>
                <Image
                  source={{ uri: profileImage || "https://via.placeholder.com/40" }}
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
                  onPress={SubmitComment}
                  disabled={comment.length === 0}
                >
                  <Ionicons name="send" size={24} color={comment.length > 0 ? "#3b82f6" : "#ccc"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { height: isAuthor ? "40%" : "30%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share or Save</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity style={styles.shareOption} onPress={sharePost}>
                <View style={styles.shareIconContainer}>
                  <Ionicons name="paper-plane" size={28} color="#3b82f6" />
                </View>
                <Text style={styles.shareOptionText}>Share Post</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleSaveToggle}>
                <View style={styles.shareIconContainer}>
                  <Ionicons name={note.is_saved ? "bookmark" : "bookmark-outline"} size={28} color="#3b82f6" />
                </View>
                <Text style={styles.shareOptionText}>{note.is_saved ? "Unsave Post" : "Save Post"}</Text>
              </TouchableOpacity>

              {isAuthor && (
                <TouchableOpacity style={styles.shareOption} onPress={handleArchiveToggle}>
                  <View style={styles.shareIconContainer}>
                    <Ionicons name={note.is_archived ? "archive" : "archive-outline"} size={28} color="#3b82f6" />
                  </View>
                  <Text style={styles.shareOptionText}>{note.is_archived ? "Unarchive Post" : "Archive Post"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function getTagStyles(tag: string) {
  const tagColors: Record<string, { backgroundColor: string; textColor: string }> = {
    Frontend: { backgroundColor: "rgba(59, 130, 246, 0.15)", textColor: "rgba(59, 130, 246, 1)" },
    Backend: { backgroundColor: "rgba(37, 99, 235, 0.15)", textColor: "rgba(37, 99, 235, 1)" },
    Database: { backgroundColor: "rgba(29, 78, 216, 0.15)", textColor: "rgba(29, 78, 216, 1)" },
    DevOps: { backgroundColor: "rgba(30, 64, 175, 0.15)", textColor: "rgba(30, 64, 175, 1)" },
    Design: { backgroundColor: "rgba(147, 51, 234, 0.15)", textColor: "rgba(147, 51, 234, 1)" },
    UIUX: { backgroundColor: "rgba(168, 85, 247, 0.15)", textColor: "rgba(168, 85, 247, 1)" },
    state: { backgroundColor: "rgba(20, 184, 166, 0.15)", textColor: "rgba(20, 184, 166, 1)" },
    default: { backgroundColor: "rgba(244, 63, 94, 0.15)", textColor: "rgba(244, 63, 94, 1)" },
  }

  return tagColors[tag.toLowerCase()] || tagColors.default
}

function formatTimestamp(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return date.toLocaleDateString("en-US", options)
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    position: "relative",
    backgroundColor: "#fff",
  },
  maskedView: {
    width: "100%",
    aspectRatio: 419 / 351,
    overflow: "hidden",
  },
  contentWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  topContainer: {
    position: "absolute",
    top: 15,
    left: 10,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePlaceholder: {
    width: 37,
    height: 37,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  profileText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  authorInfo: {
    justifyContent: "center",
  },
  fullName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  displayName: {
    fontSize: 10,
    color: "#6b7280",
    fontStyle: "italic",
  },
  followButton: {
    fontSize: 12,
    color: "#3b82f6",
    marginLeft: 10,
  },
  tagHolder: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 2,
  },
  tagText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  contentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  defaultBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  floatingNoteContainer: {
    position: "absolute",
    flexDirection: "column",
    alignItems: "flex-end",
    zIndex: 3,
  },
  noteTextContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: -8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: 90,
  },
  noteText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
  },
  noteProfileContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  noteProfileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  titleContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 15,
    padding: 10,
    borderRadius: 8,
    maxWidth: 230,
    maxHeight: 250,
  },
  titleText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "nunitoExtraBold",
    lineHeight: 25,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 5,
    marginEnd: 20,
    position: "absolute",
    bottom: 15,
    right: 10,
    zIndex: 1,
    gap: 25,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: "#000",
    marginLeft: 5,
  },
  commentsCounter: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentsCount: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 10 : 16,
    height: "75%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  commentsList: {
    paddingBottom: 16,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noCommentsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalCommentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  commentCard: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9D9D9",
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#666666",
  },
  commentText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  commentModalKeyboardOpen: {
    position: "relative",
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
    borderColor: "#e0e0e0",
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
  shareOptionsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-around",
  },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
