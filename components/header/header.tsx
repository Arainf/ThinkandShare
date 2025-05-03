import { supabase } from '@/config/supabaseClient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRouter, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'

// Move this outside the component to prevent recreation
function getInitials(fullName: string): string {
	if (!fullName) return ''
	const names = fullName.trim().split(/\s+/)
	const initials = names.slice(0, 2).map((name) => name[0].toUpperCase())
	return initials.join('')
}

export default function Header({
	isAuthHeader = false,
	showLogo = false,
	renderNone = false,
	customTitle = '',
	onBackPress
}: {
	isAuthHeader?: boolean
	showLogo?: boolean
	renderNone?: boolean
	customTitle?: string
	onBackPress?: () => void
}) {
	const router = useRouter()
	const segments = useSegments()
	const navigation = useNavigation()
	const colorScheme = useColorScheme()
	const [userInitials, setUserInitials] = useState<string>('')

	// Memoize segment-based values
	const currentSegment = useMemo(() => segments[1] || '', [segments])
	const currentStack = useMemo(() => segments[0] || '', [segments])
	
	const title = useMemo(() => {
		if (customTitle) return customTitle
		switch (currentSegment) {
			case 'notification': return 'Notifications'
			case 'setting': return 'Settings'
			case 'profile': return 'Profile'
			case 'noteposting': return 'Create Note'
			default: return 'Home'
		}
	}, [currentSegment, customTitle])

	const showIcons = useMemo(() => {
		if (currentSegment === 'noteposting') return false
		return ['notification', 'profile', 'setting', ''].includes(currentSegment)
	}, [currentSegment])

	const isHomePage = useMemo(() => segments.length === 1, [segments])
	const isNotePosting = useMemo(() => currentSegment === 'noteposting', [currentSegment])

	// Memoize logo
	const thinkshareLogo = useMemo(() => 
		colorScheme === 'light'
			? require('../../assets/icons/white-mode-3x.png')
			: require('../../assets/icons/dark-mode-3x.png'),
		[colorScheme]
	)

	// Memoize handlers
	const handleBackButton = useCallback(() => {
		if (onBackPress) {
			onBackPress();
			return;
		}

		if (isNotePosting) {
			Alert.alert(
				"Discard changes?",
				"Are you sure you want to discard your changes?",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Discard",
						style: "destructive",
						onPress: () => {
							router.push('/(feed)');
						}
					}
				]
			);
			return;
		}

		// Handle stack-based navigation
		if (currentStack === '(feed)') {
			if (currentSegment) {
				router.push('/(feed)');
			}
		} else if (currentStack === '(auth)') {
			if (navigation.canGoBack()) {
				navigation.goBack();
			} else {
				router.push('/(auth)/login');
			}
		} else if (currentStack === 'post' || currentStack === 'profile') {
			router.push('/(feed)');
		} else {
			if (navigation.canGoBack()) {
				navigation.goBack();
			} else {
				router.push('/(feed)');
			}
		}
	}, [onBackPress, isNotePosting, navigation, router, currentStack, currentSegment]);

	const handleNotificationPress = useCallback(() => {
		router.push('/(feed)/notification')
	}, [router])

	const handleSettingsPress = useCallback(() => {
		router.push('/(feed)/setting')
	}, [router])

	useEffect(() => {
		if (isAuthHeader) {
			const fetchUserData = async () => {
				const { data: session } = await supabase.auth.getSession()
				if (session?.session) {
					const { data, error } = await supabase
						.from('profiles')
						.select('full_name')
						.eq('id', session.session.user.id)
						.single()

					if (!error && data?.full_name) {
						setUserInitials(getInitials(data.full_name))
					}
				}
			}
			fetchUserData()
		}
	}, [isAuthHeader])

	if (renderNone) return null

	return (
		<View style={styles.container}>
			{/* Left Section */}
			<View style={styles.leftContainer}>
				{!isHomePage ? (
					<TouchableOpacity 
						onPress={handleBackButton} 
						style={styles.backButton}
					>
						<Ionicons name="arrow-back-outline" size={24} color="#374151" />
						{!isNotePosting && <Text style={styles.backText}>Back</Text>}
					</TouchableOpacity>
				) : isAuthHeader ? (
					<Image style={styles.logo} source={thinkshareLogo} />
				) : showLogo ? (
					<Image style={styles.logo} source={thinkshareLogo} />
				) : (
					<View style={styles.iconContainer}>
						<TouchableOpacity onPress={handleNotificationPress}>
							<Ionicons
								name="notifications"
								size={24}
								color="#374151"
								style={styles.iconSpacing}
							/>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{/* Title */}
			<View style={styles.centerContainer}>
				<Text style={styles.title}>{title}</Text>
			</View>

			{/* Right Section */}
			<View style={styles.iconContainer}>
				{!isAuthHeader && !showLogo && showIcons && (
					<>
						<TouchableOpacity>
							<Ionicons
								name="search-outline"
								size={24}
								color="#374151"
								style={styles.iconSpacing}
							/>
						</TouchableOpacity>
						{currentSegment !== 'profile' && currentSegment !== 'setting' && (
							<TouchableOpacity onPress={handleSettingsPress}>
								<Ionicons name="grid-outline" size={24} color="#374151" />
							</TouchableOpacity>
						)}
					</>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		height: 60,
		backgroundColor: '#fff',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb'
	},
	leftContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		zIndex: 10,
		minWidth: 50
	},
	centerContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		left: 0,
		right: 0
	},
	backButton: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	backText: {
		marginLeft: 8,
		fontSize: 16,
		color: '#374151',
		fontWeight: 'bold'
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#374151',
		textAlign: 'center'
	},
	iconContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 20,
		minWidth: 50,
		justifyContent: 'flex-end'
	},
	iconSpacing: {
		marginHorizontal: 12
	},
	profileContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#3b82f6',
		justifyContent: 'center',
		alignItems: 'center'
	},
	profileInitials: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold'
	},
	logo: {
		width: 50,
		height: 50,
		resizeMode: 'contain'
	}
})