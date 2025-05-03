import React, { useEffect, useState } from 'react'
import {
   ActivityIndicator,
   Alert,
   Image,
   Platform,
   SafeAreaView,
   ScrollView,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   View
} from 'react-native'
// Removed LinearGradient as it's not used for the card display anymore
import { supabase } from '@/config/supabaseClient'
import { Ionicons } from '@expo/vector-icons'
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'

// --- Helper to get MimeType (remains the same) ---
const getMimeType = (uri: string): string => {
	const extension = uri?.split('.').pop()?.toLowerCase()
	switch (extension) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg'
		case 'png':
			return 'image/png'
		case 'gif':
			return 'image/gif'
		default:
			return 'application/octet-stream'
	}
}

export default function ProfileEditScreen() {
	// Renamed component for clarity
	const router = useRouter()
	const [profileText, setProfileText] = useState('') // Start empty
	const [profileImage, setProfileImage] = useState<string | null>(null)
	const [backgroundImageUriToUpload, setBackgroundImageUriToUpload] = useState<string | null>(null) // Only store URI if *new* banner is selected
	const [loading, setLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false) // Separate state for save button spinner
	const [user, setUser] = useState<string | null>(null)
	const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null) // Store existing banner URL
	const [currentProfileUrl, setCurrentProfileUrl] = useState<string | null>(null) // Store existing profile URL

	// --- Image Picker Logic (remains mostly the same) ---
	const handleUploadProfileImage = async () => {
		setLoading(true) // Show general loading indicator
		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permissionResult.granted) {
			Alert.alert('Permission required', 'Allow access to photos to upload images.')
			setLoading(false)
			return
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'], // Use enum
			allowsEditing: true,
			quality: 0.8,
			aspect: [1, 1]
		})
		setLoading(false) // Hide general loading indicator
		if (!result.canceled && result.assets && result.assets.length > 0) {
			setProfileImage(result.assets[0].uri) // Set the new local URI
		}
	}

	const handleUploadBackground = async () => {
		setLoading(true)
		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permissionResult.granted) {
			Alert.alert('Permission required', 'Allow access to photos to upload images.')
			setLoading(false)
			return
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true, // Allow editing for banner too, if desired
			quality: 0.8
			// aspect: [16, 9] // Optional aspect ratio
		})
		setLoading(false)
		if (!result.canceled && result.assets && result.assets.length > 0) {
			// Don't display banner, just store its URI for potential upload
			setBackgroundImageUriToUpload(result.assets[0].uri)
		}
	}

	// --- Fetch existing profile details ---
	useEffect(() => {
		let isApiSubscribed = true
		const getProfileDetails = async () => {
			setLoading(true) // Show loading indicator during fetch
			const {data: sessionData, error: sessionError} = await supabase.auth.getSession()
			if (sessionError || !sessionData?.session) {
				console.error('Session Error:', sessionError)
				if (isApiSubscribed) router.replace('/')
				return
			}
			const userId = sessionData.session.user.id
			setUser(userId)

			try {
				const {data, error} = await supabase
					.from('profiles')
					.select('full_name, portrait_banner, profile_image')
					.eq('id', userId)
					.single()

				if (error && error.code !== 'PGRST116') {
					console.error('Error fetching user data:', error)
					if (isApiSubscribed) Alert.alert('Error', 'Could not fetch profile details.')
				} else if (data && isApiSubscribed) {
					setProfileText(data.full_name || '') // Use fetched name or empty
					setProfileImage(data.profile_image) // Set profile image URL from DB
					setCurrentProfileUrl(data.profile_image) // Store initial URL
					// Don't set background display, just store the current URL
					setCurrentBannerUrl(data.portrait_banner)
				}
			} catch (err) {
				console.error('Fetch profile error:', err)
				if (isApiSubscribed) Alert.alert('Error', 'An unexpected error occurred.')
			} finally {
				if (isApiSubscribed) setLoading(false) // Hide loading indicator
			}
		}
		getProfileDetails()
		return () => {
			isApiSubscribed = false
		}
	}, []) // Fetch only once on mount

	// --- Save Logic ---
	const handleSave = async () => {
		if (!user) {
			Alert.alert('Error', 'User session not found.')
			return
		}

		setIsSaving(true) // Start save spinner

		try {
			let finalProfileImageUrl: string | null = currentProfileUrl // Start with existing URL
			let finalBackgroundImageUrl: string | null = currentBannerUrl // Start with existing URL

			// --- Upload Profile Image (if changed) ---
			const isNewProfilePic =
				profileImage &&
				profileImage !== currentProfileUrl &&
				(profileImage.startsWith('file://') || profileImage.startsWith('content://'))
			if (isNewProfilePic) {
				console.log('Uploading new profile image...')
				const fileInfo = await FileSystem.getInfoAsync(profileImage)
				if (!fileInfo.exists) throw new Error('Selected profile image file not found.')

				const base64 = await FileSystem.readAsStringAsync(profileImage, {
					encoding: FileSystem.EncodingType.Base64
				})
				const filePath = `profiles/${user}/profile.${profileImage.split('.').pop()}`
				const contentType = getMimeType(profileImage)

				const {data: uploadData, error: uploadError} = await supabase.storage
					.from('profiles-images')
					.upload(filePath, decode(base64), {contentType, upsert: true})

				if (uploadError) throw new Error(`Profile upload failed: ${uploadError.message}`)

				const {data: urlData} = supabase.storage
					.from('profiles-images')
					.getPublicUrl(uploadData.path)
				finalProfileImageUrl = urlData.publicUrl
				console.log('Profile image upload successful:', finalProfileImageUrl)
			} else if (profileImage === null && currentProfileUrl !== null) {
				// User removed image, set URL to null (optional: delete from storage)
				console.log('Removing profile image reference.')
				finalProfileImageUrl = null
				// Optional: Delete logic here...
			}

			// --- Upload Background Image (if selected) ---
			if (backgroundImageUriToUpload) {
				// Only upload if a *new* one was selected
				console.log('Uploading new cover photo...')
				const fileInfo = await FileSystem.getInfoAsync(backgroundImageUriToUpload)
				if (!fileInfo.exists) throw new Error('Selected cover photo file not found.')

				const base64 = await FileSystem.readAsStringAsync(backgroundImageUriToUpload, {
					encoding: FileSystem.EncodingType.Base64
				})
				const filePath = `backgrounds/${user}/background.${backgroundImageUriToUpload
					.split('.')
					.pop()}`
				const contentType = getMimeType(backgroundImageUriToUpload)

				const {data: uploadData, error: uploadError} = await supabase.storage
					.from('profiles-images')
					.upload(filePath, decode(base64), {contentType, upsert: true})

				if (uploadError) throw new Error(`Cover photo upload failed: ${uploadError.message}`)

				const {data: urlData} = supabase.storage
					.from('profiles-images')
					.getPublicUrl(uploadData.path)
				finalBackgroundImageUrl = urlData.publicUrl
				console.log('Cover photo upload successful:', finalBackgroundImageUrl)
			}
			// Note: Add logic here if you want a button to *remove* the banner (set finalBackgroundImageUrl = null)

			// --- Update Database ---
			console.log('Updating profile in DB:', {
				full_name: profileText,
				profile_image: finalProfileImageUrl,
				portrait_banner: finalBackgroundImageUrl
			})
			const {error: updateError} = await supabase
				.from('profiles')
				.update({
					full_name: profileText,
					profile_image: finalProfileImageUrl,
					portrait_banner: finalBackgroundImageUrl,
					is_first_login: false
				})
				.eq('id', user)

			if (updateError) {
				console.error('DB Update Error:', updateError)
				throw new Error(`Failed to save profile: ${updateError.message}`)
			}

			Alert.alert('Success', 'Profile saved!')
			// Update current URLs state after successful save
			setCurrentProfileUrl(finalProfileImageUrl)
			setCurrentBannerUrl(finalBackgroundImageUrl)
			setBackgroundImageUriToUpload(null) // Clear selected banner URI
		} catch (err: any) {
			console.error('Save error:', err)
			Alert.alert('Error', err.message || 'An unexpected error occurred during save.')
		} finally {
			setIsSaving(false) // Stop save spinner
			router.push('/(feed)')
		}
	}

	// --- Render ---
	if (loading && !isSaving) {
		// Show full screen loading only during initial fetch
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#3b82f6" />
			</View>
		)
	}

	return (
		<SafeAreaView>
			<ScrollView contentContainerStyle={styles.scrollViewContainer}>
				<View style={styles.container}>
					{/* Profile Picture Section */}
					<View style={styles.profilePicSection}>
						<TouchableOpacity
							onPress={handleUploadProfileImage}
							style={styles.profileImageTouchable}>
							{profileImage ? (
								<Image
									source={{
										uri: `${profileImage}?t=${Date.now()}`
									}}
									style={styles.profileImage}
								/>
							) : (
								<View style={styles.profileImagePlaceholder}>
									{/* Optional: Add an Icon here */}
									<Ionicons
										name="camera-outline"
										size={40}
										color="#888"
									/>
								</View>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleUploadBackground}
							style={styles.bannerImageTouchable}>
							{currentBannerUrl ? (
								<Image
									source={{
										uri: `${currentBannerUrl}?t=${Date.now()}`
									}}
									style={styles.bannerImage}
								/>
							) : (
								<View style={styles.bannerImagePlaceholder}>
									{/* Optional: Add an Icon here */}
									<Ionicons
										name="camera-outline"
										size={40}
										color="#888"
									/>
								</View>
							)}
						</TouchableOpacity>
					</View>

					{/* Input Fields Section */}
					<View style={styles.inputSection}>
						<Text style={styles.inputLabel}>Name</Text>
						<TextInput
							style={styles.textInput}
							value={profileText}
							onChangeText={setProfileText}
							placeholder="Enter your name"
							placeholderTextColor="#aaa"
							autoCapitalize="words"
						/>
						{/* Add more fields like username, bio, website here if needed */}
						{/* Example:
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput style={styles.textInput} placeholder="Username" ... />
                    <Text style={styles.inputLabel}>Bio</Text>
                    <TextInput style={styles.textInput} placeholder="Bio" multiline ... />
                    */}
					</View>

					{/* Buttons Section */}
					<View style={styles.buttonSection}>
						<View style={{flexDirection: 'row', gap: 5}}>
							<TouchableOpacity
								style={[styles.actionButton, styles.changeCoverButton]}
								onPress={handleUploadProfileImage}>
								<Text style={styles.actionButtonText}>
									Change Profile Photo
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.actionButton, styles.changeCoverButton]}
								onPress={handleUploadBackground}>
								<Text style={styles.actionButtonText}>
									Change Cover Photo
								</Text>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							style={[styles.actionSaveButton, styles.saveButton]}
							onPress={handleSave}
							disabled={isSaving}>
							{isSaving ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Text style={styles.saveButtonText}>Save</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

// --- Styles --- (Major Changes)
const styles = StyleSheet.create({
	loadingContainer: {
		// Centered loading indicator
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff'
	},
	scrollViewContainer: {
		flexGrow: 1, // Allow content to grow
		justifyContent: 'center' // Center content vertically if it's short
	},
	container: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'android' ? 40 : 60, // Adjust top padding
		paddingBottom: 40 // Add bottom padding
	},
	profilePicSection: {
		alignItems: 'center',
		marginBottom: 5, // Space below profile pic area
		flexDirection: 'row',
		justifyContent: 'space-around',
		flex: 0.2,
		width: '100%'
	},
	profileImageTouchable: {
		marginBottom: 10 // Space between image and text link
	},
	bannerImageTouchable: {
		marginBottom: 10 // Space between image and text link
	},
	profileImage: {
		width: 120, // Larger profile pic
		height: 120,
		borderRadius: 60, // Perfectly circular
		backgroundColor: '#eee', // Background while loadin
		elevation: 15
	},
	bannerImage: {
		width: 150, // Larger profile pic
		height: 250,
		borderRadius: 28, // Perfectly circular
		backgroundColor: '#eee', // Background while loadin
		elevation: 15
	},
	profileImagePlaceholder: {
		width: 120,
		height: 120,
		borderRadius: 28,
		backgroundColor: '#f0f0f0', // Light gray placeholder
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
		elevation: 15
	},
	bannerImagePlaceholder: {
		width: 150,
		height: 250,
		borderRadius: 28,
		backgroundColor: '#f0f0f0', // Light gray placeholder
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
		elevation: 15
	},
	changePhotoText: {
		color: '#007AFF', // Standard blue link color
		fontSize: 16,
		fontWeight: '600' // Semibold
	},
	inputSection: {
		width: '100%',
		marginBottom: 10 // Space below inputs
	},
	inputLabel: {
		fontSize: 14,
		color: '#555',
		marginBottom: 5,
		marginLeft: 5, // Slight indent
		fontWeight: '500'
	},
	textInput: {
		width: '100%',
		borderWidth: 1,
		borderColor: '#ddd', // Lighter border
		backgroundColor: '#f9f9f9', // Subtle background
		borderRadius: 8,
		paddingHorizontal: 15,
		paddingVertical: 12, // Adjust vertical padding
		fontSize: 16,
		marginBottom: 10 // Space between inputs
	},
	buttonSection: {
		width: '100%',
		alignItems: 'center' // Center buttons within the section
	},
	actionButton: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: 'center',
		marginBottom: 15,
		flexDirection: 'row', // For potential icons later
		justifyContent: 'center',
		paddingHorizontal: 10
	},
	actionSaveButton: {
		flex: 1,
		width: '100%', // Make buttons slightly narrower than container
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: 'center',
		marginBottom: 15,
		flexDirection: 'row', // For potential icons later
		justifyContent: 'center'
	},
	changeCoverButton: {
		backgroundColor: '#eef', // Lighter background for secondary action
		borderWidth: 1,
		borderColor: '#007AFF' // Blue border
	},
	actionButtonText: {
		// For buttons with lighter backgrounds
		color: '#007AFF', // Blue text
		fontSize: 10,
		fontWeight: '600'
	},
	saveButton: {
		backgroundColor: '#007AFF' // Primary action color (blue)
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600'
	}
	// Removed styles related to the old profileCard display:
	// profileCard, backgroundImage, gradientOverlay, profileTextInput (now textInput)
})
