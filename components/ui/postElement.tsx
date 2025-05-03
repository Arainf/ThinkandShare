import Ionicons from '@expo/vector-icons/Ionicons'
import Octicons from '@expo/vector-icons/Octicons'
import MaskedView from '@react-native-masked-view/masked-view'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface FloatingNote {
	id: string
	text: string
	emoji?: string
	profileImage?: string
}

interface Note {
	author: string
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
	id: string
	cover_image_url?: string
}

export default function PostElement({note}: {note: Note}) {
	const [isLoading, setIsLoading] = useState(false)
	const [liked, setLiked] = useState(false)
	const router = useRouter()

	// Animation values for multiple floating notes
	const floatAnims = useRef((note.floatingNotes || [{id: 'default'}]).map(() => new Animated.Value(0))).current

	// Get first letter of author name for profile placeholder
	const authorInitial = note.author ? note.author.charAt(0).toUpperCase() : 'U'

	// Format date (simplified for example)
	const formattedDate = note.date || 'February 14 at 9:04 AM'

	// Handle image loading
	const handleImageLoad = () => {
		setIsLoading(false)
	}

	// Default background color if no image and no specified background
	const defaultBackgroundColor = note.backgroundColor || '#b3b3b3'

	// Set up floating animations with staggered timing
	useEffect(() => {
		const animations = floatAnims.map((anim, index) => {
			// Stagger the animations slightly
			const delay = index * 300

			return Animated.loop(
				Animated.sequence([
					Animated.timing(anim, {
						toValue: 1,
						duration: 1500,
						delay,
						useNativeDriver: true
					}),
					Animated.timing(anim, {
						toValue: 0,
						duration: 1500,
						delay: 0,
						useNativeDriver: true
					})
				])
			)
		})

		// Start all animations
		animations.forEach((animation) => animation.start())

		return () => {
			// Stop all animations on cleanup
			animations.forEach((animation) => animation.stop())
		}
	}, [floatAnims])

	function toUpperCaseText(text: string) {
		if (!text) return ''
		return text.toUpperCase()
	}

	// Default floating notes if none provided
	const floatingNotes = note.floatingNotes || []

	return (
		<View style={styles.container}>
			{/* Author info at top */}
			<View style={styles.topContainer}>
				<View style={styles.authorContainer}>
					<TouchableOpacity style={styles.profilePlaceholder}>
						{note.author_profile_image ? (
							<Image
								source={{uri: note.author_profile_image}}
								style={styles.profileImage}
								onLoad={handleImageLoad}
							/>
						) : (
							<Text style={styles.profileText}>{authorInitial}</Text>
						)}
					</TouchableOpacity>

					<View style={styles.authorInfo}>
						<Text style={styles.fullName}>
							{note.author || 'Adrian Rainier Fabian'}
						</Text>
						<Text style={styles.displayName}>{formattedDate}</Text>
					</View>
				</View>
			</View>

			{/* Tag */}
			<View
				style={[
					styles.tagHolder,
					{ backgroundColor: getTagStyles(note.tag || 'default').backgroundColor }
				]}>
				<Text
					style={[
						styles.tagText,
						{ color: getTagStyles(note.tag || 'default').textColor }
					]}>
					{note.tag || 'tag'}
				</Text>
			</View>

			{/* Main content with masked view */}
			<TouchableOpacity
				onPress={() => router.push({ pathname: '/post/[id]', params: { id: note.id } })}
				style={styles.postContainer}
			>
				<MaskedView
					style={styles.maskedView}
					maskElement={
						<Svg width="100%" height="100%" viewBox="0 0 419 351">
							<Path
								d="M217.82 57.5C224.547 57.5 230 52.0467 230 45.3198V12.1802C230 5.45328 235.453 0 242.18 0H314.25H366.625H406.82C413.547 0 419 5.45328 419 12.1802V60.6982V121.396V283.027C419 289.754 413.547 295.207 406.82 295.207H271.68C264.953 295.207 259.5 300.661 259.5 307.388V319.104V333.96C259.5 340.632 254.132 346.062 247.461 346.139L12.321 348.858C5.53947 348.936 0 343.46 0 336.678V121.396V69.6802C0 62.9533 5.45328 57.5 12.1802 57.5H217.82Z"
								fill="#D9D9D9"
							/>
						</Svg>
					}>
					<View style={styles.contentWrapper}>
						{/* Background image or color */}
						{note.cover_image_url
 ? (
							<View style={styles.imageContainer}>
								{isLoading && (
									<View style={styles.loadingContainer}>
										<ActivityIndicator
											size="small"
											color="#3b82f6"
										/>
									</View>
								)}
								<Image
									source={{uri: note.cover_image_url}}
									style={styles.contentImage}
									onLoadStart={() => setIsLoading(true)}
									onLoad={handleImageLoad}
								/>
								{/* Overlay gradient for better text visibility */}
								<View style={styles.imageOverlay} />
							</View>
						) : (
							<View
								style={[
									styles.defaultBackground,
									{backgroundColor: defaultBackgroundColor}
								]}>
								<View style={styles.gradientOverlay} />
							</View>
						)}

						{/* Multiple floating notes */}
						{floatingNotes.map((floatingNote, index) => {
							// Calculate position based on index
							const topPosition = 60 + index * 60
							const rightPosition = 20 + (index % 2) * -15 // Alternate right position slightly

							// Get animation value for this note
							const translateY = floatAnims[index].interpolate({
								inputRange: [0, 1],
								outputRange: [0, -4 - index] // Slightly different movement for each note
							})

							return (
								<Animated.View
									key={floatingNote.id}
									style={[
										styles.floatingNoteContainer,
										{
											bottom: topPosition,
											right: rightPosition,
											transform: [{translateY}]
										}
									]}>
									<View style={styles.noteTextContainer}>
										<Text style={styles.noteText}>
											{floatingNote.text}
										</Text>
									</View>
									{floatingNote.profileImage && (
										<View style={styles.noteProfileContainer}>
											<Image
												source={{
													uri: floatingNote.profileImage
												}}
												style={styles.noteProfileImage}
											/>
										</View>
									)}
								</Animated.View>
							)
						})}

						{/* Title at bottom left */}
						<View style={styles.titleContainer}>
							<Text style={styles.titleText}>
								{toUpperCaseText(note.title || 'Post title goes here')}
							</Text>
						</View>
					</View>
				</MaskedView>
			</TouchableOpacity>

			{/* Bottom action buttons */}
			<View style={styles.bottomContainer}>
				<TouchableOpacity style={styles.actionButton}>
					<Octicons name="comment-discussion" size={24} color="black" />
					<Text style={styles.actionText}>{note.comments || 0}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.actionButton}>
					<Ionicons name="paper-plane-outline" size={24} color="black" />
					<Text style={styles.actionText}>{note.shares || 0}</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

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


const styles = StyleSheet.create({
	container: {
		padding: 10,
		position: 'relative',
		backgroundColor: '#fff'
	},
	maskedView: {
		width: '100%',
		aspectRatio: 419 / 351, // Match SVG aspect ratio
		overflow: 'hidden'
	},
	contentWrapper: {
		width: '100%',
		height: '100%',
		position: 'relative'
	},
	topContainer: {
		position: 'absolute',
		top: 15,
		left: 10,
		zIndex: 2,
		flexDirection: 'row',
		alignItems: 'center'
	},
	authorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	profilePlaceholder: {
		width: 37,
		height: 37,
		borderRadius: 20,
		backgroundColor: '#3b82f6',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: '#fff'
	},
	profileImage: {
		width: '100%',
		height: '100%',
		borderRadius: 20
	},
	profileText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16
	},
	authorInfo: {
		justifyContent: 'center'
	},
	fullName: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#374151'
	},
	displayName: {
		fontSize: 10,
		color: '#6b7280',
		fontStyle: 'italic'
	},
	tagHolder: {
		backgroundColor: '#e5e7eb',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		position: 'absolute',
		top: 20,
		right: 20,
		zIndex: 2
	},
	tagText: {
		fontSize: 12,
		color: '#4b5563',
		fontWeight: '500'
	},
	imageContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden'
	},
	contentImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover'
	},
	imageOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: '50%'
	},
	defaultBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%'
	},
	gradientOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: '50%',
		backgroundColor: 'rgba(0,0,0,0.3)'
	},
	loadingContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1
	},
	// Instagram-style floating note
	floatingNoteContainer: {
		position: 'absolute',
		flexDirection: 'column',
		alignItems: 'flex-end',
		zIndex: 3
	},
	noteTextContainer: {
		backgroundColor: '#ffffff',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 10,
		marginRight: 10,
		marginBottom: -8, // Overlap with profile image
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 1},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		maxWidth: 90
	},
	noteText: {
		fontSize: 12,
		color: '#000000',
		fontWeight: '500'
	},
	noteProfileContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#fff',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 1},
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 3
	},
	noteProfileImage: {
		width: '100%',
		height: '100%',
		borderRadius: 16
	},
	titleContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 15,
		padding: 10,
		borderRadius: 8,
		maxWidth: 230,
		maxHeight: 250
	},
	titleText: {
		color: '#fff',
		fontSize: 20,
		fontFamily: 'nunitoExtraBold',
		lineHeight: 25,
		textShadowColor: 'rgba(0, 0, 0, 0.5)', // dark semi-transparent shadow
		textShadowOffset: {width: 1, height: 2}, // little offset down-right
		textShadowRadius: 3 // blur radius
	},
	bottomContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingVertical: 10,
		marginTop: 5,
		marginEnd: 20,
		position: 'absolute',
		bottom: 15,
		right: 10,
		zIndex: 1,
		gap: 25
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	actionText: {
		fontSize: 14,
		color: '#000',
		marginLeft: 5
	},
	likedText: {
		color: '#f43f5e'
	},
	postContainer: {
		width: '100%',
		aspectRatio: 419 / 351,
		overflow: 'hidden'
	}
})
