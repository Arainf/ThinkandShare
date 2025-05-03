import PostElement from '@/components/ui/postElement'
import { FeedType, fetchNotes, Note } from '@/config/notesService'
import { supabase } from '@/config/supabaseClient'
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Animated,
	Dimensions,
	Easing,
	FlatList,
	Image,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import Svg, { Path } from 'react-native-svg'

const {height: windowHeight, width: windowWidth} = Dimensions.get('window')

// --- Configurable Header Heights ---
const INITIAL_HEADER_HEIGHT = windowHeight * 0.3 // Start at 30% of screen height
const MIN_HEADER_HEIGHT = windowHeight * 0.25 // Shrink down to 25%
const HEADER_SCROLL_DISTANCE = INITIAL_HEADER_HEIGHT - MIN_HEADER_HEIGHT

// Use Animated.FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export default function ProfileDetails() {
	const router = useRouter()
	const {id} = useLocalSearchParams()
	const [profile, setProfile] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('posts')
	const [isExpanded, setIsExpanded] = useState(false)
	const [notes, setNotes] = useState<Note[]>([])
	const [archivedNotes, setArchivedNotes] = useState<Note[]>([])
	const [savedNotes, setSavedNotes] = useState<Note[]>([])

	// Create animated value for scaleY transform (replacing heightScale)
	const scaleY = useRef(new Animated.Value(1.1)).current // Start at 30%
	const scaleX = useRef(new Animated.Value(1.1)).current // Start at 30%

	// Create animated value for translateY transform
	const translateY = useRef(new Animated.Value(windowHeight * -0.7)).current
	const imageTranslateY = useRef(new Animated.Value(windowHeight * 0.35)).current
	const secondView = '0 0 412 880'

	const toggleAnimation = () => {
		// Toggle the state
		setIsExpanded(!isExpanded)

		// Animate the translateY value and scaleY in parallel
		Animated.parallel([
			Animated.timing(translateY, {
				toValue: !isExpanded ? 0 : windowHeight * -0.7,
				duration: 700,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true
			}),
			Animated.timing(scaleY, {
				toValue: !isExpanded ? 1 : 1.1, // Animate to 100% if expanding, 30% if collapsing
				duration: 700,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true // Now we can use native driver!
			}),
			Animated.timing(scaleX, {
				toValue: !isExpanded ? 1 : 1.1, // Animate to 100% if expanding, 30% if collapsing
				duration: 700,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true // Now we can use native driver!
			}),
			Animated.timing(imageTranslateY, {
				toValue: !isExpanded ? 1 : windowHeight * 0.35, // Animate to 100% if expanding, 30% if collapsing
				duration: 700,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true // Now we can use native driver!
			})
		]).start()
	}

	const currentView = secondView
	// --- Animated Value for Scroll Position ---
	const scrollY = useRef(new Animated.Value(0)).current

	const portraitBannerUri = useMemo(() => {
		return profile?.portrait_banner ? `${profile.portrait_banner}` : null
	}, [profile?.portrait_banner])

	const profileImageUri = useMemo(() => {
		return profile?.profile_image ? `${profile.profile_image}` : null
	}, [profile?.profile_image])

	useEffect(() => {
		// Fetch profile data
		const fetchProfile = async () => {
			try {
				const {data, error} = await supabase
					.from('profiles')
					.select('full_name, portrait_banner, profile_image')
					.eq('id', id)
					.single()

				if (error) {
					console.error('Error fetching profile:', error)
					setProfile(null)
				} else {
					setProfile({
						...data,
						posts: 0,    // This will be updated with actual count
						followers: 0, // This would need a followers table
						following: 0  // This would need a following table
					})
				}
			} catch (err) {
				console.error('Unexpected error:', err)
				setProfile(null)
			} finally {
				setLoading(false)
			}
		}

		if (id) {
			fetchProfile()
		} else {
			setLoading(false)
			setProfile(null)
			console.error('No profile ID provided.')
		}
	}, [id])

	// Fetch notes for this profile
	useEffect(() => {
		const fetchUserNotes = async () => {
			if (!id) return

			try {
				// Fetch user's posts
				const userNotes = await fetchNotes({
					feedType: FeedType.USER,
					userId: id as string
				})
				setNotes(userNotes)

				// Update post count in profile
				setProfile(prev => ({
					...prev,
					posts: userNotes.length
				}))

				// Fetch saved notes (if we have a saved_notes table)
				try {
					const saved = await fetchNotes({
						feedType: FeedType.SAVED,
						userId: id as string
					})
					setSavedNotes(saved)
				} catch (error) {
					console.log('Saved notes might not be set up yet:', error)
				}

				// Fetch archived notes (if we have an is_archived field)
				try {
					const archived = await fetchNotes({
						feedType: FeedType.ARCHIVED,
						userId: id as string
					})
					setArchivedNotes(archived)
				} catch (error) {
					console.log('Archived notes might not be set up yet:', error)
				}
			} catch (err) {
				console.error('Error fetching notes:', err)
			}
		}

		fetchUserNotes()
	}, [id])

	// Get the active notes based on the selected tab
	const getActiveNotes = () => {
		switch (activeTab) {
			case 'notes':
				return notes
			case 'saved':
				return savedNotes
			case 'archived':
				return archivedNotes
			default:
				return notes
		}
	}

	// --- Header Height Animation ---
	const animatedHeaderHeight = scrollY.interpolate({
		inputRange: [0, HEADER_SCROLL_DISTANCE],
		outputRange: [INITIAL_HEADER_HEIGHT, MIN_HEADER_HEIGHT],
		extrapolate: 'clamp'
	})

	// --- Loading State ---
	if (loading) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#3b82f6" />
				</View>
			</SafeAreaView>
		)
	}

	// --- Error/Not Found State ---
	if (!profile) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="arrow-back-outline" size={24} color="#3b82f6" />
				</TouchableOpacity>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>Profile not found.</Text>
				</View>
			</SafeAreaView>
		)
	}

	// --- Profile Found State ---
	return (
		<View style={styles.mainContainer}>
			<StatusBar translucent={true} />

			<View style={styles.mainContainer}>
				<StatusBar translucent={true} />

				{/* Back Button */}
				<TouchableOpacity onPress={() => router.replace('/(feed)')} style={styles.backButton}>
					<Ionicons name="arrow-back-outline" size={20} color="#fff" />
				</TouchableOpacity>

				{/* Share Button */}
				<TouchableOpacity style={styles.shareButton}>
					<Feather name="share" size={20} color="#fff" />
				</TouchableOpacity>

				{/* Main Content */}
				<AnimatedFlatList
					data={getActiveNotes()}
					ListHeaderComponent={
						<>
							{/* Header with Banner Image */}
							<Animated.View
								style={[
									styles.headerContainer,
									{
										height: windowHeight, // Fixed height
										transform: [{translateY: translateY}]
									}
								]}>
								<MaskedView
									style={styles.maskedView}
									maskElement={
										<Svg
											viewBox={currentView}
											style={styles.svg}>
											<Path
												d="M412 0C412 6.22236 412 31.7816 412 31.7816V55.6178L412 879.473H232.756L232.756 846.767C232.756 840.544 228.619 835.5 223.517 835.5H-0.999985L-0.999971 77.0093V46.45C-0.999971 46.45 -0.999972 6.22236 -0.999971 0H65.1602H333.466H412Z"
												fill="#D9D9D9"
											/>
										</Svg>
									}>
									{portraitBannerUri ? (
										<Animated.Image
											source={{
												uri: portraitBannerUri
											}}
											style={[
												styles.backgroundImage,
												{
													transform: [
														{
															scaleY: scaleY as any
														},
														{
															scaleX: scaleX as any
														},
														{
															translateY: imageTranslateY as any
														}
													]
												}
											]}
										/>
									) : (
										<View
											style={[
												styles.backgroundImage,
												{
													backgroundColor:
														'#374151'
												}
											]}
										/>
									)}

									{/* Gradient overlay for better text visibility */}
									<LinearGradient
										colors={[
											'rgba(0,0,0,0.4)',
											'transparent',
											'rgba(0,0,0,0.5)'
										]}
										style={styles.gradientOverlay}
									/>

									<Text style={styles.headerName}>
										{profile.full_name}
									</Text>

									{/* Bottom container for stats and action buttons */}
									<View style={styles.bottomMaskedContainer}>
										{/* Stats Container - Left aligned, smaller fonts */}
										<View style={styles.statsContainer}>
											<View style={styles.statItem}>
												<Text
													style={
														styles.statNumber
													}>
													{profile.posts}
												</Text>
												<Text
													style={
														styles.statLabel
													}>
													posts
												</Text>
											</View>
											<View style={styles.statItem}>
												<Text
													style={
														styles.statNumber
													}>
													{
														profile.followers
													}
												</Text>
												<Text
													style={
														styles.statLabel
													}>
													followers
												</Text>
											</View>
											<View style={styles.statItem}>
												<Text
													style={
														styles.statNumber
													}>
													{
														profile.following
													}
												</Text>
												<Text
													style={
														styles.statLabel
													}>
													following
												</Text>
											</View>
										</View>

										{/* Action Buttons Container - Right aligned */}
										<View
											style={
												styles.actionButtonsContainer
											}>
											<TouchableOpacity
												style={
													styles.editProfileButton
												}>
												<Text
													style={
														styles.editProfileText
													}>
													Edit profile
												</Text>
											</TouchableOpacity>
											<TouchableOpacity
												style={[
													styles.iconButton,
													{
														backgroundColor:
															'#3B82F6'
													}
												]}>
												<MaterialIcons
													name="edit"
													size={16}
													color="#fff"
												/>
											</TouchableOpacity>
											<TouchableOpacity
												style={[
													styles.iconButton,
													{
														borderWidth: 2,
														borderColor:
															'#fff'
													}
												]}
												onPress={
													toggleAnimation
												}>
												<Feather
													name={
														isExpanded
															? 'chevron-up'
															: 'chevron-down'
													}
													size={16}
													color="#fff"
												/>
											</TouchableOpacity>
										</View>
									</View>
								</MaskedView>
							</Animated.View>
							<Animated.View
								style={[
									styles.profileInfoContainer,
									{transform: [{translateY: translateY}]}
								]}>
								{/* Profile Info */}
								<View style={styles.profileDetailsContainer}>
									<View style={styles.profileImageAndName}>
										<View
											style={
												styles.profileImageContainer
											}>
											{profileImageUri ? (
												<Image
													source={{
														uri: profileImageUri
													}}
													style={
														styles.profileImage
													}
												/>
											) : (
												<View
													style={
														styles.profileImagePlaceholder
													}>
													<Text
														style={
															styles.profileImagePlaceholderText
														}>
														{profile.full_name?.charAt(
															0
														) ||
															'U'}
													</Text>
												</View>
											)}
										</View>
										<View style={styles.nameContainer}>
											<Text style={styles.fullName}>
												{profile.full_name}
											</Text>
											<Text style={styles.username}>
												@
												{profile.full_name?.split(
													' '
												)[0] || 'user'}
											</Text>
										</View>
									</View>

									{/* Navigation Tabs */}
									<View style={styles.tabsContainer}>
										<TouchableOpacity
											style={[
												styles.tabButton,
												activeTab === 'notes' &&
													styles.activeTabButton
											]}
											onPress={() =>
												setActiveTab('notes')
											}>
											<MaterialCommunityIcons
												name="note-text-outline"
												size={24}
												color={
													activeTab ===
													'notes'
														? '#3b82f6'
														: '#9ca3af'
												}
											/>
										</TouchableOpacity>
										<TouchableOpacity
											style={[
												styles.tabButton,
												activeTab === 'posts' &&
													styles.activeTabButton
											]}
											onPress={() =>
												setActiveTab('posts')
											}>
											<FontAwesome5
												name="star"
												size={22}
												color={
													activeTab ===
													'posts'
														? '#3b82f6'
														: '#9ca3af'
												}
											/>
										</TouchableOpacity>
										<TouchableOpacity
											style={[
												styles.tabButton,
												activeTab === 'saved' &&
													styles.activeTabButton
											]}
											onPress={() =>
												setActiveTab('saved')
											}>
											<Ionicons
												name="trash-outline"
												size={24}
												color={
													activeTab ===
													'saved'
														? '#3b82f6'
														: '#9ca3af'
												}
											/>
										</TouchableOpacity>
									</View>
								</View>
							</Animated.View>
						</>
					}
					renderItem={({item}) => (
						<Animated.View
							style={[
								styles.postItemContainer,
								{transform: [{translateY: translateY}]}
							]}>
							<PostElement note={item} />
						</Animated.View>
					)}
					keyExtractor={(item) => item.id.toString()}
					showsVerticalScrollIndicator={false}
					onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {
						useNativeDriver: false
					})}
					scrollEventThrottle={16}
				/>
			</View>
		</View>
	)
}

// --- Styles ---
const styles = StyleSheet.create({
	headerName: {
		fontFamily: 'nunitoExtraBold',
		fontSize: 32,
		color: '#ffffff',
		alignSelf: 'center',
		marginTop: 80,
		zIndex: 1
	},
	safeArea: {
		flex: 1,
		backgroundColor: '#fff'
	},
	imageOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: '50%'
	},
	mainContainer: {
		marginTop: -10,
		backgroundColor: '#f9f9f9'
	},
	headerContainer: {
		position: 'relative',
		left: 0,
		right: 0,
		zIndex: 1,
		overflow: 'hidden',
		transformOrigin: 'top' // Make sure scaling happens from the top
	},
	maskedView: {
		width: '100%',
		height: '100%',
		overflow: 'hidden',
		position: 'relative'
	},
	svg: {
		width: '100%',
		height: '100%'
	},
	backgroundImage: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		width: '100%',
		height: '100%',
		resizeMode: 'cover'
	},
	gradientOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	},
	// New container for bottom elements inside maskedView
	bottomMaskedContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'column',
		width: '100%',
		paddingHorizontal: 5,
		paddingBottom: 15
	},
	// Updated statsContainer
	statsContainer: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 20
	},
	statItem: {
		alignItems: 'flex-start',
		marginRight: 20
	},
	statNumber: {
		fontSize: 14, // Smaller font
		fontWeight: 'bold',
		color: '#fff', // Changed to white for visibility on the background
		textShadowColor: 'rgba(0,0,0,0.5)',
		textShadowOffset: {width: 1, height: 1},
		textShadowRadius: 2
	},
	statLabel: {
		fontSize: 10, // Smaller font
		color: '#f0f0f0', // Changed to light color for visibility
		textShadowColor: 'rgba(0,0,0,0.5)',
		textShadowOffset: {width: 1, height: 1},
		textShadowRadius: 2
	},
	// Updated actionButtonsContainer
	actionButtonsContainer: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
		gap: 10,
		paddingHorizontal: 2
	},
	editProfileButton: {
		backgroundColor: 'rgba(255, 255, 255, 0)',
		borderRadius: 6,
		paddingVertical: 6,
		borderWidth: 2,
		borderColor: '#fff',
		paddingHorizontal: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	editProfileText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#fff'
	},
	iconButton: {
		width: 30,
		height: 30,
		borderRadius: 6,
		justifyContent: 'center',
		alignItems: 'center'
	},
	backButton: {
		position: 'absolute',
		top: 60,
		left: 15,
		zIndex: 10,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	shareButton: {
		position: 'absolute',
		top: 60,
		right: 15,
		zIndex: 10,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	profileInfoContainer: {
		marginTop: -52,
		backgroundColor: '#fff'
	},
	profileDetailsContainer: {
		padding: 15
	},
	profileImageAndName: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15
	},
	profileImageContainer: {
		width: 38,
		height: 38,
		borderRadius: 25,
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: '#fff',
		marginRight: 12
	},
	profileImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover'
	},
	profileImagePlaceholder: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#3b82f6'
	},
	profileImagePlaceholderText: {
		fontSize: 20,
		color: '#fff',
		fontWeight: 'bold'
	},
	nameContainer: {
		flex: 1
	},
	fullName: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#111'
	},
	username: {
		fontSize: 9,
		color: '#666'
	},
	tabsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around'
	},
	tabButton: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 8
	},
	activeTabButton: {
		borderBottomWidth: 2,
		borderBottomColor: '#3b82f6'
	},
	postItemContainer: {
		width: '100%'
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20
	},
	errorText: {
		color: '#d9534f',
		fontSize: 18,
		textAlign: 'center'
	}
})
